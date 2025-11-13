import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpenCheck, ClipboardList, Users2, BarChart3, User, Settings, Home } from "lucide-react";
import { FaGraduationCap, FaClipboardList, FaUser, FaBell, FaCog, FaHome, FaFileAlt, FaUsers } from "react-icons/fa";
import PersonalizationModal from '../PersonalizationModal';
import { BACKEND_URL } from '../../utils/api';
import Modal from '../Modal';

const HomeMenuList = ({ isAdmin, onNavigate, unreadCount, showNotifications }) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const location = useLocation();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

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

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para verificar si una ruta está activa
  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    // Para otras rutas, verificar si la ruta actual comienza con la ruta del menú
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
    // Recargar notificaciones para actualizar el contador
    if (showNotifDropdown) {
      setLoading(true);
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

  return (
    <>
      <nav style={{
        padding:'0', 
        width:'100%',
        height:'100vh', 
        display:'flex', 
        flexDirection:'column', 
        justifyContent:'space-between',
        background: 'var(--bg-menu)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Logo de la empresa */}
        <div style={{
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          padding:'1rem 0.8rem 1.2rem 0.8rem',
          borderBottom:'1px solid var(--border-primary)',
          flexShrink: 0
        }}>
          <img 
            src="/daviivr.png" 
            alt="Logo Empresa" 
            style={{
              maxWidth: isSmallScreen ? '110px' : '130px',
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        <div style={{
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          paddingTop: '0.5rem'
        }}>
          <ul style={{
            listStyle:'none',
            margin:0,
            padding:0,
            display:'flex',
            flexDirection:'column',
            gap: isSmallScreen ? '0.7rem' : '0.9rem',
            paddingLeft:'0.5rem',
            paddingRight:'0.5rem',
            paddingBottom: '1rem'
          }}>
            {options.map(opt => (
              <li key={opt.to} style={{position:'relative'}}>
                {opt.isNotif ? (
                  <>
                    <button
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap: isSmallScreen ? '0.8rem' : '1rem',
                        background: isActive('/notificaciones') ? 'var(--gradient-primary)' : 'none',
                        border:'none',
                        fontSize: isSmallScreen ? '0.95rem' : '1.05rem',
                        color: isActive('/notificaciones') ? 'var(--text-white)' : 'var(--text-primary)',
                        cursor:'pointer',
                        padding: isSmallScreen ? '0.5rem 0.9rem' : '0.6rem 1.1rem',
                        width:'100%',
                        textAlign:'left',
                        borderRadius:'8px',
                        transition:'all 0.3s ease',
                        position:'relative',
                        fontWeight: isActive('/notificaciones') ? '600' : '500',
                        boxShadow: isActive('/notificaciones') ? 'var(--shadow-medium)' : 'none'
                      }}
                      onClick={handleNotifClick}
                      onMouseEnter={e => {
                        if (!isActive('/notificaciones')) {
                          e.currentTarget.style.background='var(--bg-card-hover)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive('/notificaciones')) {
                          e.currentTarget.style.background='none';
                        }
                      }}
                    >
                      {opt.icon}
                      {unreadCount > 0 && (
                        <span style={{
                          position:'absolute',
                          left:10,
                          top:7,
                          width:10,
                          height:10,
                          background:'#e74c3c',
                          borderRadius:'50%',
                          display:'inline-block',
                          border:'2px solid var(--bg-menu)',
                          zIndex: 2
                        }}></span>
                      )}
                      <span>{opt.label}</span>
                    </button>
                  </>
                ) : (
                  <button
                    style={{
                      display:'flex',
                      alignItems:'center',
                      gap: isSmallScreen ? '0.8rem' : '1rem',
                      background: isActive(opt.to) ? 'var(--gradient-primary)' : 'none',
                      border:'none',
                      fontSize: isSmallScreen ? '0.95rem' : '1.05rem',
                      color: isActive(opt.to) ? 'var(--text-white)' : 'var(--text-primary)',
                      cursor:'pointer',
                      padding: isSmallScreen ? '0.5rem 0.9rem' : '0.6rem 1.1rem',
                      width:'100%',
                      textAlign:'left',
                      borderRadius:'8px',
                      transition:'all 0.3s ease',
                      position:'relative',
                      fontWeight: isActive(opt.to) ? '600' : '500',
                      boxShadow: isActive(opt.to) ? 'var(--shadow-medium)' : 'none'
                    }}
                    onClick={() => { navigate(opt.to); if(onNavigate) onNavigate(); }}
                    onMouseEnter={e => {
                      if (!isActive(opt.to)) {
                        e.currentTarget.style.background='var(--bg-card-hover)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive(opt.to)) {
                        e.currentTarget.style.background='none';
                      }
                    }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                    {isActive(opt.to) && (
                      <span style={{
                        position:'absolute',
                        left:0,
                        top:'50%',
                        transform:'translateY(-50%)',
                        width:'4px',
                        height:'60%',
                        background:'var(--text-white)',
                        borderRadius:'0 4px 4px 0'
                      }}></span>
                    )}
                  </button>
                )}
              </li>
            ))}
            
            {/* Botón de Personalización */}
            <li>
              <button
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap: isSmallScreen ? '0.8rem' : '1rem',
                  background:'none',
                  border:'none',
                  fontSize: isSmallScreen ? '0.95rem' : '1.05rem',
                  color:'var(--text-primary)',
                  cursor:'pointer',
                  padding: isSmallScreen ? '0.5rem 0.9rem' : '0.6rem 1.1rem',
                  width:'100%',
                  textAlign:'left',
                  borderRadius:'8px',
                  transition:'all 0.3s ease',
                  position:'relative',
                  fontWeight:'500'
                }}
                onClick={() => setShowPersonalization(true)}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <FaCog size={22} />
                <span>Personalizar</span>
              </button>
            </li>
          </ul>
        </div>
        
        {/* Botón cerrar sesión abajo */}
        <div style={{
          marginTop:'auto',
          padding:'1.2rem 0.8rem 1.2rem 0.8rem',
          borderTop:'1.5px solid var(--border-primary)',
          display:'flex',
          justifyContent:'center',
          flexShrink: 0
        }}>
          <button
            className="logout-btn"
            style={{
              background:'var(--gradient-danger)',
              color:'var(--text-white)',
              padding: isSmallScreen ? '0.5rem 1.2rem' : '0.6rem 1.5rem',
              borderRadius:'8px',
              fontWeight:600,
              border:'none',
              cursor:'pointer',
              fontSize: isSmallScreen ? '0.9rem' : '1rem',
              transition:'all 0.3s ease',
              boxShadow:'var(--shadow-light)',
              width: '100%',
              maxWidth: '100%'
            }}
            onClick={handleLogout}
            onMouseEnter={e => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = 'var(--shadow-medium)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'var(--shadow-light)';
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
      
      <PersonalizationModal 
        isOpen={showPersonalization} 
        onClose={() => setShowPersonalization(false)} 
      />

      {/* Modal de Notificaciones */}
      <Modal 
        isOpen={showNotifDropdown} 
        onClose={() => setShowNotifDropdown(false)}
        title={`Notificaciones ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
      >
        <div style={{
          maxHeight: '70vh',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-secondary)',
                borderTop: '3px solid var(--text-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <p>Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              <FaBell size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem' }}>No tienes notificaciones</p>
            </div>
          ) : (
            <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {notifications.map(n => {
                // Determinar colores según el tema para mejor contraste
                const getUnreadStyles = () => {
                  const colorScheme = document.documentElement.getAttribute('data-color-scheme');
                  
                  // Para tema pastel, usar texto oscuro
                  if (colorScheme === 'pastel') {
                    return {
                      background: 'var(--gradient-primary)',
                      border: '2px solid var(--border-focus)',
                      borderLeft: '4px solid var(--border-focus)',
                      messageColor: '#1a1a1a',
                      dateColor: '#2d3748',
                      textShadow: 'none'
                    };
                  }
                  
                  // Para tema neon, usar texto negro con efecto neon
                  if (colorScheme === 'neon') {
                    return {
                      background: 'var(--gradient-primary)',
                      border: '2px solid var(--border-focus)',
                      borderLeft: '4px solid var(--border-focus)',
                      messageColor: '#000000',
                      dateColor: '#000000',
                      textShadow: '0 0 8px rgba(0, 255, 136, 0.8), 0 0 12px rgba(0, 255, 136, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)'
                    };
                  }
                  
                  // Para otros temas, usar texto blanco con sombra
                  return {
                    background: 'var(--gradient-primary)',
                    border: '2px solid var(--border-focus)',
                    borderLeft: '4px solid var(--border-focus)',
                    messageColor: '#ffffff',
                    dateColor: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  };
                };
                
                const unreadStyles = !n.is_read ? getUnreadStyles() : null;
                
                return (
                <li key={n.id} style={{
                  background: n.is_read ? 'var(--bg-card)' : (unreadStyles?.background || 'var(--gradient-primary)'),
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                  boxShadow: 'var(--shadow-light)',
                  border: n.is_read ? '1px solid var(--border-primary)' : (unreadStyles?.border || '2px solid var(--border-focus)'),
                  borderLeft: !n.is_read ? (unreadStyles?.borderLeft || '4px solid var(--border-focus)') : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-light)';
                }}
                >
                  {!n.is_read && (
                    <span style={{
                      position: 'absolute',
                      top: '0.8rem',
                      right: '0.8rem',
                      width: '10px',
                      height: '10px',
                      background: 'var(--text-danger)',
                      borderRadius: '50%',
                      display: 'inline-block'
                    }}></span>
                  )}
                  <div style={{
                    fontSize: '1.05rem',
                    color: n.is_read ? 'var(--text-primary)' : (unreadStyles?.messageColor || '#ffffff'),
                    fontWeight: n.is_read ? '500' : (unreadStyles?.textShadow ? '700' : '600'),
                    letterSpacing: '0.01em',
                    lineHeight: '1.5',
                    paddingRight: !n.is_read ? '1.5rem' : '0',
                    textShadow: !n.is_read ? (unreadStyles?.textShadow || '0 1px 2px rgba(0, 0, 0, 0.2)') : 'none'
                  }}>{n.message}</div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: n.is_read ? 'var(--text-secondary)' : (unreadStyles?.dateColor || 'rgba(255, 255, 255, 0.9)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textShadow: !n.is_read ? (unreadStyles?.textShadow || '0 1px 2px rgba(0, 0, 0, 0.2)') : 'none',
                    fontWeight: !n.is_read && unreadStyles?.textShadow ? '600' : '400'
                  }}>
                    <span>{new Date(n.created_at).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {!n.is_read && (
                    <button
                      style={{
                        marginTop: '0.5rem',
                        background: 'var(--gradient-primary)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        padding: '0.5rem 1rem',
                        alignSelf: 'flex-start',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                      onClick={() => handleMarkAsRead(n.id)}
                      onMouseEnter={e => {
                        e.target.style.background = 'var(--gradient-primary-hover)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = 'var(--shadow-medium)';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'var(--gradient-primary)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Marcar como leída
                    </button>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
};

export default HomeMenuList; 