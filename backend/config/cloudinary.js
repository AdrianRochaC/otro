const cloudinary = require('cloudinary').v2;

// Validar configuración de Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('🔍 === CONFIGURACIÓN DE CLOUDINARY ===');
console.log('☁️ Cloud Name configurado:', cloudName ? '✅ Sí (' + cloudName + ')' : '❌ No');
console.log('🔑 API Key configurado:', apiKey ? '✅ Sí' : '❌ No');
console.log('🔐 API Secret configurado:', apiSecret ? '✅ Sí' : '❌ No');

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ ADVERTENCIA: Variables de Cloudinary no configuradas completamente');
  console.warn('💡 Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Render.com');
} else {
  console.log('✅ Todas las variables de Cloudinary están configuradas');
}

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

/**
 * Subir documento a Cloudinary
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} originalName - Nombre original del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {Promise<Object>} - URL y public_id del archivo subido
 */
async function uploadDocumentToCloudinary(fileBuffer, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    // Validar configuración antes de subir
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      const error = new Error('Cloudinary no está configurado. Verifica las variables de entorno.');
      console.error('❌ Error de configuración:', error.message);
      reject(error);
      return;
    }
    
    console.log('☁️ Iniciando subida a Cloudinary...');
    console.log('📄 Archivo:', originalName);
    console.log('📊 Tamaño:', fileBuffer.length, 'bytes');
    console.log('📋 Tipo MIME:', mimeType);
    
    // Detectar si es un video por MIME type o por extensión
    const isVideo = mimeType.startsWith('video/') || 
                    originalName.toLowerCase().match(/\.(mp4|avi|mov|wmv|mkv|flv|webm)$/);
    
    // Determinar el resource_type según el tipo de archivo
    let resourceType = 'raw'; // Por defecto para documentos y videos MP4
    
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (isVideo) {
      // Los videos MP4 se guardan como archivos (raw) para persistencia
      // Similar a los documentos, no como videos procesados
      resourceType = 'raw';
    }
    
    console.log('📦 Resource Type:', resourceType);
    console.log('🎬 Es video:', isVideo ? '✅ Sí' : '❌ No');
    
    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Determinar carpeta según el tipo de archivo
    const folder = isVideo ? 'videos' : 'documents';
    const publicId = `${folder}/${timestamp}_${sanitizedName}`;
    
    console.log('🆔 Public ID generado:', publicId);
    console.log('📁 Carpeta seleccionada:', folder);
    console.log('📂 Ruta completa en Cloudinary:', publicId);
    
    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
      public_id: publicId.split('.')[0], // Sin extensión
      use_filename: false,
      unique_filename: true,
      overwrite: false
    };
    
    console.log('⚙️ Opciones de subida:', JSON.stringify(uploadOptions, null, 2));
    
    // Subir el archivo
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Error subiendo a Cloudinary:', error);
          console.error('📚 Detalles del error:', JSON.stringify(error, null, 2));
          reject(error);
        } else {
          const uploadedFolder = result.public_id.split('/')[0] || folder;
          console.log('✅ Archivo subido exitosamente a Cloudinary');
          console.log('🌐 URL segura:', result.secure_url);
          console.log('🆔 Public ID:', result.public_id);
          console.log('📁 Carpeta en Cloudinary:', uploadedFolder);
          console.log('📂 Ruta completa:', result.public_id);
          console.log('📊 Tamaño subido:', result.bytes, 'bytes');
          console.log('📋 Formato:', result.format || 'N/A');
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            folder: uploadedFolder
          });
        }
      }
    );
    
    // Escribir el buffer al stream
    uploadStream.end(fileBuffer);
  });
}

/**
 * Eliminar documento de Cloudinary
 * @param {string} publicId - Public ID del archivo en Cloudinary
 * @param {string} resourceType - Tipo de recurso (raw, image, video)
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
async function deleteDocumentFromCloudinary(publicId, resourceType = 'raw') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log('✅ Documento eliminado de Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    throw error;
  }
}

/**
 * Extraer public_id de una URL de Cloudinary
 * @param {string} url - URL de Cloudinary
 * @returns {string|null} - Public ID o null si no es una URL válida
 */
function extractPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    // Formato: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/public_id.format
    const match = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extrayendo public_id:', error);
    return null;
  }
}

module.exports = {
  uploadDocumentToCloudinary,
  deleteDocumentFromCloudinary,
  extractPublicIdFromUrl
};

