import React from 'react';

const RobotIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cabeza del robot - rectángulo redondeado */}
      <rect 
        x="7" 
        y="6" 
        width="10" 
        height="8" 
        rx="1.5" 
        ry="1.5" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2"
      />
      
      {/* Antena - línea horizontal en la parte superior */}
      <line 
        x1="10" 
        y1="4" 
        x2="14" 
        y2="4" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round"
      />
      
      {/* Conector vertical de la antena */}
      <line 
        x1="12" 
        y1="4" 
        x2="12" 
        y2="6" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round"
      />
      
      {/* Ojos - dos óvalos horizontales pequeños */}
      <ellipse 
        cx="9.5" 
        cy="9" 
        rx="1" 
        ry="0.6" 
        fill="currentColor"
      />
      <ellipse 
        cx="14.5" 
        cy="9" 
        rx="1" 
        ry="0.6" 
        fill="currentColor"
      />
      
      {/* Cuerpo - rectángulo más ancho y corto */}
      <rect 
        x="5" 
        y="14" 
        width="14" 
        height="6" 
        rx="1" 
        ry="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2"
      />
    </svg>
  );
};

export default RobotIcon;