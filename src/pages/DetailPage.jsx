import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import axios from "axios";
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
  const [hasCompletedEvaluation, setHasCompletedEvaluation] = useState(false);

  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  
  if (!token || !user || !user.rol) {
    navigate("/login");
    return null;
  }


  useEffect(() => {
    const loadCourse = async () => {
      if (!user || !user.rol || !token) {
        return;
      }

      try {
        
        const res = await axios.get(`${BACKEND_URL}/api/courses?rol=${user.rol}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const found = res.data.courses.find((c) => c.id === +id);
        
        if (!found) {
          alert("Curso no encontrado");
          return navigate("/courses");
        }

        
        // Cargar preguntas del curso
        try {
          const questionsRes = await axios.get(`${BACKEND_URL}/api/courses/${id}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          found.evaluation = questionsRes.data.questions || [];
        } catch (questionsError) {
          found.evaluation = [];
        }

        setCourse(found);
        
      } catch (err) {
        alert("Error al cargar curso: " + (err.response?.data?.message || err.message));
        navigate("/courses");
      }
    };

    loadCourse();
  }, [id, navigate, token, user.rol]);


  // Nuevo useEffect: cargar progreso desde la base de datos
  useEffect(() => {
    if (!course || user.rol === "Admin") return;

    const progressURL = `${BACKEND_URL}/api/progress/${id}`;

    axios
      .get(progressURL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success && res.data.progress) {
          const p = res.data.progress;
          
          // Verificar si hay progreso real - usar múltiples campos para ser más robusto
          if (p.id || p.video_completed || p.evaluation_score !== null || p.attempts_used > 0) {
            
            // Hay progreso registrado
            if (p.video_completed) {
              setVideoEnded(true);
            }
            setAttemptsLeft(course.attempts - (p.attempts_used || 0));

            // NO cargar el puntaje automáticamente - solo cargar si el usuario ya completó la evaluación
            // El puntaje se mostrará solo después de completar la evaluación en esta sesión
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
    
    // Debug: mostrar progreso en consola

    // Ya no usamos localStorage para saber si el curso fue iniciado
    // Guardar progreso en la DB solo cuando el video termina
    if (state.played >= 0.99 && !videoEnded) {
      setVideoEnded(true);
      axios
        .post(
          `${BACKEND_URL}/api/progress`,
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
            attemptsUsed: course.attempts - attemptsLeft,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
        })
        .catch((error) => {
        });
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
    // Reducir intentos al iniciar el quiz
    setAttemptsLeft(prev => prev - 1);
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
    setHasCompletedEvaluation(true); // Marcar que se completó la evaluación
    setShowQuiz(false);
    setTimerActive(false);

    axios
      .post(
        `${BACKEND_URL}/api/progress`,
        {
          courseId: +id,
          videoCompleted: true,
          score: correct,
          total,
          status,
          attemptsUsed: course.attempts - attemptsLeft,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        // Los intentos ya se redujeron en startQuiz
      })
      .catch(() => {});
  };

  const handleSelect = (qIdx, optIdx) => {
    setAnswers({ ...answers, [qIdx]: optIdx });
  };



  return (
    <div className="detail-page-container">
      <div className="detail-page">
        <button className="detail-back-button" onClick={() => navigate(-1)}>⬅ Volver</button>
        <h1>{course.title}</h1>
        <p>{course.description}</p>

        <div className="detail-video">
          {(() => {
            const videoUrl = course.videoUrl || course.video_url;
            if (!videoUrl) {
              return <p>⚠️ No hay video disponible</p>;
            }
            
            const isYouTube = videoUrl.includes('youtube.com/embed/') || 
                             videoUrl.includes('youtube.com/watch') || 
                             videoUrl.includes('youtu.be/');
            
            let finalUrl;
            if (isYouTube) {
              // Para YouTube, usar la URL tal como está o convertir a embed
              finalUrl = videoUrl.includes('youtube.com/embed/') 
                ? videoUrl 
                : videoUrl.replace(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/, 'https://www.youtube.com/embed/$1');
            } else {
              // Para archivos locales, construir la URL correcta
              finalUrl = videoUrl.startsWith('http') 
                ? videoUrl 
                : `${BACKEND_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
            }
            
            console.log('🎬 DetailPage - Cargando video:', { 
              originalUrl: videoUrl, 
              finalUrl, 
              isYouTube,
              courseId: course.id 
            });
            
            return (
              <ReactPlayer
                url={finalUrl}
                controls
                onProgress={handleProgress}
                onEnded={() => setVideoEnded(true)}
                onError={(error) => {
                  console.error('❌ Error en ReactPlayer:', error);
                  console.error('URL que falló:', finalUrl);
                }}
                onReady={() => {
                  console.log('✅ ReactPlayer listo:', finalUrl);
                }}
                className="react-player"
              />
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

        {/* Mostrar puntaje solo si hay evaluación Y se completó en esta sesión */}
        {Array.isArray(course.evaluation) && course.evaluation.length > 0 && score && hasCompletedEvaluation && (
          <div className={`quiz-score ${score.score >= Math.ceil(score.total * 0.6) ? 'quiz-score-approved' : 'quiz-score-failed'}`}>
            {score.score >= Math.ceil(score.total * 0.6) ? (
              <>
                <span className="quiz-result-icon">✅</span>
                <span className="quiz-result-text">
                  Obtuviste {score.score} de {score.total} 
                  <span className="quiz-status-approved"> (Aprobado)</span>
                </span>
              </>
            ) : (
              <>
                <span className="quiz-result-icon">❌</span>
                <span className="quiz-result-text">
                  Obtuviste {score.score} de {score.total} 
                  <span className="quiz-status-failed"> (Reprobado)</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPage;
