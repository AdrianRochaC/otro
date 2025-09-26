// =============================================
// Script de configuración automática para Railway
// Proyecto Grado - MySQL Setup
// =============================================

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Railway MySQL
const railwayConfig = {
  host: process.env.RAILWAY_DB_HOST || 'metro.proxy.rlwy.net',
  port: process.env.RAILWAY_DB_PORT || 15580,
  user: process.env.RAILWAY_DB_USER || 'root',
  password: process.env.RAILWAY_DB_PASSWORD || 'tjhQWfbfMbKlxUvoEHUERzLEkEMKVcOH',
  database: process.env.RAILWAY_DB_NAME || 'railway',
  ssl: {
    rejectUnauthorized: false
  }
};

// Función para ejecutar el script SQL
async function setupRailwayDatabase() {
  let connection;
  
  try {
    console.log('🚀 Iniciando configuración de Railway MySQL...');
    console.log('📡 Conectando a Railway...');
    
    // Conectar a Railway
    connection = await mysql.createConnection(railwayConfig);
    console.log('✅ Conectado a Railway MySQL');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'simple-railway-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Leyendo script SQL...');
    
    // Dividir el script en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*') && !cmd.includes('SET') && !cmd.includes('START') && !cmd.includes('COMMIT'));
    
    console.log(`🔧 Ejecutando ${commands.length} comandos...`);
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Comando ${i + 1}/${commands.length} ejecutado`);
        } catch (error) {
          // Ignorar errores de "ya existe" para tablas y datos
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry')) {
            console.warn(`⚠️ Advertencia en comando ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas en la base de datos:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Verificar datos insertados
    console.log('📊 Verificando datos insertados...');
    const [cargos] = await connection.execute('SELECT COUNT(*) as count FROM cargos');
    const [usuarios] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    const [courses] = await connection.execute('SELECT COUNT(*) as count FROM courses');
    
    console.log(`   - Cargos: ${cargos[0].count}`);
    console.log(`   - Usuarios: ${usuarios[0].count}`);
    console.log(`   - Cursos: ${courses[0].count}`);
    
    console.log('🎉 ¡Configuración completada exitosamente!');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Email: admin@proyecto.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error configurando Railway:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Función para verificar la conexión
async function testRailwayConnection() {
  let connection;
  
  try {
    console.log('🧪 Probando conexión a Railway...');
    connection = await mysql.createConnection(railwayConfig);
    
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Conexión a Railway exitosa');
    console.log('📊 Resultado de prueba:', result[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Railway:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función para mostrar información de conexión
function showConnectionInfo() {
  console.log('📋 Información de conexión Railway:');
  console.log(`   Host: ${railwayConfig.host}`);
  console.log(`   Puerto: ${railwayConfig.port}`);
  console.log(`   Usuario: ${railwayConfig.user}`);
  console.log(`   Base de datos: ${railwayConfig.database}`);
  console.log(`   SSL: ${railwayConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`);
}

// Ejecutar según el argumento de línea de comandos
const command = process.argv[2];

switch (command) {
  case 'setup':
    showConnectionInfo();
    setupRailwayDatabase();
    break;
  case 'test':
    testRailwayConnection();
    break;
  case 'info':
    showConnectionInfo();
    break;
  default:
    console.log('🔧 Script de configuración Railway MySQL');
    console.log('');
    console.log('Uso:');
    console.log('  node railway-setup.js setup  - Configurar base de datos completa');
    console.log('  node railway-setup.js test   - Probar conexión');
    console.log('  node railway-setup.js info   - Mostrar información de conexión');
    console.log('');
    console.log('Variables de entorno requeridas:');
    console.log('  RAILWAY_DB_HOST     - Host de Railway (opcional)');
    console.log('  RAILWAY_DB_PORT     - Puerto de Railway (opcional)');
    console.log('  RAILWAY_DB_USER     - Usuario de Railway (opcional)');
    console.log('  RAILWAY_DB_PASSWORD - Contraseña de Railway (opcional)');
    console.log('  RAILWAY_DB_NAME     - Nombre de la base de datos (opcional)');
}
