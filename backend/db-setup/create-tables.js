import mysql from 'mysql2/promise';

// Configuración Railway
const config = {
  host: 'metro.proxy.rlwy.net',
  port: 15580,
  user: 'root',
  password: 'tjhQWfbfMbKlxUvoEHUERzLEkEMKVcOH',
  database: 'railway'
};

async function createTables() {
  let connection;
  
  try {
    console.log('🚀 Conectando a Railway...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado');
    
    // Crear tablas
    console.log('📋 Creando tablas...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cargos (
        id int(11) NOT NULL AUTO_INCREMENT,
        nombre varchar(100) NOT NULL,
        descripcion text DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla cargos creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla usuarios creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla courses creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla questions creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla course_progress creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla documents creada');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS document_targets (
        id int(11) NOT NULL AUTO_INCREMENT,
        document_id int(11) NOT NULL,
        target_type enum('role','user') NOT NULL,
        target_value varchar(64) NOT NULL,
        PRIMARY KEY (id),
        KEY document_id (document_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla document_targets creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla notifications creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla user_preferences creada');
    
    await connection.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla bitacora_global creada');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bitacora_personal (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        titulo varchar(255) NOT NULL,
        contenido text DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla bitacora_personal creada');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chatbot_history (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        message text NOT NULL,
        response text NOT NULL,
        timestamp timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_user_timestamp (user_id,timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla chatbot_history creada');
    
    console.log('🎉 ¡Todas las tablas creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

createTables();
