/** Manejo centralizado de errores: respuestas uniformes { ok, error }. */
export function noEncontrado(req, res) {
  res.status(404).json({ ok: false, error: 'Recurso no encontrado' });
}

export function manejadorDeErrores(error, req, res, next) { // eslint-disable-line no-unused-vars
  const estado = error.estado || 500;
  if (estado === 500) console.error('[ERROR]', error);
  res.status(estado).json({
    ok: false,
    error: estado === 500 ? 'Error interno del servidor' : error.message,
  });
}
