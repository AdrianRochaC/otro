import { BACKEND_URL } from './api';

/**
 * Función para hacer debug de videos
 */
export const debugVideos = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    console.log('🔍 === DEBUG DE VIDEOS ===');
    console.log('🌐 Backend URL:', BACKEND_URL);
    console.log('🔑 Token disponible:', !!token);
    
    // Listar todos los archivos de video
    const response = await fetch(`${BACKEND_URL}/api/debug/videos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 Respuesta del servidor:', data);
    
    if (data.success) {
      console.log('📁 Directorio de videos:', data.directory);
      console.log('📋 Todos los archivos:', data.allFiles);
      console.log('🎬 Archivos de video:', data.videoFiles);
      console.log('📊 Cantidad de videos:', data.count);
      
      // Verificar si el directorio existe
      if (data.allFiles && data.allFiles.length === 0) {
        console.warn('⚠️ El directorio de videos está vacío');
      }
      
      // Buscar el archivo específico que estamos buscando
      const targetFile = '1761081012577-videoFile.mp4';
      const fileExists = data.allFiles && data.allFiles.includes(targetFile);
      console.log(`🔍 Archivo ${targetFile} existe:`, fileExists);
      
      if (!fileExists && data.allFiles) {
        console.log('🔍 Archivos similares encontrados:', 
          data.allFiles.filter(f => f.includes('1761081012577') || f.includes('videoFile'))
        );
      }
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

/**
 * Diagnosticar el problema de videos
 */
export const diagnoseVideoProblem = async () => {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DE VIDEOS ===');
  
  try {
    // 1. Verificar estado del servidor
    console.log('1️⃣ Verificando estado del servidor...');
    const debugResult = await debugVideos();
    
    if (!debugResult || !debugResult.success) {
      console.error('❌ No se pudo conectar con el servidor');
      return;
    }
    
    // 2. Verificar si hay archivos
    console.log('2️⃣ Verificando archivos disponibles...');
    if (debugResult.allFiles && debugResult.allFiles.length === 0) {
      console.warn('⚠️ PROBLEMA IDENTIFICADO: El directorio de videos está vacío');
      console.log('💡 POSIBLE CAUSA: El servidor se reinició y perdió los archivos');
      console.log('💡 SOLUCIÓN: Necesitas subir el video nuevamente');
      return;
    }
    
    // 3. Buscar archivos similares
    console.log('3️⃣ Buscando archivos similares...');
    const similarFiles = debugResult.allFiles.filter(f => 
      f.includes('1761081012577') || 
      f.includes('videoFile') ||
      f.endsWith('.mp4')
    );
    
    if (similarFiles.length > 0) {
      console.log('🔍 Archivos similares encontrados:', similarFiles);
    } else {
      console.log('❌ No se encontraron archivos similares');
    }
    
    // 4. Verificar el directorio
    console.log('4️⃣ Información del directorio:');
    console.log('📁 Directorio:', debugResult.directory);
    console.log('📊 Total de archivos:', debugResult.allFiles?.length || 0);
    console.log('🎬 Archivos de video:', debugResult.videoFiles?.length || 0);
    
    // 5. Recomendaciones
    console.log('5️⃣ RECOMENDACIONES:');
    if (debugResult.allFiles?.length === 0) {
      console.log('🔄 El servidor está vacío - necesitas subir videos nuevamente');
    } else if (!debugResult.allFiles?.includes('1761081012577-videoFile.mp4')) {
      console.log('🔍 El archivo específico no existe - verifica el nombre o sube uno nuevo');
    } else {
      console.log('✅ El archivo debería existir - revisa permisos o configuración');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
};
