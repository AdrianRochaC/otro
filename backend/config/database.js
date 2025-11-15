// Configuración centralizada de la base de datos
const mysql = require('mysql2/promise');

// Configuración de base de datos - Solo Railway
const dbConfig = {
  // Usar siempre Railway
  host: process.env.DB_HOST || 'shinkansen.proxy.rlwy.net',
  port: process.env.DB_PORT || 57379,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'vZMgbwHaRlLbmPxGPAGOPDVIexcYQjkw',
  database: process.env.DB_NAME || 'railway',
  
  // Configuraciones adicionales para mejor rendimiento
  connectionLimit: 10,
  charset: 'utf8mb4'
};

// Mostrar información de conexión
console.log('🗄️ Configuración de BD: ' + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.database + ' (Railway)');

// Función para crear conexión (compatible con versiones antiguas)
function createConnection() {
  return new Promise(function(resolve, reject) {
    mysql.createConnection(dbConfig)
      .then(function(connection) {
        resolve(connection);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

// Función para probar la conexión (compatible con versiones antiguas)
function testConnection() {
  return new Promise(function(resolve, reject) {
    createConnection()
      .then(function(connection) {
        return connection.execute('SELECT 1');
      })
      .then(function() {
        console.log('✅ Conexión a la base de datos exitosa');
        resolve(true);
      })
      .catch(function(error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        resolve(false);
      });
  });
}

module.exports = {
  dbConfig,
  createConnection,
  testConnection
};
