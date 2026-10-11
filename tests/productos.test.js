import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, ADMIN, login, usuarioConRol, unico, cerrarBD } from './helpers.js';

after(cerrarBD);

const nuevoProducto = () => ({
  codigo: `T-${unico()}`.slice(0, 30), nombre: 'Producto de prueba',
  categoriaId: 1, unidad: 'unidad', precio: 10, stockMinimo: 5,
});

test('PF-10 el administrador crea un producto (201) con stock inicial 0', async () => {
  const token = await login(ADMIN);
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(nuevoProducto());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.stock_actual, 0);
});

test('PF-11 no se permite código de producto repetido (409)', async () => {
  const token = await login(ADMIN);
  const datos = nuevoProducto();
  await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(datos);
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(datos);
  assert.equal(res.status, 409);
});

test('PF-12 precio negativo es rechazado por validación (422)', async () => {
  const token = await login(ADMIN);
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`)
    .send({ ...nuevoProducto(), precio: -5 });
  assert.equal(res.status, 422);
});

test('PF-13 un empleado puede consultar productos pero NO crearlos (403)', async () => {
  const empleado = await usuarioConRol('empleado');
  const lista = await request(app).get('/api/productos').set('Authorization', `Bearer ${empleado.token}`);
  assert.equal(lista.status, 200);
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${empleado.token}`).send(nuevoProducto());
  assert.equal(res.status, 403);
});

test('PF-14 el reporte de stock bajo incluye productos en o bajo el mínimo', async () => {
  const token = await login(ADMIN);
  const res = await request(app).get('/api/reportes/stock-bajo').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.every((p) => p.stock_actual <= p.stock_minimo));
});
