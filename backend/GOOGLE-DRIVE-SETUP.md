# Configuración de Google Drive para Videos Gratuitos

## 🎯 **Objetivo**
Hacer que los videos MP4 sean persistentes y gratuitos usando Google Drive (15GB gratis).

## 🔧 **Configuración Requerida**

### **1. Crear proyecto en Google Cloud Console**
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita la API de Google Drive

### **2. Crear credenciales de servicio**
1. Ve a **APIs & Services** → **Credentials**
2. Clic en **Create Credentials** → **Service Account**
3. Nombre: `video-uploader`
4. Rol: **Editor** (o **Owner**)
5. Clic en **Create Key** → **JSON**
6. Descarga el archivo JSON

### **3. Configurar variables de entorno en Render.com**
**NO uses archivo .env** - Configura directamente en Render.com:

1. Ve a tu proyecto en Render.com
2. Clic en **Environment**
3. Agrega estas variables:

```
GOOGLE_CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_private_key_aqui\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=opcional_id_de_carpeta
```

**⚠️ IMPORTANTE:**
- Copia EXACTAMENTE el `private_key` del archivo JSON
- Incluye las comillas dobles
- Incluye los `\n` para los saltos de línea

## ✅ **Resultado**
- ✅ Videos MP4 se guardan en Google Drive
- ✅ Videos son 100% persistentes
- ✅ No se pierden en reinicios de servidor
- ✅ 15GB gratis para siempre
- ✅ YouTube sigue funcionando igual

## 🔄 **Fallback Automático**
Si Google Drive no está configurado:
- ✅ **Sistema funciona igual** (sin errores)
- ⚠️ **Videos se guardan localmente** (pueden perderse)
- 📝 **Logs te avisan** que necesitas configurar Google Drive

## 💰 **Costo**
- **Google Drive**: 15GB gratis para siempre
- **Sin límite de tiempo**
- **Sin tarjeta de crédito requerida**

## 🚀 **Después de Configurar**
1. Reinicia tu servidor
2. Sube un video MP4
3. Verifica que se guarde en Google Drive
4. Los videos nunca se perderán

## 🔍 **Verificar que Funciona**
1. Ve a tu Google Drive
2. Busca archivos con nombre `course-{id}-{timestamp}-{filename}`
3. Los videos deberían estar ahí y ser públicos
