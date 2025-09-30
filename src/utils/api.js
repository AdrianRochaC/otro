// utils/api.js
// Detectar automáticamente el ambiente
const getBackendURL = () => {
  console.log('🔍 Detectando ambiente:', window.location.hostname);
  console.log('🔍 URL completa:', window.location.href);
  
  // Si estamos en desarrollo (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Usando localhost');
    return "http://localhost:3001";
  }
  
  // Si estamos en Render - FRONTEND
  if (window.location.hostname === 'otro-frontend.onrender.com') {
    console.log('🚀 Usando Render backend desde frontend');
    return "https://otro-k5x5.onrender.com";
  }
  
  // Si estamos en Render - BACKEND (por si acaso)
  if (window.location.hostname === 'otro-k5x5.onrender.com') {
    console.log('🚀 Usando Render backend desde backend');
    return "https://otro-k5x5.onrender.com";
  }
  
  // Si estamos en farmeoa.com
  if (window.location.hostname === 'farmeoa.com') {
    console.log('🌐 Usando farmeoa.com');
    return "https://farmeoa.com:3001";
  }
  
  // Para otros hosting con carpetas separadas:
  // Frontend en public_html, Backend en app/backend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  console.log('🔧 Usando hostname por defecto:', `${protocol}//${hostname}:3001`);
  return `${protocol}//${hostname}:3001`;
};

export const BACKEND_URL = getBackendURL();

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");
  const fullURL = `${BACKEND_URL}${path}`;
  
  console.log('🌐 Haciendo petición a:', fullURL);
  console.log('🔑 Token:', token ? 'Presente' : 'No presente');

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(fullURL, {
      ...options,
      headers,
    });

    console.log('📡 Respuesta recibida:', response.status, response.statusText);

    // Si la respuesta no es exitosa, lanzar error con detalles
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      console.error('❌ Error en respuesta:', errorData);
      throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('💥 Error en fetch:', error);
    
    // Si es error de red (servidor no disponible)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica que esté ejecutándose.');
    }
    throw error;
  }
};
