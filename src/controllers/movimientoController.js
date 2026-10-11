import { movimientoService } from '../services/movimientoService.js';

const manejar = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

export const movimientoController = {
  ingreso: manejar(async (req, res) => {
    const data = await movimientoService.registrarIngreso(req.body, req.usuario.id);
    res.status(201).json({ ok: true, data });
  }),
  retiro: manejar(async (req, res) => {
    const data = await movimientoService.registrarRetiro(req.body, req.usuario.id);
    res.status(201).json({ ok: true, data });
  }),
  listar: manejar(async (req, res) => {
    const { productoId, tipo, desde, hasta } = req.query;
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(100, Number(req.query.limite) || 50);
    const data = await movimientoService.listar({
      productoId, tipo: ['INGRESO', 'RETIRO'].includes(tipo) ? tipo : null, desde, hasta,
      limite, desplazamiento: (pagina - 1) * limite,
    });
    res.json({ ok: true, data });
  }),
  auditoria: manejar(async (req, res) => {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(100, Number(req.query.limite) || 50);
    res.json({ ok: true, data: await movimientoService.auditoria({ limite, desplazamiento: (pagina - 1) * limite }) });
  }),
};
