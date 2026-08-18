/**
 * Capa de presentación del servidor (controladores).
 * Traduce HTTP a llamadas de negocio y de vuelta. No contiene reglas
 * de negocio ni SQL: solo orquesta.
 */
import { usuarioService } from '../services/usuarioService.js';

export const usuarioController = {
  async listarRoles(req, res, next) {
    try {
      const roles = await usuarioService.listarRoles();
      res.json({ ok: true, data: roles });
    } catch (error) {
      next(error);
    }
  },

  async listar(req, res, next) {
    try {
      const pagina = Math.max(1, Number(req.query.pagina) || 1);
      const limite = Math.min(50, Number(req.query.limite) || 20);
      const usuarios = await usuarioService.listarUsuarios({
        limite,
        desplazamiento: (pagina - 1) * limite,
      });
      res.json({ ok: true, data: usuarios });
    } catch (error) {
      next(error);
    }
  },

  async crear(req, res, next) {
    try {
      const { nombre, email, password, rolId } = req.body;
      const nuevo = await usuarioService.crearUsuario(
        { nombre, email, password, rolId },
        req.usuario?.id
      );
      res.status(201).json({ ok: true, data: nuevo });
    } catch (error) {
      next(error);
    }
  },
};
