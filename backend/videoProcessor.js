const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { AssemblyAI } = require('assemblyai');

// En CommonJS __dirname ya está disponible

class VideoProcessor {
  constructor() {
    // Configurar AssemblyAI (necesitarás tu API key)
    this.assemblyClient = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY || 'your_assemblyai_api_key'
    });
    
    // Directorio para videos temporales
    this.tempDir = path.join(__dirname, '../temp/videos');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Descarga video de YouTube y extrae audio
   */
  async downloadYouTubeVideo(videoUrl) {
    try {
      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
      const videoId = info.videoDetails.videoId;
      
      const outputPath = path.join(this.tempDir, `${videoId}_${Date.now()}.mp4`);
      const audioPath = path.join(this.tempDir, `${videoId}_${Date.now()}.mp3`);
      
      // Descargar video
      const videoStream = ytdl(videoUrl, { quality: 'highestaudio' });
      const writeStream = fs.createWriteStream(outputPath);
      
      await new Promise((resolve, reject) => {
        videoStream.pipe(writeStream);
        videoStream.on('end', resolve);
        videoStream.on('error', reject);
      });
      
      // Extraer audio usando ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(outputPath)
          .toFormat('mp3')
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .save(audioPath);
      });
      
      // Limpiar archivo de video (solo necesitamos el audio)
      fs.unlinkSync(outputPath);
      
      return {
        audioPath,
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        duration: info.videoDetails.lengthSeconds,
        category: info.videoDetails.category,
        viewCount: info.videoDetails.viewCount
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extrae audio de archivo MP4
   */
  async extractAudioFromMP4(videoPath) {
    try {
      console.log('🎬 Extrayendo audio de video:', videoPath);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(videoPath)) {
        throw new Error(`El archivo de video no existe: ${videoPath}`);
      }
      
      const fileName = path.basename(videoPath, path.extname(videoPath));
      const audioPath = path.join(this.tempDir, `${fileName}_${Date.now()}.mp3`);
      
      console.log('🎵 Archivo de audio temporal:', audioPath);
      
      await new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg(videoPath)
          .toFormat('mp3')
          .audioCodec('mp3')
          .audioBitrate(128)
          .on('start', (commandLine) => {
            console.log('🚀 FFmpeg iniciado:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('⏳ Progreso:', progress.percent + '%');
          })
          .on('end', () => {
            console.log('✅ Extracción de audio completada');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ Error en FFmpeg:', err.message);
            reject(new Error(`Error extrayendo audio: ${err.message}`));
          })
          .save(audioPath);
      });
      
      // Verificar que el archivo de audio se creó correctamente
      if (!fs.existsSync(audioPath)) {
        throw new Error('El archivo de audio no se creó correctamente');
      }
      
      const audioStats = fs.statSync(audioPath);
      console.log('📊 Audio extraído:', (audioStats.size / (1024 * 1024)).toFixed(2), 'MB');
      
      return audioPath;
      
    } catch (error) {
      console.error('❌ Error extrayendo audio:', error.message);
      throw error;
    }
  }

  /**
   * Transcribe audio usando AssemblyAI
   */
  async transcribeAudio(audioPath) {
    try {
      console.log('🎤 Iniciando transcripción de audio:', audioPath);
      console.log('📁 Tamaño del archivo:', (fs.statSync(audioPath).size / (1024 * 1024)).toFixed(2), 'MB');
      
      // Verificar que AssemblyAI esté configurado
      if (!this.assemblyClient) {
        throw new Error('AssemblyAI no está configurado. Verifica ASSEMBLYAI_API_KEY');
      }
      
      // Subir archivo a AssemblyAI
      console.log('⬆️ Subiendo archivo a AssemblyAI...');
      const uploadUrl = await this.assemblyClient.files.upload(audioPath);
      console.log('✅ Archivo subido exitosamente');
      
      // Crear transcripción
      console.log('📝 Creando transcripción...');
      const transcript = await this.assemblyClient.transcripts.create({
        audio_url: uploadUrl,
        language_code: 'es', // Español
        speaker_labels: true, // Identificar diferentes hablantes
        auto_highlights: true, // Resaltar puntos clave
        sentiment_analysis: true, // Análisis de sentimientos
        entity_detection: true // Detectar entidades importantes
      });
      
      console.log('🔄 Transcripción creada, ID:', transcript.id);
      console.log('⏳ Esperando procesamiento...');
      
      // Esperar a que termine el procesamiento
      let transcriptResult;
      let attempts = 0;
      const maxAttempts = 60; // 60 segundos máximo
      
      while (transcript.status !== 'completed' && attempts < maxAttempts) {
        if (transcript.status === 'error') {
          console.error('❌ Error en la transcripción:', transcript.error);
          throw new Error(`Error en la transcripción: ${transcript.error}`);
        }
        
        console.log(`⏳ Estado: ${transcript.status} (intento ${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        transcriptResult = await this.assemblyClient.transcripts.get(transcript.id);
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Timeout: La transcripción tardó demasiado en completarse');
      }
      
      console.log('✅ Transcripción completada');
      console.log('📊 Confianza:', transcriptResult.confidence);
      console.log('📝 Longitud del texto:', transcriptResult.text?.length || 0, 'caracteres');
      
      // Limpiar archivo temporal
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('🗑️ Archivo temporal eliminado');
      }
      
      return {
        text: transcriptResult.text || '',
        confidence: transcriptResult.confidence || 0,
        words: transcriptResult.words || [],
        highlights: transcriptResult.auto_highlights_result || [],
        entities: transcriptResult.entities || [],
        sentiment: transcriptResult.sentiment_analysis_results || []
      };
      
    } catch (error) {
      console.error('❌ Error en transcripción:', error.message);
      
      // Limpiar archivo en caso de error
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
          console.log('🗑️ Archivo temporal eliminado tras error');
        } catch (cleanupError) {
          console.warn('⚠️ Error limpiando archivo temporal:', cleanupError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Procesa video completo (descarga + transcripción)
   */
  async processYouTubeVideo(videoUrl) {
    try {
      // Paso 1: Descargar y extraer audio
      const videoData = await this.downloadYouTubeVideo(videoUrl);
      
      // Paso 2: Transcribir audio
      const transcription = await this.transcribeAudio(videoData.audioPath);
      
      return {
        ...videoData,
        transcription: transcription.text,
        confidence: transcription.confidence,
        highlights: transcription.highlights,
        entities: transcription.entities,
        sentiment: transcription.sentiment,
        words: transcription.words
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Procesa archivo MP4 completo (extracción + transcripción)
   */
  async processMP4Video(videoPath) {
    try {
      // Paso 1: Extraer audio
      const audioPath = await this.extractAudioFromMP4(videoPath);
      
      // Paso 2: Transcribir audio
      const transcription = await this.transcribeAudio(audioPath);
      
      // Obtener información del archivo
      const stats = fs.statSync(videoPath);
      
      return {
        fileName: path.basename(videoPath),
        fileSize: stats.size,
        modifiedDate: stats.mtime,
        transcription: transcription.text,
        confidence: transcription.confidence,
        highlights: transcription.highlights,
        entities: transcription.entities,
        sentiment: transcription.sentiment,
        words: transcription.words
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Limpia archivos temporales
   */
  cleanup() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Eliminar archivos más antiguos de 1 hora
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlinkSync(filePath);
          }
      });
    } catch (error) {
      }
  }
}

module.exports = new VideoProcessor();
