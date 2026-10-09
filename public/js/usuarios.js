/**
 * Cliente web (primera capa de la arquitectura de tres capas).
 * Solo presenta datos y envía peticiones: ninguna decisión de seguridad
 * se toma aquí. Ocultar un botón en el navegador no protege nada; la
 * autorización real ocurre siempre en el servidor.
 */
// API, token, usuarioActual, $, peticion, mostrarMensaje y escaparHTML vienen de comun.js

const PRIVILEGIOS_POR_ROL = {
  administrador: ['Gestión completa de usuarios y roles', 'Alta y edición de productos',
                  'Ingresos y retiros de inventario', 'Reportes y auditoría'],
  supervisor:    ['Alta y edición de productos', 'Ingresos y retiros de inventario', 'Reportes'],
  empleado:      ['Consulta del catálogo de productos', 'Registro de ingresos'],
};

async function cargarRoles() {
  const select = $('rolId');
  try {
    const roles = await peticion('/roles');
    select.innerHTML = '<option value="">Seleccione un rol…</option>';
    roles.forEach((rol) => {
      const opcion = document.createElement('option');
      opcion.value = rol.id;
      opcion.textContent = rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1);
      opcion.dataset.nombre = rol.nombre;
      opcion.dataset.descripcion = rol.descripcion || '';
      select.appendChild(opcion);
    });
  } catch (error) {
    select.innerHTML = '<option value="">No fue posible cargar los roles</option>';
    mostrarMensaje(error.message, 'error');
  }
}

function mostrarPrivilegios() {
  const opcion = $('rolId').selectedOptions[0];
  const caja = $('privilegios');
  const nombre = opcion?.dataset.nombre;

  if (!nombre) {
    caja.textContent = 'Seleccione un rol para ver los privilegios que otorga.';
    return;
  }
  const lista = PRIVILEGIOS_POR_ROL[nombre] || [];
  caja.innerHTML =
    `<strong>${escaparHTML(opcion.dataset.descripcion || nombre)}</strong>` +
    `<ul>${lista.map((p) => `<li>${p}</li>`).join('')}</ul>`;
}

async function cargarUsuarios() {
  const cuerpo = $('tablaUsuarios');
  try {
    const usuarios = await peticion('/usuarios');
    if (!usuarios.length) {
      cuerpo.innerHTML = '<tr><td colspan="4" class="vacio">Aún no hay usuarios registrados.</td></tr>';
      return;
    }
    cuerpo.innerHTML = usuarios
      .map((u) => `<tr>
          <td>${escaparHTML(u.nombre)}</td>
          <td>${escaparHTML(u.email)}</td>
          <td><span class="etiqueta">${escaparHTML(u.rol)}</span></td>
          <td>${u.activo ? 'Activo' : 'Inactivo'}</td>
        </tr>`)
      .join('');
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="vacio">${escaparHTML(error.message)}</td></tr>`;
  }
}

async function crearUsuario() {
  const boton = $('btnCrear');
  boton.disabled = true;
  mostrarMensaje('', '');

  try {
    const nuevo = await peticion('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('nombre').value,
        email: $('email').value,
        password: $('password').value,
        rolId: Number($('rolId').value),
      }),
    });
    mostrarMensaje(`Usuario ${nuevo.email} creado con el rol ${nuevo.rol}.`, 'exito');
    ['nombre', 'email', 'password'].forEach((campo) => ($(campo).value = ''));
    $('rolId').value = '';
    mostrarPrivilegios();
    cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

// --- Arranque (la verificación del token y el menú los hace comun.js) ---
if (token) {
  $('rolId').addEventListener('change', mostrarPrivilegios);
  $('btnCrear').addEventListener('click', crearUsuario);
  cargarRoles();
  cargarUsuarios();
}
