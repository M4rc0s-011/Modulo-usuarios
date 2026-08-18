# Módulo de gestión de usuarios por privilegios

Sistema de Gestión de Inventario — Ingeniería de Software II, UAPA
Unidad 2: arquitectura de aplicaciones aplicada a un módulo funcional.

## Arquitectura implementada

Arquitectura **cliente-servidor de tres capas con organización interna en capas
(layered / n-tier)**, la misma definida en la Unidad 1:

```
CLIENTE WEB              public/            HTML + CSS + JS (presentación)
        │  HTTP/JSON
SERVIDOR DE APLICACIÓN   src/routes/        define rutas y privilegios exigidos
                         src/middlewares/   autenticación y autorización
                         src/validators/    validación de entradas
                         src/controllers/   traduce HTTP ↔ negocio
                         src/services/      reglas de negocio (Service Layer)
                         src/repositories/  acceso a datos (Repository)
        │  SQL preparado
BASE DE DATOS            sql/schema.sql     MySQL 8
```

Regla de dependencia: cada capa solo llama a la que tiene debajo. Los
controladores no escriben SQL y los repositorios no conocen HTTP.

## Requisitos

- Node.js 18 o superior
- MySQL 8.x

## Instalación

```bash
npm install
cp .env.example .env        # editar credenciales y JWT_SECRET
mysql -u root -p < sql/schema.sql
npm start
```

Abrir `http://localhost:3000/login.html`.

## Credenciales iniciales

| Correo | Contraseña | Rol |
|---|---|---|
| admin@inventario.do | Admin123* | administrador |

Cambiar la contraseña después de la primera prueba.

## Roles y privilegios

| Rol | Crear usuarios | Productos | Ingresos / retiros | Reportes |
|---|---|---|---|---|
| administrador | Sí | Sí | Sí | Sí |
| supervisor | No | Sí | Sí | Sí |
| empleado | No | Solo consulta | Solo ingresos | No |

## Endpoints

| Método | Ruta | Privilegio exigido |
|---|---|---|
| POST | `/api/auth/login` | Público (limitado a 10 intentos / 15 min) |
| GET | `/api/auth/perfil` | Token válido |
| GET | `/api/roles` | Rol `administrador` |
| GET | `/api/usuarios` | Permiso `usuarios.listar` |
| POST | `/api/usuarios` | Rol `administrador` + permiso `usuarios.crear` |

## Prueba de la restricción por privilegios

1. Iniciar sesión como administrador y crear un usuario con rol `empleado`.
2. Cerrar sesión (borrar `localStorage`) e iniciar con ese empleado.
3. Intentar `POST /api/usuarios` con su token: el servidor responde
   **403 Forbidden**, aunque la petición se envíe directamente desde consola
   o desde una herramienta como Postman, sin pasar por la interfaz.

Ese es el punto de la práctica: la autorización vive en el servidor, no en el
navegador.
