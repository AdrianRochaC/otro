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
      {/* Cabeza del robot - rectángulo con esquinas redondeadas */}
      <rect 
        x="6" 
        y="6" 
        width="12" 
        height="10" 
        rx="2" 
        ry="2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      
      {/* Antena/conector en la parte superior central */}
      <path 
        d="M12 6 L12 3 M10 3 L14 3" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Ojos - dos óvalos verticales horizontales */}
      <ellipse 
        cx="9" 
        cy="10" 
        rx="1.2" 
        ry="2" 
        fill="currentColor"
      />
      <ellipse 
        cx="15" 
        cy="10" 
        rx="1.2" 
        ry="2" 
        fill="currentColor"
      />
    </svg>
  );
};

export default RobotIcon;