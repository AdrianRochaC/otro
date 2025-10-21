import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CoursesPage.css";
import { BACKEND_URL } from '../utils/api';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir a Home si el usuario acaba de iniciar sesión
    if (window.location.pathname === "/coursespage") {
      window.location.href = "/home";
      return;
    }

    loadCourses();
  }, []);

  // Función para cargar cursos (refactorizada)
  const loadCourses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("authToken");

      if (!user || !user.rol || !token) {
        alert("⚠️ Debes iniciar sesión.");
        navigate("/login", { replace: true });
        return;
      }

      const rol = user.rol;
      const response = await fetch(`${BACKEND_URL}/api/courses?rol=${encodeURIComponent(rol)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("⚠️ Sesión expirada. Inicia sesión nuevamente.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      } else {
        alert("Error al cargar cursos");
      }
    } catch (err) {
      }
  };

  // Función para asegurar que la URL esté en formato embed
  const ensureEmbedUrl = (url) => {
    if (!url) return null;

    // Si ya es una URL de embed, la devolvemos tal como está
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Si es una URL de watch, la convertimos a embed
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <div className="courses-body">
      <div className="courses-page">
        <h1>Cursos Disponibles</h1>
        <div className="courses-container">
          {courses.length === 0 ? (
            <p>No hay cursos disponibles para tu rol.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="course-card">
                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <div className="video-container">
                  {(() => {
                    const videoUrl = course.videoUrl || course.video_url;
                    if (!videoUrl || videoUrl.trim() === "") {
                      return (
                        <div className="no-video">
                          <p>⚠️ No hay video disponible</p>
                        </div>
                      );
                    }
                    
                    // Si es YouTube, usar iframe
                    if (videoUrl.includes('youtube.com/embed/') || videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be/')) {
                      return (
                        <iframe
                          src={ensureEmbedUrl(videoUrl)}
                          title={course.title}
                          width="100%"
                          height="315"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                    
                    // Para archivos locales, construir la URL correcta
                    const finalUrl = videoUrl.startsWith('http') 
                      ? videoUrl 
                      : `${BACKEND_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
                    
                    console.log('🎬 Cargando video:', { 
                      originalUrl: videoUrl, 
                      finalUrl, 
                      courseId: course.id 
                    });
                    
                    return (
                      <video
                        src={finalUrl}
                        controls
                        width="100%"
                        height="315"
                        style={{ background: '#000' }}
                        onError={(e) => {
                          console.error('❌ Error cargando video:', e);
                          console.error('URL que falló:', finalUrl);
                        }}
                        onLoadStart={() => {
                          console.log('🔄 Iniciando carga de video:', finalUrl);
                        }}
                        onCanPlay={() => {
                          console.log('✅ Video listo para reproducir:', finalUrl);
                        }}
                      >
                        Tu navegador no soporta la reproducción de video.
                      </video>
                    );
                  })()}
                </div>

                {/* ✅ Botón corregido con ruta correcta */}
                <button onClick={() => navigate(`/detail/${course.id}`)}>
                  Ver curso
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
