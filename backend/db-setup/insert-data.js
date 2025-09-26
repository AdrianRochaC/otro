import mysql from 'mysql2/promise';

// Configuración Railway
const config = {
  host: 'metro.proxy.rlwy.net',
  port: 15580,
  user: 'root',
  password: 'tjhQWfbfMbKlxUvoEHUERzLEkEMKVcOH',
  database: 'railway'
};

async function insertData() {
  let connection;
  
  try {
    console.log('🚀 Conectando a Railway...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado');
    
    console.log('📊 Insertando datos...');
    
    // Insertar cargos
    await connection.execute(`
      INSERT IGNORE INTO cargos (id, nombre, descripcion) VALUES
      (1, 'Admin', 'Administrador del sistema'),
      (3, 'Contabilidad', 'Personal de contabilidad'),
      (4, 'Compras', 'Personal de compras'),
      (5, 'Atención al Cliente', 'Personal de atención al cliente'),
      (6, 'Operativo', 'Personal operativo')
    `);
    console.log('✅ Cargos insertados');
    
    // Insertar usuario admin
    await connection.execute(`
      INSERT IGNORE INTO usuarios (id, nombre, email, password, rol, cargo_id, activo) VALUES
      (1, 'Admin del Sistema', 'admin@proyecto.com', '$2b$10$2WAfix5/MJkoA3WHPCRY7.PUGL620xoXFLjWgqYlRPFdWeslDf6wK', 'Admin', 1, 1)
    `);
    console.log('✅ Usuario admin insertado');
    
    // Insertar preferencias
    await connection.execute(`
      INSERT IGNORE INTO user_preferences (user_id, theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_color) VALUES
      (1, 'dark', 'default', 'medium', 'inter', 'normal', 'enabled', 'color', 'default')
    `);
    console.log('✅ Preferencias insertadas');
    
    // Insertar cursos
    await connection.execute(`
      INSERT IGNORE INTO courses (id, title, description, video_url, role, attempts, time_limit) VALUES
      (1, 'Curso de Introducción', 'Curso básico de introducción al sistema', '/uploads/videos/intro.mp4', 'Admin', 3, 30),
      (2, 'Capacitación Contabilidad', 'Curso de capacitación para personal de contabilidad', '/uploads/videos/contabilidad.mp4', 'Contabilidad', 2, 45)
    `);
    console.log('✅ Cursos insertados');
    
    // Insertar preguntas
    await connection.execute(`
      INSERT IGNORE INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index) VALUES
      (1, '¿Cuál es el objetivo principal del sistema?', 'Gestionar usuarios', 'Capacitar empleados', 'Controlar inventario', 'Facturar servicios', 1),
      (1, '¿Qué rol tiene acceso completo al sistema?', 'Usuario', 'Gerente', 'Admin', 'Operativo', 2),
      (2, '¿Cuál es la función principal de contabilidad?', 'Ventas', 'Registro financiero', 'Marketing', 'Recursos humanos', 1),
      (2, '¿Qué documento es fundamental en contabilidad?', 'Factura', 'Contrato', 'Manual', 'Catálogo', 0)
    `);
    console.log('✅ Preguntas insertadas');
    
    // Insertar bitácora
    await connection.execute(`
      INSERT IGNORE INTO bitacora_global (id, titulo, descripcion, estado, asignados, deadline) VALUES
      (1, 'Configuración Inicial', 'Configuración inicial del sistema en Railway', 'verde', 'Admin', '2025-12-31'),
      (2, 'Capacitación Personal', 'Capacitación del personal en el nuevo sistema', 'amarillo', 'Todos los cargos', '2025-11-30')
    `);
    console.log('✅ Bitácora insertada');
    
    // Insertar notificación
    await connection.execute(`
      INSERT IGNORE INTO notifications (user_id, message, type, is_read) VALUES
      (1, '¡Bienvenido al sistema! La configuración inicial se ha completado exitosamente.', 'sistema', 0)
    `);
    console.log('✅ Notificación insertada');
    
    console.log('🎉 ¡Datos insertados exitosamente!');
    console.log('🔑 Credenciales: admin@proyecto.com / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

insertData();
