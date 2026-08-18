-- ============================================================
-- Sistema de Gestión de Inventario
-- Módulo: Gestión de usuarios por privilegios (roles)
-- Motor: MySQL 8.x
-- Capa: Datos (tercera capa de la arquitectura cliente-servidor)
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventario_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inventario_db;

-- ------------------------------------------------------------
-- Tabla: roles
-- Define los perfiles de privilegio del sistema (RF-02)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(50)  NOT NULL UNIQUE,
  descripcion  VARCHAR(255) NULL,
  activo       TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: permisos
-- Acciones atómicas que el sistema puede autorizar
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  clave        VARCHAR(60)  NOT NULL UNIQUE,
  descripcion  VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: rol_permisos
-- Relación muchos a muchos entre roles y permisos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id      INT NOT NULL,
  permiso_id  INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rp_rol     FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
  CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Cuentas del sistema. La contraseña nunca se almacena en texto
-- plano, solo su hash bcrypt (RNF-02).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  rol_id          INT          NOT NULL,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  creado_por      INT          NULL,
  creado_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol     FOREIGN KEY (rol_id)     REFERENCES roles(id),
  CONSTRAINT fk_usuario_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuarios_rol (rol_id),
  INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: auditoria
-- Registro de acciones importantes (RF-11)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT          NULL,
  accion       VARCHAR(80)  NOT NULL,
  entidad      VARCHAR(60)  NOT NULL,
  entidad_id   VARCHAR(60)  NULL,
  detalle      TEXT         NULL,
  ocurrido_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_auditoria_fecha (ocurrido_en)
) ENGINE=InnoDB;

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Control total del sistema, incluida la gestión de usuarios y roles'),
  ('supervisor',    'Registra ingresos y retiros, consulta reportes, no administra usuarios'),
  ('empleado',      'Consulta el inventario y registra operaciones básicas')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO permisos (clave, descripcion) VALUES
  ('usuarios.crear',     'Crear cuentas de usuario'),
  ('usuarios.listar',    'Consultar el listado de usuarios'),
  ('usuarios.editar',    'Modificar o desactivar usuarios'),
  ('productos.crear',    'Registrar productos'),
  ('productos.listar',   'Consultar productos'),
  ('inventario.ingreso', 'Registrar ingresos de productos'),
  ('inventario.retiro',  'Registrar retiros de productos'),
  ('reportes.ver',       'Consultar reportes del inventario')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- administrador: todos los permisos
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'administrador';

-- supervisor: operación e informes, sin administración de usuarios
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'supervisor'
  AND p.clave IN ('productos.crear','productos.listar','inventario.ingreso',
                  'inventario.retiro','reportes.ver');

-- empleado: consulta y registro básico
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'empleado'
  AND p.clave IN ('productos.listar','inventario.ingreso');

-- Usuario administrador inicial.
-- Contraseña: Admin123*  (hash bcrypt, costo 10). Cambiarla al primer inicio de sesión.
INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo)
SELECT 'Administrador del sistema',
       'admin@inventario.do',
       '$2b$10$T3DLIN3BLENO18aPFc3.8.9iAlRaywdbUstUpzBSohFEiZfvvzMgS',
       r.id,
       1
FROM roles r WHERE r.nombre = 'administrador'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
