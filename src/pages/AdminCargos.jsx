import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaUsers, FaGraduationCap, FaFileAlt } from 'react-icons/fa';
import Modal from '../components/Modal';
import './AdminCargos.css';
import { BACKEND_URL } from '../utils/api';

const API_URL = BACKEND_URL;

// Lista de cargos predefinidos para farmacia
const CARGOS_PREDEFINIDOS = [
  { nombre: 'Farmacéutico', descripcion: 'Responsable de la dispensación de medicamentos, asesoramiento farmacéutico y supervisión del inventario de medicamentos.' },
  { nombre: 'Técnico Farmacéutico', descripcion: 'Auxiliar del farmacéutico en la preparación y dispensación de medicamentos, manejo de inventario y atención al cliente.' },
  { nombre: 'Gerente de Farmacia', descripcion: 'Responsable de la administración general de la farmacia, gestión de personal, inventarios y cumplimiento normativo.' },
  { nombre: 'Cajero', descripcion: 'Encargado del cobro de medicamentos y productos, manejo de caja registradora y atención al cliente en el punto de venta.' },
  { nombre: 'Auxiliar de Farmacia', descripcion: 'Apoyo en tareas administrativas, organización de productos, limpieza y mantenimiento del área de ventas.' },
  { nombre: 'Supervisor de Turno', descripcion: 'Responsable de supervisar las operaciones durante su turno, coordinar al personal y asegurar el cumplimiento de procedimientos.' },
  { nombre: 'Especialista en Inventario', descripcion: 'Encargado del control de stock, recepción de mercancías, verificación de vencimientos y rotación de productos.' },
  { nombre: 'Asesor Comercial', descripcion: 'Responsable de promoción de productos, asesoramiento a clientes sobre medicamentos y productos de salud.' },
  { nombre: 'Contador', descripcion: 'Encargado de la contabilidad de la farmacia, manejo de facturación, reportes financieros y cumplimiento tributario.' },
  { nombre: 'Administrador', descripcion: 'Responsable de la administración general, recursos humanos, políticas internas y coordinación con proveedores.' },
  { nombre: 'Atención al Cliente', descripcion: 'Especialista en atención al cliente, resolución de consultas, quejas y sugerencias de los usuarios de la farmacia.' },
  { nombre: 'Operativo', descripcion: 'Personal operativo encargado de tareas generales de apoyo, logística y mantenimiento de la farmacia.' },
  { nombre: 'Compras', descripcion: 'Responsable de la gestión de compras, negociación con proveedores, evaluación de productos y gestión de contratos.' },
  { nombre: 'Marketing', descripcion: 'Encargado de estrategias de marketing, promociones, publicidad y desarrollo de campañas para la farmacia.' },
  { nombre: 'Sistemas', descripcion: 'Responsable del mantenimiento de sistemas informáticos, software de farmacia y soporte técnico.' }
];

