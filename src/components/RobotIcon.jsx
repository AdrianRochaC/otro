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
      {/* Cabeza del robot */}
      <rect x="6" y="4" width="12" height="10" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      
      {/* Antenas */}
      <circle cx="9" cy="2" r="1" fill="currentColor"/>
      <circle cx="15" cy="2" r="1" fill="currentColor"/>
      <line x1="9" y1="2" x2="9" y2="4" stroke="currentColor" strokeWidth="1"/>
      <line x1="15" y1="2" x2="15" y2="4" stroke="currentColor" strokeWidth="1"/>
      
      {/* Ojos */}
      <circle cx="9" cy="7" r="1.5" fill="white"/>
      <circle cx="15" cy="7" r="1.5" fill="white"/>
      <circle cx="9" cy="7" r="0.8" fill="currentColor"/>
      <circle cx="15" cy="7" r="0.8" fill="currentColor"/>
      
      {/* Boca */}
      <rect x="9" y="9" width="6" height="1" rx="0.5" fill="white"/>
      
      {/* Cuerpo */}
      <rect x="7" y="14" width="10" height="8" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      
      {/* Botones en el pecho */}
      <circle cx="10" cy="17" r="0.8" fill="white"/>
      <circle cx="14" cy="17" r="0.8" fill="white"/>
      <circle cx="10" cy="19" r="0.8" fill="white"/>
      <circle cx="14" cy="19" r="0.8" fill="white"/>
      
      {/* Brazos */}
      <rect x="4" y="15" width="3" height="6" rx="1" fill="currentColor"/>
      <rect x="17" y="15" width="3" height="6" rx="1" fill="currentColor"/>
      
      {/* Manos */}
      <circle cx="5.5" cy="22" r="1" fill="currentColor"/>
      <circle cx="18.5" cy="22" r="1" fill="currentColor"/>
    </svg>
  );
};

export default RobotIcon;