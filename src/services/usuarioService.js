/**
 * Patrón Service Layer (capa de lógica de negocio).
 * Aquí viven las reglas del dominio; no hay SQL ni objetos req/res de Express.
 * Eso permite probar estas reglas sin levantar el servidor ni la base de datos.
 */
import bcrypt from 'bcryptjs';
import { usuarioRepository } from '../repositories/usuarioRepository.js';
import { rolRepository } from '../repositories/rolRepository.js';
import { ErrorDeNegocio } from '../utils/ErrorDeNegocio.js';

const COSTO_BCRYPT = 10;

export { ErrorDeNegocio };

export const usuarioService = {
  async listarRoles() {
    return rolRepository.listarActivos();
  },

  async listarUsuarios(opciones) {
    return usuarioRepository.listar(opciones);
  },

  /**
   * Regla de negocio: el correo es único, el rol debe existir y estar activo,
   * y la contraseña se guarda siempre como hash, nunca en texto plano.
   */
  async crearUsuario({ nombre, email, password, rolId }, creadoPor = null) {
    const correo = String(email).trim().toLowerCase();

    const existente = await usuarioRepository.buscarPorEmail(correo);
    if (existente) {
      throw new ErrorDeNegocio('Ya existe un usuario registrado con ese correo', 409);
    }

    const rol = await rolRepository.buscarPorId(rolId);
    if (!rol) {
      throw new ErrorDeNegocio('El rol indicado no existe o está inactivo', 422);
    }

    const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);

    const id = await usuarioRepository.crearConAuditoria({
      nombre: String(nombre).trim(),
      email: correo,
      passwordHash,
      rolId: rol.id,
      creadoPor,
    });

    return { id, nombre: String(nombre).trim(), email: correo, rol: rol.nombre };
  },

  /** Regla: no puede quedar el sistema sin ningún administrador activo. */
  async editarUsuario(id, { nombre, email, rolId }, actorId) {
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) throw new ErrorDeNegocio('Usuario no encontrado', 404);

    const correo = String(email).trim().toLowerCase();
    const otro = await usuarioRepository.buscarPorEmail(correo);
    if (otro && otro.id !== id) throw new ErrorDeNegocio('Ese correo ya pertenece a otro usuario', 409);

    const rol = await rolRepository.buscarPorId(rolId);
    if (!rol) throw new ErrorDeNegocio('El rol indicado no existe o está inactivo', 422);

    const dejaDeSerAdmin = usuario.rol === 'administrador' && rol.nombre !== 'administrador';
    if (dejaDeSerAdmin && usuario.activo && (await usuarioRepository.contarAdministradoresActivos()) <= 1) {
      throw new ErrorDeNegocio('No se puede quitar el rol al último administrador activo', 422);
    }

    await usuarioRepository.actualizar(id, { nombre: String(nombre).trim(), email: correo, rolId: rol.id }, actorId);
    return usuarioRepository.buscarPorId(id);
  },

  /** Reglas: nadie se desactiva a sí mismo ni desactiva al último administrador. */
  async cambiarEstado(id, activo, actorId) {
    if (id === actorId && !activo) throw new ErrorDeNegocio('No puede desactivar su propia cuenta', 422);
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) throw new ErrorDeNegocio('Usuario no encontrado', 404);
    if (!activo && usuario.rol === 'administrador' && usuario.activo
        && (await usuarioRepository.contarAdministradoresActivos()) <= 1) {
      throw new ErrorDeNegocio('No se puede desactivar al último administrador activo', 422);
    }
    await usuarioRepository.cambiarEstado(id, activo, actorId);
    return usuarioRepository.buscarPorId(id);
  },

  async cambiarPassword(id, actual, nueva) {
    const hash = await usuarioRepository.hashDePassword(id);
    if (!hash || !(await bcrypt.compare(actual, hash))) {
      throw new ErrorDeNegocio('La contraseña actual no es correcta', 422);
    }
    await usuarioRepository.actualizarPassword(id, await bcrypt.hash(nueva, COSTO_BCRYPT));
  },

  /** Valida credenciales para el inicio de sesión (RF-01). */
  async autenticar(email, password) {
    const usuario = await usuarioRepository.buscarPorEmail(String(email).trim().toLowerCase());

    // Mensaje genérico a propósito: no se revela si el correo existe o no.
    const credencialesInvalidas = new ErrorDeNegocio('Credenciales inválidas', 401);
    if (!usuario || !usuario.activo) throw credencialesInvalidas;

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) throw credencialesInvalidas;

    const permisos = await usuarioRepository.permisosDeUsuario(usuario.id);
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      permisos,
    };
  },
};
