import React from 'react';

const DoctorIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cabeza */}
      <circle cx="12" cy="8" r="3" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      
      {/* Cuerpo */}
      <rect x="8" y="11" width="8" height="10" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      
      {/* Estetoscopio */}
      <path d="M12 11 L12 14 M10 14 L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="16" r="1.5" fill="white" stroke="white" strokeWidth="1"/>
      <circle cx="15" cy="16" r="1.5" fill="white" stroke="white" strokeWidth="1"/>
      <path d="M9 16 L7 18 M15 16 L17 18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Cruz médica en el pecho */}
      <rect x="11" y="13" width="2" height="4" fill="white"/>
      <rect x="10" y="15" width="4" height="2" fill="white"/>
      
      {/* Brazos */}
      <rect x="6" y="12" width="2" height="6" rx="1" fill="currentColor"/>
      <rect x="16" y="12" width="2" height="6" rx="1" fill="currentColor"/>
      
      {/* Piernas */}
      <rect x="9" y="21" width="2" height="3" rx="1" fill="currentColor"/>
      <rect x="13" y="21" width="2" height="3" rx="1" fill="currentColor"/>
    </svg>
  );
};

export default DoctorIcon;
