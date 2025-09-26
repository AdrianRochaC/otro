# 🚀 Guía de Despliegue del Backend

## 📋 Pasos para subir el backend a producción:

### 1. **Preparar archivos para subir:**
```
backend/
├── server.js
├── start-production.js
├── production.config.js
├── package.json
├── package-lock.json
├── node_modules/ (o instalar en el servidor)
├── uploads/
├── temp/
└── DEPLOYMENT.md
```

### 2. **Configurar el servidor:**
- **Puerto:** 3001
- **Node.js:** Versión 18 o superior
- **PM2:** Para mantener el proceso activo (recomendado)

### 3. **Comandos para ejecutar en el servidor:**

```bash
# Instalar dependencias
npm install --production

# Iniciar en modo producción
npm run start:prod

# O con PM2 (recomendado)
npm install -g pm2
pm2 start start-production.js --name "capacitaciones-backend"
pm2 save
pm2 startup
```

### 4. **Configurar CORS:**
Edita `server.js` línea 81-84 y cambia:
```javascript
const allowedOrigins = [
  'https://tu-dominio-real.com',  // ← Cambia esto
  'https://www.tu-dominio-real.com',
  'http://tu-dominio-real.com',
  'http://www.tu-dominio-real.com'
];
```

### 5. **Verificar que funciona:**
```bash
curl http://tu-servidor:3001/api/test
```

### 6. **Configurar firewall:**
- Abrir puerto 3001
- Permitir conexiones desde tu dominio frontend

## ✅ **Resultado esperado:**
- ✅ Sin errores 404, 500, 503
- ✅ CORS configurado correctamente
- ✅ Base de datos conectada
- ✅ Rutas de API funcionando
- ✅ Comunicación perfecta con frontend

## 🔧 **Troubleshooting:**
- Si hay error 404: Verificar que el servidor esté ejecutándose
- Si hay error 500: Revisar logs del servidor
- Si hay error CORS: Verificar configuración de dominios




