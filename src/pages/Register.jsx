import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Register.css";
import { BACKEND_URL } from '../utils/api';

const API_URL = BACKEND_URL;

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargos, setCargos] = useState([]);
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  useEffect(() => {
    fetchCargos();
  }, []);

  // Validar contraseña en tiempo real
  useEffect(() => {
    const validatePassword = (password) => {
      return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
      };
    };

    setPasswordValidation(validatePassword(password));
  }, [password]);

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

    // Validar contraseña
    const isPasswordValid = Object.values(passwordValidation).every(valid => valid);
    if (!isPasswordValid) {
      alert("❌ La contraseña no cumple con todos los requisitos");
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
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Indicadores de validación de contraseña */}
          {password && (
            <div className="password-validation">
              <div className={`validation-item ${passwordValidation.length ? 'valid' : 'invalid'}`}>
                <span className="validation-icon">
                  {passwordValidation.length ? '✅' : '❌'}
                </span>
                Mínimo 8 caracteres
              </div>
              <div className={`validation-item ${passwordValidation.uppercase ? 'valid' : 'invalid'}`}>
                <span className="validation-icon">
                  {passwordValidation.uppercase ? '✅' : '❌'}
                </span>
                Al menos una mayúscula
              </div>
              <div className={`validation-item ${passwordValidation.lowercase ? 'valid' : 'invalid'}`}>
                <span className="validation-icon">
                  {passwordValidation.lowercase ? '✅' : '❌'}
                </span>
                Al menos una minúscula
              </div>
              <div className={`validation-item ${passwordValidation.number ? 'valid' : 'invalid'}`}>
                <span className="validation-icon">
                  {passwordValidation.number ? '✅' : '❌'}
                </span>
                Al menos un número
              </div>
            </div>
          )}
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