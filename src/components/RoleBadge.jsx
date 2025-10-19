import React from 'react';
import './RoleBadge.css';

const RoleBadge = () => {
  try {
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
        text: 'Administrador'
      },
      'Empleado': {
        icon: '👤',
        text: 'Empleado'
      }
    };

    const config = roleConfig[displayRole] || roleConfig['Empleado'];

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
  } catch (error) {
    console.error('Error en RoleBadge:', error);
    return null; // No renderizar nada si hay error
  }
};

export default RoleBadge;
