/** Página de auditoría: solo la ve quien tiene el permiso auditoria.ver (administrador). */
async function cargarAuditoria() {
  const cuerpo = $('tablaAuditoria');
  try {
    const registros = await peticion('/auditoria?limite=100');
    cuerpo.innerHTML = registros.length
      ? registros.map((a) => `<tr>
          <td>${new Date(a.ocurrido_en).toLocaleString('es-DO')}</td>
          <td>${escaparHTML(a.usuario || '—')}</td>
          <td><span class="etiqueta neutra">${escaparHTML(a.accion)}</span></td>
          <td>${escaparHTML(a.entidad)} #${escaparHTML(a.entidad_id)}</td>
          <td>${escaparHTML(a.detalle || '')}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="vacio">Sin registros.</td></tr>';
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">${escaparHTML(error.message)}</td></tr>`;
  }
}

if (token) cargarAuditoria();
