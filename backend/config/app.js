// Configuración general de la aplicación
const appConfig = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'capacitaciones_jwt_secret_2024_ultra_secure_key',
    expiresIn: '24h'
  },
  
  // Configuración de archivos
  uploads: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // Configuración de OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'OPENAI_API_KEY',
    model: 'gpt-4.1'
  },
  
  // Configuración de CORS
  cors: {
    allowedOrigins: [
      'https://farmeoa.com',
      'https://www.farmeoa.com',
      'http://farmeoa.com',
      'http://www.farmeoa.com',
      'https://farmeoa.com:3001',
      'http://farmeoa.com:3001',
      'https://otro-frontend.onrender.com',
      'https://otro-k5x5.onrender.com',
      'https://farmeoan.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ]
  }
};

module.exports = appConfig;
