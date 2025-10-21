import { BACKEND_URL } from './api';

/**
 * Función para hacer debug de videos
 */
export const debugVideos = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    console.log('🔍 === DEBUG DE VIDEOS ===');
    console.log('🌐 Backend URL:', BACKEND_URL);
    
    // Listar todos los archivos de video
    const response = await fetch(`${BACKEND_URL}/api/debug/videos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('📋 Respuesta del servidor:', data);
    
    if (data.success) {
      console.log('📁 Directorio de videos:', data.directory);
      console.log('📋 Todos los archivos:', data.allFiles);
      console.log('🎬 Archivos de video:', data.videoFiles);
      console.log('📊 Cantidad de videos:', data.count);
    } else {
      console.error('❌ Error listando videos:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error en debug de videos:', error);
    return null;
  }
};

/**
 * Verificar un video específico
 */
export const checkSpecificVideo = async (filename) => {
  try {
    const token = localStorage.getItem('authToken');
    
    console.log('🔍 === VERIFICANDO VIDEO ESPECÍFICO ===');
    console.log('📁 Filename:', filename);
    
    const response = await fetch(`${BACKEND_URL}/api/check-video/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('📋 Respuesta de verificación:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error verificando video:', error);
    return null;
  }
};

/**
 * Probar acceso directo a un video
 */
export const testVideoAccess = async (videoUrl) => {
  try {
    console.log('🔍 === PROBANDO ACCESO A VIDEO ===');
    console.log('🎬 Video URL:', videoUrl);
    
    const response = await fetch(videoUrl, { method: 'HEAD' });
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Video accesible');
      return true;
    } else {
      console.log('❌ Video no accesible');
      return false;
    }
  } catch (error) {
    console.error('❌ Error probando acceso:', error);
    return false;
  }
};
