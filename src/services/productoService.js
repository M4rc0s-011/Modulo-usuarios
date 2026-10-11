import { productoRepository } from '../repositories/productoRepository.js';
import { ErrorDeNegocio } from '../utils/ErrorDeNegocio.js';

export const productoService = {
  listarCategorias: () => productoRepository.listarCategorias(),
  listar: (opciones) => productoRepository.listar(opciones),
  stockBajo: () => productoRepository.stockBajo(),

  async obtener(id) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw new ErrorDeNegocio('Producto no encontrado', 404);
    return producto;
  },

  async crear(datos, usuarioId) {
    const codigo = String(datos.codigo).trim().toUpperCase();
    if (await productoRepository.buscarPorCodigo(codigo)) {
      throw new ErrorDeNegocio('Ya existe un producto con ese código', 409);
    }
    if (!(await productoRepository.categoriaPorId(datos.categoriaId))) {
      throw new ErrorDeNegocio('La categoría indicada no existe', 422);
    }
    const id = await productoRepository.crear({ ...datos, codigo }, usuarioId);
    return productoRepository.buscarPorId(id);
  },

  async actualizar(id, datos) {
    await this.obtener(id);
    if (!(await productoRepository.categoriaPorId(datos.categoriaId))) {
      throw new ErrorDeNegocio('La categoría indicada no existe', 422);
    }
    await productoRepository.actualizar(id, datos);
    return productoRepository.buscarPorId(id);
  },

  async cambiarEstado(id, activo) {
    await this.obtener(id);
    await productoRepository.cambiarEstado(id, activo);
    return productoRepository.buscarPorId(id);
  },
};
