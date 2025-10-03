// utils/videoUtils.js
import { BACKEND_URL } from './api';

/**
 * Construye la URL final para un video de manera consistente
 * @param {string} videoUrl - URL del video desde la base de datos
 * @returns {string} URL final para reproducir el video
 */
export const buildVideoUrl = (videoUrl) => {
  if (!videoUrl || videoUrl.trim() === '') {
    return null;
  }

  // Si es YouTube embed, devolver tal como está
  if (videoUrl.includes('youtube.com/embed/')) {
    return videoUrl;
  }

  // Si ya es una URL completa (http/https), devolver tal como está
  if (videoUrl.startsWith('http')) {
    return videoUrl;
  }

  // Si empieza con /uploads/videos/, agregar BACKEND_URL
  if (videoUrl.startsWith('/uploads/videos/')) {
    return `${BACKEND_URL}${videoUrl}`;
  }

  // Fallback: asumir que es un archivo local y construir la ruta completa
  return `${BACKEND_URL}/uploads/videos/${videoUrl}`;
};

/**
 * Verifica si un video es de YouTube
 * @param {string} videoUrl - URL del video
 * @returns {boolean} true si es YouTube
 */
export const isYouTubeVideo = (videoUrl) => {
  return videoUrl && videoUrl.includes('youtube.com/embed/');
};

/**
 * Convierte una URL de YouTube normal a embed
 * @param {string} url - URL de YouTube
 * @returns {string|null} URL de embed o null si no es YouTube
 */
export const convertToEmbedUrl = (url) => {
  if (!url) return null;
  
  // Si ya es embed, devolver tal como está
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Convertir URL normal de YouTube a embed
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

/**
 * Convierte una URL de embed a URL normal de YouTube
 * @param {string} embedUrl - URL de embed de YouTube
 * @returns {string|null} URL normal o null si no es embed
 */
export const convertToWatchUrl = (embedUrl) => {
  if (!embedUrl) return null;
  
  const match = embedUrl.match(/youtube\.com\/embed\/([^?&]+)/);
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : embedUrl;
};
