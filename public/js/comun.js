/**
 * Funciones compartidas por todas las páginas (capa de presentación).
 * Cargar este archivo ANTES del script propio de cada página:
 *   <script src="js/comun.js"></script>
 *   <script src="js/productos.js"></script>
 *
 * Recordatorio: ocultar opciones del menú es solo comodidad visual.
 * La seguridad real está en el servidor (middlewares de auth.js).
 */
const API = '/api';
const token = localStorage.getItem('token');
const usuarioActual = JSON.parse(localStorage.getItem('usuario') || 'null');

const $ = (id) => document.getElementById(id);

/** Evita XSS: usar SIEMPRE al meter datos de la BD dentro de innerHTML. */
function escaparHTML(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function tienePermiso(...permisos) {
  const propios = usuarioActual?.permisos || [];
  return permisos.some((p) => propios.includes(p));
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

/** fetch con token. Si el token expiró (401), vuelve al login. */
async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opciones.headers || {}),
    },
  });
  if (respuesta.status === 401) {
    cerrarSesion();
    throw new Error('La sesión expiró');
  }
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const detalle = cuerpo.detalles?.map((d) => d.mensaje).join('. ');
    throw new Error(detalle || cuerpo.error || 'Error inesperado');
  }
  return cuerpo.data;
}

function mostrarMensaje(texto, tipo, idCaja = 'mensaje') {
  const caja = $(idCaja);
  if (!caja) return;
  caja.textContent = texto;
  caja.className = tipo;
}

/** Opciones del menú y el permiso que exige cada una (null = todos). */
const OPCIONES_MENU = [
  { href: 'index.html',       texto: 'Inicio',      permisos: null },
  { href: 'productos.html',   texto: 'Productos',   permisos: ['productos.listar'] },
  { href: 'movimientos.html', texto: 'Movimientos', permisos: ['inventario.ingreso', 'inventario.retiro'] },
  { href: 'usuarios.html',    texto: 'Usuarios',    permisos: ['usuarios.listar'] },
  { href: 'auditoria.html',   texto: 'Auditoría',   permisos: ['auditoria.ver'] },
];

function pintarMenu() {
  const menu = $('menu');
  if (!menu) return;
  const actual = location.pathname.split('/').pop() || 'index.html';
  menu.innerHTML =
    OPCIONES_MENU.filter((o) => !o.permisos || tienePermiso(...o.permisos))
      .map((o) => `<a href="${o.href}" class="${o.href === actual ? 'activo' : ''}">${o.texto}</a>`)
      .join('') + '<button type="button" class="salir" id="btnSalir">Cerrar sesión</button>';
  $('btnSalir').addEventListener('click', cerrarSesion);
}

// --- Arranque común de toda página protegida ---
if (!token) {
  window.location.href = 'login.html';
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const sesion = $('sesion');
    if (sesion) sesion.textContent = `${usuarioActual?.nombre || ''} · ${usuarioActual?.rol || ''}`;
    pintarMenu();
  });
}
