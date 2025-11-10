# Cómo Verificar que los Documentos se Subieron a Cloudinary

## ⚠️ IMPORTANTE: Dónde Buscar los Documentos

**NO busques en el Dashboard.** Los documentos están en **Media Library**.

### Pasos para Ver los Documentos:

1. **Inicia sesión** en [Cloudinary Console](https://cloudinary.com/console)

2. **En el menú lateral izquierdo**, busca y haz clic en **"Media Library"** (no en "Dashboard")
   - Es el ícono que parece una biblioteca o carpeta con archivos
   - Está en la sección principal del menú

3. **Busca la carpeta `documents/`**
   - En la parte superior de Media Library, verás una barra de navegación de carpetas
   - Haz clic en la carpeta `documents/` o búscala en la lista

4. **Verás todos tus documentos subidos**
   - Nombre del archivo
   - Vista previa (si es imagen)
   - Tamaño
   - Fecha de subida
   - URL del documento

## 🔍 Verificar que Cloudinary Está Configurado

### En los Logs del Servidor (Render)

Cuando el servidor inicia, deberías ver:

```
🔍 === CONFIGURACIÓN DE CLOUDINARY ===
☁️ Cloud Name configurado: ✅ Sí (tu_cloud_name)
🔑 API Key configurado: ✅ Sí
🔐 API Secret configurado: ✅ Sí
✅ Todas las variables de Cloudinary están configuradas
```

Si ves `❌ No` en alguna variable, significa que no está configurada en Render.

### Al Subir un Documento

En los logs del servidor deberías ver:

```
☁️ Iniciando subida a Cloudinary...
📄 Archivo: [nombre]
📊 Tamaño: [tamaño] bytes
📋 Tipo MIME: [tipo]
📦 Resource Type: raw
🆔 Public ID generado: documents/[timestamp]_[nombre]
⚙️ Opciones de subida: {...}
✅ Documento subido exitosamente a Cloudinary
🌐 URL segura: https://res.cloudinary.com/...
🆔 Public ID: documents/[id]
📁 Carpeta: documents
📊 Tamaño subido: [tamaño] bytes
```

## 🐛 Solución de Problemas

### No veo los documentos en Media Library

1. **Verifica que subiste un documento** desde la aplicación
2. **Asegúrate de estar en "Media Library"** (no Dashboard)
3. **Busca en la carpeta `documents/`**
4. **Revisa los logs del servidor** para ver si hubo errores

### Error: "Cloudinary no está configurado"

1. Ve a Render.com → Tu servicio → Environment
2. Verifica que tengas estas 3 variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Reinicia el servicio después de agregar las variables

### Los documentos no se suben

1. **Revisa los logs del servidor** en Render
2. **Abre la consola del navegador** (F12) y busca errores
3. **Verifica que las variables de entorno estén correctas** en Render
4. **Asegúrate de que el archivo sea del tipo permitido** (PDF, Word, Excel)

## 📍 Ubicación Visual en Cloudinary

```
Cloudinary Console
├── Dashboard ← NO busques aquí
├── Media Library ← ✅ AQUÍ están los documentos
│   └── documents/ ← Carpeta donde se guardan
├── Assets
├── Image
└── ...
```

## ✅ Verificación Rápida

1. Sube un documento desde tu aplicación
2. Abre la consola del navegador (F12) y verifica que aparezca el alert con la URL
3. Copia la URL que aparece en el alert
4. Abre esa URL en una nueva pestaña - deberías poder descargar el documento
5. Ve a Cloudinary → Media Library → documents/ y verifica que esté ahí

