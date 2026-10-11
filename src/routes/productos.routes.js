import { Router } from 'express';
import { productoController } from '../controllers/productoController.js';
import { verificarToken, exigirPermiso } from '../middlewares/auth.js';
import { reglasCrearProducto, reglasProducto, reglasEstado } from '../validators/productoValidator.js';
import { verificarValidacion } from '../validators/usuarioValidator.js';

const router = Router();

router.get('/categorias', verificarToken, exigirPermiso('productos.listar'), productoController.categorias);
router.get('/productos', verificarToken, exigirPermiso('productos.listar'), productoController.listar);
router.get('/productos/:id', verificarToken, exigirPermiso('productos.listar'), productoController.obtener);
router.post('/productos', verificarToken, exigirPermiso('productos.crear'),
  reglasCrearProducto, verificarValidacion, productoController.crear);
router.put('/productos/:id', verificarToken, exigirPermiso('productos.editar'),
  reglasProducto, verificarValidacion, productoController.actualizar);
router.patch('/productos/:id/estado', verificarToken, exigirPermiso('productos.editar'),
  reglasEstado, verificarValidacion, productoController.cambiarEstado);

export default router;
