import { BACKEND_URL } from './api';

/**
 * Debug completo para administradores
 */
export const debugVideoSystem = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    console.log('🔍 === DEBUG COMPLETO DEL SISTEMA DE VIDEOS ===');
    console.log('🌐 Backend URL:', BACKEND_URL);
    console.log('🔑 Token disponible:', !!token);
    
    // Obtener estado del sistema
    const response = await fetch(`${BACKEND_URL}/api/debug/video-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('📋 Estado del sistema:', data);
    
    if (data.success) {
      const debug = data.debug;
      
      console.log('📊 === RESUMEN DEL SISTEMA ===');
      console.log('🕐 Timestamp:', debug.timestamp);
      
      // Google Drive
      console.log('☁️ === GOOGLE DRIVE ===');
      console.log('✅ Configurado:', debug.googleDrive.configured);
      console.log('📧 Client Email:', debug.googleDrive.clientEmail);
      console.log('🔑 Private Key:', debug.googleDrive.privateKey);
      console.log('📁 Folder ID:', debug.googleDrive.folderId);
      
      // Almacenamiento local
      console.log('📁 === ALMACENAMIENTO LOCAL ===');
      console.log('📂 Directorio:', debug.localStorage.videosDir);
      console.log('✅ Existe:', debug.localStorage.exists);
      console.log('📋 Archivos:', debug.localStorage.files?.length || 0);
      
      if (debug.localStorage.files && debug.localStorage.files.length > 0) {
        console.log('📄 Lista de archivos:');
        debug.localStorage.files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        });
      }
      
      // Sistema
      console.log('💻 === SISTEMA ===');
      console.log('🟢 Node Version:', debug.system.nodeVersion);
      console.log('🖥️ Platform:', debug.system.platform);
      console.log('🧠 Memory Usage:', debug.system.memoryUsage);
      
      // Recomendaciones
      console.log('💡 === RECOMENDACIONES ===');
      if (!debug.googleDrive.configured) {
        console.warn('⚠️ Google Drive no está configurado');
        console.log('💡 Para videos persistentes, configura Google Drive');
        console.log('📖 Lee: GOOGLE-DRIVE-SETUP.md');
      } else {
        console.log('✅ Google Drive configurado - videos serán persistentes');
      }
      
      if (debug.localStorage.files && debug.localStorage.files.length > 0) {
        console.warn('⚠️ Hay archivos locales que pueden perderse');
        console.log('💡 Considera migrar a Google Drive');
      }
      
    } else {
      console.error('❌ Error obteniendo estado del sistema:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error en debug del sistema:', error);
    return null;
  }
};

/**
 * Probar subida de video
 */
export const testVideoUpload = async (file) => {
  try {
    console.log('🧪 === PROBANDO SUBIDA DE VIDEO ===');
    console.log('📄 Archivo:', file.name);
    console.log('📊 Tamaño:', file.size, 'bytes');
    console.log('📄 Tipo:', file.type);
    
    const formData = new FormData();
    formData.append('videoFile', file);
    formData.append('title', 'Test Video');
    formData.append('description', 'Video de prueba');
    formData.append('cargoId', '1');
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    console.log('📋 Resultado de la prueba:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error probando subida:', error);
    return null;
  }
};
