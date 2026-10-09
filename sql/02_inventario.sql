SET NAMES utf8mb4;
-- ============================================================
-- Sistema de Gestión de Inventario
-- Módulos: Productos, Movimientos de inventario y Reportes
-- Ejecutar DESPUÉS de sql/schema.sql
-- ============================================================

USE inventario_db;

-- ------------------------------------------------------------
-- Tabla: categorias (RF de productos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL UNIQUE,
  descripcion  VARCHAR(255) NULL,
  activo       TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: productos
-- stock_actual solo se modifica a través de movimientos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30)   NOT NULL UNIQUE,
  nombre          VARCHAR(120)  NOT NULL,
  descripcion     VARCHAR(255)  NULL,
  categoria_id    INT           NOT NULL,
  unidad          VARCHAR(20)   NOT NULL DEFAULT 'unidad',
  precio          DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_actual    INT           NOT NULL DEFAULT 0,
  stock_minimo    INT           NOT NULL DEFAULT 0,
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT chk_producto_stock    CHECK (stock_actual >= 0),
  CONSTRAINT chk_producto_minimo   CHECK (stock_minimo >= 0),
  CONSTRAINT chk_producto_precio   CHECK (precio >= 0),
  INDEX idx_productos_categoria (categoria_id),
  INDEX idx_productos_activo (activo)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: movimientos (ingresos y retiros)
-- stock_resultante guarda cómo quedó el stock tras el movimiento.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  producto_id       INT          NOT NULL,
  tipo              ENUM('INGRESO','RETIRO') NOT NULL,
  cantidad          INT          NOT NULL,
  stock_resultante  INT          NOT NULL,
  motivo            VARCHAR(255) NULL,
  usuario_id        INT          NULL,
  ocurrido_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_mov_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT chk_mov_cantidad CHECK (cantidad > 0),
  INDEX idx_mov_producto (producto_id),
  INDEX idx_mov_fecha (ocurrido_en)
) ENGINE=InnoDB;

-- ============================================================
-- PERMISOS NUEVOS
-- ============================================================
INSERT INTO permisos (clave, descripcion) VALUES
  ('productos.editar', 'Modificar o desactivar productos'),
  ('auditoria.ver',    'Consultar el registro de auditoría')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- administrador: vuelve a recibir todos los permisos (incluye los nuevos)
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'administrador';

-- supervisor: también puede editar productos
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
WHERE r.nombre = 'supervisor' AND p.clave = 'productos.editar';

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Materia prima',      'Insumos para producción'),
  ('Producto terminado', 'Listo para la venta'),
  ('Empaque',            'Cajas, fundas y etiquetas'),
  ('Repuestos',          'Piezas de mantenimiento')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO productos (codigo, nombre, categoria_id, unidad, precio, stock_actual, stock_minimo)
SELECT 'MP-001', 'Resina de polietileno', id, 'kg', 85.00, 500, 100 FROM categorias WHERE nombre = 'Materia prima'
UNION ALL
SELECT 'MP-002', 'Pigmento azul', id, 'kg', 320.00, 8, 10 FROM categorias WHERE nombre = 'Materia prima'
UNION ALL
SELECT 'PT-001', 'Botella 500 ml', id, 'unidad', 4.50, 2400, 500 FROM categorias WHERE nombre = 'Producto terminado'
UNION ALL
SELECT 'PT-002', 'Galón 1 gal', id, 'unidad', 18.00, 150, 200 FROM categorias WHERE nombre = 'Producto terminado'
UNION ALL
SELECT 'EM-001', 'Caja de cartón 12 u', id, 'unidad', 25.00, 60, 50 FROM categorias WHERE nombre = 'Empaque'
UNION ALL
SELECT 'RP-001', 'Resistencia de molde', id, 'unidad', 1500.00, 1, 2 FROM categorias WHERE nombre = 'Repuestos'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
