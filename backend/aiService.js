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
      
      // Usar GPT-4o-mini si está disponible (mejor que gpt-3.5-turbo y más barato que gpt-4)
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "Eres un experto en crear evaluaciones educativas de alta calidad. Tu especialidad es generar preguntas específicas, relevantes y desafiantes que evalúen la comprensión REAL del contenido proporcionado. Las preguntas deben basarse EXCLUSIVAMENTE en el contenido específico mencionado, no en conocimiento general. Eres preciso, detallado y siempre generas JSON válido en formato de array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5, // Reducido para mayor consistencia y precisión
        max_tokens: 3000 // Aumentado para permitir preguntas más detalladas
      });

      let response = completion.choices[0].message.content;
      console.log('📝 Respuesta de OpenAI recibida:', response.length, 'caracteres');
      console.log('📋 Primeros 300 chars de la respuesta:', response.substring(0, 300));
      
      // Si la respuesta está en formato JSON object, convertir a array
      try {
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
          response = JSON.stringify(jsonResponse.questions);
        } else if (jsonResponse.questions) {
          // Si está anidado de otra forma
          response = JSON.stringify(Array.isArray(jsonResponse.questions) ? jsonResponse.questions : [jsonResponse.questions]);
        }
      } catch (e) {
        // Si no es JSON object, continuar con el parsing normal
      }
      
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
      // Extraer información estructurada del contenido
      const transcriptMatch = content.match(/TRANSCRIPCIÓN DEL CONTENIDO REAL:\s*([\s\S]*?)(?:\n\n|$)/);
      const transcript = transcriptMatch ? transcriptMatch[1].trim() : '';
      const hasTranscript = transcript && transcript.length > 50 && !transcript.includes('No se pudo obtener');
      
      if (hasTranscript) {
        // Procesar transcripción para extraer conceptos clave
        const concepts = this.extractKeyConcepts(transcript);
        const sections = this.divideIntoSections(transcript);
        
        contentContext = `CONTENIDO COMPLETO DEL VIDEO DE YOUTUBE:
${content}

ANÁLISIS DEL CONTENIDO:
- Transcripción disponible: SÍ (${transcript.length} caracteres)
- Conceptos clave identificados: ${concepts.length > 0 ? concepts.slice(0, 10).join(', ') : 'Analizar transcripción'}
- Secciones principales: ${sections.length} secciones identificadas
${sections.length > 0 ? sections.map((s, i) => `  ${i + 1}. ${s.title}: ${s.summary.substring(0, 100)}...`).join('\n') : ''}`;
        
        specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA VIDEO DE YOUTUBE CON TRANSCRIPCIÓN REAL:
- CRÍTICO: Las preguntas DEBEN basarse EXCLUSIVAMENTE en el contenido real mencionado en la transcripción
- Analiza la transcripción completa para identificar:
  * Conceptos específicos explicados en el video
  * Ejemplos concretos mencionados por el instructor
  * Pasos o procedimientos descritos
  * Definiciones o explicaciones dadas
  * Conclusiones o resúmenes presentados
- Genera preguntas que evalúen la comprensión de:
  * Conceptos específicos mencionados en la transcripción (NO genéricos)
  * Detalles concretos explicados en el video
  * Ejemplos reales presentados
  * Relaciones entre conceptos explicados
  * Aplicaciones prácticas mencionadas
- Las preguntas deben ser ESPECÍFICAS al contenido del video, no preguntas genéricas sobre el tema
- Si el video menciona números, fechas, nombres, o datos específicos, inclúyelos en las preguntas
- Evita preguntas que puedan responderse sin haber visto el video
- Prioriza preguntas que requieran haber escuchado y comprendido el contenido específico`;
      } else {
        contentContext = `CONTENIDO DEL VIDEO DE YOUTUBE:
${content}

NOTA: No se pudo obtener la transcripción completa del video.`;
        
        specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA VIDEO DE YOUTUBE (SIN TRANSCRIPCIÓN):
- Analiza el título, descripción y metadatos disponibles
- Genera preguntas que evalúen la comprensión de los conceptos principales sugeridos
- Considera la categoría del video para ajustar el nivel de dificultad
- Las preguntas deben ser relevantes para el contenido educativo sugerido por el título y descripción`;
      }
    } else if (contentType === 'video') {
      // Procesar transcripción de archivo de video
      const transcriptMatch = content.match(/TRANSCRIPCIÓN COMPLETA DEL AUDIO:\s*([\s\S]*?)(?:\n\n|$)/);
      const transcript = transcriptMatch ? transcriptMatch[1].trim() : '';
      const concepts = transcript ? this.extractKeyConcepts(transcript) : [];
      const sections = transcript ? this.divideIntoSections(transcript) : [];
      
      contentContext = `CONTENIDO REAL DEL ARCHIVO DE VIDEO (TRANSCRIPCIÓN COMPLETA):
${content}

ANÁLISIS DEL CONTENIDO:
- Transcripción disponible: ${transcript ? 'SÍ' : 'NO'} (${transcript ? transcript.length : 0} caracteres)
- Conceptos clave identificados: ${concepts.length > 0 ? concepts.slice(0, 10).join(', ') : 'Analizar transcripción'}
- Secciones principales: ${sections.length} secciones`;
      
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA ARCHIVO DE VIDEO CON TRANSCRIPCIÓN:
- CRÍTICO: Las preguntas DEBEN basarse EXCLUSIVAMENTE en el contenido real de la transcripción
- Analiza la transcripción completa línea por línea para identificar:
  * Conceptos específicos explicados
  * Ejemplos concretos mencionados
  * Pasos o procedimientos detallados
  * Definiciones exactas dadas
  * Conclusiones específicas presentadas
- Genera preguntas que evalúen:
  * Comprensión de conceptos específicos mencionados (NO genéricos)
  * Detalles concretos explicados en el video
  * Ejemplos reales presentados
  * Secuencias o procesos descritos
  * Aplicaciones prácticas mencionadas
- Las preguntas deben ser ESPECÍFICAS al contenido real del video
- Incluye datos específicos mencionados (números, nombres, fechas, etc.)
- Evita preguntas genéricas que no requieran haber visto el video
- Prioriza preguntas que demuestren comprensión del contenido específico`;
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
Eres un experto en crear evaluaciones educativas de alta calidad. Tu tarea es generar ${numQuestions} preguntas de evaluación que evalúen la comprensión REAL del contenido presentado.

TÍTULO DEL CURSO: ${title}
DESCRIPCIÓN DEL CURSO: ${description}

${contentContext}

${specificInstructions}

REQUISITOS GENERALES PARA LAS PREGUNTAS:
1. ESPECIFICIDAD: Las preguntas deben ser específicas al contenido real presentado, no genéricas
2. RELEVANCIA: Cada pregunta debe evaluar comprensión de conceptos, ejemplos o información realmente mencionada
3. DIFICULTAD: Varía el nivel de dificultad (algunas básicas, algunas que requieran análisis)
4. COBERTURA: Cubre diferentes aspectos del contenido (conceptos, ejemplos, aplicaciones, conclusiones)
5. CLARIDAD: Usa lenguaje claro, preciso y profesional
6. OPCIONES: Las opciones incorrectas deben ser plausibles pero claramente incorrectas
7. VALIDACIÓ: Las preguntas deben poder responderse correctamente solo con el contenido proporcionado

ESTRUCTURA DE LAS PREGUNTAS:
- Preguntas de comprensión (30%): ¿Qué se explicó sobre X?
- Preguntas de aplicación (30%): ¿Cómo se aplica X en Y?
- Preguntas de análisis (25%): ¿Por qué X es importante según el video?
- Preguntas de síntesis (15%): ¿Qué conclusión se puede extraer sobre X?

FORMATO DE RESPUESTA (JSON estricto):
[
  {
    "question": "Pregunta específica basada en el contenido real",
    "options": ["Opción A (correcta)", "Opción B (plausible pero incorrecta)", "Opción C (plausible pero incorrecta)", "Opción D (plausible pero incorrecta)"],
    "correctIndex": 0,
    "explanation": "Explicación breve y clara de por qué esta es la respuesta correcta, mencionando el contenido específico del video"
  }
]

IMPORTANTE: 
- Solo responde con el JSON válido, sin texto adicional antes o después
- Asegúrate de que el JSON sea válido y parseable
- correctIndex debe ser un número entre 0 y 3
- Todas las preguntas deben tener exactamente 4 opciones
- Las preguntas deben ser específicas al contenido proporcionado, no genéricas
`;
  }

  /**
   * Extrae conceptos clave de una transcripción
   */
  extractKeyConcepts(transcript) {
    if (!transcript || transcript.length < 50) return [];
    
    // Dividir en oraciones
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Palabras clave comunes en contenido educativo
    const educationalKeywords = [
      'definición', 'concepto', 'ejemplo', 'proceso', 'método', 'técnica',
      'característica', 'función', 'importante', 'necesario', 'debe', 'debería',
      'paso', 'procedimiento', 'aplicación', 'uso', 'utilidad', 'beneficio'
    ];
    
    // Extraer frases que contengan palabras clave
    const concepts = [];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      educationalKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          // Extraer la frase relevante (10-50 palabras alrededor de la palabra clave)
          const words = sentence.split(/\s+/);
          const keywordIndex = words.findIndex(w => w.toLowerCase().includes(keyword));
          if (keywordIndex >= 0) {
            const start = Math.max(0, keywordIndex - 5);
            const end = Math.min(words.length, keywordIndex + 15);
            const phrase = words.slice(start, end).join(' ').trim();
            if (phrase.length > 20 && phrase.length < 200) {
              concepts.push(phrase);
            }
          }
        }
      });
    });
    
    // Eliminar duplicados y limitar
    return [...new Set(concepts)].slice(0, 20);
  }

  /**
   * Divide una transcripción en secciones lógicas
   */
  divideIntoSections(transcript) {
    if (!transcript || transcript.length < 100) return [];
    
    // Dividir por párrafos o cambios de tema
    const paragraphs = transcript.split(/\n\n+/).filter(p => p.trim().length > 50);
    
    // Si hay pocos párrafos, dividir por oraciones largas
    if (paragraphs.length < 3) {
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 50);
      const chunkSize = Math.ceil(sentences.length / 5);
      const sections = [];
      
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const chunk = sentences.slice(i, i + chunkSize).join('. ');
        if (chunk.length > 100) {
          sections.push({
            title: `Sección ${Math.floor(i / chunkSize) + 1}`,
            summary: chunk.substring(0, 200) + '...',
            content: chunk
          });
        }
      }
      
      return sections;
    }
    
    // Procesar párrafos como secciones
    return paragraphs.slice(0, 10).map((para, index) => {
      const firstSentence = para.split(/[.!?]/)[0].trim();
      const title = firstSentence.length > 60 
        ? firstSentence.substring(0, 60) + '...' 
        : firstSentence || `Sección ${index + 1}`;
      
      return {
        title: title,
        summary: para.substring(0, 200) + (para.length > 200 ? '...' : ''),
        content: para
      };
    });
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
      
      // PRIMERO: Intentar obtener transcripción directa
      let transcriptText = '';
      let confidence = 0.3;
      let videoTitle = 'Video de YouTube';
      let videoDescription = '';
      
      try {
        const videoId = this.extractVideoId(videoUrl);
        console.log('🆔 Video ID extraído:', videoId);
        
        if (videoId) {
          console.log('🎤 Intentando obtener transcripción directa...');
          try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
              lang: 'es',
              country: 'ES'
            });
            
            if (transcript && transcript.length > 0) {
              transcriptText = transcript.map(item => item.text).join(' ');
              confidence = 0.9;
              console.log('✅ Transcripción obtenida:', transcriptText.length, 'caracteres');
              console.log('📝 Primeros 300 chars:', transcriptText.substring(0, 300));
            } else {
              console.log('⚠️ Transcripción vacía, intentando sin idioma específico...');
              const transcriptDefault = await YoutubeTranscript.fetchTranscript(videoId);
              if (transcriptDefault && transcriptDefault.length > 0) {
                transcriptText = transcriptDefault.map(item => item.text).join(' ');
                confidence = 0.8;
                console.log('✅ Transcripción obtenida (idioma por defecto):', transcriptText.length, 'caracteres');
              }
            }
          } catch (transcriptError) {
            console.log('❌ Error con youtube-transcript:', transcriptError.message);
          }
        }
      } catch (transcriptError) {
        console.log('❌ Error general obteniendo transcripción:', transcriptError.message);
      }
      
      // SEGUNDO: Si no hay transcripción, intentar descargar audio y transcribir
      if (!transcriptText) {
        console.log('🔄 No se obtuvo transcripción directa, intentando descargar audio...');
        try {
          // Usar el método existente de videoProcessor para descargar y transcribir
          const videoData = await videoProcessor.processYouTubeVideo(videoUrl);
          if (videoData && videoData.transcription) {
            transcriptText = videoData.transcription;
            confidence = 0.95; // Muy alta confianza para transcripción real
            console.log('✅ Transcripción real obtenida descargando audio:', transcriptText.length, 'caracteres');
            console.log('📝 Primeros 300 chars:', transcriptText.substring(0, 300));
          }
        } catch (downloadError) {
          console.log('❌ Error descargando audio:', downloadError.message);
        }
      }
      
      // TERCERO: Intentar obtener información básica con ytdl-core
      try {
        console.log('🔄 Intentando obtener información básica...');
        const info = await ytdl.getInfo(videoUrl);
        videoTitle = info.videoDetails.title;
        videoDescription = info.videoDetails.description || '';
        console.log('✅ Información básica obtenida:');
        console.log('  - Título:', videoTitle);
        console.log('  - Duración:', info.videoDetails.lengthSeconds, 'segundos');
        console.log('  - Descripción:', videoDescription.substring(0, 200));
      } catch (ytdlError) {
        console.log('❌ Error con ytdl-core:', ytdlError.message);
        // Usar información básica con el ID del video
        const videoId = this.extractVideoId(videoUrl);
        if (videoId) {
          videoTitle = `Video de YouTube (ID: ${videoId})`;
          videoDescription = 'Información no disponible debido a restricciones de YouTube';
        }
      }
      
      // Crear contenido enriquecido con mejor estructura
      const hasTranscript = transcriptText && transcriptText.length > 50 && !transcriptText.includes('No se pudo obtener');
      
      let enrichedContent = `
TÍTULO DEL VIDEO: ${videoTitle}
DESCRIPCIÓN DEL VIDEO:
${videoDescription || 'No disponible'}

`;

      if (hasTranscript) {
        // Procesar transcripción para mejor análisis
        const concepts = this.extractKeyConcepts(transcriptText);
        const sections = this.divideIntoSections(transcriptText);
        
        enrichedContent += `
TRANSCRIPCIÓN COMPLETA DEL CONTENIDO REAL DEL VIDEO:
${transcriptText}

INFORMACIÓN ESTRUCTURADA:
- Longitud de transcripción: ${transcriptText.length} caracteres
- Conceptos clave identificados: ${concepts.length > 0 ? concepts.slice(0, 15).join(', ') : 'Analizar transcripción'}
${sections.length > 0 ? `- Secciones principales del video:\n${sections.map((s, i) => `  ${i + 1}. ${s.title}`).join('\n')}` : ''}

INSTRUCCIONES CRÍTICAS PARA LA IA:
- La transcripción contiene el contenido REAL y COMPLETO del video
- DEBES generar preguntas basadas EXCLUSIVAMENTE en lo que se menciona en esta transcripción
- Las preguntas deben ser ESPECÍFICAS al contenido real, no genéricas sobre el tema
- Incluye preguntas sobre conceptos, ejemplos, pasos, definiciones y conclusiones MENCIONADOS en la transcripción
- Evita preguntas que puedan responderse sin haber visto/escuchado el video
`;
      } else {
        enrichedContent += `
TRANSCRIPCIÓN DEL CONTENIDO: No se pudo obtener transcripción completa del video

INSTRUCCIONES PARA LA IA:
- Debido a limitaciones de acceso, genera preguntas de evaluación generales sobre el tema educativo
- Basa las preguntas en el título y descripción del video
- Las preguntas deben ser apropiadas para un curso educativo y evaluar conocimientos básicos del tema
- Indica en las preguntas que se basan en el tema general, no en contenido específico del video
`;
      }
      
      console.log('📊 === RESUMEN DE INFORMACIÓN OBTENIDA ===');
      console.log('📏 Longitud total del contenido:', enrichedContent.length, 'caracteres');
      console.log('📝 Longitud de transcripción:', transcriptText.length, 'caracteres');
      console.log('🎯 Confianza:', confidence);
      console.log('📋 Contenido final (primeros 500 chars):', enrichedContent.substring(0, 500));
      
      return {
        title: videoTitle,
        content: enrichedContent,
        contentType: 'youtube',
        duration: 0,
        transcription: transcriptText,
        confidence: confidence,
        metadata: {
          description: videoDescription,
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
