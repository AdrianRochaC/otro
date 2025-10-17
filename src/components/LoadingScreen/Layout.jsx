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


  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout-container">
      {/* Menú lateral fijo para todas las páginas */}
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
      
      <main className="main-content" style={{marginLeft: collapsed ? '56px' : '220px', paddingTop:'2rem', transition:'margin-left 0.22s cubic-bezier(.4,0,.2,1)'}}>
        {children}
      </main>
      
      {/* Chatbot disponible en todas las páginas */}
      <Chatbot />
    </div>
  );
};

export default Layout;