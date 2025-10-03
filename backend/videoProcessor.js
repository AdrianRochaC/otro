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
      const fileName = path.basename(videoPath, path.extname(videoPath));
      const audioPath = path.join(this.tempDir, `${fileName}_${Date.now()}.mp3`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .toFormat('mp3')
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .save(audioPath);
      });
      
      return audioPath;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transcribe audio usando AssemblyAI
   */
  async transcribeAudio(audioPath) {
    try {
      // Subir archivo a AssemblyAI
      const uploadUrl = await this.assemblyClient.files.upload(audioPath);
      
      // Crear transcripción
      const transcript = await this.assemblyClient.transcripts.create({
        audio_url: uploadUrl,
        language_code: 'es', // Español
        speaker_labels: true, // Identificar diferentes hablantes
        auto_highlights: true, // Resaltar puntos clave
        sentiment_analysis: true, // Análisis de sentimientos
        entity_detection: true // Detectar entidades importantes
      });
      
      // Esperar a que termine el procesamiento
      let transcriptResult;
      while (transcript.status !== 'completed') {
        if (transcript.status === 'error') {
          throw new Error('Error en la transcripción');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        transcriptResult = await this.assemblyClient.transcripts.get(transcript.id);
      }
      
      // Limpiar archivo temporal
      fs.unlinkSync(audioPath);
      
      return {
        text: transcriptResult.text,
        confidence: transcriptResult.confidence,
        words: transcriptResult.words,
        highlights: transcriptResult.auto_highlights_result,
        entities: transcriptResult.entities,
        sentiment: transcriptResult.sentiment_analysis_results
      };
      
    } catch (error) {
      // Limpiar archivo en caso de error
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
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
      console.log('🎬 Iniciando procesamiento de video:', videoPath);
      console.log('📁 Archivo existe:', require('fs').existsSync(videoPath));
      
      // Paso 1: Extraer audio
      console.log('🔊 Extrayendo audio...');
      const audioPath = await this.extractAudioFromMP4(videoPath);
      console.log('✅ Audio extraído:', audioPath);
      
      // Paso 2: Transcribir audio
      console.log('📝 Transcribiendo audio...');
      const transcription = await this.transcribeAudio(audioPath);
      console.log('✅ Transcripción completada');
      
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
