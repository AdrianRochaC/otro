import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import './AdminDocumentos.css'; // Asegúrate de crear este archivo para los estilos
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BACKEND_URL } from '../utils/api';

const API_URL = BACKEND_URL;

// Función para convertir tipos MIME a nombres amigables
const getFriendlyMimeType = (mimetype) => {
  if (!mimetype) return 'Desconocido';
  
  const mimeParts = mimetype.split('/');
  const type = mimeParts[0];
  const subtype = mimeParts[1];
  
  // Mapeo de tipos MIME a nombres amigables
  const mimeMap = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'text/plain': 'Texto',
    'text/csv': 'CSV'
  };
  
  // Si está en el mapa, devolver el nombre amigable
  if (mimeMap[mimetype]) {
    return mimeMap[mimetype];
  }
  
  // Si no está en el mapa, devolver el subtipo en mayúsculas (sin el prefijo vnd.)
  if (subtype) {
    // Limpiar prefijos comunes
    let cleanSubtype = subtype
      .replace(/^vnd\./, '')
      .replace(/^openxmlformats-officedocument\./, '')
      .replace(/wordprocessingml\.document$/, 'Word')
      .replace(/spreadsheetml\.sheet$/, 'Excel')
      .replace(/presentationml\.presentation$/, 'PowerPoint')
      .replace(/msword$/, 'Word')
      .replace(/ms-excel$/, 'Excel');
    
    // Si después de limpiar sigue siendo muy largo, usar solo la primera parte
    if (cleanSubtype.length > 15) {
      cleanSubtype = cleanSubtype.split('.')[0];
    }
    
    return cleanSubtype.toUpperCase();
  }
  
  return type.toUpperCase();
};