const AdminCargos = () => {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [cargoMetrics, setCargoMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Estados para el formulario de creación
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCargos, setFilteredCargos] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Estados para el formulario de edición
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  useEffect(() => {
    fetchCargos();
  }, []);

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container') && !event.target.closest('.dropdown-list')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchCargos = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCargos(data.cargos || []);
      } else {
        const errorData = await response.json();
        }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const fetchCargoMetrics = async (cargoId) => {
    setLoadingMetrics(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${cargoId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCargoMetrics(data.metrics);
        } else {
          setCargoMetrics(null);
        }
      } else {
        setCargoMetrics(null);
      }
    } catch (error) {
      setCargoMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim() || !descripcion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setModalOpen(false);
        resetForm();
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error creando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editNombre.trim() || !editDescripcion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${editingCargo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          descripcion: editDescripcion.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setEditModalOpen(false);
        setEditingCargo(null);
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error actualizando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres ELIMINAR este cargo? Esta acción no se puede deshacer.')) {
      return;
    }
    if (!confirm('Advertencia: Se desactivarán los usuarios del cargo, se eliminarán cursos/preguntas/progresos asociados, se quitarán asignaciones de documentos por este rol y se borrarán documentos huérfanos no globales. ¿Deseas continuar?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error eliminando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const openEditModal = (cargo) => {
    setEditingCargo(cargo);
    setEditNombre(cargo.nombre);
    setEditDescripcion(cargo.descripcion);
    setEditModalOpen(true);
  };

  const openDetailModal = async (cargo) => {
    setSelectedCargo(cargo);
    setCargoMetrics(null); // Resetear métricas anteriores
    setDetailModalOpen(true);
    await fetchCargoMetrics(cargo.id);
  };

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setShowDropdown(false);
    setFilteredCargos([]);
    setDropdownOpen(false);
  };

  // Función para combinar cargos predefinidos con los existentes
  const getCombinedCargos = () => {
    // Convertir cargos existentes al formato de los predefinidos
    const existingCargos = cargos.map(cargo => ({
      nombre: cargo.nombre,
      descripcion: cargo.descripcion
    }));
    
    // Combinar predefinidos con existentes, evitando duplicados
    const combined = [...CARGOS_PREDEFINIDOS];
    
    existingCargos.forEach(existingCargo => {
      const exists = combined.some(predefined => 
        predefined.nombre.toLowerCase() === existingCargo.nombre.toLowerCase()
      );
      if (!exists) {
        combined.push(existingCargo);
      }
    });
    
    return combined;
  };

  // Función para manejar el input y mostrar la lista
  const handleNombreChange = (e) => {
    const value = e.target.value;
    setNombre(value);
    
    const allCargos = getCombinedCargos();
    
    if (value.length > 0) {
      // Filtrar cargos según el texto ingresado
      const filtered = allCargos.filter(cargo => 
        cargo.nombre.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCargos(filtered);
    } else {
      // Si no hay texto, mostrar todos los cargos
      setFilteredCargos(allCargos);
    }
    setShowDropdown(true);
    setDropdownOpen(true);
  };

  // Función para mostrar la lista cuando se hace focus en el input
  const handleInputFocus = () => {
    if (filteredCargos.length === 0) {
      const allCargos = getCombinedCargos();
      setFilteredCargos(allCargos);
    }
    setShowDropdown(true);
    setDropdownOpen(true);
  };

  // Función para seleccionar un cargo de la lista
  const selectCargo = (cargo) => {
    setNombre(cargo.nombre);
    setDescripcion(cargo.descripcion);
    setShowDropdown(false);
    setFilteredCargos([]);
    setDropdownOpen(false);
  };

  // Función para cerrar el dropdown
  const closeDropdown = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setDropdownOpen(false);
    }, 200);
  };

  const downloadCargoReport = async (cargo) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos/${cargo.id}/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_${cargo.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Reporte individual generado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Error generando reporte individual'}`);
      }
    } catch (error) {
      alert('❌ Error generando reporte individual');
    }
  };

  // Función para generar reporte Excel
  const generateExcelReport = async () => {
    try {
      setGeneratingReport(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Cargos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Reporte Excel generado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Error generando reporte'}`);
      }
    } catch (error) {
      alert('❌ Error generando reporte Excel');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-cargos-container">
        <div className="loading">Cargando cargos...</div>
      </div>
    );
  }

  return (
    <div className="admin-cargos-container">
      <div className="admin-cargos-header">
        <h1>Gestión de Cargos</h1>
        <p>Administra los cargos y departamentos de la empresa</p>
      </div>

      <div className="admin-cargos-actions">
        <button 
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <FaPlus /> Crear Nuevo Cargo
        </button>
        
        <button 
          className="btn-success"
          onClick={generateExcelReport}
          disabled={generatingReport}
          style={{ marginLeft: '10px' }}
        >
          <FaDownload /> 
          {generatingReport ? 'Generando...' : 'Reporte Excel'}
        </button>
      </div>

      <div className="admin-cargos-content">
        {}
        <div className="cargos-grid">
          {cargos.map((cargo) => (
            <div key={cargo.id} className="cargo-card" onClick={() => openDetailModal(cargo)}>
              <div className="cargo-header">
                <h3>{cargo.nombre}</h3>
                <div className="cargo-actions">
                  <button 
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(cargo);
                    }}
                    title="Editar cargo"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cargo.id);
                    }}
                    title="Eliminar cargo"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="cargo-body">
                <p className="cargo-description">{cargo.descripcion}</p>
                <div className="cargo-details">
                  <span className="created-date">
                    Creado: {new Date(cargo.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
              
              <div className="cargo-footer">
                <span className="click-hint">Haz clic para ver detalles</span>
              </div>
            </div>
          ))}
        </div>

        {cargos.length === 0 && (
          <div className="no-cargos">
            <p>No hay cargos configurados</p>
            <button 
              className="btn-primary"
              onClick={() => setModalOpen(true)}
            >
              <FaPlus /> Crear Primer Cargo
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear cargo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-header">
          <h2>Crear Nuevo Cargo</h2>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre del Cargo *</label>
              <small className="form-help">
                💡 Haz clic en el campo para ver todos los cargos disponibles o escribe para filtrar
              </small>
              <div className="dropdown-container">
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={handleNombreChange}
                  onFocus={handleInputFocus}
                  onBlur={closeDropdown}
                  placeholder="Haz clic para ver la lista de cargos"
                  required
                  autoComplete="off"
                />
                {showDropdown && filteredCargos.length > 0 && (
                  <div className="dropdown-list">
                    {filteredCargos.map((cargo, index) => {
                      // Verificar si es un cargo predefinido
                      const isPredefined = CARGOS_PREDEFINIDOS.some(predefined => 
                        predefined.nombre.toLowerCase() === cargo.nombre.toLowerCase()
                      );
                      
                      return (
                        <div
                          key={index}
                          className={`dropdown-item ${isPredefined ? 'predefined' : 'existing'}`}
                          onClick={() => selectCargo(cargo)}
                        >
                          <div className="cargo-name">
                            {cargo.nombre}
                            {isPredefined && <span className="cargo-badge">Predefinido</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className={`form-group form-group-description ${dropdownOpen ? 'dropdown-open' : ''}`}>
              <label htmlFor="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe las responsabilidades del cargo"
                rows="3"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Crear Cargo
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal para editar cargo */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="modal-header">
          <h2>Editar Cargo</h2>
        </div>
        <div className="modal-content">
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label htmlFor="editNombre">Nombre del Cargo *</label>
              <input
                type="text"
                id="editNombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Ej: Gerente de Ventas"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="editDescripcion">Descripción *</label>
              <textarea
                id="editDescripcion"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                placeholder="Describe las responsabilidades del cargo"
                rows="3"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Actualizar Cargo
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal para detalles del cargo */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <div className="modal-header">
          <h2>Detalles del Cargo: {selectedCargo?.nombre}</h2>
        </div>
        <div className="modal-content">
          {selectedCargo && (
            <div className="cargo-details-modal">
              <div className="cargo-info">
                <h3>{selectedCargo.nombre}</h3>
                <p className="description">{selectedCargo.descripcion}</p>
                <p className="created-date">
                  <strong>Creado:</strong> {new Date(selectedCargo.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>

              <div className="cargo-metrics">
                <h4>📊 Métricas del Cargo</h4>
                {loadingMetrics ? (
                  <div className="loading-metrics">
                    <div className="loading-spinner"></div>
                    <span>Cargando métricas...</span>
                  </div>
                ) : cargoMetrics ? (
                  <>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <FaUsers className="metric-icon" />
                        <div className="metric-content">
                          <span className="metric-value">{cargoMetrics.totalUsuarios || 0}</span>
                          <span className="metric-label">Usuarios</span>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <FaGraduationCap className="metric-icon" />
                        <div className="metric-content">
                          <span className="metric-value">{cargoMetrics.totalCursos || 0}</span>
                          <span className="metric-label">Cursos</span>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <FaFileAlt className="metric-icon" />
                        <div className="metric-content">
                          <span className="metric-value">{cargoMetrics.totalDocumentos || 0}</span>
                          <span className="metric-label">Documentos</span>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <div className="metric-content">
                          <span className="metric-value">{Math.round(cargoMetrics.promedioProgreso || 0)}%</span>
                          <span className="metric-label">Progreso Promedio</span>
                        </div>
                      </div>
                    </div>
                    
                    {cargoMetrics.promedioProgreso > 0 && (
                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${Math.min(cargoMetrics.promedioProgreso, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          Progreso general del cargo: {Math.round(cargoMetrics.promedioProgreso)}%
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-metrics">
                    <span>❌ No se pudieron cargar las métricas</span>
                  </div>
                )}
              </div>

              <div className="cargo-actions-modal">
                <button 
                  className="btn-primary"
                  onClick={() => downloadCargoReport(selectedCargo)}
                >
                  <FaDownload /> Descargar Reporte
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminCargos;
