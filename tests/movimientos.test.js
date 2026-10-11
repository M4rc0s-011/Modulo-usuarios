import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, pool, ADMIN, login, usuarioConRol, unico, cerrarBD } from './helpers.js';

after(cerrarBD);

/** Crea un producto directo en la BD (así no dependemos del módulo de productos). */
async function productoDePrueba(stockInicial = 0, stockMinimo = 5) {
  const [r] = await pool.execute(
    `INSERT INTO productos (codigo, nombre, categoria_id, stock_actual, stock_minimo)
     VALUES (?, 'Producto de prueba movimientos', 1, ?, ?)`,
    [`M-${unico()}`.slice(0, 30), stockInicial, stockMinimo]
  );
  return r.insertId;
}

const stockDe = async (id) => {
  const [f] = await pool.execute('SELECT stock_actual FROM productos WHERE id = ?', [id]);
  return f[0].stock_actual;
};

test('PF-20 un ingreso aumenta el stock y queda en el historial', async () => {
  const token = await login(ADMIN);
  const id = await productoDePrueba(0);
  const res = await request(app).post('/api/movimientos/ingreso').set('Authorization', `Bearer ${token}`)
    .send({ productoId: id, cantidad: 20, motivo: 'Compra' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.stockResultante, 20);
  assert.equal(await stockDe(id), 20);
  const hist = await request(app).get(`/api/movimientos?productoId=${id}`).set('Authorization', `Bearer ${token}`);
  assert.equal(hist.body.data.length, 1);
});

test('PF-21 un retiro mayor que el stock es rechazado (422) y el stock no cambia', async () => {
  const token = await login(ADMIN);
  const id = await productoDePrueba(3);
  const res = await request(app).post('/api/movimientos/retiro').set('Authorization', `Bearer ${token}`)
    .send({ productoId: id, cantidad: 10 });
  assert.equal(res.status, 422);
  assert.equal(await stockDe(id), 3);
});

test('PF-22 un empleado puede registrar ingresos pero NO retiros (403)', async () => {
  const id = await productoDePrueba(10);
  const empleado = await usuarioConRol('empleado');
  const ingreso = await request(app).post('/api/movimientos/ingreso').set('Authorization', `Bearer ${empleado.token}`)
    .send({ productoId: id, cantidad: 5 });
  assert.equal(ingreso.status, 201);
  const retiro = await request(app).post('/api/movimientos/retiro').set('Authorization', `Bearer ${empleado.token}`)
    .send({ productoId: id, cantidad: 1 });
  assert.equal(retiro.status, 403);
});

test('PF-23 dos retiros simultáneos no dejan el stock negativo', async () => {
  const token = await login(ADMIN);
  const id = await productoDePrueba(10);
  const retirar = () => request(app).post('/api/movimientos/retiro').set('Authorization', `Bearer ${token}`)
    .send({ productoId: id, cantidad: 7 });
  const [a, b] = await Promise.all([retirar(), retirar()]);
  assert.deepEqual([a.status, b.status].sort(), [201, 422]);
  assert.equal(await stockDe(id), 3);
});

test('PF-24 cantidad 0 o negativa es rechazada por validación (422)', async () => {
  const token = await login(ADMIN);
  const id = await productoDePrueba(10);
  const res = await request(app).post('/api/movimientos/ingreso').set('Authorization', `Bearer ${token}`)
    .send({ productoId: id, cantidad: 0 });
  assert.equal(res.status, 422);
});

test('PF-25 la auditoría solo la ve el administrador', async () => {
  const token = await login(ADMIN);
  const ok = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${token}`);
  assert.equal(ok.status, 200);
  const empleado = await usuarioConRol('empleado');
  const no = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${empleado.token}`);
  assert.equal(no.status, 403);
});
