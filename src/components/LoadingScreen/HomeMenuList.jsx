import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck, ClipboardList, Users2, BarChart3, User, Settings, Home } from "lucide-react";
import { FaGraduationCap, FaClipboardList, FaUser, FaBell, FaCog, FaHome, FaFileAlt, FaUsers, FaSignOutAlt } from "react-icons/fa";
import PersonalizationModal from '../PersonalizationModal';
import { BACKEND_URL } from '../../utils/api';
import './HomeMenuList.css';

const HomeMenuList = ({ isAdmin, onNavigate, unreadCount, showNotifications }) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);

  let options = isAdmin
    ? [
        { to: "/home", icon: <Home size={22} />, label: "Home" },
        { to: "/admin-courses", icon: <BookOpenCheck size={22} />, label: "Gestión Cursos" },
        { to: "/AdminBitacora", icon: <ClipboardList size={22} />, label: "Bitácora" },
        { to: "/cuentas", icon: <Users2 size={22} />, label: "Cuentas" },
        { to: "/dashboard", icon: <BarChart3 size={22} />, label: "Dashboard" },
        { to: "/admin-documentos", icon: <FaFileAlt size={22} />, label: "Documentos" },
        { to: "/admin-cargos", icon: <FaUsers size={22} />, label: "Cargos" },
        { to: "/perfil", icon: <User size={22} />, label: "Perfil" },
      ]
    : [
        { to: "/home", icon: <FaHome size={22} />, label: "Home" },
        { to: "/courses", icon: <FaGraduationCap size={22} />, label: "Cursos" },
        { to: "/bitacora", icon: <FaClipboardList size={22} />, label: "Bitácora" },
        { to: "/documentos", icon: <FaFileAlt size={22} />, label: "Documentos" },
        { to: "/perfil", icon: <FaUser size={22} />, label: "Perfil" },
      ];

  if (showNotifications) {
    // Insertar notificaciones antes de perfil
    const notifOption = { to: "/notificaciones", icon: <FaBell size={22} />, label: "Notificaciones", isNotif: true };
    if (isAdmin) {
      options.splice(options.length - 1, 0, notifOption);
    } else {
      options.splice(options.length - 1, 0, notifOption);
    }
  }

  const navigate = useNavigate();

  const clearUserPreferencesAndStyles = () => {
    // Elimina todas las preferencias personalizadas
    localStorage.removeItem('theme');
    localStorage.removeItem('colorScheme');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('fontFamily');
    localStorage.removeItem('spacing');
    localStorage.removeItem('animations');
    localStorage.removeItem('backgroundType');
    localStorage.removeItem('backgroundImageUrl');
    localStorage.removeItem('backgroundColor');
    localStorage.removeItem('storageCleared');
    localStorage.removeItem('backgroundImageTooLarge');

    // Restablece los estilos del DOM a los valores por defecto
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-color-scheme', 'default');
    document.documentElement.setAttribute('data-font-size', 'medium');
    document.documentElement.setAttribute('data-font-family', 'inter');
    document.documentElement.setAttribute('data-spacing', 'normal');
    document.documentElement.setAttribute('data-animations', 'enabled');
    document.documentElement.setAttribute('data-background-type', 'color');
    document.documentElement.setAttribute('data-background-color', 'default');
    document.documentElement.style.removeProperty('--background-image');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    clearUserPreferencesAndStyles();
    navigate('/login', { replace: true });
  };

  const handleNotifClick = () => {
    setShowNotifDropdown((prev) => !prev);
    if (!showNotifDropdown) {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setNotifications(data.notifications);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem('authToken');
    await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  return (
    <>
      <nav className="home-menu-list">

        <div>
          <ul>
            {options.map(opt => (
              <li key={opt.to} className="home-menu-item">
                {opt.isNotif ? (
                  <>
                    <button
                      className="home-menu-button"
                      onClick={handleNotifClick}
                    >
                      {opt.icon}
                      {unreadCount > 0 && (
                        <span className="notification-badge"></span>
                      )}
                      <span>{opt.label}</span>
                    </button>
                    {showNotifDropdown && (
                      <div className="notification-dropdown">
                        <h4 style={{
                          margin:'0 0 1rem 0',
                          fontSize:'1.1rem',
                          color:'var(--text-primary)'
                        }}>Notificaciones</h4>
                        {loading ? (
                          <div style={{color:'var(--text-secondary)'}}>Cargando...</div>
                        ) : notifications.length === 0 ? (
                          <div style={{color:'var(--text-secondary)'}}>Sin notificaciones</div>
                        ) : (
                          <ul style={{
                            listStyle:'none',
                            margin:0,
                            padding:0,
                            display:'flex',
                            flexDirection:'column',
                            gap:'0.7rem'
                          }}>
                            {notifications.map(n => (
                              <li key={n.id} style={{
                                background:n.is_read ? 'var(--bg-card)' : 'var(--gradient-info)',
                                borderRadius:'10px',
                                padding:'0.7rem 0.8rem',
                                boxShadow:'var(--shadow-light)',
                                border:'1px solid var(--border-primary)',
                                display:'flex',
                                flexDirection:'column',
                                gap:'0.3rem'
                              }}>
                                <div style={{
                                  fontSize:'1.01rem',
                                  color:'var(--text-primary)',
                                  fontWeight:'500',
                                  letterSpacing:'0.01em'
                                }}>{n.message}</div>
                                <div style={{
                                  fontSize:'0.97rem',
                                  color:'var(--text-secondary)'
                                }}>{new Date(n.created_at).toLocaleString()}</div>
                                {!n.is_read && (
                                  <button
                                    style={{
                                      marginTop:'0.3rem',
                                      background:'var(--gradient-primary)',
                                      color:'var(--text-white)',
                                      border:'none',
                                      borderRadius:'8px',
                                      cursor:'pointer',
                                      fontSize:'0.98rem',
                                      padding:'4px 12px',
                                      alignSelf:'flex-end',
                                      transition:'all 0.3s ease'
                                    }}
                                    onClick={() => handleMarkAsRead(n.id)}
                                    onMouseEnter={e => {
                                      e.target.style.background = 'var(--gradient-primary-hover)';
                                      e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                      e.target.style.background = 'var(--gradient-primary)';
                                      e.target.style.transform = 'translateY(0)';
                                    }}
                                  >
                                    Marcar como leída
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    className="home-menu-button"
                    onClick={() => { navigate(opt.to); if(onNavigate) onNavigate(); }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                )}
              </li>
            ))}
            
            {/* Botón de Personalización */}
            <li className="home-menu-item">
              <button
                className="home-menu-button"
                onClick={() => setShowPersonalization(true)}
              >
                <FaCog size={22} />
                <span>Personalizar</span>
              </button>
            </li>
          </ul>
        </div>
        
        {/* Botón cerrar sesión abajo */}
        <div className="logout-section">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Cerrar Sesión
          </button>
        </div>
      </nav>
      
      <PersonalizationModal 
        isOpen={showPersonalization} 
        onClose={() => setShowPersonalization(false)} 
      />
    </>
  );
};

export default HomeMenuList; 