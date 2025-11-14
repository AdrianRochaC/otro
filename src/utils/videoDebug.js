import { BACKEND_URL } from './api';

/**
 * Función para hacer debug de videos
 */
export const debugVideos = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Listar todos los archivos de video
    const response = await fetch(`${BACKEND_URL}/api/debug/videos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Verificar si el directorio existe
      // Buscar el archivo específico que estamos buscando
    }
    
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Verificar un video específico
 */
export const checkSpecificVideo = async (filename) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${BACKEND_URL}/api/check-video/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Probar acceso directo a un video
 */
export const testVideoAccess = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl, { method: 'HEAD' });
    
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Diagnosticar el problema de videos
 */
export const diagnoseVideoProblem = async () => {
  try {
    // 1. Verificar estado del servidor
    const debugResult = await debugVideos();
    
    if (!debugResult || !debugResult.success) {
      return;
    }
    
    // 2. Verificar si hay archivos
    // 3. Buscar archivos similares
    // 4. Verificar el directorio
    // 5. Recomendaciones
    
  } catch (error) {
    // Error en diagnóstico
  }
};
