import jwt from 'jsonwebtoken';
import { usuarioService } from '../services/usuarioService.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const usuario = await usuarioService.autenticar(email, password);

      const token = jwt.sign(usuario, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      });

      res.json({ ok: true, data: { token, usuario } });
    } catch (error) {
      next(error);
    }
  },

  perfil(req, res) {
    res.json({ ok: true, data: req.usuario });
  },
};
