// components/LoadingScreen/Layout.jsx
import React from 'react';
import HomeMenuList from './HomeMenuList';
import Chatbot from '../Chatbot';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Layout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Determinar si es admin
  const isAdmin = user && (user.rol === 'Admin' || user.rol === 'Administrador');
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Obtener cantidad de notificaciones no leídas
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/api/notifications/unread/count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUnreadCount(data.count);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
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
          <div style={{
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
            display: 'flex',
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
        </>
      )}
      <main className="main-content" style={location.pathname !== '/home' ? {marginLeft: collapsed ? '56px' : '220px', paddingTop:'2rem', transition:'margin-left 0.22s cubic-bezier(.4,0,.2,1)'} : {}}>
        {children}
      </main>
      
      {/* Chatbot disponible en todas las páginas */}
      <Chatbot />
    </div>
  );
};

export default Layout;