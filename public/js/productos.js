/**
 * Página de productos (capa de presentación).
 * Las funciones peticion, escaparHTML, tienePermiso, mostrarMensaje y $ vienen de comun.js.
 */
async function cargarCategorias() {
  const categorias = await peticion('/categorias');
  const opciones = categorias
    .map((c) => `<option value="${c.id}">${escaparHTML(c.nombre)}</option>`)
    .join('');
  $('categoriaId').innerHTML = '<option value="">Seleccione…</option>' + opciones;
  $('filtroCategoria').innerHTML = '<option value="">Todas las categorías</option>' + opciones;
}

async function cargarProductos() {
  const cuerpo = $('tablaProductos');
  try {
    const filtros = new URLSearchParams({
      buscar: $('buscar').value.trim(),
      categoriaId: $('filtroCategoria').value,
      limite: 100,
    });
    const productos = await peticion(`/productos?${filtros}`);
    const puedeEditar = tienePermiso('productos.editar');

    if (!productos.length) {
      cuerpo.innerHTML = '<tr><td colspan="7" class="vacio">No se encontraron productos.</td></tr>';
      return;
    }
    cuerpo.innerHTML = productos.map((p) => `
      <tr>
        <td>${escaparHTML(p.codigo)}</td>
        <td>${escaparHTML(p.nombre)}</td>
        <td>${escaparHTML(p.categoria)}</td>
        <td>${p.stock_bajo
          ? `<span class="etiqueta alerta" title="En o bajo el mínimo">${p.stock_actual} ${escaparHTML(p.unidad)}</span>`
          : `${p.stock_actual} ${escaparHTML(p.unidad)}`}</td>
        <td>${p.stock_minimo}</td>
        <td class="derecha">${Number(p.precio).toFixed(2)}</td>
        <td>${puedeEditar
          ? `<button type="button" class="btn-chico btn-peligro" data-desactivar="${p.id}">Desactivar</button>`
          : ''}</td>
      </tr>`).join('');
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="7" class="vacio">${escaparHTML(error.message)}</td></tr>`;
  }
}

async function registrarProducto() {
  const boton = $('btnGuardar');
  boton.disabled = true;
  mostrarMensaje('', '');
  try {
    const nuevo = await peticion('/productos', {
      method: 'POST',
      body: JSON.stringify({
        codigo: $('codigo').value,
        nombre: $('nombre').value,
        categoriaId: Number($('categoriaId').value),
        unidad: $('unidad').value || 'unidad',
        precio: Number($('precio').value),
        stockMinimo: Number($('stockMinimo').value),
      }),
    });
    mostrarMensaje(`Producto ${nuevo.codigo} registrado.`, 'exito');
    ['codigo', 'nombre'].forEach((id) => ($(id).value = ''));
    cargarProductos();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

async function desactivarProducto(id) {
  try {
    await peticion(`/productos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo: false }) });
    cargarProductos();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

// --- Arranque ---
if (token) {
  if (tienePermiso('productos.crear')) $('seccionFormulario').classList.remove('oculto');

  $('btnGuardar').addEventListener('click', registrarProducto);
  $('btnBuscar').addEventListener('click', cargarProductos);
  $('buscar').addEventListener('keydown', (e) => { if (e.key === 'Enter') cargarProductos(); });
  $('tablaProductos').addEventListener('click', (e) => {
    const id = e.target.dataset.desactivar;
    if (id) desactivarProducto(id);
  });

  cargarCategorias().then(cargarProductos).catch((e) => mostrarMensaje(e.message, 'error'));
}
