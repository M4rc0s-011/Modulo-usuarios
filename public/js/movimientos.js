/**
 * Página de movimientos de inventario (ingresos y retiros).
 * Las funciones peticion, escaparHTML, tienePermiso, mostrarMensaje y $ vienen de comun.js.
 */
let productos = [];

async function cargarProductos() {
  const anterior = $('productoId').value;
  productos = await peticion('/productos?limite=100');
  $('productoId').innerHTML = '<option value="">Seleccione…</option>' + productos
    .map((p) => `<option value="${p.id}">${escaparHTML(p.codigo)} · ${escaparHTML(p.nombre)}</option>`)
    .join('');
  $('productoId').value = anterior;
  mostrarStock();
}

function mostrarStock() {
  const p = productos.find((x) => String(x.id) === $('productoId').value);
  $('infoStock').textContent = p
    ? `Existencia actual: ${p.stock_actual} ${p.unidad} (mínimo ${p.stock_minimo})`
    : 'Seleccione un producto para ver su existencia.';
}

async function cargarHistorial() {
  const cuerpo = $('tablaMovimientos');
  try {
    const movimientos = await peticion('/movimientos?limite=30');
    cuerpo.innerHTML = movimientos.length
      ? movimientos.map((m) => `<tr>
          <td>${new Date(m.ocurrido_en).toLocaleString('es-DO')}</td>
          <td>${escaparHTML(m.codigo)} · ${escaparHTML(m.producto)}</td>
          <td><span class="etiqueta ${m.tipo === 'RETIRO' ? 'alerta' : ''}">${m.tipo}</span></td>
          <td>${m.cantidad}</td>
          <td>${m.stock_resultante}</td>
          <td>${escaparHTML(m.usuario || '—')}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="vacio">Aún no hay movimientos.</td></tr>';
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="6" class="vacio">${escaparHTML(error.message)}</td></tr>`;
  }
}

async function registrarMovimiento() {
  const boton = $('btnRegistrar');
  boton.disabled = true;
  mostrarMensaje('', '');
  try {
    const tipo = $('tipo').value; // 'ingreso' o 'retiro'
    const resultado = await peticion(`/movimientos/${tipo}`, {
      method: 'POST',
      body: JSON.stringify({
        productoId: Number($('productoId').value),
        cantidad: Number($('cantidad').value),
        motivo: $('motivo').value,
      }),
    });
    mostrarMensaje(
      `${tipo === 'ingreso' ? 'Ingreso' : 'Retiro'} registrado. Stock resultante: ${resultado.stockResultante}.`,
      'exito'
    );
    $('motivo').value = '';
    await Promise.all([cargarProductos(), cargarHistorial()]);
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

// --- Arranque ---
if (token) {
  // El empleado solo tiene 'inventario.ingreso': no se le muestra la opción de retiro.
  // Aunque la forzara desde la consola, el servidor respondería 403.
  const opciones = [];
  if (tienePermiso('inventario.ingreso')) opciones.push('<option value="ingreso">Ingreso</option>');
  if (tienePermiso('inventario.retiro')) opciones.push('<option value="retiro">Retiro</option>');
  $('tipo').innerHTML = opciones.join('');

  $('productoId').addEventListener('change', mostrarStock);
  $('btnRegistrar').addEventListener('click', registrarMovimiento);
  cargarProductos().catch((e) => mostrarMensaje(e.message, 'error'));
  cargarHistorial();
}
