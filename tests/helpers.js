/**
 * Utilidades compartidas por todas las pruebas.
 * Las pruebas usan la base de datos local (inventario_db) y crean
 * sus propios datos con nombres únicos para no chocar entre sí.
 */
import './setup-env.js';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

export { app, request, pool };

export const ADMIN = { email: 'admin@inventario.do', password: 'Admin123*' };

/** Sufijo único para correos, códigos de producto, etc. */
export const unico = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function login({ email, password }) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login falló para ${email}: ${res.status}`);
  return res.body.data.token;
}

/** Crea un usuario con el rol indicado y devuelve su token. */
export async function usuarioConRol(nombreRol) {
  const tokenAdmin = await login(ADMIN);
  const roles = await request(app).get('/api/roles').set('Authorization', `Bearer ${tokenAdmin}`);
  const rol = roles.body.data.find((r) => r.nombre === nombreRol);
  const credenciales = { email: `prueba${unico()}@test.do`, password: 'Prueba123' };
  const res = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: `Prueba ${nombreRol}`, ...credenciales, rolId: rol.id });
  if (res.status !== 201) throw new Error(`No se pudo crear usuario de prueba: ${res.status}`);
  return { ...credenciales, id: res.body.data.id, token: await login(credenciales) };
}

/** Cerrar el pool al final de cada archivo de pruebas, o node --test se queda colgado. */
export const cerrarBD = () => pool.end();
