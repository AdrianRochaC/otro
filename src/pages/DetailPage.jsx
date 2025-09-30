import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import axios from "axios";
import { useUser } from "../hooks/useUser";
import "./DetailPage.css";
import { BACKEND_URL } from '../utils/api';

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [played, setPlayed] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [score, setScore] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const { user, token, loading, isAdmin } = useUser();
  const [videoExists, setVideoExists] = useState(null);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);


  useEffect(() => {
    const loadCourse = async () => {
      if (!id || !user || !user.rol || !token) {
        console.log('Esperando datos del usuario...', { id, user: user?.rol, token: !!token });
        return;
      }

      try {
        console.log('Cargando curso con ID:', id);
        console.log('Rol del usuario:', user.rol);
        
        const res = await axios.get(`${BACKEND_URL}/api/courses?rol=${user.rol}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Cursos recibidos:', res.data.courses);
        const found = res.data.courses.find((c) => c.id === +id);
        
        if (!found) {
          console.error('Curso no encontrado con ID:', id);
          alert("Curso no encontrado");
          return navigate("/courses");
        }

        console.log('Curso encontrado:', found);
        
        // Cargar preguntas del curso
        try {
          const questionsRes = await axios.get(`${BACKEND_URL}/api/courses/${id}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log('Preguntas cargadas:', questionsRes.data.questions);
          found.evaluation = questionsRes.data.questions || [];
        } catch (questionsError) {
          console.warn('Error cargando preguntas:', questionsError);
          found.evaluation = [];
        }

        setCourse(found);
        console.log('Curso configurado:', found);
        
      } catch (err) {
        console.error('Error al cargar curso:', err);
        alert("Error al cargar curso: " + (err.response?.data?.message || err.message));
        navigate("/courses");
      }
    };

    loadCourse();
  }, [id, navigate, token, user]);

  // Verificar si el archivo de video existe
  useEffect(() => {
    const checkVideoFile = async () => {
      if (!course || !token || !user) return;
      
      const videoUrl = course.videoUrl || course.video_url;
      if (!videoUrl) {
        setVideoExists(null);
        return;
      }
      
      // YouTube o URL externa, asumir que existe
      if (videoUrl.includes('youtube.com/embed/') || videoUrl.startsWith('http')) {
        setVideoExists(true);
        return;
      }
      
      // Para archivos locales, verificar si existen
      setCheckingVideo(true);
      try {
        const filename = videoUrl.replace('/uploads/videos/', '');
        console.log('🔍 Verificando archivo local:', filename);
        
        const response = await axios.get(`${BACKEND_URL}/api/check-video/${filename}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📁 Verificación de archivo:', response.data);
        setVideoExists(response.data.exists);
      } catch (error) {
        console.error('❌ Error verificando archivo:', error);
        setVideoExists(false);
      } finally {
        setCheckingVideo(false);
      }
    };

    checkVideoFile();
  }, [course, token, user]);

  // Nuevo useEffect: cargar progreso desde la base de datos
  useEffect(() => {
    if (!course || !user || isAdmin) return;

    const progressURL = `${BACKEND_URL}/api/progress/${id}`;
    console.log('🔍 Cargando progreso del curso:', id);
    console.log('🌐 URL del backend:', BACKEND_URL);
    console.log('📡 URL completa de progreso:', progressURL);

    axios
      .get(progressURL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success && res.data.progress) {
          const p = res.data.progress;
          
          // Verificar si hay progreso real (no el objeto vacío)
          if (p.created_at) {
            // Hay progreso registrado
            if (p.video_completed) setVideoEnded(true);
            setAttemptsLeft(course.attempts - (p.attempts_used || 0));

            if (p.evaluation_score != null) {
              setScore({
                score: p.evaluation_score,
                total: p.evaluation_total,
              });
            }
          } else {
            // No hay progreso registrado, usar valores por defecto
            setAttemptsLeft(course.attempts);
            setVideoEnded(false);
            setScore({ score: null, total: null });
          }
        } else {
          // Fallback en caso de respuesta inesperada
          setAttemptsLeft(course.attempts);
          setVideoEnded(false);
          setScore({ score: null, total: null });
        }
      })
      .catch((err) => {
        console.error('Error cargando progreso del curso:', err);
        // En caso de error, usar valores por defecto
        setAttemptsLeft(course.attempts);
        setVideoEnded(false);
        setScore({ score: null, total: null });
      });
  }, [course, id, token, user.rol]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setShowQuiz(false);
      setTimerActive(false);
      alert("⏰ Se acabó el tiempo");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  if (!course) return <p>Cargando curso...</p>;

  const handleProgress = (state) => {
    setPlayed(state.played);

    // Ya no usamos localStorage para saber si el curso fue iniciado
    // Guardar progreso en la DB solo cuando el video termina
    if (state.played >= 0.99 && !videoEnded) {
      setVideoEnded(true);
      axios
        .post(
          "/api/progress",
          {
            courseId: +id,
            videoCompleted: true,
            score: score?.score ?? null,
            total: score?.total ?? null,
            status: score
              ? score.score >= Math.ceil(score.total * 0.6)
                ? "aprobado"
                : "reprobado"
              : null,
            attemptsUsed: (course.attempts - attemptsLeft) ?? 0,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(console.error);
    }
  };

  const startQuiz = () => {
    if (!videoEnded) return alert("Primero debes ver todo el video.");
    if (attemptsLeft !== null && attemptsLeft <= 0)
      return alert("Ya no tienes más intentos.");
    setAnswers({});
    setTimeLeft(course.timeLimit * 60);
    setTimerActive(true);
    setShowQuiz(true);
  };

  const submitQuiz = () => {
    const total = course.evaluation.length;
    const correct = course.evaluation.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const status =
      correct >= Math.ceil(total * 0.6) ? "aprobado" : "reprobado";

    setScore({ score: correct, total });
    setShowQuiz(false);
    setTimerActive(false);

    axios
      .post(
        "/api/progress",
        {
          courseId: +id,
          videoCompleted: true,
          score: correct,
          total,
          status,
          attemptsUsed: (course.attempts - (attemptsLeft - 1)) ?? 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setAttemptsLeft((prev) => prev - 1);
      })
      .catch(console.error);
  };

  const handleSelect = (qIdx, optIdx) => {
    setAnswers({ ...answers, [qIdx]: optIdx });
  };

  // Función para obtener la URL del video de manera robusta
  const getVideoUrl = (course) => {
    if (!course) return null;
    
    const videoUrl = course.videoUrl || course.video_url;
    if (!videoUrl) return null;
    
    // Si es YouTube, usar la URL directamente
    if (videoUrl.includes('youtube.com/embed/')) {
      return videoUrl;
    }
    
    // Si ya es una URL completa, usarla
    if (videoUrl.startsWith('http')) {
      return videoUrl;
    }
    
    // Si es una ruta relativa, construir la URL completa
    return `${BACKEND_URL}${videoUrl}`;
  };

  // Función para reintentar la carga del video
  const retryVideoLoad = () => {
    console.log('🔄 Reintentando carga del video...');
    setVideoError(null);
    setRetryCount(prev => prev + 1);
    setVideoExists(null);
    setCheckingVideo(false);
  };

  // Mostrar loading mientras se cargan los datos
  if (loading || !user || !token) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          Cargando curso...
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  // Mostrar mensaje si no hay curso cargado
  if (!course) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          Cargando información del curso...
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page-container">
      <div className="detail-page">
        <button className="detail-back-button" onClick={() => navigate(-1)}>⬅ Volver</button>
        <h1>{course.title}</h1>
        <p>{course.description}</p>

        <div className="detail-video">
          {(() => {
            const finalUrl = getVideoUrl(course);
            
            console.log('🎬 Configurando video:', {
              courseId: course.id,
              courseTitle: course.title,
              originalVideoUrl: course.videoUrl || course.video_url,
              finalUrl,
              backendUrl: BACKEND_URL,
              videoExists,
              checkingVideo
            });
            
            if (!finalUrl) {
              return (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-danger)', marginBottom: '1rem' }}>
                    ❌ No hay video disponible
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Este curso no tiene un video asociado.
                  </div>
                </div>
              );
            }
            
            // Mostrar loading mientras se verifica el archivo (solo para archivos locales)
            if (checkingVideo && !finalUrl.includes('youtube.com')) {
              return (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    Verificando archivo de video...
                  </div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '3px solid var(--border-color)',
                    borderTop: '3px solid var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              );
            }
            
            // Mostrar error si el archivo no existe (solo para archivos locales)
            if (videoExists === false && !finalUrl.includes('youtube.com')) {
              const filename = (course.videoUrl || course.video_url)?.replace('/uploads/videos/', '') || 'desconocido';
              return (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-danger)', marginBottom: '1rem' }}>
                    ❌ Video no encontrado
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    El archivo de video no está disponible en el servidor.
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Archivo: {filename}
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Recargar página
                  </button>
                </div>
              );
            }
            
            // Mostrar el reproductor de video
            return (
              <div>
                <ReactPlayer
                  url={finalUrl}
                  controls
                  width="100%"
                  height="100%"
                  onProgress={handleProgress}
                  onEnded={() => setVideoEnded(true)}
                  onError={(error) => {
                    console.error('❌ Error en video:', error);
                    console.error('❌ URL del video:', finalUrl);
                    console.error('❌ Intento número:', retryCount + 1);
                    setVideoError(error);
                  }}
                  onReady={() => {
                    console.log('✅ Video listo para reproducir:', finalUrl);
                    setVideoError(null);
                  }}
                  onStart={() => {
                    console.log('▶️ Video iniciado:', finalUrl);
                    setVideoError(null);
                  }}
                  className="react-player"
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: 'anonymous'
                      }
                    }
                  }}
                />
                
                {/* Mostrar error y botón de reintento si hay error */}
                {videoError && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem', 
                    textAlign: 'center', 
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '1rem', color: 'var(--text-danger)', marginBottom: '0.5rem' }}>
                      ❌ Error cargando el video
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      Intento {retryCount + 1} de 3
                    </div>
                    {retryCount < 2 && (
                      <button 
                        onClick={retryVideoLoad}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '0.5rem'
                        }}
                      >
                        Reintentar
                      </button>
                    )}
                    <button 
                      onClick={() => window.location.reload()}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--secondary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Recargar página
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="video-progress-bar">
          <div className="video-progress-filled" style={{ width: `${played * 100}%` }} />
        </div>

        {/* Solo mostrar evaluación si hay preguntas */}
        {Array.isArray(course.evaluation) && course.evaluation.length > 0 && (
          !showQuiz ? (
            <div className="course-evaluation-section">
              <button
                className="evaluation-button"
                disabled={!videoEnded || (attemptsLeft !== null && attemptsLeft <= 0)}
                onClick={startQuiz}
              >
                📝 Realizar Evaluación
              </button>
              {!videoEnded && <p className="video-warning">Debes ver todo el video.</p>}
              {attemptsLeft !== null && <p className="evaluation-message">Intentos restantes: {attemptsLeft}</p>}
            </div>
          ) : (
            <div className="quiz-container">
              {timeLeft !== null && (
                <p className="evaluation-message">
                  ⏳ Tiempo restante: {Math.floor(timeLeft / 60)}:{("0" + (timeLeft % 60)).slice(-2)}
                </p>
              )}
              {course.evaluation.map((q, idx) => (
                <div className="evaluation-question" key={idx}>
                  <p><strong>{idx + 1}. {q.question}</strong></p>
                  <ul>
                    {q.options.map((opt, i) => (
                      <li key={i}>
                        <label>
                          <input
                            type="radio"
                            name={`q${idx}`}
                            checked={answers[idx] === i}
                            onChange={() => handleSelect(idx, i)}
                          />
                          {" "}{opt}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button className="submit-quiz" onClick={submitQuiz}>Enviar respuestas</button>
            </div>
          )
        )}

        {/* Mostrar puntaje solo si hay evaluación */}
        {Array.isArray(course.evaluation) && course.evaluation.length > 0 && score && (
          <div className="quiz-score">
            ✅ Obtuviste {score.score} de {score.total} (
            {score.score >= Math.ceil(score.total * 0.6) ? "Aprobado" : "Reprobado"})
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPage;
