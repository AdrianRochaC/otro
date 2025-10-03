import React, { useState, useEffect } from "react";
import "./Register.css";
import { BACKEND_URL } from '../utils/api';

const API_URL = BACKEND_URL;

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargos, setCargos] = useState([]);
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cargos/activos`);
      if (response.ok) {
        const data = await response.json();
        setCargos(data.cargos);
        if (data.cargos.length > 0) {
          setSelectedCargoId(data.cargos[0].id);
        }
      } else {
        }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const validateName = (name) => {
    // Verificar que no sea solo números
    if (/^\d+$/.test(name.trim())) {
      return "❌ El nombre no puede ser solo números";
    }
    
    // Verificar que tenga al menos 2 palabras (nombre y apellido)
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return "❌ Debe incluir nombre y apellido";
    }
    
    // Verificar que cada palabra tenga al menos 2 caracteres
    for (const word of words) {
      if (word.length < 2) {
        return "❌ Cada nombre debe tener al menos 2 caracteres";
      }
    }
    
    // Verificar que contenga solo letras, espacios y algunos caracteres especiales
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(name.trim())) {
      return "❌ El nombre solo puede contener letras, espacios, guiones y apostrofes";
    }
    
    return null; // Válido
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validar nombre
    const nameError = validateName(name);
    if (nameError) {
      alert(nameError);
      return;
    }

    if (!selectedCargoId) {
      alert("❌ Por favor selecciona un cargo");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: name,
          email: email, 
          password: password, 
          cargo_id: parseInt(selectedCargoId)
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert("✅ " + result.message);
        // Limpiar formulario después del registro exitoso
        setName("");
        setEmail("");
        setPassword("");
        setSelectedCargoId(cargos.length > 0 ? cargos[0].id : "");
      } else {
        alert("❌ " + result.message);
      }
    } catch (error) {
      alert("❌ Error de conexión. Verifica que el servidor esté funcionando.");
    }
  };

  if (loading) {
    return (
      <div className="register-container">
        <div className="loading">Cargando cargos disponibles...</div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-header">
        <h1>🚀 Crear Cuenta</h1>
        <p>Únete a nuestra plataforma de capacitaciones</p>
      </div>
      
      <form className="register-form" onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="name">
            <span className="label-icon">👤</span>
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa tu nombre completo"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            <span className="label-icon">📧</span>
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@empresa.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <span className="label-icon">🔒</span>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cargo">
            <span className="label-icon">🏢</span>
            Cargo/Departamento
          </label>
          <select 
            id="cargo"
            value={selectedCargoId} 
            onChange={(e) => setSelectedCargoId(e.target.value)}
            required
          >
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nombre} - {cargo.descripcion}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary">
          <span className="btn-icon">✨</span>
          Crear cuenta
        </button>
      </form>
    </div>
  );
};

export default Register;