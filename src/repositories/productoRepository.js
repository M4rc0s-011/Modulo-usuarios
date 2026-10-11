import { pool } from '../config/db.js';

export const productoRepository = {
  async listarCategorias() {
    const [filas] = await pool.execute(
      'SELECT id, nombre, descripcion FROM categorias WHERE activo = 1 ORDER BY nombre'
    );
    return filas;
  },

  async categoriaPorId(id) {
    const [filas] = await pool.execute(
      'SELECT id, nombre FROM categorias WHERE id = ? AND activo = 1 LIMIT 1', [id]
    );
    return filas[0] || null;
  },

  async listar({ buscar = '', categoriaId = null, soloActivos = true, limite = 20, desplazamiento = 0 } = {}) {
    const condiciones = [];
    const valores = [];
    if (soloActivos) condiciones.push('p.activo = 1');
    if (buscar) {
      condiciones.push('(p.nombre LIKE ? OR p.codigo LIKE ?)');
      valores.push(`%${buscar}%`, `%${buscar}%`);
    }
    if (categoriaId) {
      condiciones.push('p.categoria_id = ?');
      valores.push(Number(categoriaId));
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [filas] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.unidad, p.precio,
              p.stock_actual, p.stock_minimo, p.activo,
              p.categoria_id, c.nombre AS categoria,
              (p.stock_actual <= p.stock_minimo) AS stock_bajo
         FROM productos p
         JOIN categorias c ON c.id = p.categoria_id
         ${where}
        ORDER BY p.nombre
        LIMIT ? OFFSET ?`,
      [...valores, Number(limite), Number(desplazamiento)]
    );
    return filas;
  },

  async buscarPorId(id) {
    const [filas] = await pool.execute(
      `SELECT p.*, c.nombre AS categoria
         FROM productos p JOIN categorias c ON c.id = p.categoria_id
        WHERE p.id = ? LIMIT 1`, [id]
    );
    return filas[0] || null;
  },

  async buscarPorCodigo(codigo) {
    const [filas] = await pool.execute('SELECT id FROM productos WHERE codigo = ? LIMIT 1', [codigo]);
    return filas[0] || null;
  },

  async crear({ codigo, nombre, descripcion, categoriaId, unidad, precio, stockMinimo }, usuarioId) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      const [r] = await conexion.execute(
        `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, unidad, precio, stock_minimo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [codigo, nombre, descripcion ?? null, categoriaId, unidad, precio, stockMinimo]
      );
      await conexion.execute(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
         VALUES (?, 'CREAR_PRODUCTO', 'productos', ?, ?)`,
        [usuarioId ?? null, String(r.insertId), `Alta de ${codigo}`]
      );
      await conexion.commit();
      return r.insertId;
    } catch (e) {
      await conexion.rollback();
      throw e;
    } finally {
      conexion.release();
    }
  },

  async actualizar(id, { nombre, descripcion, categoriaId, unidad, precio, stockMinimo }) {
    await pool.execute(
      `UPDATE productos SET nombre = ?, descripcion = ?, categoria_id = ?, unidad = ?,
              precio = ?, stock_minimo = ? WHERE id = ?`,
      [nombre, descripcion ?? null, categoriaId, unidad, precio, stockMinimo, id]
    );
  },

  async cambiarEstado(id, activo) {
    await pool.execute('UPDATE productos SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
  },

  async stockBajo() {
    const [filas] = await pool.execute(
      `SELECT p.id, p.codigo, p.nombre, c.nombre AS categoria, p.unidad,
              p.stock_actual, p.stock_minimo,
              (p.stock_minimo - p.stock_actual) AS faltante
         FROM productos p JOIN categorias c ON c.id = p.categoria_id
        WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
        ORDER BY faltante DESC`
    );
    return filas;
  },
};