const AdminDocumentos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  // Estados para cargos (roles)
  const [roles, setRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Estados para selección
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);

  // Estados para edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSelectedRoles, setEditSelectedRoles] = useState([]);
  const [editIsGlobal, setEditIsGlobal] = useState(false);

  // Cargar documentos al montar
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtrar documentos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  // Función para descargar documentos (maneja Cloudinary y archivos locales)
  const handleDownload = async (doc) => {
    try {
      // Si es una URL de Cloudinary, descargar usando fetch
      if (doc.filename && doc.filename.startsWith('http')) {
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
      } else {
        // Para archivos locales, usar el enlace directo
        window.open(`${API_URL}/uploads/documents/${doc.filename}`, '_blank');
      }
    } catch (error) {
      // Error silencioso
    }
  };

  // Cargar cargos al abrir el modal
  useEffect(() => {
    if (modalOpen) {
      fetchCargos();
    }
  }, [modalOpen]);

  const fetchCargos = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Obtener cargos de la base de datos
      const cargosRes = await fetch(`${API_URL}/api/cargos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cargosData = await cargosRes.json();
      
      if (cargosData.success) {
        // Extraer solo los nombres de los cargos y filtrar admin/Admin del sistema
        const rolesFromDB = cargosData.cargos
          .map(cargo => cargo.nombre)
          .filter(rol => {
            const rolLower = rol.toLowerCase();
            return rolLower !== 'admin' && 
                   rolLower !== 'admin del sistema' &&
                   rolLower !== 'administrador' &&
                   rolLower !== 'administrador del sistema';
          });
        setRoles(rolesFromDB);
      }
    } catch (err) {
      setRoles([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
        setFilteredDocuments(data.documents);
      } else setUploadError('No se pudieron cargar los documentos');
    } catch (err) {
      setUploadError('Error al cargar documentos');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const handleGlobalChange = (e) => {
    setIsGlobal(e.target.checked);
    if (e.target.checked) {
      setSelectedRoles([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Selecciona un archivo');
      return;
    }
    if (!isGlobal && selectedRoles.length === 0) {
      setUploadError('Selecciona al menos un cargo o marca "Para todos"');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('is_global', isGlobal);
      formData.append('roles', JSON.stringify(selectedRoles));
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Documento subido exitosamente a Cloudinary');
        setFile(null);
        setSelectedRoles([]);
        setIsGlobal(false);
        fetchDocuments();
        setTimeout(() => {
          setModalOpen(false);
          setUploadSuccess('');
        }, 1200);
      } else {
        console.error('❌ Error al subir documento:', data.message);
        setUploadError(data.message || 'Error al subir documento');
      }
    } catch (err) {
      setUploadError('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = async (doc) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditFile(null);
    setEditIsGlobal(doc.is_global === 1 || doc.is_global === true);
    // Cargar destinatarios actuales
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${doc.id}/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Esperar a que roles estén cargados
        if (roles.length === 0) {
          await fetchCargos();
        }
        // Normalizar tipos y valores
        const normalizedRoles = (data.roles || []).map(r => String(r).trim());
        setEditSelectedRoles(roles.filter(r => normalizedRoles.includes(r)));
      } else {
        setEditSelectedRoles([]);
      }
    } catch {
      setEditSelectedRoles([]);
    }
    setEditModalOpen(true);
  };
  const handleEditRoleToggle = (role) => {
    setEditSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const handleEditGlobalChange = (e) => {
    setEditIsGlobal(e.target.checked);
    if (e.target.checked) {
      setEditSelectedRoles([]);
    }
  };
  const handleEditFileChange = (e) => {
    setEditFile(e.target.files[0]);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName) return;
    if (!editIsGlobal && editSelectedRoles.length === 0) {
      setUploadError('Selecciona al menos un cargo o marca "Para todos"');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('is_global', editIsGlobal);
      formData.append('roles', JSON.stringify(editSelectedRoles));
      if (editFile) formData.append('document', editFile);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess(editFile ? 'Documento actualizado exitosamente en Cloudinary' : 'Documento actualizado exitosamente');
        fetchDocuments();
        setTimeout(() => {
          setEditModalOpen(false);
          setUploadSuccess('');
        }, 1200);
      } else {
        setUploadError(data.message || 'Error al actualizar documento');
      }
    } catch (err) {
      setUploadError('Error al actualizar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${docName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Documento eliminado exitosamente');
        fetchDocuments();
        setTimeout(() => {
          setUploadSuccess('');
        }, 2000);
      } else {
        setUploadError(data.message || 'Error al eliminar documento');
        setTimeout(() => {
          setUploadError('');
        }, 3000);
      }
    } catch (err) {
      setUploadError('Error al eliminar documento');
      setTimeout(() => {
        setUploadError('');
      }, 3000);
    }
  };

  return (
    <div className="admin-documentos-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%',
        maxWidth: 1200,
        margin: '56px auto',
        background: 'rgba(30,32,44,0.92)',
        borderRadius: 22,
        boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
        padding: '44px 36px 48px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}>
        <div className="header-row" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 24,
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            margin: 0,
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(167,139,250,0.3)'
          }}>
            📚 Gestión de Documentos
          </h1>
          <button 
            className="btn-primary" 
            onClick={() => setModalOpen(true)}
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(167,139,250,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(167,139,250,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)';
            }}
          >
            📁 + Agregar archivo
          </button>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Subir documento">
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Selecciona un archivo (PDF, Word, Excel):
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            {/* Checkbox para todos */}
            <div className="doc-checkbox-row" style={{ marginBottom: 18 }}>
              <label htmlFor="global-doc" style={{
                display: 'flex', alignItems: 'center',
                background: isGlobal ? 'var(--gradient-primary, #a78bfa)' : 'var(--bg-secondary, #23232b)',
                color: isGlobal ? 'var(--text-white, #fff)' : 'var(--text-primary, #fff)',
                border: isGlobal ? '2px solid var(--gradient-primary, #a78bfa)' : '2px solid var(--border-color, #333)',
                borderRadius: 16,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: isGlobal ? '0 2px 12px rgba(167,139,250,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.18s'
              }}>
                <input type="checkbox" id="global-doc" checked={isGlobal} onChange={handleGlobalChange} style={{ marginRight: 10, width: 20, height: 20, accentColor: '#a78bfa' }} />
                Para todos
              </label>
            </div>
            {/* Multi-select visual de roles */}
            <div className="doc-multiselect-section">
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Asignar a roles:
              </label>
              <div className="doc-multiselect-list">
                {roles.map(role => (
                  <span
                    key={role}
                    className={`doc-pill ${selectedRoles.includes(role) ? 'selected' : ''}`}
                    onClick={() => !isGlobal && handleRoleToggle(role)}
                    style={{ cursor: isGlobal ? 'not-allowed' : 'pointer' }}
                  >
                    {role}
                  </span>
                ))}
                {roles.length === 0 && (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    background: 'var(--bg-card-hover)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-secondary)'
                  }}>
                    No hay roles disponibles
                  </span>
                )}
              </div>
            </div>
            {uploadError && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ❌ {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ 
                color: '#16a34a', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ✅ {uploadSuccess}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={uploading} style={{ width: '100%' }}>
              {uploading ? (
                <>
                  <span style={{ display: 'inline-block', marginRight: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}></div>
                  </span>
                  Subiendo...
                </>
              ) : (
                'Subir documento'
              )}
            </button>
          </form>
        </Modal>

        {/* Modal de edición */}
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar documento">
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Nombre del documento:
              </label>
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }} 
              />
            </div>
            
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Reemplazar archivo (opcional):
              </label>
              <input 
                type="file" 
                onChange={handleEditFileChange} 
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }} 
              />
            </div>
            <div className="doc-checkbox-row" style={{ marginBottom: 18 }}>
              <label htmlFor="edit-global-doc" style={{
                display: 'flex', alignItems: 'center',
                background: editIsGlobal ? 'var(--gradient-primary, #a78bfa)' : 'var(--bg-secondary, #23232b)',
                color: editIsGlobal ? 'var(--text-white, #fff)' : 'var(--text-primary, #fff)',
                border: editIsGlobal ? '2px solid var(--gradient-primary, #a78bfa)' : '2px solid var(--border-color, #333)',
                borderRadius: 16,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: editIsGlobal ? '0 2px 12px rgba(167,139,250,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.18s'
              }}>
                <input type="checkbox" id="edit-global-doc" checked={editIsGlobal} onChange={handleEditGlobalChange} style={{ marginRight: 10, width: 20, height: 20, accentColor: '#a78bfa' }} />
                Para todos
              </label>
            </div>
            <div className="doc-multiselect-section">
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Asignar a roles:
              </label>
              <div className="doc-multiselect-list">
                {roles.map(role => (
                  <span
                    key={role}
                    className={`doc-pill ${editSelectedRoles.includes(role) ? 'selected' : ''}`}
                    onClick={() => !editIsGlobal && handleEditRoleToggle(role)}
                    style={{ cursor: editIsGlobal ? 'not-allowed' : 'pointer' }}
                  >
                    {role}
                  </span>
                ))}
                {roles.length === 0 && (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    background: 'var(--bg-card-hover)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-secondary)'
                  }}>
                    No hay roles disponibles
                  </span>
                )}
              </div>
            </div>
            
            {uploadError && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ❌ {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ 
                color: '#16a34a', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ✅ {uploadSuccess}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={uploading} style={{ width: '100%' }}>
              {uploading ? (
                <>
                  <span style={{ display: 'inline-block', marginRight: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}></div>
                  </span>
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </form>
        </Modal>

        {/* Mensajes globales de éxito/error */}
        {uploadSuccess && (
          <div style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#16a34a',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ✅ {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#dc2626',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ❌ {uploadError}
          </div>
        )}

        <div className="document-list-section">
          <h2 style={{ 
            marginBottom: 24, 
            fontSize: 24, 
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📋 Documentos subidos
            <span style={{
              background: 'var(--gradient-secondary)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              {documents.length} documento{documents.length !== 1 ? 's' : ''}
            </span>
          </h2>
          {!loadingDocs && documents.length > 0 && (
            <div style={{
              position: 'relative',
              marginBottom: '28px',
              padding: '4px',
              background: 'linear-gradient(135deg, rgba(168, 224, 99, 0.2) 0%, rgba(86, 171, 47, 0.15) 100%)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(168, 224, 99, 0.2)'
            }}>
              <input
                type="text"
                placeholder="Buscar documento por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '18px 24px 18px 56px',
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  border: '2px solid #a8e063',
                  background: 'rgba(30, 32, 44, 0.95)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  fontWeight: '500',
                  boxShadow: '0 2px 12px rgba(168, 224, 99, 0.3)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b8f073';
                  e.target.style.boxShadow = '0 0 0 4px rgba(168, 224, 99, 0.3), 0 6px 20px rgba(168, 224, 99, 0.4)';
                  e.target.style.background = 'rgba(30, 32, 44, 1)';
                  e.target.style.transform = 'scale(1.01)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#a8e063';
                  e.target.style.boxShadow = '0 2px 12px rgba(168, 224, 99, 0.3)';
                  e.target.style.background = 'rgba(30, 32, 44, 0.95)';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '22px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.5rem',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 4px rgba(168, 224, 99, 0.6))'
              }}>
                🔍
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(168, 224, 99, 0.4)',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #b8f073 0%, #66bb3f 100%)';
                    e.target.style.transform = 'translateY(-50%) scale(1.15)';
                    e.target.style.boxShadow = '0 4px 12px rgba(168, 224, 99, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)';
                    e.target.style.transform = 'translateY(-50%) scale(1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(168, 224, 99, 0.4)';
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {loadingDocs ? (
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
          ) : filteredDocuments.length === 0 && searchTerm ? (
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
                🔍
              </div>
              <p style={{ margin: 0 }}>No se encontraron documentos</p>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem',
                opacity: 0.7
              }}>
                No hay documentos que coincidan con "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  marginTop: '8px',
                  padding: '10px 20px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Limpiar búsqueda
              </button>
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
              <p style={{ margin: 0 }}>No hay documentos subidos</p>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem',
                opacity: 0.7
              }}>
                Comienza subiendo tu primer documento
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="document-table" style={{ 
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
                  {filteredDocuments.map((doc, index) => (
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
                        {getFriendlyMimeType(doc.mimetype)}
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
                        padding: '14px 12px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="btn-secondary"
                          style={{ 
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          📄 Ver/Descargar
                        </button>
                        <button 
                          className="btn-edit" 
                          title="Editar" 
                          onClick={() => openEditModal(doc)}
                          style={{
                            padding: '8px',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-delete" 
                          title="Eliminar" 
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          style={{
                            padding: '8px',
                            background: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FaTrash />
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
    </div>
  );
};

export default AdminDocumentos;
