import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaCircle, FaUser } from "react-icons/fa";
import "./AdminBitacora.css";
import { BACKEND_URL } from '../utils/api';

const AdminBitacora = () => {
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    estado: "rojo",
    asignados: [],
    deadline: "",
  });

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchTareas();
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        // Filtrar solo usuarios activos
        const usuariosActivos = (data.users || []).filter(usuario => usuario.activo === 1);
        setUsuarios(usuariosActivos);
      } else {
        console.error('Error al obtener usuarios:', data.message);
        alert('❌ Error al cargar usuarios: ' + data.message);
      }
    } catch (error) {
      console.error('Error en fetchUsuarios:', error);
      alert('❌ No se pudo cargar la lista de usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchTareas = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bitacora`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTareas(data.tareas || []);
      } else {
        alert("❌ Error al obtener tareas");
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingTarea
      ? `${BACKEND_URL}/api/bitacora/${editingTarea.id}`
      : `${BACKEND_URL}/api/bitacora`;
    const method = editingTarea ? "PUT" : "POST";

    console.log('Enviando datos:', formData);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.success) {
        fetchTareas();
        setShowModal(false);
        setEditingTarea(null);
        setFormData({
          titulo: "",
          descripcion: "",
          estado: "rojo",
          asignados: [],
          deadline: "",
        });
        alert("✅ " + (data.message || "Operación exitosa"));
      } else {
        console.error('Error del servidor:', data);
        alert("❌ " + (data.message || "Error desconocido"));
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert("❌ Error de conexión: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/bitacora/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) fetchTareas();
      else alert("❌ " + data.message);
    } catch (error) {
      }
  };

  const handleEdit = (tarea) => {
    console.log('Editando tarea:', tarea);
    
    setEditingTarea(tarea);
    setFormData({
      titulo: tarea.titulo || "",
      descripcion: tarea.descripcion || "",
      estado: tarea.estado || "rojo",
      asignados: (() => {
        try {
          if (Array.isArray(tarea.asignados)) {
            return tarea.asignados;
          }
          if (typeof tarea.asignados === 'string') {
            return JSON.parse(tarea.asignados || "[]");
          }
          return [];
        } catch (error) {
          console.error('Error parseando asignados:', error);
          return [];
        }
      })(),
      deadline: tarea.deadline ? tarea.deadline.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleCheckboxChange = (id) => {
    setFormData((prev) => {
      const asignados = prev.asignados.includes(id)
        ? prev.asignados.filter((uid) => uid !== id)
        : [...prev.asignados, id];
      return { ...prev, asignados };
    });
  };

  const getStatusClass = (estado) => {
    return `status-${estado}`;
  };

  const estados = [
    { key: "rojo", label: "🔴 Pendientes" },
    { key: "amarillo", label: "🟡 En Progreso" },
    { key: "verde", label: "✅ Completadas" },
  ];

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "verde":
        return "COMPLETADO";
      case "amarillo":
        return "EN PROGRESO";
      case "rojo":
      default:
        return "PENDIENTE";
    }
  };

  return (
    <div className="admin-body bitacora-container">
      <div className="bitacora-header">
        <h1>🚦 Bitácora Global</h1>
        <button className="btn-primary" onClick={() => {
          setShowModal(true);
          // Recargar usuarios cuando se abre el modal
          fetchUsuarios();
        }}>
          <FaPlus /> Nueva Tarea
        </button>
      </div>

      {loading ? (
        <p>Cargando tareas...</p>
      ) : tareas.length === 0 ? (
        <p>No hay tareas registradas.</p>
      ) : (
        <div className="bitacora-columns">
          {estados.map(({ key, label }) => (
            <div key={key} className="bitacora-column">
              <h2 className={`titulo-columna ${getStatusClass(key)}`}>
                {label} ({tareas.filter((t) => t.estado === key).length})
              </h2>
              {tareas
                .filter((t) => t.estado === key)
                .map((t) => {
                  let asignados = [];
                  try {
                    asignados = Array.isArray(t.asignados)
                      ? t.asignados
                      : JSON.parse(t.asignados || "[]");
                  } catch (error) {
                    asignados = [];
                  }
                  return (
                    <div key={t.id} className={`admin-tarea-card admin-status-${t.estado}`}>
                      <div className="admin-tarea-title">{t.titulo}</div>
                      <p>{t.descripcion}</p>
                      <div className="admin-badge">
                        <FaCircle /> {getEstadoLabel(t.estado)}
                      </div>
                      <div className="tarea-info">
                        <div className="info-item">
                          <strong>📅 Límite:</strong>{" "}
                          {(() => {
                            if (!t.deadline) return 'Sin fecha';
                            
                            // Crear fecha usando partes individuales para evitar problemas de zona horaria
                            const dateParts = t.deadline.split('-');
                            if (dateParts.length === 3) {
                              const year = parseInt(dateParts[0]);
                              const month = parseInt(dateParts[1]) - 1; // Los meses en JS van de 0-11
                              const day = parseInt(dateParts[2]);
                              const date = new Date(year, month, day);
                              return date.toLocaleDateString("es-ES");
                            }
                            
                            // Fallback: intentar parsear como fecha normal
                            try {
                              return new Date(t.deadline).toLocaleDateString("es-ES");
                            } catch (error) {
                              return t.deadline; // Mostrar la fecha como string si falla
                            }
                          })()}
                        </div>
                        <div className="info-item">
                          <strong>👥 Asignados:</strong>{" "}
                          <div className="asignados-container">
                            {asignados.length === 0 ? (
                              <span className="no-asignados">Sin asignar</span>
                            ) : (
                              asignados.map((id) => {
                                // Primero intentar usar la información del backend
                                const userFromBackend = t.usuariosAsignados?.find((u) => u.id === id);
                                if (userFromBackend) {
                                  return (
                                    <span key={id} className={`asignado-badge ${userFromBackend.activo ? 'activo' : 'inactivo'}`}>
                                      <FaUser /> {userFromBackend.nombre}
                                      {!userFromBackend.activo && <span className="status-indicator"> (Inactivo)</span>}
                                    </span>
                                  );
                                }
                                
                                // Fallback: buscar en la lista local de usuarios
                                const user = usuarios.find((u) => u.id === id);
                                return (
                                  <span key={id} className="asignado-badge">
                                    <FaUser /> {user?.nombre || `ID ${id}`}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="btn-edit" onClick={() => handleEdit(t)} title="Editar tarea">
                          <FaEdit />
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(t.id)} title="Eliminar tarea">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingTarea ? "✏️ Editar Tarea" : "➕ Nueva Tarea"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>📝 Título de la tarea:</label>
                <input
                  type="text"
                  placeholder="Ingresa el título de la tarea"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>📄 Descripción:</label>
                <textarea
                  placeholder="Describe los detalles de la tarea"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>🚦 Estado:</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="rojo">🔴 Pendiente</option>
                  <option value="amarillo">🟡 En Progreso</option>
                  <option value="verde">✅ Completado</option>
                </select>
              </div>

              <div className="form-group">
                <label>📅 Fecha Límite:</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>👥 Asignar usuarios:</label>
                <div className="usuarios-checkboxes">
                  {loadingUsuarios ? (
                    <div className="no-usuarios">
                      <p>🔄 Cargando usuarios...</p>
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="no-usuarios">
                      <p>❌ No hay usuarios disponibles</p>
                      <p><small>Verifica tu conexión o contacta al administrador</small></p>
                    </div>
                  ) : (
                    usuarios.map((u) => (
                      <label key={u.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.asignados.includes(u.id)}
                          onChange={() => handleCheckboxChange(u.id)}
                        />
                        <span className="checkmark"></span>
                        {u.nombre} {u.activo === 0 && <span className="inactive-user">(Inactivo)</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingTarea ? "💾 Actualizar" : "✨ Crear"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTarea(null);
                    setFormData({
                      titulo: "",
                      descripcion: "",
                      estado: "rojo",
                      asignados: [],
                      deadline: "",
                    });
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBitacora;