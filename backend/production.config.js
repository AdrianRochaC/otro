// Configuración para producción
export const productionConfig = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 3001, // Usar puerto del hosting o 3001
  
  // Base de datos - Configuración actual
  DB_HOST: 'shinkansen.proxy.rlwy.net',
  DB_PORT: 57379,
  DB_USER: 'root',
  DB_PASSWORD: 'vZMgbwHaRlLbmPxGPAGOPDVIexcYQjkw',
  DB_NAME: 'railway',
  
  // JWT Secret - Clave segura para producción
  JWT_SECRET: 'capacitaciones_jwt_secret_2024_ultra_secure_key',
  
  // OpenAI API Key - Si usas IA
  OPENAI_API_KEY: 'OPENAI_API_KEY'
};
