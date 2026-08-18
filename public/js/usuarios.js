/**
 * Cliente web (primera capa de la arquitectura de tres capas).
 * Solo presenta datos y envía peticiones: ninguna decisión de seguridad
 * se toma aquí. Ocultar un botón en el navegador no protege nada; la
 * autorización real ocurre siempre en el servidor.
 */
const API = '/api';
const token = localStorage.getItem('token');
const usuarioActual = JSON.parse(localStorage.getItem('usuario') || 'null');

const $ = (id) => document.getElementById(id);

const PRIVILEGIOS_POR_ROL = {
  administrador: ['Gestión completa de usuarios y roles', 'Alta y edición de productos',
                  'Ingresos y retiros de inventario', 'Reportes y auditoría'],
  supervisor:    ['Alta y edición de productos', 'Ingresos y retiros de inventario', 'Reportes'],
  empleado:      ['Consulta del catálogo de productos', 'Registro de ingresos'],
};

function mostrarMensaje(texto, tipo) {
  const caja = $('mensaje');
  caja.textContent = texto;
  caja.className = tipo;
}

async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opciones.headers || {}),
    },
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const detalle = cuerpo.detalles?.map((d) => d.mensaje).join('. ');
    throw new Error(detalle || cuerpo.error || 'Error inesperado');
  }
  return cuerpo.data;
}

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
    `<strong>${opcion.dataset.descripcion || nombre}</strong>` +
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
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td><span class="etiqueta">${u.rol}</span></td>
          <td>${u.activo ? 'Activo' : 'Inactivo'}</td>
        </tr>`)
      .join('');
  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="4" class="vacio">${error.message}</td></tr>`;
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

// --- Arranque ---
if (!token) {
  window.location.href = 'login.html';
} else {
  $('sesion').textContent = `${usuarioActual?.nombre || ''} · ${usuarioActual?.rol || ''}`;
  $('rolId').addEventListener('change', mostrarPrivilegios);
  $('btnCrear').addEventListener('click', crearUsuario);
  cargarRoles();
  cargarUsuarios();
}
