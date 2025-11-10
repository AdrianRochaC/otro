# Configuración de Cloudinary para Documentos

Este proyecto utiliza Cloudinary para almacenar documentos de forma persistente en la nube.

## Requisitos Previos

1. Crear una cuenta en [Cloudinary](https://cloudinary.com/)
2. Obtener las credenciales de tu cuenta:
   - Cloud Name
   - API Key
   - API Secret

## Configuración

### 1. Obtener Credenciales de Cloudinary

1. Inicia sesión en tu cuenta de Cloudinary
2. Ve al Dashboard
3. En la sección "Account Details" encontrarás:
   - **Cloud Name**: Nombre de tu cuenta
   - **API Key**: Tu clave API
   - **API Secret**: Tu secreto API (haz clic en "Reveal" para verlo)

### 2. Configurar Variables de Entorno

Agrega las siguientes variables de entorno a tu archivo `.env` en la carpeta `backend/`:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Ejemplo:**
```env
CLOUDINARY_CLOUD_NAME=mi_farmacia
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 3. Instalar Dependencias

Si aún no has instalado las dependencias, ejecuta:

```bash
cd backend
npm install
```

Esto instalará el paquete `cloudinary` que ya está incluido en `package.json`.

## Funcionalidad

### Almacenamiento de Documentos

- Todos los documentos subidos se almacenan en Cloudinary en la carpeta `documents/`
- Los documentos se organizan automáticamente con nombres únicos
- Se soportan los siguientes tipos de archivo:
  - PDF (`application/pdf`)
  - Word (`application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
  - Excel (`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### Operaciones

- **Subir**: Los documentos se suben automáticamente a Cloudinary al crearlos
- **Actualizar**: Al actualizar un documento con un archivo nuevo, el anterior se elimina de Cloudinary
- **Eliminar**: Al eliminar un documento, también se elimina de Cloudinary

### URLs de Documentos

- Las URLs de Cloudinary se guardan en la base de datos en el campo `filename`
- El frontend detecta automáticamente si es una URL de Cloudinary (comienza con `http`) o una ruta local
- Los documentos antiguos con rutas locales seguirán funcionando hasta que se actualicen

## Solución de Problemas

### Error: "Invalid API Key"

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que no haya espacios extra en las credenciales
- Reinicia el servidor después de cambiar las variables de entorno

### Error: "Upload failed"

- Verifica tu conexión a internet
- Revisa que el tamaño del archivo no exceda 20MB
- Verifica que el tipo de archivo esté permitido

### Los documentos antiguos no se muestran

- Los documentos subidos antes de la integración con Cloudinary usan rutas locales
- Estos documentos seguirán funcionando si el servidor tiene acceso a la carpeta `uploads/documents/`
- Para migrar documentos antiguos, puedes actualizarlos manualmente desde el panel de administración

## Notas Importantes

- **Persistencia**: Los documentos ahora tienen persistencia completa en Cloudinary
- **Backup**: Cloudinary mantiene automáticamente copias de seguridad de tus archivos
- **CDN**: Los documentos se sirven a través de la CDN de Cloudinary para mejor rendimiento
- **Seguridad**: Las URLs de Cloudinary son públicas por defecto. Si necesitas privacidad adicional, considera configurar firmas de URL en Cloudinary

