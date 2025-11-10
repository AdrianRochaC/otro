const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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
    // Determinar el resource_type según el tipo de archivo
    let resourceType = 'raw'; // Por defecto para documentos
    
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
    }
    
    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `documents/${timestamp}_${sanitizedName}`;
    
    const uploadOptions = {
      resource_type: resourceType,
      folder: 'documents',
      public_id: publicId.split('.')[0], // Sin extensión
      use_filename: false,
      unique_filename: true,
      overwrite: false
    };
    
    // Subir el archivo
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Error subiendo a Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Documento subido a Cloudinary:', result.secure_url);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes
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

