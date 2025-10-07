const OpenAI = require('openai');
const { executeQuery } = require('./db-setup/connection-manager.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
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
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const { title, description, content, contentType } = courseData;
      
      // Verificar que tenemos contenido suficiente
      if (!content || content.trim().length < 50) {
        console.warn('⚠️ Contenido insuficiente para generar preguntas efectivas');
        // Generar preguntas básicas basadas en título y descripción
        return this.generateBasicQuestions(title, description, numQuestions);
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
      
      const questions = this.parseAIResponse(response);
      
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
      }
    ];

    // Agregar preguntas básicas hasta alcanzar el número solicitado
    for (let i = 0; i < Math.min(numQuestions, basicQuestions.length); i++) {
      questions.push(basicQuestions[i]);
    }

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
   * Extrae transcripción real de video de YouTube
   */
  async extractYouTubeTranscript(videoUrl) {
    try {
      console.log('🎬 === INICIANDO EXTRACCIÓN DE TRANSCRIPCIÓN DE YOUTUBE ===');
      console.log('📺 URL del video:', videoUrl);
      
      // Intentar múltiples métodos en orden de preferencia
      let videoData;
      let methodUsed = '';
      
      try {
        console.log('🔄 Intentando método de transcripción directa...');
        videoData = await videoProcessor.getYouTubeTranscript(videoUrl);
        methodUsed = 'transcripción directa';
        console.log('✅ Transcripción directa obtenida exitosamente');
      } catch (directError) {
        console.warn('⚠️ Transcripción directa falló:', directError.message);
        
        try {
          console.log('🔄 Intentando método yt-dlp (más robusto)...');
          videoData = await videoProcessor.downloadAndTranscribeWithYtDlp(videoUrl);
          methodUsed = 'yt-dlp + transcripción';
          console.log('✅ Transcripción con yt-dlp obtenida exitosamente');
        } catch (ytdlpError) {
          console.warn('⚠️ yt-dlp falló:', ytdlpError.message);
          console.log('🔄 Intentando método original (ytdl-core)...');
          
          // Último recurso: método original
          videoData = await videoProcessor.processYouTubeVideo(videoUrl);
          methodUsed = 'ytdl-core + transcripción';
          console.log('✅ Transcripción por método original obtenida exitosamente');
        }
      }
      
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
      
      console.log('📊 === DATOS OBTENIDOS ===');
      console.log('📋 Título:', videoData.title);
      console.log('📏 Longitud de transcripción:', videoData.transcription?.length || 0, 'caracteres');
      console.log('🎯 Confianza:', videoData.confidence);
      console.log('🔧 Método usado:', methodUsed);
      
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
      console.error('❌ === ERROR EN EXTRACCIÓN DE TRANSCRIPCIÓN ===');
      console.error('🔍 Error:', error.message);
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
