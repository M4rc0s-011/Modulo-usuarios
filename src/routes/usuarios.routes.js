/**
 * Definición de rutas. Cada ruta declara explícitamente el nivel de
 * privilegio que exige, de modo que el control de acceso queda visible
 * en un solo lugar y es fácil de auditar.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { usuarioController } from '../controllers/usuarioController.js';
import { authController } from '../controllers/authController.js';
import { verificarToken, exigirRol, exigirPermiso } from '../middlewares/auth.js';
import {
  reglasCrearUsuario,
  reglasLogin,
  reglasEditarUsuario,
  reglasEstadoUsuario,
  reglasCambiarPassword,
  verificarValidacion,
} from '../validators/usuarioValidator.js';

const router = Router();

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  message: { ok: false, error: 'Demasiados intentos. Intente nuevamente más tarde.' },
});

// --- Autenticación (RF-01) ---
router.post('/auth/login', limitadorLogin, reglasLogin, verificarValidacion, authController.login);
router.get('/auth/perfil', verificarToken, authController.perfil);
router.put('/auth/password', verificarToken, reglasCambiarPassword, verificarValidacion, usuarioController.cambiarPassword);

// --- Gestión de usuarios por privilegios (RF-02) ---
router.get('/roles', verificarToken, exigirRol('administrador'), usuarioController.listarRoles);

router.get(
  '/usuarios',
  verificarToken,
  exigirPermiso('usuarios.listar'),
  usuarioController.listar
);

router.post(
  '/usuarios',
  verificarToken,
  exigirRol('administrador'),
  exigirPermiso('usuarios.crear'),
  reglasCrearUsuario,
  verificarValidacion,
  usuarioController.crear
);

router.put(
  '/usuarios/:id',
  verificarToken,
  exigirPermiso('usuarios.editar'),
  reglasEditarUsuario,
  verificarValidacion,
  usuarioController.editar
);

router.patch(
  '/usuarios/:id/estado',
  verificarToken,
  exigirPermiso('usuarios.editar'),
  reglasEstadoUsuario,
  verificarValidacion,
  usuarioController.cambiarEstado
);

export default router;
