import { body } from 'express-validator';

export const reglasProducto = [
  body('codigo').optional().trim().matches(/^[A-Za-z0-9-]{2,30}$/)
    .withMessage('El código debe tener de 2 a 30 caracteres (letras, números o guiones)'),
  body('nombre').trim().isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('categoriaId').isInt({ min: 1 }).withMessage('Seleccione una categoría válida').toInt(),
  body('unidad').optional().trim().isLength({ min: 1, max: 20 }),
  body('precio').isFloat({ min: 0 }).withMessage('El precio no puede ser negativo').toFloat(),
  body('stockMinimo').isInt({ min: 0 }).withMessage('El stock mínimo debe ser un entero ≥ 0').toInt(),
];

export const reglasCrearProducto = [
  body('codigo').exists({ values: 'falsy' }).withMessage('El código es obligatorio'),
  ...reglasProducto,
];

export const reglasEstado = [body('activo').isBoolean().withMessage('activo debe ser true o false').toBoolean()];
