// components/LoadingScreen/Layout.jsx
import React from 'react';
import HomeMenuList from './HomeMenuList';
import Chatbot from '../Chatbot';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../utils/api';

const Layout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();
  
  // Determinar si es admin
  const isAdmin = user && (user.rol === 'Admin' || user.rol === 'Administrador');
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // Obtener cantidad de notificaciones no leídas solo si hay usuario logueado
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || location.pathname === '/login' || location.pathname === '/register') {
      return;
    }
    
    fetch(`${BACKEND_URL}/api/notifications/unread/count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUnreadCount(data.count);
      })
      .catch(error => {
      });
  }, [location.pathname]);

  // Hook para manejar el resize de la ventana
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // En móviles, cerrar el menú si está abierto
      if (mobile && showMenu) {
        setShowMenu(false);
      }
      
      // En desktop, cerrar el menú móvil si está abierto
      if (!mobile && showMenu) {
        setShowMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showMenu]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout-container">
      {/* En Home, menú desplegable; en otras páginas, menú fijo siempre visible */}
      {location.pathname === '/home' ? (
        <>
          <div style={{display:'flex',justifyContent:'flex-start',alignItems:'center',padding:'1.2rem 2.5rem 0 2.5rem'}}>
            <button
              className="home-hamburger-btn"
              style={{
                background:'none',
                border:'none',
                fontSize:'2.1rem',
                cursor:'pointer',
                color:'var(--text-primary)',
                position:'relative',
                transition:'color 0.3s ease'
              }}
              onClick={() => setShowMenu(true)}
              aria-label="Abrir menú"
            >
              &#9776;
              {unreadCount > 0 && (
                <span style={{
                  position:'absolute',
                  top:7,
                  right:-7,
                  width:13,
                  height:13,
                  background:'#e74c3c',
                  borderRadius:'50%',
                  display:'inline-block',
                  border:'2px solid var(--bg-menu)',
                  zIndex:2
                }}></span>
              )}
            </button>
          </div>
          {showMenu && (
            <div className="home-menu-overlay" style={{
              position:'fixed',
              top:0,
              left:0,
              width:'100vw',
              height:'100vh',
              background:'rgba(0,0,0,0.5)',
              backdropFilter:'blur(8px)',
              zIndex:9999,
              display:'flex',
              alignItems:'flex-start',
              justifyContent:'flex-start'
            }}>
              <div style={{
                background:'var(--bg-menu)',
                minWidth:'220px',
                maxWidth:'90vw',
                height:'100vh',
                boxShadow:'var(--shadow-card)',
                padding:'0',
                position:'relative',
                display:'flex',
                flexDirection:'column',
                borderRight:'1px solid var(--border-primary)'
              }}>
                <button
                  style={{
                    position:'absolute',
                    top:'1.2rem',
                    right:'1.2rem',
                    background:'none',
                    border:'none',
                    fontSize:'2rem',
                    cursor:'pointer',
                    color:'var(--text-primary)',
                    transition:'color 0.3s ease'
                  }}
                  onClick={() => setShowMenu(false)}
                  aria-label="Cerrar menú"
                >
                  &times;
                </button>
                <HomeMenuList isAdmin={isAdmin} onNavigate={() => setShowMenu(false)} unreadCount={unreadCount} showNotifications={true} />
              </div>
              <div style={{flex:1}} onClick={() => setShowMenu(false)} />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Menú hamburguesa para móviles */}
          {isMobile && (
            <div className="mobile-menu-toggle" style={{
              position: 'fixed',
              top: '1rem',
              left: '1rem',
              zIndex: 1001,
              background: 'var(--bg-menu)',
              border: '1px solid var(--border-primary)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-medium)',
              transition: 'all 0.3s ease'
            }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
                position: 'relative'
              }}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Abrir menú"
            >
              ☰
              {unreadCount > 0 && (
                <span style={{
                  position:'absolute',
                  top:-5,
                  right:-5,
                  width:12,
                  height:12,
                  background:'#e74c3c',
                  borderRadius:'50%',
                  display:'inline-block',
                  border:'2px solid var(--bg-menu)',
                  zIndex:2
                }}></span>
              )}
            </button>
            </div>
          )}

          {/* Overlay para móviles */}
          {showMenu && isMobile && (
            <div className="mobile-menu-overlay" style={{
              position:'fixed',
              top:0,
              left:0,
              width:'100vw',
              height:'100vh',
              background:'rgba(0,0,0,0.5)',
              backdropFilter:'blur(8px)',
              zIndex:9998,
              display:'flex',
              alignItems:'flex-start',
              justifyContent:'flex-start'
            }}>
              <div style={{
                background:'var(--bg-menu)',
                minWidth:'280px',
                maxWidth:'85vw',
                height:'100vh',
                boxShadow:'var(--shadow-card)',
                padding:'0',
                position:'relative',
                display:'flex',
                flexDirection:'column',
                borderRight:'1px solid var(--border-primary)'
              }}>
                <button
                  style={{
                    position:'absolute',
                    top:'1rem',
                    right:'1rem',
                    background:'none',
                    border:'none',
                    fontSize:'2rem',
                    cursor:'pointer',
                    color:'var(--text-primary)',
                    transition:'color 0.3s ease'
                  }}
                  onClick={() => setShowMenu(false)}
                  aria-label="Cerrar menú"
                >
                  &times;
                </button>
                <HomeMenuList isAdmin={isAdmin} onNavigate={() => setShowMenu(false)} unreadCount={unreadCount} showNotifications={true} />
              </div>
              <div style={{flex:1}} onClick={() => setShowMenu(false)} />
            </div>
          )}

          {/* Menú lateral para desktop */}
          {!isMobile && (
            <div className="desktop-sidebar" style={{
            minWidth: collapsed ? '56px' : '220px',
            maxWidth: collapsed ? '56px' : '270px',
            width: collapsed ? '56px' : '220px',
            height: '100vh',
            boxShadow: 'var(--shadow-card)',
            background: 'var(--bg-menu)',
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000,
            flexDirection: 'column',
            alignItems: 'flex-start',
            transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
            borderRight: '1px solid var(--border-primary)'
          }}>
            <div style={{width:'100%',display:'flex',justifyContent:'flex-end',alignItems:'center'}}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.7rem',
                  color: 'var(--text-primary)',
                  margin: '1.2rem 1.2rem 0 0',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onClick={() => setCollapsed(c => !c)}
                aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {collapsed ? (
                  <>
                    {'☰'}
                    {unreadCount > 0 && (
                      <span style={{
                        position:'absolute',
                        top:2,
                        right:2,
                        width:13,
                        height:13,
                        background:'#e74c3c',
                        borderRadius:'50%',
                        display:'inline-block',
                        border:'2px solid var(--bg-menu)',
                        zIndex:2
                      }}></span>
                    )}
                  </>
                ) : '✕'}
              </button>
            </div>
            {!collapsed && (
              <HomeMenuList isAdmin={isAdmin} unreadCount={unreadCount} showNotifications={true} />
            )}
            </div>
          )}
        </>
      )}
      <main className="main-content" style={
        location.pathname !== '/home' 
          ? {
              marginLeft: isMobile ? '0' : (collapsed ? '56px' : '220px'), 
              paddingTop: isMobile ? '4rem' : '2rem',
              paddingLeft: isMobile ? '1rem' : '2rem',
              paddingRight: isMobile ? '1rem' : '2rem',
              transition:'margin-left 0.22s cubic-bezier(.4,0,.2,1)'
            } 
          : {
              paddingLeft: isMobile ? '1rem' : '2rem',
              paddingRight: isMobile ? '1rem' : '2rem'
            }
      }>
        {children}
      </main>
      
      {/* Chatbot disponible en todas las páginas */}
      <Chatbot />
    </div>
  );
};

export default Layout;