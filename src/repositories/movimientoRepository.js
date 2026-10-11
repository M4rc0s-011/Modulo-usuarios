import { pool } from '../config/db.js';
import { ErrorDeNegocio } from '../utils/ErrorDeNegocio.js';

export const movimientoRepository = {
  /**
   * Registra un ingreso o retiro en UNA transacción:
   * 1) bloquea la fila del producto (FOR UPDATE) para que dos retiros
   *    simultáneos no dejen el stock negativo,
   * 2) calcula y guarda el nuevo stock,
   * 3) inserta el movimiento y 4) la auditoría.
   */
  async registrar({ productoId, tipo, cantidad, motivo, usuarioId }) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();

      const [filas] = await conexion.execute(
        'SELECT id, codigo, stock_actual, activo FROM productos WHERE id = ? FOR UPDATE',
        [productoId]
      );
      const producto = filas[0];
      if (!producto || !producto.activo) {
        throw new ErrorDeNegocio('El producto no existe o está inactivo', 404);
      }

      const nuevoStock = tipo === 'INGRESO'
        ? producto.stock_actual + cantidad
        : producto.stock_actual - cantidad;

      if (nuevoStock < 0) {
        throw new ErrorDeNegocio(
          `Stock insuficiente: hay ${producto.stock_actual} y se intentó retirar ${cantidad}`, 422);
      }

      await conexion.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, productoId]);

      const [r] = await conexion.execute(
        `INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productoId, tipo, cantidad, nuevoStock, motivo ?? null, usuarioId ?? null]
      );

      await conexion.execute(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
         VALUES (?, ?, 'productos', ?, ?)`,
        [usuarioId ?? null, `REGISTRAR_${tipo}`, String(productoId),
         `${tipo} de ${cantidad} en ${producto.codigo}. Stock: ${producto.stock_actual} -> ${nuevoStock}`]
      );

      await conexion.commit();
      return { id: r.insertId, productoId, tipo, cantidad, stockResultante: nuevoStock };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  },

  async listar({ productoId = null, tipo = null, desde = null, hasta = null, limite = 50, desplazamiento = 0 } = {}) {
    const cond = [];
    const val = [];
    if (productoId) { cond.push('m.producto_id = ?'); val.push(Number(productoId)); }
    if (tipo) { cond.push('m.tipo = ?'); val.push(tipo); }
    if (desde) { cond.push('m.ocurrido_en >= ?'); val.push(`${desde} 00:00:00`); }
    if (hasta) { cond.push('m.ocurrido_en <= ?'); val.push(`${hasta} 23:59:59`); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const [filas] = await pool.query(
      `SELECT m.id, m.tipo, m.cantidad, m.stock_resultante, m.motivo, m.ocurrido_en,
              p.codigo, p.nombre AS producto, u.nombre AS usuario
         FROM movimientos m
         JOIN productos p ON p.id = m.producto_id
         LEFT JOIN usuarios u ON u.id = m.usuario_id
         ${where}
        ORDER BY m.ocurrido_en DESC, m.id DESC
        LIMIT ? OFFSET ?`,
      [...val, Number(limite), Number(desplazamiento)]
    );
    return filas;
  },


  async auditoria({ limite = 50, desplazamiento = 0 } = {}) {
    const [filas] = await pool.query(
      `SELECT a.id, a.accion, a.entidad, a.entidad_id, a.detalle, a.ocurrido_en, u.nombre AS usuario
         FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.ocurrido_en DESC, a.id DESC
        LIMIT ? OFFSET ?`,
      [Number(limite), Number(desplazamiento)]
    );
    return filas;
  },
};
