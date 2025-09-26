#!/usr/bin/env node

// Script de inicio para producción
import { productionConfig } from './production.config.js';

// Configurar variables de entorno
process.env.NODE_ENV = productionConfig.NODE_ENV;
process.env.PORT = productionConfig.PORT;
process.env.DB_HOST = productionConfig.DB_HOST;
process.env.DB_PORT = productionConfig.DB_PORT;
process.env.DB_USER = productionConfig.DB_USER;
process.env.DB_PASSWORD = productionConfig.DB_PASSWORD;
process.env.DB_NAME = productionConfig.DB_NAME;
process.env.JWT_SECRET = productionConfig.JWT_SECRET;
process.env.OPENAI_API_KEY = productionConfig.OPENAI_API_KEY;

console.log('🚀 Iniciando servidor en modo PRODUCCIÓN...');
console.log(`📡 Puerto: ${productionConfig.PORT}`);
console.log(`🗄️ Base de datos: ${productionConfig.DB_HOST}:${productionConfig.DB_PORT}`);
console.log(`🌐 Ambiente: ${productionConfig.NODE_ENV}`);

// Importar y ejecutar el servidor
import('./server.js').catch(error => {
  console.error('❌ Error iniciando el servidor:', error);
  process.exit(1);
});




