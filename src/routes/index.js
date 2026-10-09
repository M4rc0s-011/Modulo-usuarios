/**
 * Enrutador principal. Cada módulo tiene su propio archivo de rutas
 * para que cada integrante trabaje en su archivo sin conflictos.
 */
import { Router } from 'express';
import usuariosRoutes from './usuarios.routes.js';
import productosRoutes from './productos.routes.js';
import movimientosRoutes from './movimientos.routes.js';
import reportesRoutes from './reportes.routes.js';

const router = Router();

router.use(usuariosRoutes);    // /auth/*, /roles, /usuarios      (Marcos)
router.use(productosRoutes);   // /categorias, /productos         (Juan Manuel)
router.use(movimientosRoutes); // /movimientos, /auditoria        (Héctor)
router.use(reportesRoutes);    // /reportes/stock-bajo            (Juan Manuel)

export default router;
