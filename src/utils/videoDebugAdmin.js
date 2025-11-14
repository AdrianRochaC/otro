import { BACKEND_URL } from './api';

/**
 * Debug completo para administradores
 */
export const debugVideoSystem = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Obtener estado del sistema
    const response = await fetch(`${BACKEND_URL}/api/debug/video-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const debug = data.debug;
      
      // Google Drive
      // Almacenamiento local
      // Sistema
      // Recomendaciones
    }
    
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Probar subida de video
 */
export const testVideoUpload = async (file) => {
  try {
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
    
    return result;
  } catch (error) {
    return null;
  }
};
