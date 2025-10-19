import React, { memo } from 'react';
import './RoleBadge.css';

const RoleBadge = memo(() => {
  // Obtener el rol del usuario de manera eficiente
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userRole = user?.rol || 'Empleado';
  
  // Determinar si es administrador
  const isAdmin = userRole === 'Admin' || userRole === 'Admin del Sistema';
  
  // Configuración simple
  const config = isAdmin 
    ? { icon: '👑', text: 'Administrador', className: 'admin' }
    : { icon: '👤', text: 'Empleado', className: 'employee' };

  return (
    <div className={`role-badge ${config.className}`}>
      <span className="role-icon">{config.icon}</span>
      <span className="role-text">{config.text}</span>
    </div>
  );
});

RoleBadge.displayName = 'RoleBadge';

export default RoleBadge;
