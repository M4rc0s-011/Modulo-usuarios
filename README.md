# Sistema de Gestión de Inventario

Proyecto final de **Ingeniería de Software II** — UAPA.

Aplicación web cliente-servidor de tres capas para controlar productos, existencias
y movimientos de inventario, con control de acceso por roles y privilegios.

**Equipo**

| Integrante | Rol Scrum | Módulo |
|---|---|---|
| Marcos Xavier Rodríguez Santana | Scrum Master / Developer | Gestión de usuarios y privilegios, base técnica |
| Juan Manuel Peña | Product Owner / Developer | Productos, alertas de stock bajo |
| Héctor Andrés Recio Pérez | Developer / QA | Movimientos de inventario, auditoría, pruebas de integración |

## Módulos

1. **Usuarios y privilegios**: inicio de sesión con JWT, roles (administrador, supervisor, empleado), permisos por rol, alta, edición y desactivación de cuentas.
2. **Productos**: catálogo con categorías, búsqueda, registro, desactivación y alerta de stock bajo.
3. **Movimientos de inventario**: ingresos y retiros. El stock nunca queda negativo (transacción con bloqueo de fila).
4. **Auditoría**: registro de las acciones importantes, que solo consulta el administrador.

## Arquitectura

```
CLIENTE WEB              public/            HTML + CSS + JS (presentación)
        │  HTTP/JSON
SERVIDOR DE APLICACIÓN   src/routes/        rutas y privilegio exigido
                         src/middlewares/   autenticación y autorización
                         src/validators/    validación de entradas
                         src/controllers/   traduce HTTP ↔ negocio
                         src/services/      reglas de negocio (Service Layer)
                         src/repositories/  acceso a datos (Repository)
        │  SQL preparado
BASE DE DATOS            sql/               MySQL 8
```

Regla de dependencia: cada capa solo llama a la que tiene debajo.

## Instalación

Requisitos: Node.js 20 o superior y MySQL 8.

```bash
npm install
cp .env.example .env          # editar DB_PASSWORD y JWT_SECRET
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/02_inventario.sql
npm start
```

Abrir `http://localhost:3000/login.html` · Usuario inicial: `admin@inventario.do` / `Admin123*`

## Roles y privilegios

| Permiso | Administrador | Supervisor | Empleado |
|---|---|---|---|
| Gestionar usuarios | ✔ | | |
| Consultar productos | ✔ | ✔ | ✔ |
| Registrar / desactivar productos | ✔ | ✔ | |
| Registrar ingresos | ✔ | ✔ | ✔ |
| Registrar retiros | ✔ | ✔ | |
| Ver alertas de stock bajo | ✔ | ✔ | |
| Consultar auditoría | ✔ | | |

## Endpoints

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/login` | Público (10 intentos / 15 min) |
| GET | `/api/auth/perfil` | Token válido |
| PUT | `/api/auth/password` | Token válido |
| GET | `/api/roles` | Rol administrador |
| GET | `/api/usuarios` | `usuarios.listar` |
| POST | `/api/usuarios` | Rol administrador + `usuarios.crear` |
| PUT | `/api/usuarios/:id` | `usuarios.editar` |
| PATCH | `/api/usuarios/:id/estado` | `usuarios.editar` |
| GET | `/api/categorias` | `productos.listar` |
| GET | `/api/productos` · `/api/productos/:id` | `productos.listar` |
| POST | `/api/productos` | `productos.crear` |
| PUT · PATCH | `/api/productos/:id` · `/api/productos/:id/estado` | `productos.editar` |
| GET | `/api/reportes/stock-bajo` | `reportes.ver` |
| POST | `/api/movimientos/ingreso` | `inventario.ingreso` |
| POST | `/api/movimientos/retiro` | `inventario.retiro` |
| GET | `/api/movimientos` | `inventario.ingreso` o `inventario.retiro` |
| GET | `/api/auditoria` | `auditoria.ver` |

## Pruebas

```bash
npm test
```

Son 23 pruebas automatizadas, entre funcionales y de aceptación (`node:test` + supertest), sobre la base de datos local. Crean sus propios datos de prueba. Antes de una demostración, se recrea la BD con los dos scripts SQL.
