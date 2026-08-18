/**
 * Validación de entradas antes de que los datos lleguen a la lógica de negocio.
 * Es la primera barrera contra datos malformados y contenido malicioso (RNF-02).
 */
import { body, validationResult } from 'express-validator';

export const reglasCrearUsuario = [
  body('nombre')
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 64 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe incluir al menos una letra mayúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe incluir al menos un número'),
  body('rolId')
    .isInt({ min: 1 })
    .withMessage('Debe seleccionar un rol válido'),
];

export const reglasLogin = [
  body('email').trim().isEmail().withMessage('Correo inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

export function verificarValidacion(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({
      ok: false,
      error: 'Datos inválidos',
      detalles: errores.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
}
