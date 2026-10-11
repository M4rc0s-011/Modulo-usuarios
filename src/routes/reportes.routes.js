import { Router } from 'express';
import { productoController } from '../controllers/productoController.js';
import { verificarToken, exigirPermiso } from '../middlewares/auth.js';

const router = Router();

router.get('/reportes/stock-bajo', verificarToken, exigirPermiso('reportes.ver'), productoController.stockBajo);

export default router;
