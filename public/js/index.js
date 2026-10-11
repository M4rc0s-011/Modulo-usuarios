/** Página de inicio: saludo y alertas de stock bajo (si el rol puede ver reportes). */
async function cargarAlertas() {
  const cuerpo = $('tablaAlertas');
  try {
    const productos = await peticion('/reportes/stock-bajo');
    cuerpo.innerHTML = productos.length
      ? productos.map((p) => `<tr>
          <td>${escaparHTML(p.codigo)}</td>
          <td>${escaparHTML(p.nombre)}</td>
          <td>${escaparHTML(p.categoria)}</td>
          <td><span class="etiqueta alerta">${p.stock_actual}</span></td>
          <td>${p.stock_minimo}</td>
          <td>${p.faltante}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="vacio">No hay productos en stock bajo.</td></tr>';
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="6" class="vacio">${escaparHTML(error.message)}</td></tr>`;
  }
}

if (token) {
  $('saludo').textContent = `Bienvenido, ${usuarioActual?.nombre || ''}`;
  if (tienePermiso('reportes.ver')) {
    $('seccionAlertas').classList.remove('oculto');
    cargarAlertas();
  }
}
