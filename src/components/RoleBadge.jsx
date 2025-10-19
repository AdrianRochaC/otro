import React from 'react';
import './RoleBadge.css';

const RoleBadge = () => {
  // Obtener el rol del usuario desde el localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userRole = user?.rol || 'Empleado';
  
  // Determinar si es administrador o empleado
  const isAdmin = userRole === 'Admin' || userRole === 'Admin del Sistema';
  const displayRole = isAdmin ? 'Admin' : 'Empleado';
  
  // Configuración de íconos y colores según el rol
  const roleConfig = {
    'Admin': {
      icon: '👑',
      text: 'Administrador',
      color: '#FFD700', // Dorado
      bgColor: '#1a1a1a' // Fondo oscuro
    },
    'Empleado': {
      icon: '👤',
      text: 'Empleado',
      color: '#4CAF50', // Verde
      bgColor: '#1a1a1a' // Fondo oscuro
    },
    'default': {
      icon: '👤',
      text: 'Usuario',
      color: '#9E9E9E', // Gris
      bgColor: '#1a1a1a' // Fondo oscuro
    }
  };

  const config = roleConfig[displayRole] || roleConfig.default;

  return (
    <div className="role-badge" data-role={displayRole}>
      <div className="role-icon">
        {config.icon}
      </div>
      <span className="role-text">
        {config.text}
      </span>
    </div>
  );
};

export default RoleBadge;
