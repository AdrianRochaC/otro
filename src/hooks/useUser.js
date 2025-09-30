// src/hooks/useUser.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const userData = localStorage.getItem("user");
        
        if (!authToken || !userData) {
          console.log('No hay token o usuario, redirigiendo al login');
          navigate("/login");
          return;
        }
        
        const parsedUser = JSON.parse(userData);
        
        if (!parsedUser || !parsedUser.rol) {
          console.log('Usuario inválido, redirigiendo al login');
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        
        setToken(authToken);
        setUser(parsedUser);
        setLoading(false);
        setError(null);
        
        console.log('Usuario cargado correctamente:', {
          id: parsedUser.id,
          rol: parsedUser.rol,
          nombre: parsedUser.nombre
        });
      } catch (error) {
        console.error('Error cargando usuario:', error);
        setError(error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login");
      }
    };

    loadUser();
  }, [navigate]);

  const isAdmin = user && (user.rol === 'Admin' || user.rol === 'Administrador');
  const isUser = user && user.rol && user.rol !== 'Admin' && user.rol !== 'Administrador';

  return {
    user,
    token,
    loading,
    error,
    isAdmin,
    isUser,
    hasRole: (role) => user && user.rol === role,
    hasAnyRole: (roles) => user && user.rol && roles.includes(user.rol)
  };
};
