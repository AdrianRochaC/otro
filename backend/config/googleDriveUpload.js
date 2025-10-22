// Configuración de Multer para Google Drive
const multer = require('multer');
const googleDriveService = require('./googleDrive');

// Configuración de Multer en memoria para Google Drive
const storage = multer.memoryStorage();

const googleDriveUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB máximo
  },
  fileFilter: function (req, file, cb) {
    console.log('🔍 === MULTER FILE FILTER ===');
    console.log('📄 Archivo recibido:', file.originalname);
    console.log('📄 Tipo MIME:', file.mimetype);
    console.log('📄 Campo:', file.fieldname);
    
    if (file.mimetype.startsWith('video/')) {
      console.log('✅ Archivo de video aceptado');
      cb(null, true);
    } else {
      console.log('❌ Archivo rechazado - no es video');
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  }
});

// Middleware para procesar video después de subir
const processVideoToGoogleDrive = async (req, res, next) => {
  try {
    if (req.file) {
      console.log('🔄 === PROCESANDO VIDEO PARA GOOGLE DRIVE ===');
      console.log('📄 Archivo original:', req.file.originalname);
      console.log('📊 Tamaño:', req.file.size, 'bytes');
      console.log('📄 Tipo MIME:', req.file.mimetype);
      console.log('📦 Buffer disponible:', !!req.file.buffer);
      console.log('📦 Tamaño del buffer:', req.file.buffer?.length, 'bytes');
      
      // Obtener courseId del body o generar uno temporal
      const courseId = req.body.courseId || 'temp-' + Date.now();
      console.log('📁 Course ID:', courseId);
      
      // Subir a Google Drive
      console.log('☁️ Iniciando subida a Google Drive...');
      const result = await googleDriveService.uploadVideo(req.file, courseId);
      
      console.log('📋 === RESULTADO DE GOOGLE DRIVE ===');
      console.log('✅ Éxito:', result.success);
      console.log('📄 Nombre del archivo:', result.fileName);
      console.log('🌐 URL pública:', result.publicUrl);
      console.log('📊 Tamaño:', result.size, 'bytes');
      console.log('🏷️ Tipo de almacenamiento:', result.type);
      
      if (result.warning) {
        console.warn('⚠️ Advertencia:', result.warning);
      }
      
      // Agregar información de Google Drive al req.file
      req.file.googleDrive = result;
      req.file.location = result.publicUrl;
      req.file.googleDriveId = result.fileId;
      
      console.log('✅ Video procesado exitosamente');
    } else {
      console.log('ℹ️ No hay archivo de video para procesar');
    }
    
    next();
  } catch (error) {
    console.error('❌ === ERROR PROCESANDO VIDEO ===');
    console.error('❌ Error:', error.message);
    console.error('📚 Stack:', error.stack);
    next(error);
  }
};

module.exports = {
  googleDriveUpload,
  processVideoToGoogleDrive
};
