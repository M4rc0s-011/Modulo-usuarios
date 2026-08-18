/**
 * Punto de entrada del servidor de aplicación (segunda capa de la
 * arquitectura cliente-servidor de tres capas).
 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import rutas from './routes/index.js';
import { probarConexion } from './config/db.js';
import { noEncontrado, manejadorDeErrores } from './middlewares/errorHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Capa de presentación: cliente web servido de forma estática.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', rutas);

app.use(noEncontrado);
app.use(manejadorDeErrores);

const PUERTO = process.env.PORT || 3000;

probarConexion()
  .then(() => {
    app.listen(PUERTO, () => console.log(`[SERVIDOR] Escuchando en http://localhost:${PUERTO}`));
  })
  .catch((error) => {
    console.error('[BD] No fue posible conectar con la base de datos:', error.message);
    process.exit(1);
  });

export default app;
