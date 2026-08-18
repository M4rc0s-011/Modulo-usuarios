/**
 * Capa de datos: configuración del acceso a MySQL.
 * Se utiliza un pool de conexiones para soportar concurrencia (RNF-01, RNF-04)
 * y consultas preparadas para prevenir inyección SQL (RNF-02).
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventario_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
});

/**
 * Verifica la conexión al iniciar el servidor. Si la base de datos no
 * responde, la aplicación no debe levantar en un estado inconsistente.
 */
export async function probarConexion() {
  const conexion = await pool.getConnection();
  try {
    await conexion.ping();
    console.log('[BD] Conexión establecida con', process.env.DB_NAME);
  } finally {
    conexion.release();
  }
}
