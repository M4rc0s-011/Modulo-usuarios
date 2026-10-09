import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, ADMIN, login, usuarioConRol, cerrarBD } from './helpers.js';

after(cerrarBD);

test('PF-01 login con credenciales correctas devuelve token', async () => {
  const res = await request(app).post('/api/auth/login').send(ADMIN);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.token);
  assert.ok(res.body.data.usuario.permisos.includes('usuarios.crear'));
});

test('PF-02 login con contraseña incorrecta devuelve 401', async () => {
  const res = await request(app).post('/api/auth/login')
    .send({ email: ADMIN.email, password: 'Incorrecta1' });
  assert.equal(res.status, 401);
});

test('PF-03 sin token no se pueden listar usuarios (401)', async () => {
  const res = await request(app).get('/api/usuarios');
  assert.equal(res.status, 401);
});

test('PF-04 un empleado NO puede crear usuarios (403)', async () => {
  const empleado = await usuarioConRol('empleado');
  const res = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${empleado.token}`)
    .send({ nombre: 'Intruso', email: 'x@test.do', password: 'Prueba123', rolId: 1 });
  assert.equal(res.status, 403);
});

test('PF-05 el administrador crea un usuario (201) y no permite correo repetido (409)', async () => {
  const token = await login(ADMIN);
  const datos = { nombre: 'Ana Prueba', email: `ana${Date.now()}@test.do`, password: 'Prueba123', rolId: 3 };
  const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send(datos);
  assert.equal(res.status, 201);
  const repetido = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send(datos);
  assert.equal(repetido.status, 409);
});

test('PF-06 un correo Gmail con punto puede iniciar sesión tal como se registró', async () => {
  const token = await login(ADMIN);
  const email = `juan.perez${Date.now()}@gmail.com`;
  const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Juan Gmail', email, password: 'Prueba123', rolId: 3 });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.email, email);
  const ok = await request(app).post('/api/auth/login').send({ email, password: 'Prueba123' });
  assert.equal(ok.status, 200);
});

test('PF-07 el administrador no puede desactivarse a sí mismo (422)', async () => {
  const token = await login(ADMIN);
  const perfil = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`);
  const res = await request(app).patch(`/api/usuarios/${perfil.body.data.id}/estado`)
    .set('Authorization', `Bearer ${token}`).send({ activo: false });
  assert.equal(res.status, 422);
});

test('PF-08 un usuario desactivado no puede iniciar sesión', async () => {
  const token = await login(ADMIN);
  const empleado = await usuarioConRol('empleado');
  const res = await request(app).patch(`/api/usuarios/${empleado.id}/estado`)
    .set('Authorization', `Bearer ${token}`).send({ activo: false });
  assert.equal(res.status, 200);
  const intento = await request(app).post('/api/auth/login').send({ email: empleado.email, password: empleado.password });
  assert.equal(intento.status, 401);
});

test('PF-09 editar usuario cambia su rol y cambiar contraseña exige la actual', async () => {
  const token = await login(ADMIN);
  const empleado = await usuarioConRol('empleado');
  const editado = await request(app).put(`/api/usuarios/${empleado.id}`).set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Ascendido', email: empleado.email, rolId: 2 });
  assert.equal(editado.status, 200);
  assert.equal(editado.body.data.rol, 'supervisor');
  const mala = await request(app).put('/api/auth/password').set('Authorization', `Bearer ${empleado.token}`)
    .send({ actual: 'Incorrecta1', nueva: 'NuevaClave1' });
  assert.equal(mala.status, 422);
  const buena = await request(app).put('/api/auth/password').set('Authorization', `Bearer ${empleado.token}`)
    .send({ actual: empleado.password, nueva: 'NuevaClave1' });
  assert.equal(buena.status, 200);
  await login({ email: empleado.email, password: 'NuevaClave1' });
});
