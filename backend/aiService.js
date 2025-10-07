const OpenAI = require('openai');
const { executeQuery } = require('./db-setup/connection-manager.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { YoutubeTranscript } = require('youtube-transcript');
const videoProcessor = require('./videoProcessor.js');

dotenv.config();

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || OPENAI_API_KEY, // Cambiar por tu API key real
});

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      }
  }

  /**
   * Genera preguntas de evaluación usando IA basándose en el contenido del curso
   * @param {Object} courseData - Datos del curso (título, descripción, contenido)
   * @param {number} numQuestions - Número de preguntas a generar (default: 5)
   * @returns {Array} Array de preguntas con opciones y respuesta correcta
   */
  async generateQuestions(courseData, numQuestions = 5) {
    try {
      console.log('🤖 === GENERANDO PREGUNTAS CON IA ===');
      console.log('📊 Datos del curso:');
      console.log('  - Título:', courseData.title);
      console.log('  - Tipo de contenido:', courseData.contentType);
      console.log('  - Longitud del contenido:', courseData.content?.length || 0, 'caracteres');
      console.log('  - Número de preguntas solicitadas:', numQuestions);
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const { title, description, content, contentType } = courseData;
      
      // Verificar que tenemos contenido suficiente (más tolerante)
      if (!content || content.trim().length < 20) {
        console.warn('⚠️ Contenido muy limitado, generando preguntas básicas...');
        // Generar preguntas básicas basadas en título y descripción
        return this.generateBasicQuestions(title, description, numQuestions);
      }
      
      if (content.trim().length < 100) {
        console.warn('⚠️ Contenido limitado, pero intentando generar preguntas...');
      }
      
      // Crear prompt contextual para OpenAI
      const prompt = this.createPrompt(title, description, content, contentType, numQuestions);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en crear evaluaciones educativas. Genera preguntas claras, relevantes y desafiantes basadas EXCLUSIVAMENTE en el contenido proporcionado. Las preguntas deben evaluar la comprensión real del material presentado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      console.log('📝 Respuesta de OpenAI recibida:', response.length, 'caracteres');
      console.log('📋 Primeros 300 chars de la respuesta:', response.substring(0, 300));
      
      const questions = this.parseAIResponse(response);
      console.log('✅ Preguntas generadas exitosamente:', questions.length);
      console.log('📊 Resumen de preguntas:');
      questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.question.substring(0, 50)}...`);
      });
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error generando preguntas:', error.message);
      throw error;
    }
  }

  /**
   * Genera preguntas básicas cuando no hay suficiente contenido
   */
  generateBasicQuestions(title, description, numQuestions) {
    console.log('🔧 === GENERANDO PREGUNTAS BÁSICAS ===');
    console.log('📝 Título:', title);
    console.log('📄 Descripción:', description?.substring(0, 200) || 'Sin descripción');
    console.log('🔢 Número solicitado:', numQuestions);
    
    const questions = [];
    const basicQuestions = [
      {
        question: `¿Cuál es el tema principal del curso "${title}"?`,
        options: [
          "El tema principal se explica en la descripción del curso",
          "No se especifica un tema principal",
          "El tema principal es evidente en el título",
          "El tema principal se desarrolla a lo largo del curso"
        ],
        correctIndex: 0,
        explanation: "El tema principal del curso se puede identificar en la descripción proporcionada."
      },
      {
        question: `¿Qué tipo de contenido educativo se presenta en "${title}"?`,
        options: [
          "Contenido audiovisual educativo",
          "Contenido teórico únicamente",
          "Contenido práctico únicamente",
          "Contenido mixto teórico-práctico"
        ],
        correctIndex: 0,
        explanation: "El curso presenta contenido audiovisual educativo como se indica en el formato del material."
      },
      {
        question: `¿Qué se puede esperar aprender de "${title}"?`,
        options: [
          "Conocimientos relacionados con el tema del curso",
          "Información general sin aplicación práctica",
          "Solo conceptos básicos",
          "Información desactualizada"
        ],
        correctIndex: 0,
        explanation: "El curso está diseñado para transmitir conocimientos relacionados con el tema presentado."
      },
      {
        question: `¿Cuál es la mejor forma de aprovechar el contenido de "${title}"?`,
        options: [
          "Prestar atención completa al material presentado",
          "Revisar solo las partes más importantes",
          "Saltar las explicaciones detalladas",
          "Ver el contenido de forma superficial"
        ],
        correctIndex: 0,
        explanation: "Para aprovechar al máximo el contenido educativo, es importante prestar atención completa al material."
      },
      {
        question: `¿Qué nivel de conocimiento se requiere para entender "${title}"?`,
        options: [
          "El nivel apropiado se indica en la descripción del curso",
          "Se requiere conocimiento avanzado",
          "Solo se necesita conocimiento básico",
          "No se especifica el nivel requerido"
        ],
        correctIndex: 0,
        explanation: "El nivel de conocimiento requerido se puede determinar revisando la descripción del curso."
      }
    ];

    // Agregar preguntas básicas hasta alcanzar el número solicitado
    for (let i = 0; i < Math.min(numQuestions, basicQuestions.length); i++) {
      questions.push(basicQuestions[i]);
    }

    console.log('✅ Preguntas básicas generadas:', questions.length);
    console.log('📊 Resumen de preguntas básicas:');
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question.substring(0, 50)}...`);
    });

    return questions;
  }

  /**
   * Crea el prompt para OpenAI basándose en el tipo de contenido
   */
  createPrompt(title, description, content, contentType, numQuestions) {
    let contentContext = '';
    let specificInstructions = '';
    
    if (contentType === 'youtube') {
      contentContext = `CONTENIDO DEL VIDEO DE YOUTUBE:
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA VIDEO DE YOUTUBE:
- Analiza el título, descripción y metadatos del video
- Genera preguntas que evalúen la comprensión de los conceptos principales
- Considera la duración y categoría del video para ajustar el nivel de dificultad
- Las preguntas deben ser relevantes para el contenido educativo del video`;
    } else if (contentType === 'video') {
      contentContext = `CONTENIDO REAL DEL ARCHIVO DE VIDEO (TRANSCRIPCIÓN COMPLETA):
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA ARCHIVO DE VIDEO CON TRANSCRIPCIÓN:
- Analiza la transcripción real del audio del video para identificar los temas específicos tratados
- Genera preguntas que evalúen la comprensión de los conceptos MENCIONADOS REALMENTE en el video
- Usa los puntos clave, entidades y sentimientos identificados en la transcripción
- Las preguntas deben ser específicas al contenido real del video, no genéricas
- Considera la confianza de la transcripción para ajustar el nivel de detalle de las preguntas
- Incluye preguntas sobre conceptos específicos, ejemplos mencionados, y conclusiones presentadas`;
    } else if (contentType === 'file') {
      contentContext = `CONTENIDO DEL DOCUMENTO:
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA DOCUMENTO:
- Analiza el tipo de documento (PDF, Word, etc.) y su nombre
- Genera preguntas que evalúen la comprensión de los temas del documento
- Considera el formato del archivo para determinar el tipo de contenido educativo`;
    } else {
      contentContext = `CONTENIDO DEL CURSO:
${content}`;
      specificInstructions = `
INSTRUCCIONES GENERALES:
- Genera preguntas basándote en el título y descripción del curso
- Las preguntas deben cubrir los conceptos principales del tema
- Mantén un nivel de dificultad apropiado para el contenido`;
    }

    return `
Eres un experto en crear evaluaciones educativas. Genera ${numQuestions} preguntas de evaluación para el siguiente curso:

TÍTULO DEL CURSO: ${title}
DESCRIPCIÓN DEL CURSO: ${description}

${contentContext}

${specificInstructions}

REQUISITOS GENERALES:
- Cada pregunta debe ser clara, específica y relevante
- Las opciones deben ser plausibles pero solo una correcta
- El nivel de dificultad debe ser apropiado para el contenido
- Las preguntas deben cubrir diferentes aspectos del tema
- Usa un lenguaje claro y profesional
- Evita preguntas demasiado obvias o demasiado complejas

FORMATO DE RESPUESTA (JSON):
[
  {
    "question": "Pregunta aquí",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0,
    "explanation": "Explicación breve de por qué es correcta"
  }
]

IMPORTANTE: Solo responde con el JSON válido, sin texto adicional. Asegúrate de que el JSON sea válido y que correctIndex sea un número entre 0 y 3.
`;
  }

  /**
   * Parsea la respuesta de OpenAI a un formato utilizable
   */
  parseAIResponse(response) {
    try {
      // Limpiar la respuesta y extraer solo el JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      // Validar y limpiar las preguntas
      return questions.map(q => ({
        question: q.question?.trim() || '',
        options: (q.options || []).map(opt => opt?.trim() || ''),
        correctIndex: parseInt(q.correctIndex) || 0,
        explanation: q.explanation?.trim() || ''
      })).filter(q => 
        q.question && 
        q.options.length === 4 && 
        q.options.every(opt => opt) &&
        q.correctIndex >= 0 && 
        q.correctIndex <= 3
      );
      
    } catch (error) {
      throw new Error('Respuesta de IA malformada');
    }
  }

  /**
   * Obtiene información del video de YouTube con transcripción real
   */
  async getYouTubeVideoInfo(videoUrl) {
    try {
      console.log('🎬 === OBTENIENDO INFORMACIÓN DE YOUTUBE ===');
      console.log('📺 URL:', videoUrl);
      
      // Obtener información básica del video
      const info = await ytdl.getInfo(videoUrl);
      console.log('📋 Información básica obtenida:');
      console.log('  - Título:', info.videoDetails.title);
      console.log('  - Duración:', info.videoDetails.lengthSeconds, 'segundos');
      console.log('  - Categoría:', info.videoDetails.category);
      console.log('  - Visualizaciones:', info.videoDetails.viewCount);
      console.log('  - Descripción (primeros 200 chars):', (info.videoDetails.description || '').substring(0, 200));
      
      // Intentar obtener transcripción directa
      let transcriptText = '';
      let confidence = 0.7;
      
      try {
        // Extraer ID del video
        const videoId = this.extractVideoId(videoUrl);
        console.log('🆔 Video ID extraído:', videoId);
        
        if (videoId) {
          console.log('🎤 Intentando obtener transcripción...');
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'es',
            country: 'ES'
          });
          
          if (transcript && transcript.length > 0) {
            transcriptText = transcript.map(item => item.text).join(' ');
            confidence = 0.9; // Alta confianza para transcripciones oficiales
            console.log('✅ Transcripción obtenida:', transcriptText.length, 'caracteres');
            console.log('📝 Primeros 300 chars de transcripción:', transcriptText.substring(0, 300));
          } else {
            console.log('⚠️ Transcripción vacía o no disponible');
          }
        }
      } catch (transcriptError) {
        console.log('❌ Error obteniendo transcripción:', transcriptError.message);
        // Si no hay transcripción, usar solo descripción
        transcriptText = info.videoDetails.description || '';
        confidence = 0.5;
        console.log('🔄 Usando descripción como fallback:', transcriptText.length, 'caracteres');
      }
      
      // Crear contenido enriquecido
      const enrichedContent = `
TÍTULO DEL VIDEO: ${info.videoDetails.title}
DURACIÓN: ${Math.floor(info.videoDetails.lengthSeconds / 60)} minutos ${info.videoDetails.lengthSeconds % 60} segundos
CATEGORÍA: ${info.videoDetails.category || 'Educación'}
VISUALIZACIONES: ${info.videoDetails.viewCount || '0'}

DESCRIPCIÓN DEL VIDEO:
${info.videoDetails.description || 'No hay descripción disponible'}

TRANSCRIPCIÓN DEL CONTENIDO:
${transcriptText || 'No se pudo obtener transcripción del video'}

INSTRUCCIONES PARA LA IA:
Basándote en la transcripción real del video de YouTube (si está disponible) o en el título y descripción, genera preguntas de evaluación que evalúen la comprensión del contenido específico mencionado en el video. Las preguntas deben ser relevantes para el material educativo real que se presenta.
      `;
      
      console.log('📊 === RESUMEN DE INFORMACIÓN OBTENIDA ===');
      console.log('📏 Longitud total del contenido:', enrichedContent.length, 'caracteres');
      console.log('📝 Longitud de transcripción:', transcriptText.length, 'caracteres');
      console.log('📄 Longitud de descripción:', (info.videoDetails.description || '').length, 'caracteres');
      console.log('🎯 Confianza:', confidence);
      console.log('📋 Contenido final (primeros 500 chars):', enrichedContent.substring(0, 500));
      
      return {
        title: info.videoDetails.title,
        content: enrichedContent,
        contentType: 'youtube',
        duration: parseInt(info.videoDetails.lengthSeconds),
        transcription: transcriptText,
        confidence: confidence,
        metadata: {
          category: info.videoDetails.category,
          viewCount: info.videoDetails.viewCount,
          description: info.videoDetails.description,
          highlights: [],
          entities: [],
          sentiment: []
        }
      };
      
    } catch (error) {
      console.error('❌ Error en getYouTubeVideoInfo:', error.message);
      throw error;
    }
  }

  /**
   * Extrae el ID del video de una URL de YouTube
   */
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Extrae transcripción real de video de YouTube
   */
  async extractYouTubeTranscript(videoUrl) {
    try {
      // Usar el procesador de video para obtener transcripción real
      const videoData = await videoProcessor.processYouTubeVideo(videoUrl);
      
      // Crear contenido enriquecido con la transcripción real
      const enrichedContent = `
TÍTULO DEL VIDEO: ${videoData.title}
DURACIÓN: ${Math.floor(videoData.duration / 60)} minutos ${videoData.duration % 60} segundos
CATEGORÍA: ${videoData.category}
VISUALIZACIONES: ${videoData.viewCount}

DESCRIPCIÓN DEL VIDEO:
${videoData.description}

TRANSCRIPCIÓN COMPLETA DEL AUDIO:
${videoData.transcription}

PUNTOS CLAVE IDENTIFICADOS:
${videoData.highlights ? videoData.highlights.map(h => `- ${h.text}`).join('\n') : 'No se identificaron puntos clave específicos'}

ENTIDADES IMPORTANTES MENCIONADAS:
${videoData.entities ? videoData.entities.map(e => `- ${e.text} (${e.entity_type})`).join('\n') : 'No se identificaron entidades específicas'}

INSTRUCCIONES PARA LA IA:
Basándote en la transcripción real del video de YouTube, genera preguntas de evaluación que evalúen la comprensión del contenido específico mencionado en el audio. Las preguntas deben ser relevantes para el material educativo real que se presenta en el video.
      `;
      
      
      return {
        title: videoData.title,
        content: enrichedContent,
        contentType: 'youtube',
        duration: videoData.duration,
        transcription: videoData.transcription,
        confidence: videoData.confidence,
        metadata: {
          category: videoData.category,
          viewCount: videoData.viewCount,
          description: videoData.description,
          highlights: videoData.highlights,
          entities: videoData.entities,
          sentiment: videoData.sentiment
        }
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Procesa archivo MP4 con transcripción real
   */
  async processMP4WithTranscription(filePath) {
    try {
      // Usar el procesador de video para obtener transcripción real
      const videoData = await videoProcessor.processMP4Video(filePath);
      
      // Crear contenido enriquecido con la transcripción real
      const enrichedContent = `
NOMBRE DEL ARCHIVO: ${videoData.fileName}
TAMAÑO: ${(videoData.fileSize / (1024 * 1024)).toFixed(2)} MB
FECHA DE MODIFICACIÓN: ${videoData.modifiedDate.toLocaleDateString()}

TRANSCRIPCIÓN COMPLETA DEL AUDIO:
${videoData.transcription}

PUNTOS CLAVE IDENTIFICADOS:
${videoData.highlights ? videoData.highlights.map(h => `- ${h.text}`).join('\n') : 'No se identificaron puntos clave específicos'}

ENTIDADES IMPORTANTES MENCIONADAS:
${videoData.entities ? videoData.entities.map(e => `- ${e.text} (${e.entity_type})`).join('\n') : 'No se identificaron entidades específicas'}

INSTRUCCIONES PARA LA IA:
Basándote en la transcripción real del archivo de video, genera preguntas de evaluación que evalúen la comprensión del contenido específico mencionado en el audio. Las preguntas deben ser relevantes para el material educativo real que se presenta en el video.
      `;
      
      return {
        title: videoData.fileName,
        content: enrichedContent,
        contentType: 'video',
        transcription: videoData.transcription,
        confidence: videoData.confidence,
        metadata: {
          fileSize: videoData.fileSize,
          modifiedDate: videoData.modifiedDate,
          highlights: videoData.highlights,
          entities: videoData.entities,
          sentiment: videoData.sentiment
        }
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analiza contenido de archivo (PDF, DOC, videos, etc.)
   */
  async analyzeFileContent(filePath) {
    try {
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      let content = `Archivo: ${fileName}`;
      let contentType = 'file';
      
      // Análisis específico para diferentes tipos de archivo
      if (fileExtension === '.pdf') {
        content += '\nTipo: Documento PDF';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo PDF, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un documento de este tipo.';
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        content += '\nTipo: Documento Word';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo Word, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un documento de este tipo.';
      } else if (['.mp4', '.avi', '.mov', '.wmv', '.mkv'].includes(fileExtension)) {
        content += '\nTipo: Archivo de video';
        contentType = 'video';
        
        // Obtener información básica del archivo
        try {
          const stats = fs.statSync(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          const modifiedDate = stats.mtime.toLocaleDateString();
          
          content += `\nTamaño: ${fileSizeMB} MB`;
          content += `\nFecha de modificación: ${modifiedDate}`;
          content += `\nExtensión: ${fileExtension.toUpperCase()}`;
        } catch (statsError) {
          }
        
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo de video y sus metadatos, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un video educativo de este tipo. Considera que es contenido audiovisual educativo.';
      } else {
        content += '\nTipo: Archivo desconocido';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo, genera preguntas de evaluación generales que podrían ser relevantes para el contenido educativo.';
      }
      
      return {
        title: fileName,
        content: content,
        contentType: contentType,
        fileExtension: fileExtension
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera preguntas automáticamente para un curso existente
   */
  async generateQuestionsForCourse(courseId) {
    try {
      // Obtener datos del curso
      const [courses] = await executeQuery(
        'SELECT * FROM courses WHERE id = ?',
        [courseId]
      );

      if (courses.length === 0) {
        throw new Error('Curso no encontrado');
      }

      const course = courses[0];
      let courseData;

      // Determinar el tipo de contenido y extraer información
      if (course.video_url && course.video_url.includes('youtube.com')) {
        courseData = await this.extractYouTubeTranscript(course.video_url);
      } else if (course.video_url) {
        courseData = await this.analyzeFileContent(course.video_url);
      } else {
        // Solo usar título y descripción
        courseData = {
          title: course.title,
          content: course.description,
          contentType: 'text'
        };
      }

      // Generar preguntas con IA
      const questions = await this.generateQuestions(courseData);
      
      // Guardar las preguntas en la base de datos
      await this.saveQuestionsToDatabase(courseId, questions);
      
      return questions;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guarda las preguntas generadas en la base de datos
   */
  async saveQuestionsToDatabase(courseId, questions) {
    try {
      // Eliminar preguntas existentes
      await executeQuery('DELETE FROM questions WHERE course_id = ?', [courseId]);
      
      // Insertar nuevas preguntas
      for (const question of questions) {
        await executeQuery(
          `INSERT INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            courseId,
            question.question,
            question.options[0],
            question.options[1],
            question.options[2],
            question.options[3],
            question.correctIndex
          ]
        );
      }
      
      } catch (error) {
      throw error;
    }
  }
}

module.exports = new AIService();
