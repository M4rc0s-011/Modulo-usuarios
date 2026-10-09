/**
 * Punto de entrada del servidor de aplicación (segunda capa de la
 * arquitectura cliente-servidor de tres capas).
 */
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { probarConexion } from './config/db.js';

if (!process.env.JWT_SECRET) {
  console.error('[CONFIG] Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const PUERTO = process.env.PORT || 3000;

probarConexion()
  .then(() => {
    app.listen(PUERTO, () => console.log(`[SERVIDOR] Escuchando en http://localhost:${PUERTO}`));
  })
  .catch((error) => {
    console.error('[BD] No fue posible conectar con la base de datos:', error.message);
    process.exit(1);
  });
