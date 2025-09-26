// utils/api.js
// Detectar automáticamente el ambiente
const getBackendURL = () => {
  // Si estamos en desarrollo (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://localhost:3001";
  }
  
  // Si estamos en Render
  if (window.location.hostname.includes('onrender.com')) {
    return "https://otro-k5x5.onrender.com";
  }
  
  // Si estamos en farmeoa.com
  if (window.location.hostname === 'farmeoa.com') {
    return "https://farmeoa.com:3001";
  }
  
  // Para otros hosting con carpetas separadas:
  // Frontend en public_html, Backend en app/backend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001`;
};

export const BACKEND_URL = getBackendURL();

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers,
    });

    // Si la respuesta no es exitosa, lanzar error con detalles
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return response;
  } catch (error) {
    // Si es error de red (servidor no disponible)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica que esté ejecutándose.');
    }
    throw error;
  }
};
