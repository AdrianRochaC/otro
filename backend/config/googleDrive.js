// Configuración de Google Drive para videos persistentes
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación con Google Drive
   */
  initializeAuth() {
    try {
      // Verificar si las variables de entorno están configuradas
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      
      if (!clientEmail || !privateKey) {
        console.warn('⚠️ Variables de Google Drive no configuradas - usando modo local');
        console.warn('💡 Para usar Google Drive, configura GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en Render.com');
        return;
      }

      // Configurar autenticación
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive autenticado correctamente');
    } catch (error) {
      console.error('❌ Error autenticando Google Drive:', error);
      console.warn('⚠️ Google Drive no disponible - usando almacenamiento local');
    }
  }

  /**
   * Subir video a Google Drive
   */
  async uploadVideo(file, courseId) {
    try {
      // Verificar si Google Drive está disponible
      if (!this.drive) {
        console.warn('⚠️ Google Drive no disponible - usando almacenamiento local');
        return this.fallbackToLocal(file, courseId);
      }

      console.log('☁️ === SUBIENDO VIDEO A GOOGLE DRIVE ===');
      console.log('📄 Archivo:', file.originalname);
      console.log('📊 Tamaño:', file.size, 'bytes');
      console.log('📁 Curso ID:', courseId);

      // Crear nombre único para el archivo
      const fileName = `course-${courseId}-${Date.now()}-${file.originalname}`;
      
      // Metadatos del archivo
      const fileMetadata = {
        name: fileName,
        parents: this.folderId ? [this.folderId] : undefined, // Carpeta específica si está configurada
        description: `Video del curso ${courseId} - Subido el ${new Date().toISOString()}`
      };

      // Configuración del archivo
      const media = {
        mimeType: file.mimetype,
        body: file.buffer
      };

      // Subir archivo
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,size'
      });

      const fileId = response.data.id;
      const webViewLink = response.data.webViewLink;
      const webContentLink = response.data.webContentLink;

      console.log('✅ Video subido exitosamente a Google Drive');
      console.log('🆔 File ID:', fileId);
      console.log('🌐 Web View Link:', webViewLink);
      console.log('🔗 Web Content Link:', webContentLink);

      // Hacer el archivo público
      await this.makeFilePublic(fileId);

      return {
        success: true,
        fileId: fileId,
        fileName: fileName,
        webViewLink: webViewLink,
        webContentLink: webContentLink,
        publicUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
        size: file.size,
        type: 'google-drive'
      };

    } catch (error) {
      console.error('❌ Error subiendo a Google Drive:', error);
      console.warn('⚠️ Fallback a almacenamiento local');
      return this.fallbackToLocal(file, courseId);
    }
  }

  /**
   * Fallback a almacenamiento local
   */
  async fallbackToLocal(file, courseId) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Crear directorio si no existe
      const uploadsDir = path.join(__dirname, '../../uploads/videos');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generar nombre único
      const fileName = `course-${courseId}-${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadsDir, fileName);

      // Guardar archivo
      fs.writeFileSync(filePath, file.buffer);

      console.log('📁 Video guardado localmente:', filePath);
      console.log('⚠️ ADVERTENCIA: Este video puede perderse si el servidor se reinicia');

      return {
        success: true,
        fileName: fileName,
        publicUrl: `/uploads/videos/${fileName}`,
        size: file.size,
        type: 'local',
        warning: 'Video guardado localmente - puede perderse en reinicios'
      };
    } catch (error) {
      console.error('❌ Error en fallback local:', error);
      throw error;
    }
  }

  /**
   * Hacer archivo público
   */
  async makeFilePublic(fileId) {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('✅ Archivo hecho público:', fileId);
    } catch (error) {
      console.error('❌ Error haciendo archivo público:', error);
    }
  }

  /**
   * Eliminar video de Google Drive
   */
  async deleteVideo(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      console.log('✅ Video eliminado de Google Drive:', fileId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando de Google Drive:', error);
      throw error;
    }
  }

  /**
   * Verificar si un archivo existe
   */
  async checkFileExists(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,webViewLink'
      });
      return { exists: true, file: response.data };
    } catch (error) {
      if (error.code === 404) {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * Listar videos en Google Drive
   */
  async listVideos() {
    try {
      const response = await this.drive.files.list({
        q: "mimeType contains 'video/'",
        fields: 'files(id,name,size,createdTime,webViewLink)',
        orderBy: 'createdTime desc'
      });

      return {
        success: true,
        videos: response.data.files
      };
    } catch (error) {
      console.error('❌ Error listando videos:', error);
      throw error;
    }
  }

  /**
   * Obtener URL pública de un archivo
   */
  getPublicUrl(fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
}

module.exports = new GoogleDriveService();
