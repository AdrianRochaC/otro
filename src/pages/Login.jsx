import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { initializePreferences } from '../utils/preferencesApi';
import { apiFetch } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user || user === 'null') {
      localStorage.removeItem('theme');
      localStorage.removeItem('colorScheme');
      localStorage.removeItem('fontSize');
      localStorage.removeItem('fontFamily');
      localStorage.removeItem('spacing');
      localStorage.removeItem('animations');
      localStorage.removeItem('backgroundType');
      localStorage.removeItem('backgroundImageUrl');
      localStorage.removeItem('backgroundColor');
      localStorage.removeItem('storageCleared');
      localStorage.removeItem('backgroundImageTooLarge');

      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-color-scheme', 'default');
      document.documentElement.setAttribute('data-font-size', 'medium');
      document.documentElement.setAttribute('data-font-family', 'inter');
      document.documentElement.setAttribute('data-spacing', 'normal');
      document.documentElement.setAttribute('data-animations', 'enabled');
      document.documentElement.setAttribute('data-background-type', 'color');
      document.documentElement.setAttribute('data-background-color', 'default');
      document.documentElement.style.removeProperty('--background-image');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        await initializePreferences();
        alert("✅ Bienvenido " + result.user.nombre);
        navigate("/home");
      } else {
        alert("❌ " + (result.message || "Credenciales incorrectas"));
      }

    } catch (error) {
      
      // Mostrar error detallado en consola y alert
      const errorMessage = error.message || "Error de conexión. Verifica que el servidor esté funcionando.";
      alert("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-container">
        {/* Lado izquierdo - Logo */}
        <div className="login-logo-section">
          <div className="login-logo-content">
            <img 
              src="/daviivr.png" 
              alt="Logo Davivir" 
              className="login-logo"
            />
            <h2 className="login-brand-title">
              Capacitaciones
              <span>Davivir</span>
            </h2>
            <p className="login-brand-subtitle">
              Sistema de gestión y capacitación
            </p>
          </div>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="login-form-section">
          <div className="login-container">
            <h1>Iniciar Sesión</h1>
            <form className="login-form" onSubmit={handleLogin}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Ingresa tu email"
              />

              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Ingresa tu contraseña"
              />

              <button type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
