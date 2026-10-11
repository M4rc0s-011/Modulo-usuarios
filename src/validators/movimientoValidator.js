import { body } from 'express-validator';

export const reglasMovimiento = [
  body('productoId').isInt({ min: 1 }).withMessage('Seleccione un producto válido').toInt(),
  body('cantidad').isInt({ min: 1, max: 1000000 }).withMessage('La cantidad debe ser un entero mayor que 0').toInt(),
  body('motivo').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
];

