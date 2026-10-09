/**
 * Error controlado de una regla de negocio. Lleva el código HTTP que el
 * manejador central de errores (middlewares/errorHandler.js) devolverá.
 * Ej: throw new ErrorDeNegocio('Stock insuficiente', 422)
 */
export class ErrorDeNegocio extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}
