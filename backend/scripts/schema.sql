DROP DATABASE IF EXISTS reservapp;
CREATE DATABASE reservapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reservapp;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firebaseUID VARCHAR(255) UNIQUE,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: personas
-- =====================================================
CREATE TABLE personas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_personas_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: empleados
-- =====================================================
CREATE TABLE empleados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_persona INT NOT NULL,
    turno ENUM('manana', 'tarde', 'noche') NOT NULL,
    tipo ENUM('interno', 'externo') NOT NULL,
    CONSTRAINT fk_empleados_personas FOREIGN KEY (id_persona)
        REFERENCES personas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: roles
-- =====================================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: usuarios_roles (relación N:M)
-- =====================================================
CREATE TABLE usuarios_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    CONSTRAINT fk_usuarios_roles_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usuarios_roles_roles FOREIGN KEY (id_rol)
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_usuario_rol (id_usuario, id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: comidas_tipos
-- =====================================================
CREATE TABLE comidas_tipos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: comidas
-- =====================================================
CREATE TABLE comidas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_comida_tipo INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    es_especial BOOLEAN DEFAULT FALSE,
    url_imagen VARCHAR(500),
    activa BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_comidas_tipos FOREIGN KEY (id_comida_tipo)
        REFERENCES comidas_tipos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: comidas_restricciones
-- =====================================================
CREATE TABLE comidas_restricciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: comida_tiene_restriccion (relación N:M)
-- =====================================================
CREATE TABLE comida_tiene_restriccion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_comida INT NOT NULL,
    id_comida_restriccion INT NOT NULL,
    CONSTRAINT fk_comida_tiene_restriccion_comida FOREIGN KEY (id_comida)
        REFERENCES comidas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comida_tiene_restriccion_restriccion FOREIGN KEY (id_comida_restriccion)
        REFERENCES comidas_restricciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_comida_restriccion (id_comida, id_comida_restriccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: usuario_restricciones (relación N:M)
-- =====================================================
CREATE TABLE usuario_restricciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_restriccion INT NOT NULL,
    CONSTRAINT fk_usuario_restricciones_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usuario_restricciones_restriccion FOREIGN KEY (id_restriccion)
        REFERENCES comidas_restricciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_usuario_restriccion (id_usuario, id_restriccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: estaciones
-- =====================================================
CREATE TABLE estaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: temporadas
-- =====================================================
CREATE TABLE temporadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_estacion INT NOT NULL,
    anio INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    CONSTRAINT fk_temporadas_estaciones FOREIGN KEY (id_estacion)
        REFERENCES estaciones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT check_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: planificaciones_semanales
-- =====================================================
CREATE TABLE planificaciones_semanales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_temporada INT NOT NULL,
    nro_semana INT NOT NULL,
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    fecha DATE NOT NULL,
    CONSTRAINT fk_planificaciones_temporadas FOREIGN KEY (id_temporada)
        REFERENCES temporadas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_temporada_fecha (id_temporada, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: comidas_planificacion_semanal
-- =====================================================
CREATE TABLE comidas_planificacion_semanal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_planificacion_semanal INT NOT NULL,
    id_comida_entrada INT,
    id_comida_principal INT,
    id_comida_alternativo INT,
    id_comida_vegetariana INT,
    CONSTRAINT fk_comidas_plan_planificacion FOREIGN KEY (id_planificacion_semanal)
        REFERENCES planificaciones_semanales(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comidas_plan_entrada FOREIGN KEY (id_comida_entrada)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comidas_plan_principal FOREIGN KEY (id_comida_principal)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comidas_plan_alternativo FOREIGN KEY (id_comida_alternativo)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_comidas_plan_vegetariana FOREIGN KEY (id_comida_vegetariana)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: liquidaciones
-- =====================================================
CREATE TABLE liquidaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INT NOT NULL,
    monto_total DECIMAL(10,2) DEFAULT 0,
    UNIQUE KEY unique_mes_anio (mes, anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: reservas
-- =====================================================
CREATE TABLE reservas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_liquidacion INT,
    fecha_reservada DATETIME NOT NULL,
    fecha_cancelacion DATETIME,
    id_comida_entrada INT,
    id_comida_principal INT,
    id_comida_postre INT,
    id_comida_bebida INT,
    codigo_qr VARCHAR(255) UNIQUE,
    estado_reserva ENUM('confirmada', 'cancelada', 'noshow') NOT NULL DEFAULT 'confirmada',
    estado_liquidacion BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_reservas_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_liquidaciones FOREIGN KEY (id_liquidacion)
        REFERENCES liquidaciones(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_entrada FOREIGN KEY (id_comida_entrada)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_principal FOREIGN KEY (id_comida_principal)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_postre FOREIGN KEY (id_comida_postre)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_bebida FOREIGN KEY (id_comida_bebida)
        REFERENCES comidas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLA: historicos_precios
-- =====================================================
CREATE TABLE historicos_precios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    precio DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    CONSTRAINT check_fechas_precio CHECK (fecha_desde >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_personas_apellido_nombre ON personas(apellido, nombre);
CREATE INDEX idx_empleados_tipo ON empleados(tipo);
CREATE INDEX idx_empleados_turno ON empleados(turno);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_reservada);
CREATE INDEX idx_reservas_estado ON reservas(estado_reserva);
CREATE INDEX idx_comidas_tipo ON comidas(id_comida_tipo);
CREATE INDEX idx_comidas_activa ON comidas(activa);
CREATE INDEX idx_planificaciones_fecha ON planificaciones_semanales(fecha);
CREATE INDEX idx_liquidaciones_anio_mes ON liquidaciones(anio, mes);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar roles básicos
INSERT INTO roles (nombre) VALUES
('Administrador'),
('Empleado'),
('Cocinero');

-- Insertar tipos de comidas
INSERT INTO comidas_tipos (nombre, descripcion) VALUES
('Entrada', 'Primer plato del menú'),
('Principal', 'Plato principal del menú'),
('Postre', 'Postre del menú'),
('Bebida', 'Bebidas disponibles'),
('Alternativo', 'Opción alternativa al plato principal'),
('Vegetariano', 'Opción vegetariana');

-- Insertar restricciones alimenticias
INSERT INTO comidas_restricciones (nombre, descripcion) VALUES
('Vegetariano', 'No contiene carne ni productos cárnicos'),
('Vegano', 'No contiene productos de origen animal'),
('Sin TACC', 'Apto para celíacos'),
('Sin lactosa', 'No contiene productos lácteos'),
('Sin frutos secos', 'No contiene frutos secos ni trazas'),
('Bajo en sodio', 'Contenido reducido de sal');

-- Insertar estaciones
INSERT INTO estaciones (nombre) VALUES
('Verano'),
('Otoño'),
('Invierno'),
('Primavera');
