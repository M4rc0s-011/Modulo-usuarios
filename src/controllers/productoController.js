import { productoService } from '../services/productoService.js';

const manejar = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

export const productoController = {
  categorias: manejar(async (req, res) => {
    res.json({ ok: true, data: await productoService.listarCategorias() });
  }),
  listar: manejar(async (req, res) => {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(100, Number(req.query.limite) || 20);
    const data = await productoService.listar({
      buscar: req.query.buscar || '',
      categoriaId: req.query.categoriaId || null,
      soloActivos: req.query.todos !== '1',
      limite,
      desplazamiento: (pagina - 1) * limite,
    });
    res.json({ ok: true, data });
  }),
  obtener: manejar(async (req, res) => {
    res.json({ ok: true, data: await productoService.obtener(Number(req.params.id)) });
  }),
  crear: manejar(async (req, res) => {
    const { codigo, nombre, descripcion, categoriaId, unidad = 'unidad', precio, stockMinimo } = req.body;
    const data = await productoService.crear(
      { codigo, nombre, descripcion, categoriaId, unidad, precio, stockMinimo }, req.usuario.id);
    res.status(201).json({ ok: true, data });
  }),
  actualizar: manejar(async (req, res) => {
    const { nombre, descripcion, categoriaId, unidad = 'unidad', precio, stockMinimo } = req.body;
    const data = await productoService.actualizar(Number(req.params.id),
      { nombre, descripcion, categoriaId, unidad, precio, stockMinimo });
    res.json({ ok: true, data });
  }),
  cambiarEstado: manejar(async (req, res) => {
    res.json({ ok: true, data: await productoService.cambiarEstado(Number(req.params.id), req.body.activo) });
  }),
  stockBajo: manejar(async (req, res) => {
    res.json({ ok: true, data: await productoService.stockBajo() });
  }),
};
