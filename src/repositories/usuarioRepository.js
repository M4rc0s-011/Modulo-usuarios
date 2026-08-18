/**
 * Patrón Repository.
 * Única parte del módulo que conoce SQL. Si mañana la base de datos cambia
 * de MySQL a PostgreSQL, solo se reescribe este archivo: ni el servicio ni
 * el controlador se enteran (RNF-05, mantenibilidad).
 */
import { pool } from '../config/db.js';

export const usuarioRepository = {
  async buscarPorEmail(email) {
    const [filas] = await pool.execute(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.activo,
              u.rol_id, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE u.email = ?
        LIMIT 1`,
      [email]
    );
    return filas[0] || null;
  },

  async buscarPorId(id) {
    const [filas] = await pool.execute(
      `SELECT u.id, u.nombre, u.email, u.activo, u.creado_en,
              u.rol_id, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        WHERE u.id = ?
        LIMIT 1`,
      [id]
    );
    return filas[0] || null;
  },

  async listar({ limite = 20, desplazamiento = 0 } = {}) {
    // Paginación para no traer la tabla completa (RNF-01).
    const [filas] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.activo, u.creado_en, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
        ORDER BY u.creado_en DESC
        LIMIT ? OFFSET ?`,
      [Number(limite), Number(desplazamiento)]
    );
    return filas;
  },

  /**
   * Crea el usuario y su registro de auditoría dentro de una misma
   * transacción: o se guardan las dos cosas, o no se guarda ninguna (RNF-06).
   */
  async crearConAuditoria({ nombre, email, passwordHash, rolId, creadoPor }) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();

      const [resultado] = await conexion.execute(
        `INSERT INTO usuarios (nombre, email, password_hash, rol_id, creado_por)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre, email, passwordHash, rolId, creadoPor ?? null]
      );

      await conexion.execute(
        `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
         VALUES (?, 'CREAR_USUARIO', 'usuarios', ?, ?)`,
        [creadoPor ?? null, String(resultado.insertId), `Alta de ${email} con rol_id ${rolId}`]
      );

      await conexion.commit();
      return resultado.insertId;
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  },

  async permisosDeUsuario(usuarioId) {
    const [filas] = await pool.execute(
      `SELECT p.clave
         FROM usuarios u
         JOIN rol_permisos rp ON rp.rol_id = u.rol_id
         JOIN permisos p      ON p.id = rp.permiso_id
        WHERE u.id = ?`,
      [usuarioId]
    );
    return filas.map((f) => f.clave);
  },
};
