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
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  }
});

// Middleware para procesar video después de subir
const processVideoToGoogleDrive = async (req, res, next) => {
  try {
    if (req.file) {
      console.log('🔄 Procesando video para Google Drive...');
      
      // Obtener courseId del body o generar uno temporal
      const courseId = req.body.courseId || 'temp-' + Date.now();
      
      // Subir a Google Drive
      const result = await googleDriveService.uploadVideo(req.file, courseId);
      
      // Agregar información de Google Drive al req.file
      req.file.googleDrive = result;
      req.file.location = result.publicUrl;
      req.file.googleDriveId = result.fileId;
      
      console.log('✅ Video procesado para Google Drive');
      console.log('🌐 URL pública:', result.publicUrl);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error procesando video para Google Drive:', error);
    next(error);
  }
};

module.exports = {
  googleDriveUpload,
  processVideoToGoogleDrive
};
