import React, { useState, useEffect } from "react";
import "./Perfil.css";
import { BACKEND_URL } from '../utils/api';
import { FaPhone } from 'react-icons/fa';

const Perfil = () => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      const token = localStorage.getItem("authToken");

      if (userData && token) {
        setUser(userData);

        // Obtener progreso
        const response = await fetch(`${BACKEND_URL}/api/progress`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await response.json();
        if (result.success) {
          setProgress(result.progress);
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  if (loading) return <div className="perfil-container"><div className="loading">Cargando perfil...</div></div>;
  if (!user) return <div className="perfil-container"><div className="error">No se pudieron cargar los datos del usuario</div></div>;

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>👤 Mi Perfil</h1>
      </div>

      <div className="perfil-content">

        {/* Información del perfil */}
        <div className="perfil-card">
          <h2>Información Personal</h2>
          <div className="perfil-info">
            <div className="info-row"><span className="info-label">Nombre:</span><span className="info-value">{user.nombre}</span></div>
            <div className="info-row"><span className="info-label">Email:</span><span className="info-value">{user.email}</span></div>
            <div className="info-row">
              <span className="info-label">Rol:</span>
              <span className="perfil-role-badge">
                {user.rol || 'Sin rol asignado'}
              </span>
            </div>
          </div>
        </div>

        {/* Información de la cuenta */}
        <div className="perfil-card">
          <h2>Información de la Cuenta</h2>
          <div className="perfil-info">
            <div className="info-row"><span className="info-label">Estado:</span><span className="info-value status-active">✅ Activa</span></div>
            <div className="info-row"><span className="info-label">Tipo de Usuario:</span><span className="info-value">{user.rol === 'Admin' || user.rol === 'Admin del Sistema' ? 'Administrador del Sistema' : 'Usuario Estándar'}</span></div>
            <div className="info-row"><span className="info-label">Permisos:</span><span className="info-value">{user.rol === 'Admin' || user.rol === 'Admin del Sistema' ? 'Control total del sistema' : 'Acceso a cursos y funcionalidades básicas'}</span></div>
          </div>
        </div>

        {/* Progreso solo si no es Admin */}
        {user.rol !== 'Admin' && user.rol !== 'Admin del Sistema' && (
          <div className="perfil-card">
            <h2 style={{ marginBottom: '1rem' }}>📈 Progreso de Cursos</h2>
            {progress.length === 0 ? (
              <p style={{ fontStyle: 'italic' }}>No tienes progreso registrado aún.</p>
            ) : (
              <div className="progreso-lista">
                {progress.map((item, index) => {
                  const videoProgress = item.video_completed ? 100 : 0;
                  const hasEval = item.evaluation_total && item.evaluation_total > 0;
                  const scorePercent = hasEval ? ((item.evaluation_score / item.evaluation_total) * 100).toFixed(1) : null;
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
                    <div key={index} className="progreso-item">
                      <div className="progreso-header">
                        <h3>{item.course_title || `Curso ID ${item.course_id}`}</h3>
                        <span className={`estado-evaluacion ${estadoClase}`}>{estadoTexto}</span>
                      </div>

                      <div className="progreso-section">
                        <label>🎬 Video completado</label>
                        <div className="barra-progreso">
                          <div className="barra-interna" style={{ width: `${videoProgress}%` }}></div>
                        </div>
                        <span className="porcentaje-label">{videoProgress}%</span>
                      </div>

                      <div className="progreso-section">
                        <label>📊 Evaluación</label>
                        {hasEval ? (
                          <>
                            <div className="barra-progreso bg-eval">
                              <div className="barra-interna barra-eval" style={{ width: `${scorePercent}%` }}></div>
                            </div>
                            <span className="porcentaje-label">{scorePercent}%</span>
                          </>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic', marginLeft: 8 }}>No tiene</span>
                        )}
                      </div>

                      <div className="progreso-meta">
                        <span>🧠 Intentos usados: {item.attempts_used}</span>
                        <span>🕒 Última actualización: {new Date(item.updated_at).toLocaleString('es-CO', { hour12: false })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Información de Contacto */}
        <div className="contacto-section">
          {/* Cuadro de Contacto Administrativo */}
          <div className="contacto-card contacto-admin">
            <div className="contacto-compact">
              <div className="contacto-icon-small">👤</div>
              <div className="contacto-text">
                <p className="contacto-title">¿Necesitas ayuda administrativa?</p>
                <p className="contacto-subtitle">Modificación de información o dudas sobre contenido</p>
                <div className="contacto-details">
                  <a href="mailto:oscarandres211@hotmail.com" className="contacto-link-small">
                    <svg className="contacto-link-icon gmail-icon" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    oscarandres211@hotmail.com
                  </a>
                  <a href="tel:+573502483182" className="contacto-link-small">
                    <FaPhone className="contacto-link-icon phone-icon" />
                    +57 350 2483182
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Cuadro de Soporte Técnico */}
          <div className="contacto-card contacto-soporte">
            <div className="contacto-compact">
              <div className="contacto-icon-small">🔧</div>
              <div className="contacto-text">
                <p className="contacto-title">¿Problemas técnicos?</p>
                <p className="contacto-subtitle">Errores del sistema o dificultades de acceso</p>
                <div className="contacto-details">
                  <a href="mailto:adriancamrochac@gmail.com" className="contacto-link-small">
                    <svg className="contacto-link-icon gmail-icon" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    adriancamrochac@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
