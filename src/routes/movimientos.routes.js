import { Router } from 'express';
import { movimientoController } from '../controllers/movimientoController.js';
import { verificarToken, exigirPermiso } from '../middlewares/auth.js';
import { reglasMovimiento } from '../validators/movimientoValidator.js';
import { verificarValidacion } from '../validators/usuarioValidator.js';

const router = Router();

router.post('/movimientos/ingreso', verificarToken, exigirPermiso('inventario.ingreso'),
  reglasMovimiento, verificarValidacion, movimientoController.ingreso);
router.post('/movimientos/retiro', verificarToken, exigirPermiso('inventario.retiro'),
  reglasMovimiento, verificarValidacion, movimientoController.retiro);
router.get('/movimientos', verificarToken, exigirPermiso('inventario.ingreso', 'inventario.retiro'),
  movimientoController.listar);
router.get('/auditoria', verificarToken, exigirPermiso('auditoria.ver'), movimientoController.auditoria);

export default router;
