/**
 * Middlewares de seguridad: autenticación (quién eres) y
 * autorización por privilegios (qué te está permitido hacer).
 * Es el punto donde se materializa el control de acceso basado en roles (RNF-02).
 */
import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Token no proporcionado' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}

/** Permite el paso solo a los roles indicados. Ej: exigirRol('administrador') */
export function exigirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        error: 'No cuenta con los privilegios necesarios para esta operación',
      });
    }
    next();
  };
}

/**
 * Control más fino: exige al menos UNO de los permisos indicados.
 * Ej: exigirPermiso('usuarios.crear')
 *     exigirPermiso('inventario.ingreso', 'inventario.retiro')  -> basta con uno
 */
export function exigirPermiso(...permisosRequeridos) {
  return (req, res, next) => {
    const permisos = req.usuario?.permisos || [];
    if (!permisosRequeridos.some((p) => permisos.includes(p))) {
      return res.status(403).json({ ok: false, error: `Permiso requerido: ${permisosRequeridos.join(' o ')}` });
    }
    next();
  };
}
