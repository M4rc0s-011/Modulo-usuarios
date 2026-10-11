import { movimientoRepository } from '../repositories/movimientoRepository.js';

export const movimientoService = {
  registrarIngreso: ({ productoId, cantidad, motivo }, usuarioId) =>
    movimientoRepository.registrar({ productoId, tipo: 'INGRESO', cantidad, motivo, usuarioId }),
  registrarRetiro: ({ productoId, cantidad, motivo }, usuarioId) =>
    movimientoRepository.registrar({ productoId, tipo: 'RETIRO', cantidad, motivo, usuarioId }),
  listar: (filtros) => movimientoRepository.listar(filtros),
  auditoria: (opciones) => movimientoRepository.auditoria(opciones),
};
