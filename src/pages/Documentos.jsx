import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../utils/api';

const API_URL = BACKEND_URL;

const Documentos = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setDocuments(data.documents);
        else setError('No se pudieron cargar los documentos');
      } catch (err) {
        setError('Error al cargar documentos');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Función para descargar documentos (maneja Cloudinary y archivos locales)
  const handleDownload = async (doc) => {
    try {
      console.log('📥 Iniciando descarga de documento:', doc.name);
      
      // Si es una URL de Cloudinary, descargar usando fetch
      if (doc.filename && doc.filename.startsWith('http')) {
        console.log('☁️ Descargando desde Cloudinary:', doc.filename);
        
        const response = await fetch(doc.filename);
        if (!response.ok) {
          throw new Error('Error al descargar el archivo');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Obtener la extensión del archivo desde el mimetype o el nombre
        let extension = '';
        if (doc.mimetype) {
          const mimeParts = doc.mimetype.split('/');
          if (mimeParts[1]) {
            extension = '.' + mimeParts[1];
            // Ajustar extensiones comunes
            if (extension === '.vnd.openxmlformats-officedocument.wordprocessingml.document') {
              extension = '.docx';
            } else if (extension === '.vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
              extension = '.xlsx';
            } else if (extension === '.msword') {
              extension = '.doc';
            } else if (extension === '.vnd.ms-excel') {
              extension = '.xls';
            }
          }
        }
        
        // Usar el nombre del documento con la extensión correcta
        const fileName = doc.name.endsWith(extension) ? doc.name : doc.name + extension;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Documento descargado:', fileName);
      } else {
        // Para archivos locales, usar el enlace directo
        window.open(`${API_URL}/uploads/documents/${doc.filename}`, '_blank');
      }
    } catch (error) {
      console.error('❌ Error al descargar documento:', error);
      alert('Error al descargar el documento. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="user-documentos-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%',
        maxWidth: 900,
        margin: '56px auto',
        background: 'rgba(30,32,44,0.92)',
        borderRadius: 22,
        boxShadow: '0 6px 32px rgba(0,0,0,0.12)',
        padding: '44px 36px 48px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            margin: 0,
            marginBottom: '12px',
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(167,139,250,0.3)'
          }}>
            📚 Mis Documentos
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            margin: 0,
            opacity: 0.8
          }}>
            Documentos asignados a tu rol y perfil
          </p>
        </div>
        {loading ? (
          <div style={{ 
            padding: 48, 
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-color)',
              borderTop: '3px solid var(--gradient-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Cargando documentos...
          </div>
        ) : error ? (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            color: '#dc2626',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            ❌ {error}
          </div>
        ) : documents.length === 0 ? (
          <div style={{ 
            padding: 48, 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '3rem',
              opacity: 0.5
            }}>
              📁
            </div>
            <p style={{ margin: 0 }}>No tienes documentos asignados</p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.9rem',
              opacity: 0.7
            }}>
              Los administradores te asignarán documentos según tu rol
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'separate', 
              borderSpacing: 0, 
              background: 'var(--bg-primary, #18181b)', 
              borderRadius: 16, 
              overflow: 'hidden', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
              border: '1px solid var(--border-color, #333)' 
            }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary, #23232b)' }}>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    Nombre
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    Tipo
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    Tamaño
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    Fecha
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left', 
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid var(--border-color)'
                  }}>
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={doc.id} style={{ 
                    borderBottom: '1px solid var(--border-color, #333)',
                    background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={{ 
                      padding: '14px 12px',
                      color: 'var(--text-primary)',
                      fontWeight: '500'
                    }}>
                      {doc.name}
                    </td>
                    <td style={{ 
                      padding: '14px 12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      {doc.mimetype.split('/')[1].toUpperCase()}
                    </td>
                    <td style={{ 
                      padding: '14px 12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      {(doc.size / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ 
                      padding: '14px 12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      {new Date(doc.created_at).toLocaleString('es-CO', { 
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false 
                      })}
                    </td>
                    <td style={{ 
                      padding: '14px 12px'
                    }}>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="btn-secondary"
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(167,139,250,0.3)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(167,139,250,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(167,139,250,0.3)';
                        }}
                      >
                        📄 Ver/Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentos;
