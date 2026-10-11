/**
 * Pruebas de aceptación de integración: atraviesan los módulos de
 * Usuarios, Productos, Movimientos y Reportes en un mismo flujo.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, ADMIN, login, usuarioConRol, unico, cerrarBD } from './helpers.js';

after(cerrarBD);

const con = (token) => ({ Authorization: `Bearer ${token}` });

test('PA-01 un retiro que deja el stock en o bajo el mínimo hace aparecer el producto en el reporte', async () => {
  const token = await login(ADMIN);
  const p = (await request(app).post('/api/productos').set(con(token))
    .send({ codigo: `PA-${unico()}`.slice(0, 30), nombre: 'Producto aceptación', categoriaId: 1, precio: 1, stockMinimo: 10 })).body.data;

  await request(app).post('/api/movimientos/ingreso').set(con(token)).send({ productoId: p.id, cantidad: 15 });
  let reporte = await request(app).get('/api/reportes/stock-bajo').set(con(token));
  assert.ok(!reporte.body.data.some((x) => x.id === p.id), 'con 15 unidades no debe estar en stock bajo');

  await request(app).post('/api/movimientos/retiro').set(con(token)).send({ productoId: p.id, cantidad: 8 });
  reporte = await request(app).get('/api/reportes/stock-bajo').set(con(token));
  assert.ok(reporte.body.data.some((x) => x.id === p.id), 'con 7 unidades debe aparecer en stock bajo');
});

test('PA-02 un supervisor crea un producto, mueve inventario y todo queda en la auditoría', async () => {
  const supervisor = await usuarioConRol('supervisor');
  const codigo = `PA-${unico()}`.slice(0, 30);
  const creado = await request(app).post('/api/productos').set(con(supervisor.token))
    .send({ codigo, nombre: 'Producto del supervisor', categoriaId: 2, precio: 5, stockMinimo: 1 });
  assert.equal(creado.status, 201);
  const id = creado.body.data.id;

  assert.equal((await request(app).post('/api/movimientos/ingreso').set(con(supervisor.token)).send({ productoId: id, cantidad: 10 })).status, 201);
  assert.equal((await request(app).post('/api/movimientos/retiro').set(con(supervisor.token)).send({ productoId: id, cantidad: 4 })).status, 201);

  const tokenAdmin = await login(ADMIN);
  const auditoria = (await request(app).get('/api/auditoria?limite=100').set(con(tokenAdmin))).body.data;
  const delProducto = auditoria.filter((a) => a.entidad === 'productos' && a.entidad_id === String(id)).map((a) => a.accion);
  assert.deepEqual(delProducto.sort(), ['CREAR_PRODUCTO', 'REGISTRAR_INGRESO', 'REGISTRAR_RETIRO']);
});

test('PA-03 un empleado no puede saltarse la interfaz para retirar ni crear usuarios', async () => {
  const empleado = await usuarioConRol('empleado');
  const retiro = await request(app).post('/api/movimientos/retiro').set(con(empleado.token)).send({ productoId: 1, cantidad: 1 });
  const usuario = await request(app).post('/api/usuarios').set(con(empleado.token))
    .send({ nombre: 'Intruso', email: `x${unico()}@test.do`, password: 'Prueba123', rolId: 1 });
  assert.equal(retiro.status, 403);
  assert.equal(usuario.status, 403);
});
