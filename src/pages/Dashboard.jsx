
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../utils/api";
import "./Dashboard.css";

const Dashboard = () => {
  const [progress, setProgress] = useState([]);
  const [users, setUsers] = useState([]);
  const [generalStats, setGeneralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cargoFiltro, setCargoFiltro] = useState('todos');

  const loadDashboardData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      // Obtener usuarios, progreso y estadísticas generales en paralelo
      const [usersRes, progressRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/progress/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/stats/general`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (usersRes.data.success && progressRes.data.success) {
        setUsers(usersRes.data.users);
        setProgress(progressRes.data.progress);
        console.log('✅ Datos del dashboard cargados correctamente');
      } else {
        alert("❌ Error al cargar usuarios o progreso");
      }
      
      if (statsRes.data.success) {
        setGeneralStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      alert("❌ No se pudo cargar algunos datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Recargar datos cuando el usuario regresa a la página (por si completó un curso)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Usuario regresó a la página, recargando dashboard...');
        setLoading(true);
        loadDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Agrupar progreso por usuario (nombre)
  const progressByUser = progress.reduce((acc, item) => {
    if (!acc[item.nombre]) acc[item.nombre] = [];
    acc[item.nombre].push(item);
    return acc;
  }, {});

  // Filtrar usuarios: solo los que no son admin ni Admin
  let nonAdminUsers = users.filter(u => u.rol !== 'admin' && u.rol !== 'Admin');
  // Filtro por cargo
  if (cargoFiltro !== 'todos') {
    nonAdminUsers = nonAdminUsers.filter(u => u.cargo_nombre === cargoFiltro);
  }

  return (
    <div className="dashboard-container-bg">
      <div className="dashboard-header">
        <h1>Panel de Progreso General</h1>
        <div className="dashboard-description">
          Visualiza el avance de todos los usuarios en los cursos de la plataforma. <br />
          <span className="dashboard-subtitle">Solo visible para administradores.</span>
        </div>
        {/* Estadísticas generales */}
        {generalStats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {generalStats.usuarios_activos}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Usuarios Activos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {generalStats.total_cursos}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cursos Totales</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                {generalStats.videos_completados}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Videos Completados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info-color)' }}>
                {Math.round(generalStats.progreso_promedio_general)}%
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Progreso Promedio</div>
            </div>
          </div>
        )}

        {/* Filtro de cargos */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Filtrar por cargo:</label>
          <select value={cargoFiltro} onChange={e => setCargoFiltro(e.target.value)} style={{ padding: '0.4rem 1rem', borderRadius: 8, border: '1.5px solid #bcd2f7', fontSize: '1rem' }}>
            <option value="todos">Todos</option>
            {[...new Set(users.filter(u => u.rol !== 'admin' && u.rol !== 'Admin' && u.cargo_nombre).map(u => u.cargo_nombre))].map(cargo => (
              <option key={cargo} value={cargo}>{cargo}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="dashboard-loading">Cargando progreso...</div>
      ) : nonAdminUsers.length === 0 ? (
        <div className="dashboard-error">No hay usuarios para mostrar.</div>
      ) : (
        <div className="dashboard-users-grid">
          {nonAdminUsers.map((user, idx) => {
            const cursos = progressByUser[user.nombre] || [];
            return (
              <div key={user.id} className="dashboard-user-group">
                <div className="dashboard-user-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
                  <span className="dashboard-user-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#3f51b5" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" />
                    </svg>
                  </span>
                  <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.18rem', color: '#2a3b4d', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</h2>
                  <span className="dashboard-user-role" style={{ marginLeft: 8, fontSize: '0.98rem', fontWeight: 600, background: '#eaf1fa', color: '#3f51b5', borderRadius: 7, padding: '2px 10px', border: '1px solid #d2e3f7', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.01em' }}>
                    {user.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Sin rol'}
                  </span>
                </div>
                <div className="dashboard-user-count">
                  {cursos.length > 0 ? `${cursos.length} curso${cursos.length > 1 ? 's' : ''}` : 'Sin progreso aún'}
                </div>
                <div className="dashboard-grid">
                  {cursos.length > 0 ? cursos.map((item, cidx) => {
                    const videoProgress = item.video_completed ? 100 : 0;
                    const hasEval = item.evaluation_total && item.evaluation_total > 0;
                    const scorePercent = hasEval && item.evaluation_score !== null ? ((item.evaluation_score / item.evaluation_total) * 100).toFixed(1) : null;
                    const status = item.evaluation_status?.toLowerCase();
                    let estadoClase = 'estado-amarillo';
                    let estadoTexto = '🟡 Pendiente';
                    if (!hasEval && item.video_completed) {
                      estadoClase = 'estado-verde';
                      estadoTexto = '🟢 Completado';
                    } else if (hasEval && status === 'aprobado') {
                      estadoClase = 'estado-verde';
                      estadoTexto = '🟢 Aprobado';
                    } else if (hasEval && status === 'reprobado') {
                      estadoClase = 'estado-rojo';
                      estadoTexto = '🔴 Reprobado';
                    }
                    return (
                      <div key={cidx} className="dashboard-curso-card">
                        <div className="dashboard-progreso-header">
                          <h3>{item.curso || `Curso ID ${item.course_id}`}</h3>
                          <span className={`dashboard-estado-evaluacion dashboard-estado-${estadoClase.split('-')[1]}`}>{estadoTexto}</span>
                        </div>
                        <div className="dashboard-progreso-section">
                          <label>🎬 Video completado</label>
                          <div className="dashboard-barra-progreso">
                            <div className="dashboard-barra-interna" style={{ width: `${videoProgress}%` }}></div>
                          </div>
                          <span className="dashboard-porcentaje-label">{videoProgress}%</span>
                        </div>
                        <div className="dashboard-progreso-section">
                          <label>📊 Evaluación</label>
                          {hasEval ? (
                            <>
                              <div className="dashboard-barra-progreso dashboard-bg-eval">
                                <div className="dashboard-barra-interna dashboard-barra-eval" style={{ width: `${scorePercent}%` }}></div>
                              </div>
                              <span className="dashboard-porcentaje-label">{scorePercent}%</span>
                            </>
                          ) : (
                            <span style={{ color: '#888', fontStyle: 'italic', marginLeft: 8 }}>No tiene</span>
                          )}
                        </div>
                        <div className="dashboard-progreso-meta">
                          <span>🧠 Intentos usados: {item.attempts_used ?? '-'}</span>
                          <span>🕒 Última actualización: {item.updated_at ? new Date(item.updated_at).toLocaleString('es-CO', { hour12: false }) : '-'}</span>
                        </div>
                      </div>
                    );
                  }) : <div className="dashboard-error">Este usuario aún no tiene progreso registrado.</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
