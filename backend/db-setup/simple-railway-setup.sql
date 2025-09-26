-- Script simple para Railway MySQL
-- Crear tablas principales

CREATE TABLE IF NOT EXISTS cargos (
  id int(11) NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  descripcion text DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id int(11) NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  rol varchar(50) NOT NULL,
  cargo_id int(11) DEFAULT NULL,
  activo tinyint(1) DEFAULT 1,
  fecha_registro timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  KEY cargo_id (cargo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id int(11) NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  role varchar(50) NOT NULL,
  attempts int(11) DEFAULT 1,
  time_limit int(11) DEFAULT 30,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id int(11) NOT NULL AUTO_INCREMENT,
  course_id int(11) NOT NULL,
  question text NOT NULL,
  option_1 text NOT NULL,
  option_2 text NOT NULL,
  option_3 text NOT NULL,
  option_4 text NOT NULL,
  correct_index int(11) NOT NULL,
  PRIMARY KEY (id),
  KEY course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_progress (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  course_id int(11) NOT NULL,
  video_completed tinyint(1) NOT NULL DEFAULT 0,
  evaluation_score int(11) DEFAULT NULL,
  evaluation_total int(11) DEFAULT NULL,
  evaluation_status enum('aprobado','reprobado') DEFAULT NULL,
  attempts_used int(11) NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id int(11) NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  filename text NOT NULL,
  mimetype text NOT NULL,
  size int(11) NOT NULL,
  user_id int(11) DEFAULT NULL,
  is_global tinyint(1) DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_targets (
  id int(11) NOT NULL AUTO_INCREMENT,
  document_id int(11) NOT NULL,
  target_type enum('role','user') NOT NULL,
  target_value varchar(64) NOT NULL,
  PRIMARY KEY (id),
  KEY document_id (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) DEFAULT NULL,
  message text NOT NULL,
  type varchar(50) DEFAULT NULL,
  is_read tinyint(1) DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  data text DEFAULT NULL,
  PRIMARY KEY (id),
  KEY user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  theme varchar(20) DEFAULT 'dark',
  color_scheme varchar(20) DEFAULT 'default',
  font_size varchar(20) DEFAULT 'medium',
  font_family varchar(20) DEFAULT 'inter',
  spacing varchar(20) DEFAULT 'normal',
  animations varchar(20) DEFAULT 'enabled',
  background_type enum('color','image') DEFAULT 'color',
  background_image longblob DEFAULT NULL,
  background_color varchar(20) DEFAULT 'default',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bitacora_global (
  id int(11) NOT NULL AUTO_INCREMENT,
  titulo varchar(255) NOT NULL,
  descripcion text DEFAULT NULL,
  estado enum('rojo','amarillo','verde') DEFAULT 'rojo',
  asignados text DEFAULT NULL,
  deadline date DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bitacora_personal (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  titulo varchar(255) NOT NULL,
  contenido text DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_history (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_user_timestamp (user_id,timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos iniciales
INSERT IGNORE INTO cargos (id, nombre, descripcion) VALUES
(1, 'Admin', 'Administrador del sistema'),
(3, 'Contabilidad', 'Personal de contabilidad'),
(4, 'Compras', 'Personal de compras'),
(5, 'Atención al Cliente', 'Personal de atención al cliente'),
(6, 'Operativo', 'Personal operativo');

INSERT IGNORE INTO usuarios (id, nombre, email, password, rol, cargo_id, activo) VALUES
(1, 'Admin del Sistema', 'admin@proyecto.com', '$2b$10$2WAfix5/MJkoA3WHPCRY7.PUGL620xoXFLjWgqYlRPFdWeslDf6wK', 'Admin', 1, 1);

INSERT IGNORE INTO user_preferences (user_id, theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_color) VALUES
(1, 'dark', 'default', 'medium', 'inter', 'normal', 'enabled', 'color', 'default');

INSERT IGNORE INTO courses (id, title, description, video_url, role, attempts, time_limit) VALUES
(1, 'Curso de Introducción', 'Curso básico de introducción al sistema', '/uploads/videos/intro.mp4', 'Admin', 3, 30),
(2, 'Capacitación Contabilidad', 'Curso de capacitación para personal de contabilidad', '/uploads/videos/contabilidad.mp4', 'Contabilidad', 2, 45);

INSERT IGNORE INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index) VALUES
(1, '¿Cuál es el objetivo principal del sistema?', 'Gestionar usuarios', 'Capacitar empleados', 'Controlar inventario', 'Facturar servicios', 1),
(1, '¿Qué rol tiene acceso completo al sistema?', 'Usuario', 'Gerente', 'Admin', 'Operativo', 2),
(2, '¿Cuál es la función principal de contabilidad?', 'Ventas', 'Registro financiero', 'Marketing', 'Recursos humanos', 1),
(2, '¿Qué documento es fundamental en contabilidad?', 'Factura', 'Contrato', 'Manual', 'Catálogo', 0);

INSERT IGNORE INTO bitacora_global (id, titulo, descripcion, estado, asignados, deadline) VALUES
(1, 'Configuración Inicial', 'Configuración inicial del sistema en Railway', 'verde', 'Admin', '2025-12-31'),
(2, 'Capacitación Personal', 'Capacitación del personal en el nuevo sistema', 'amarillo', 'Todos los cargos', '2025-11-30');

INSERT IGNORE INTO notifications (user_id, message, type, is_read) VALUES
(1, '¡Bienvenido al sistema! La configuración inicial se ha completado exitosamente.', 'sistema', 0);
