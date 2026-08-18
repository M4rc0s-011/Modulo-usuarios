/**
 * Repositorio de roles. Alimenta el selector de privilegios del formulario:
 * los roles no se escriben "a mano" en el HTML, se leen de la base de datos,
 * de modo que agregar un rol nuevo no obliga a tocar el frontend.
 */
import { pool } from '../config/db.js';

export const rolRepository = {
  async listarActivos() {
    const [filas] = await pool.execute(
      `SELECT id, nombre, descripcion
         FROM roles
        WHERE activo = 1
        ORDER BY id`
    );
    return filas;
  },

  async buscarPorId(id) {
    const [filas] = await pool.execute(
      `SELECT id, nombre, descripcion FROM roles WHERE id = ? AND activo = 1 LIMIT 1`,
      [id]
    );
    return filas[0] || null;
  },
};
