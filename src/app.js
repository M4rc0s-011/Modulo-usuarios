/**
 * Configuración de la aplicación Express (sin levantar el servidor).
 * Se separa de server.js para que las pruebas puedan importar la app
 * sin abrir un puerto.
 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import rutas from './routes/index.js';
import { noEncontrado, manejadorDeErrores } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
}

// Capa de presentación: cliente web servido de forma estática.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', rutas);

app.use(noEncontrado);
app.use(manejadorDeErrores);

export default app;
