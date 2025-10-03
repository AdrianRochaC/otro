// server.js - Backend con Login, Registro y Gestión de Usuarios
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();
// Agregar importación de los endpoints de preferencias
const {
  updateBackgroundImage,
  getBackgroundImage
} = require('./userPreferences.js');

// Importar funciones corregidas de métricas de cargos
const { getCargoMetrics } = require('./cargosMetrics.js');

// Importar servicio de reportes Excel
const excelReportService = require('./excelReportService.js');

// Importar servicio de video y OpenAI
const videoProcessor = require('./videoProcessor.js');
const aiService = require('./aiService.js');
const OpenAI = require('openai');

// Importar configuraciones centralizadas PRIMERO
const { dbConfig, createConnection, testConnection } = require('./config/database.js');
const appConfig = require('./config/app.js');

const app = express();
const PORT = appConfig.server.port;
const JWT_SECRET = appConfig.jwt.secret;

// En CommonJS __dirname ya está disponible

// Configuración de OpenAI para el chatbot
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'OPENAI_API_KEY'
});

// Middleware para verificar JWT (compatible con versiones antiguas)
function verifyToken(req, res, next) {
  var authHeader = req.headers.authorization;
  var token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    var decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
}

// Middleware CORS configurado para desarrollo y producción (compatible con versiones antiguas)
var corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS: Origen solicitado:', origin);
    
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) {
      console.log('CORS: Permitiendo request sin origin');
      return callback(null, true);
    }
    
    // Permitir localhost para desarrollo
    if (origin.indexOf('localhost') !== -1 || origin.indexOf('127.0.0.1') !== -1) {
      console.log('CORS: Permitiendo localhost');
      return callback(null, true);
    }
    
    // Permitir cualquier dominio de Render
    if (origin.indexOf('onrender.com') !== -1) {
      console.log('CORS: Permitiendo dominio de Render:', origin);
      return callback(null, true);
    }
    
    // Permitir farmeoa.com
    if (origin.indexOf('farmeoa.com') !== -1) {
      console.log('CORS: Permitiendo farmeoa.com');
      return callback(null, true);
    }
    
    // Para desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS: Modo desarrollo - permitiendo cualquier origen');
      return callback(null, true);
    }
    
    // En producción, permitir solo orígenes específicos
    var allowedOrigins = appConfig.cors.allowedOrigins;
    
    // Verificar si el origen está en la lista exacta
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origen permitido (lista exacta):', origin);
      return callback(null, true);
    }
    
    // Verificar patrones con wildcard
    for (var i = 0; i < allowedOrigins.length; i++) {
      var allowedOrigin = allowedOrigins[i];
      if (allowedOrigin.includes('*')) {
        var pattern = allowedOrigin.replace(/\*/g, '.*');
        var regex = new RegExp('^' + pattern + '$');
        if (regex.test(origin)) {
          console.log('CORS: Origen permitido (patrón):', origin);
          return callback(null, true);
        }
      }
    }
    
    console.log('CORS: Origen no permitido:', origin);
    console.log('CORS: Orígenes permitidos:', allowedOrigins);
    callback(new Error('No permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log('=== PETICIÓN RECIBIDA ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Authorization:', req.headers.authorization ? 'Presente' : 'Ausente');
  next();
});

// Middleware adicional para CORS (backup)
app.use((req, res, next) => {
  console.log('=== MIDDLEWARE CORS BACKUP ===');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  
  const origin = req.headers.origin;
  
  // Permitir cualquier dominio de Render
  if (origin && origin.includes('onrender.com')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('CORS BACKUP: Permitiendo dominio de Render:', origin);
  }
  // Permitir localhost para desarrollo
  else if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('CORS BACKUP: Permitiendo localhost:', origin);
  }
  // Permitir requests sin origin
  else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    console.log('CORS BACKUP: Permitiendo request sin origin');
  }
  
  // Manejar peticiones OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('CORS BACKUP: Respondiendo a OPTIONS');
    return res.sendStatus(200);
  }
  
  next();
});

// Configurar límites de payload más grandes para imágenes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Directorios de uploads dentro de backend
const videosDir = path.join(__dirname, 'uploads', 'videos');
const documentsDir = path.join(__dirname, 'uploads', 'documents');

// Crear carpetas si no existen
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Servir las carpetas como archivos estáticos (públicas)
app.use('/uploads/videos', express.static(videosDir));

// RUTA: Verificar si un archivo de video existe
app.get('/api/check-video/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = path.join(videosDir, filename);
    
    console.log('🔍 Verificando archivo de video:', {
      filename,
      videoPath,
      exists: fs.existsSync(videoPath)
    });
    
    if (fs.existsSync(videoPath)) {
      const stats = fs.statSync(videoPath);
      res.json({
        success: true,
        exists: true,
        size: stats.size,
        modified: stats.mtime
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Archivo no encontrado'
      });
    }
  } catch (error) {
    console.error('Error verificando archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando archivo'
    });
  }
});

// Configuración de almacenamiento para videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir); // Carpeta donde se guardarán los videos
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage: storage });

// Configuración de Multer para imágenes de fondo (en memoria para guardar en DB)
const backgroundImageUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Permitir solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Configuración de Multer para análisis de video con IA (en memoria)
const videoAnalysisUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB máximo para videos
  },
  fileFilter: function (req, file, cb) {
    // Permitir solo videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  }
});

// Configuración de Multer para documentos
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const documentUpload = multer({
  storage: documentStorage,
  fileFilter: function (req, file, cb) {
    // Permitir solo PDF, Word, Excel
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB máximo
});

// Servir documentos como archivos estáticos
app.use('/uploads/documents', express.static(documentsDir));

// Endpoint para subir documento (con asignación múltiple)
app.post('/api/documents', verifyToken, documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
    }
    const { is_global, roles, users } = req.body;
    const connection = await createConnection();
    // Insertar documento
    const [result] = await connection.execute(
      `INSERT INTO documents (name, filename, mimetype, size, user_id, is_global) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.user.id, is_global === 'true' || is_global === true]
    );
    const documentId = result.insertId;
    // Insertar targets (roles)
    if (roles) {
      const rolesArr = Array.isArray(roles) ? roles : JSON.parse(roles);
      for (const role of rolesArr) {
        await connection.execute(
          `INSERT INTO document_targets (document_id, target_type, target_value) VALUES (?, 'role', ?)`,
          [documentId, role]
        );
      }
    }
    // Insertar targets (usuarios)
    if (users) {
      const usersArr = Array.isArray(users) ? users : JSON.parse(users);
      for (const userId of usersArr) {
        await connection.execute(
          `INSERT INTO document_targets (document_id, target_type, target_value) VALUES (?, 'user', ?)`,
          [documentId, String(userId)]
        );
      }
    }
    await connection.end();
    res.json({ success: true, message: 'Documento subido exitosamente.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Endpoint para listar documentos según permisos
app.get('/api/documents', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    // Obtener rol y user_id
    const [userRows] = await connection.execute('SELECT id, rol FROM usuarios WHERE id = ?', [req.user.id]);
    if (userRows.length === 0) return res.json({ success: true, documents: [] });
    const userId = String(userRows[0].id);
    const userRole = userRows[0].rol;
    // Si es Admin, mostrar todos los documentos
    if (userRole === 'Admin') {
      const [allDocs] = await connection.execute('SELECT * FROM documents ORDER BY created_at DESC');
      await connection.end();
      return res.json({ success: true, documents: allDocs });
    }
    // Documentos globales
    const [globalDocs] = await connection.execute(
      'SELECT * FROM documents WHERE is_global = 1 ORDER BY created_at DESC'
    );
    // Documentos por rol
    const [roleDocs] = await connection.execute(
      `SELECT d.* FROM documents d
       JOIN document_targets t ON d.id = t.document_id
       WHERE t.target_type = 'role' AND t.target_value = ?
       ORDER BY d.created_at DESC`,
      [userRole]
    );
    // Documentos por usuario
    const [userDocs] = await connection.execute(
      `SELECT d.* FROM documents d
       JOIN document_targets t ON d.id = t.document_id
       WHERE t.target_type = 'user' AND t.target_value = ?
       ORDER BY d.created_at DESC`,
      [userId]
    );
    // Unir y eliminar duplicados
    const allDocs = [...globalDocs, ...roleDocs, ...userDocs];
    const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());
    await connection.end();
    res.json({ success: true, documents: uniqueDocs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Endpoint para obtener destinatarios de un documento
app.get('/api/documents/:id/targets', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    const docId = req.params.id;
    const [targets] = await connection.execute(
      'SELECT target_type, target_value FROM document_targets WHERE document_id = ?',
      [docId]
    );
    const roles = targets.filter(t => t.target_type === 'role').map(t => t.target_value);
    const users = targets.filter(t => t.target_type === 'user').map(t => t.target_value);
    await connection.end();
    res.json({ success: true, roles, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Endpoint para actualizar un documento
app.put('/api/documents/:id', verifyToken, documentUpload.single('document'), async (req, res) => {
  try {
    const docId = req.params.id;
    const { name, is_global, roles } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre del documento es requerido' });
    }

    const connection = await createConnection();
    
    // Verificar que el documento existe
    const [existingDoc] = await connection.execute(
      'SELECT * FROM documents WHERE id = ?',
      [docId]
    );
    
    if (existingDoc.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    // Actualizar el documento
    let updateQuery = 'UPDATE documents SET name = ?';
    let updateParams = [name];
    
    if (req.file) {
      updateQuery += ', filename = ?, mimetype = ?, size = ?';
      updateParams.push(req.file.filename, req.file.mimetype, req.file.size);
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(docId);
    
    await connection.execute(updateQuery, updateParams);
    
    // Actualizar targets
    await connection.execute('DELETE FROM document_targets WHERE document_id = ?', [docId]);
    
    if (is_global === 'true') {
      await connection.execute(
        'INSERT INTO document_targets (document_id, target_type, target_value) VALUES (?, ?, ?)',
        [docId, 'global', 'all']
      );
    } else {
      const rolesArray = JSON.parse(roles || '[]');
      for (const role of rolesArray) {
        await connection.execute(
          'INSERT INTO document_targets (document_id, target_type, target_value) VALUES (?, ?, ?)',
          [docId, 'role', role]
        );
      }
    }
    
    await connection.end();
    res.json({ success: true, message: 'Documento actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando documento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar un documento
app.delete('/api/documents/:id', verifyToken, async (req, res) => {
  try {
    const docId = req.params.id;
    const connection = await createConnection();
    
    // Verificar que el documento existe
    const [existingDoc] = await connection.execute(
      'SELECT * FROM documents WHERE id = ?',
      [docId]
    );
    
    if (existingDoc.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    // Eliminar targets primero (por las foreign keys)
    await connection.execute('DELETE FROM document_targets WHERE document_id = ?', [docId]);
    
    // Eliminar el documento
    await connection.execute('DELETE FROM documents WHERE id = ?', [docId]);
    
    await connection.end();
    res.json({ success: true, message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


// === RUTAS DE PREFERENCIAS DE USUARIO ===
// Obtener preferencias del usuario
app.get('/api/user-preferences', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_image IS NOT NULL AS has_background_image, background_color FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    await connection.end();

    if (rows.length === 0) {
      // Si no hay preferencias, crear las por defecto
      const defaultPreferences = {
        theme: 'dark',
        color_scheme: 'default',
        font_size: 'medium',
        font_family: 'inter',
        spacing: 'normal',
        animations: 'enabled',
        background_type: 'color',
        has_background_image: false,
        background_color: 'default'
      };

      // Crear preferencias por defecto
      const insertConnection = await createConnection();
      await insertConnection.execute(
        `INSERT INTO user_preferences (user_id, theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, defaultPreferences.theme, defaultPreferences.color_scheme, defaultPreferences.font_size, 
         defaultPreferences.font_family, defaultPreferences.spacing, defaultPreferences.animations, 
         defaultPreferences.background_type, defaultPreferences.background_color]
      );
      await insertConnection.end();

      return res.json({ success: true, preferences: defaultPreferences });
    }

    res.json({ success: true, preferences: rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar preferencias del usuario
app.put('/api/user-preferences', verifyToken, async (req, res) => {
  try {
    const { 
      theme, 
      color_scheme, 
      font_size, 
      font_family, 
      spacing, 
      animations, 
      background_type, 
      background_color 
    } = req.body;
    
    const connection = await createConnection();
    
    // Verificar si el usuario ya tiene preferencias
    const [existing] = await connection.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      // Si se selecciona color sólido, limpiar la imagen de fondo
      if (background_type === 'color') {
        await connection.execute(
          `UPDATE user_preferences 
           SET theme = ?, color_scheme = ?, font_size = ?, font_family = ?, spacing = ?, animations = ?,
               background_type = ?, background_color = ?, background_image = NULL
           WHERE user_id = ?`,
          [theme, color_scheme, font_size, font_family, spacing, animations, 
           background_type, background_color, req.user.id]
        );
      } else {
        // Mantener la imagen existente si no se especifica lo contrario
        await connection.execute(
          `UPDATE user_preferences 
           SET theme = ?, color_scheme = ?, font_size = ?, font_family = ?, spacing = ?, animations = ?,
               background_type = ?, background_color = ?
           WHERE user_id = ?`,
          [theme, color_scheme, font_size, font_family, spacing, animations, 
           background_type, background_color, req.user.id]
        );
      }
    } else {
      // Crear nuevas preferencias
      await connection.execute(
        `INSERT INTO user_preferences (user_id, theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, theme, color_scheme, font_size, font_family, spacing, animations, 
         background_type, background_color]
      );
    }

    await connection.end();

    res.json({ 
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      preferences: { 
        theme, 
        color_scheme, 
        font_size, 
        font_family, 
        spacing, 
        animations, 
        background_type, 
        background_color 
      }
    });

  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para subir imagen de fondo
app.put('/api/user-preferences/background-image', verifyToken, backgroundImageUpload.single('background_image'), async (req, res) => {
  try {
    console.log('Intentando subir imagen de fondo para usuario:', req.user.id);
    
    if (!req.file) {
      console.log('No se recibió archivo');
      return res.status(400).json({ success: false, message: 'No se envió ninguna imagen.' });
    }

    console.log('Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const connection = await createConnection();
    
    // Verificar si el usuario ya tiene preferencias
    const [existing] = await connection.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      // Actualizar preferencias existentes
      console.log('Actualizando preferencias existentes');
      await connection.execute(
        'UPDATE user_preferences SET background_image = ?, background_type = ? WHERE user_id = ?',
        [req.file.buffer, 'image', req.user.id]
      );
    } else {
      // Crear nuevas preferencias con imagen de fondo
      console.log('Creando nuevas preferencias con imagen');
      await connection.execute(
        `INSERT INTO user_preferences (user_id, theme, color_scheme, font_size, font_family, spacing, animations, background_type, background_image, background_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, 'dark', 'default', 'medium', 'inter', 'normal', 'enabled', 'image', req.file.buffer, 'default']
      );
    }
    
    await connection.end();
    console.log('Imagen de fondo actualizada exitosamente');
    res.json({ success: true, message: 'Imagen de fondo actualizada exitosamente' });
  } catch (error) {
    console.error('Error al subir imagen de fondo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Endpoint para obtener imagen de fondo
app.get('/api/user-preferences/background-image', verifyToken, async (req, res) => {
  console.log('=== ENDPOINT BACKGROUND-IMAGE LLAMADO ===');
  console.log('Usuario:', req.user);
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT background_image FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );
    await connection.end();
    
    if (rows.length === 0 || !rows[0].background_image) {
      return res.status(404).json({ success: false, message: 'No hay imagen de fondo' });
    }
    
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].background_image);
  } catch (error) {
    console.error('Error al obtener imagen de fondo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar imagen de fondo
app.delete('/api/user-preferences/background-image', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    
    await connection.execute(
      'UPDATE user_preferences SET background_image = NULL, background_type = ? WHERE user_id = ?',
      ['color', req.user.id]
    );
    
    await connection.end();
    res.json({ success: true, message: 'Imagen de fondo eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen de fondo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Resetear preferencias a valores por defecto
app.post('/api/user-preferences/reset', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    
    await connection.execute(
      `UPDATE user_preferences 
       SET theme = 'dark', color_scheme = 'default', font_size = 'medium', 
           font_family = 'inter', spacing = 'normal', animations = 'enabled',
           background_type = 'color', background_image = NULL, background_color = 'default'
       WHERE user_id = ?`,
      [req.user.id]
    );

    await connection.end();

    res.json({ 
      success: true,
      message: 'Preferencias reseteadas a valores por defecto',
      preferences: {
        theme: 'dark',
        color_scheme: 'default',
        font_size: 'medium',
        font_family: 'inter',
        spacing: 'normal',
        animations: 'enabled',
        background_type: 'color',
        background_image: null,
        background_color: 'default'
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Endpoint para subir imagen de fondo
app.put('/api/user-preferences/background-image', verifyToken, updateBackgroundImage);
// Endpoint para obtener imagen de fondo
app.get('/api/user-preferences/background-image', verifyToken, getBackgroundImage);

// === RUTAS DE NOTIFICACIONES ===
// Obtener notificaciones del usuario autenticado
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    await connection.end();
    res.json({ success: true, notifications: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
});

// Marcar notificación como leída
app.post('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    await connection.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    await connection.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al marcar como leída' });
  }
});

// Obtener cantidad de no leídas
app.get('/api/notifications/unread/count', verifyToken, async (req, res) => {
  console.log('=== ENDPOINT NOTIFICATIONS COUNT LLAMADO ===');
  console.log('Usuario:', req.user);
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    await connection.end();
    res.json({ success: true, count: rows[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al contar no leídas' });
  }
});

// Ruta de prueba (compatible con versiones antiguas)
app.get('/api/test', function(req, res) {
  res.json({ message: 'Backend funcionando correctamente' });
});

// Ruta de login (compatible con versiones antiguas)
app.post('/api/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  // Validaciones básicas
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }

  // Conectar a la base de datos
  createConnection()
    .then(function(connection) {
      // Buscar usuario por email
      return connection.execute(
        'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
        [email]
      );
    })
    .then(function(results) {
      var users = results[0];
      
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      var user = users[0];

      // Verificar si el usuario está activo
      if (!user.activo) {
        return res.status(403).json({
          success: false,
          message: 'Usuario desactivado'
        });
      }

      // Verificar contraseña
      return bcrypt.compare(password, user.password)
        .then(function(isValidPassword) {
          if (!isValidPassword) {
            return res.status(401).json({
              success: false,
              message: 'Email o contraseña incorrectos'
            });
          }

          // Crear token con id, email, rol y nombre
          var token = jwt.sign(
            {
              id: user.id,
              email: user.email,
              rol: user.rol,
              nombre: user.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          // Quitar contraseña de la respuesta
          var userWithoutPassword = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            activo: user.activo
          };

          res.json({
            success: true,
            message: 'Login exitoso',
            user: userWithoutPassword,
            token: token
          });
        });
    })
    .catch(function(error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    });
});

// Ruta de registro
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, password, cargo_id } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password || !cargo_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato del nombre
    const validateName = (name) => {
      // Verificar que no sea solo números
      if (/^\d+$/.test(name.trim())) {
        return 'El nombre no puede ser solo números';
      }
      
      // Verificar que tenga al menos 2 palabras (nombre y apellido)
      const words = name.trim().split(/\s+/);
      if (words.length < 2) {
        return 'Debe incluir nombre y apellido';
      }
      
      // Verificar que cada palabra tenga al menos 2 caracteres
      for (const word of words) {
        if (word.length < 2) {
          return 'Cada nombre debe tener al menos 2 caracteres';
        }
      }
      
      // Verificar que contenga solo letras, espacios y algunos caracteres especiales
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(name.trim())) {
        return 'El nombre solo puede contener letras, espacios, guiones y apostrofes';
      }
      
      return null; // Válido
    };

    const nameError = validateName(nombre);
    if (nameError) {
      return res.status(400).json({
        success: false,
        message: nameError
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Conectar a la base de datos
    const connection = await createConnection();

    // Verificar si el email ya existe
    const [existingUser] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar que el cargo existe
    const [cargo] = await connection.execute(
      'SELECT id, nombre FROM cargos WHERE id = ?',
      [cargo_id]
    );

    if (cargo.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Cargo no válido o inactivo'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario con cargo_id y rol del cargo
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nombre, email, password, rol, cargo_id, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, cargo[0].nombre, cargo_id, true]
    );

    await connection.end();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// NUEVAS RUTAS PARA GESTIÓN DE USUARIOS

// Obtener todos los usuarios
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();

    // Obtener todos los usuarios sin las contraseñas
    const [users] = await connection.execute(
      `SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY nombre`
    );

    await connection.end();

    res.json({
      success: true,
      users: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar usuario
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y rol son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    const connection = await createConnection();

    // Verificar si el email ya existe en otro usuario
    const [existingUser] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'El email ya está siendo usado por otro usuario'
      });
    }

    // Actualizar usuario
    const [result] = await connection.execute(
      'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
      [nombre, email, rol, activo, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cambiar contraseña de usuario
app.put('/api/users/:id/reset-password', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validar longitud de contraseña
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const connection = await createConnection();

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    const [result] = await connection.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cambiar estado del usuario (activar/desactivar)
app.put('/api/users/:id/toggle-status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const connection = await createConnection();

    // Actualizar estado del usuario
    const [result] = await connection.execute(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [activo, id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener perfil de usuario
app.get('/api/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await createConnection();

    const [users] = await connection.execute(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
      [id]
    );

    await connection.end();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// server.js (continuación - agregar rutas de cursos y evaluaciones)

// RUTA: Crear curso con evaluación
app.post('/api/courses', verifyToken, upload.single('videoFile'), async (req, res) => {
  try {
    const { title, description, videoUrl, cargoId, attempts = 1, timeLimit = 30 } = req.body;
    let finalVideoUrl = videoUrl;

    // Si se subió un archivo, usa su ruta
    if (req.file) {
      finalVideoUrl = `/uploads/videos/${req.file.filename}`;
    }

    // Procesar evaluation como JSON
    let evaluation = [];
    try {
      evaluation = req.body.evaluation ? JSON.parse(req.body.evaluation) : [];
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Error al procesar las preguntas de evaluación.' });
    }

    const connection = await createConnection();

    // Verificar que el cargo existe y obtener su nombre
    const [cargoResult] = await connection.execute(
      'SELECT id, nombre FROM cargos WHERE id = ?',
      [cargoId]
    );

    if (cargoResult.length === 0) {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        message: 'El cargo seleccionado no existe' 
      });
    }

    const cargoNombre = cargoResult[0].nombre;

    // Insertar curso
    const [result] = await connection.execute(
      `INSERT INTO courses (title, description, video_url, role, attempts, time_limit) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, finalVideoUrl, cargoNombre, attempts, timeLimit]
    );

    const courseId = result.insertId;

    // Insertar preguntas si existen
    for (const q of evaluation) {
      const { question, options, correctIndex } = q;
      if (!question || !options || options.length !== 4 || correctIndex < 0 || correctIndex > 3) continue;

      await connection.execute(
        `INSERT INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [courseId, question, options[0], options[1], options[2], options[3], correctIndex]
      );
    }

    // === CREAR ENTRADA EN BITÁCORA GLOBAL ===
    await connection.execute(
      `INSERT INTO bitacora_global (titulo, descripcion, estado, asignados, deadline) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        `Nuevo Curso: ${title}`,
        `Se ha creado un nuevo curso de capacitación para el cargo: ${cargoNombre}. ${description}`,
        'verde',
        cargoNombre,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días desde hoy
      ]
    );

    // === NOTIFICAR A USUARIOS DEL CARGO ===
    const [usersToNotify] = await connection.execute(
      'SELECT id FROM usuarios WHERE cargo_id = ? AND activo = 1',
      [cargoId]
    );
    
    for (const user of usersToNotify) {
      await connection.execute(
        'INSERT INTO notifications (user_id, message, type, data) VALUES (?, ?, ?, ?)',
        [user.id, `Se ha creado un nuevo curso: ${title}`, 'curso_nuevo', JSON.stringify({ courseId })]
      );
    }

    await connection.end();

    res.status(201).json({ 
      success: true, 
      message: 'Curso creado exitosamente', 
      courseId,
      cargoNombre 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al crear curso' });
  }
});

// RUTA: Obtener cursos (puede filtrar por rol opcionalmente)
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    const { rol } = req.query;
    console.log('=== CARGANDO CURSOS ===');
    console.log('Rol solicitado:', rol);
    console.log('Usuario:', req.user);
    
    const connection = await createConnection();

    const [courses] = rol
      ? await connection.execute(`SELECT * FROM courses WHERE role = ?`, [rol])
      : await connection.execute(`SELECT * FROM courses`);
    
    console.log('Cursos encontrados en DB:', courses.length);

    // Agrega las preguntas para cada curso
    const formattedCourses = await Promise.all(courses.map(async (course) => {
      const [questions] = await connection.execute(
        `SELECT id, question, option_1, option_2, option_3, option_4, correct_index FROM questions WHERE course_id = ?`,
        [course.id]
      );

      const evaluation = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: [q.option_1, q.option_2, q.option_3, q.option_4],
        correctIndex: q.correct_index
      }));

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        videoUrl: course.video_url,
        role: course.role,
        attempts: course.attempts,
        timeLimit: course.time_limit,
        evaluation
      };
    }));

    await connection.end();

    console.log('Cursos formateados:', formattedCourses.length);
    console.log('Primer curso:', formattedCourses[0]);
    
    res.json({ success: true, courses: formattedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// RUTA: Obtener preguntas de evaluación por curso
app.get('/api/courses/:id/questions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();

    const [questions] = await connection.execute(
      `SELECT id, question, option_1, option_2, option_3, option_4, correct_index FROM questions WHERE course_id = ?`,
      [id]
    );

    await connection.end();

    const formatted = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: [q.option_1, q.option_2, q.option_3, q.option_4],
      correctIndex: q.correct_index
    }));

    res.json({ success: true, questions: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// RUTA: Eliminar un curso
app.delete('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();

    // Eliminar preguntas relacionadas (si hay)
    await connection.execute(`DELETE FROM questions WHERE course_id = ?`, [id]);

    // Eliminar el curso
    const [result] = await connection.execute(`DELETE FROM courses WHERE id = ?`, [id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    res.json({ success: true, message: 'Curso eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// RUTA: Editar curso existente (ACTUALIZADA)
app.put('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, cargoId, evaluation = [], attempts, timeLimit } = req.body;
    
    console.log('📥 Datos recibidos en PUT /api/courses/:id:', {
      id,
      title,
      description,
      videoUrl,
      cargoId,
      attempts,
      timeLimit,
      evaluationLength: evaluation.length
    });

    const connection = await createConnection();

    // Obtener el curso existente para usar valores por defecto
    const [existingCourse] = await connection.execute(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (existingCourse.length === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const current = existingCourse[0];
    
    // Usar valores existentes como fallback si no se proporcionan
    const finalTitle = title || current.title;
    const finalDescription = description || current.description;
    const finalVideoUrl = videoUrl && videoUrl.trim() !== '' ? videoUrl : current.video_url;
    
    // Para cargoId, necesitamos obtener el ID numérico del cargo existente
    let finalCargoId;
    if (cargoId) {
      finalCargoId = parseInt(cargoId);
    } else {
      // Si no se proporciona cargoId, buscar el ID del cargo actual por nombre
      const [currentCargo] = await connection.execute(
        'SELECT id FROM cargos WHERE nombre = ?',
        [current.role]
      );
      finalCargoId = currentCargo.length > 0 ? currentCargo[0].id : null;
    }
    
    const finalAttempts = attempts || current.attempts;
    const finalTimeLimit = timeLimit || current.time_limit;

    // Verificar que el cargo existe y obtener su nombre
    const [cargoResult] = await connection.execute(
      'SELECT id, nombre FROM cargos WHERE id = ?',
      [finalCargoId]
    );

    if (cargoResult.length === 0) {
      await connection.end();
      return res.status(400).json({ 
        success: false, 
        message: 'El cargo seleccionado no existe' 
      });
    }

    const cargoNombre = cargoResult[0].nombre;

    // Actualizar curso
    console.log('🔄 Actualizando curso:', {
      id,
      finalTitle,
      finalDescription,
      finalVideoUrl,
      cargoNombre,
      finalAttempts,
      finalTimeLimit
    });
    
    const [updateResult] = await connection.execute(
      `UPDATE courses SET title = ?, description = ?, video_url = ?, role = ?, attempts = ?, time_limit = ? WHERE id = ?`,
      [finalTitle, finalDescription, finalVideoUrl, cargoNombre, finalAttempts, finalTimeLimit, id]
    );
    
    console.log('✅ Resultado del UPDATE:', updateResult);

    if (updateResult.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ success: false, message: 'Curso no encontrado para actualizar' });
    }

    // Eliminar preguntas anteriores
    await connection.execute(`DELETE FROM questions WHERE course_id = ?`, [id]);

    // Insertar nuevas preguntas
    for (const q of evaluation) {
      const { question, options, correctIndex } = q;
      if (!question || options.length !== 4 || correctIndex < 0 || correctIndex > 3) continue;

      await connection.execute(
        `INSERT INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, question, options[0], options[1], options[2], options[3], correctIndex]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Curso actualizado exitosamente',
      updatedCourseId: id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Nueva ruta: Guardar progreso del curso
app.post('/api/progress', verifyToken, async (req, res) => {
  const { courseId, videoCompleted, score, total, status, attemptsUsed } = req.body;
  const userId = req.user.id;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Falta el ID del curso' });
  }

  let connection;
  try {
    connection = await createConnection();

    // Verificar si ya existe progreso previo
    const [existing] = await connection.execute(
      'SELECT * FROM course_progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing.length > 0) {
      // Actualizar progreso
      await connection.execute(
        `UPDATE course_progress SET 
          video_completed = ?,
          evaluation_score = ?,
          evaluation_total = ?,
          evaluation_status = ?,
          attempts_used = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND course_id = ?`,
        [videoCompleted, score, total, status, attemptsUsed, userId, courseId]
      );
    } else {
      // Crear nuevo progreso
      await connection.execute(
        `INSERT INTO course_progress 
          (user_id, course_id, video_completed, evaluation_score, evaluation_total, evaluation_status, attempts_used)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, courseId, videoCompleted, score, total, status, attemptsUsed]
      );
    }

    // Log para depuración
    // === NOTIFICAR AL ADMIN SI SE COMPLETA ===
    if (videoCompleted || status === 'aprobado' || status === 'reprobado') {
      const [admins] = await connection.execute(
        "SELECT id FROM usuarios WHERE rol = 'Admin' AND activo = 1"
      );
      const [[userRow]] = await connection.execute('SELECT nombre FROM usuarios WHERE id = ?', [userId]);
      const [[courseRow]] = await connection.execute('SELECT title FROM courses WHERE id = ?', [courseId]);
      for (const admin of admins) {
        // Verificar si ya existe una notificación igual para este admin, usuario y curso
        const [existingNotif] = await connection.execute(
          'SELECT id FROM notifications WHERE user_id = ? AND type = ? AND JSON_EXTRACT(data, "$ .userId") = ? AND JSON_EXTRACT(data, "$ .courseId") = ?',
          [admin.id, 'curso_completado', userId, courseId]
        );
        if (existingNotif.length === 0) {
          await connection.execute(
            'INSERT INTO notifications (user_id, message, type, data) VALUES (?, ?, ?, ?)',
            [admin.id, `El usuario ${userRow.nombre} ha completado o actualizado el curso: ${courseRow.title}`, 'curso_completado', JSON.stringify({ userId, courseId })]
          );
        }
      }
    }

    // Intentar cerrar conexión sin romper todo si falla
    try {
      await connection.end();
    } catch (endError) {
      }

    // Intentar enviar la respuesta JSON
    try {
      return res.json({ success: true, message: 'Progreso guardado correctamente' });
    } catch (jsonErr) {
      return res.status(500).send('Error al enviar respuesta');
    }

  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (endErr) {
        }
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener progreso del usuario autenticado
app.get('/api/progress', verifyToken, async (req, res) => {
  const userId = req.user.id;
  let connection;

  try {
    connection = await createConnection();
    const [rows] = await connection.execute(
      `SELECT 
        cp.course_id,
        cp.video_completed,
        cp.evaluation_score,
        cp.evaluation_total,
        cp.evaluation_status,
        cp.attempts_used,
        cp.updated_at,
        c.title AS course_title
      FROM course_progress cp
      JOIN courses c ON cp.course_id = c.id
      WHERE cp.user_id = ?`,
      [userId]
    );

    // LOG PARA CONSOLA

    await connection.end();
    return res.json({ success: true, progress: rows });
  } catch (error) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, message: "Error al obtener progreso" });
  }
});

// Obtener progreso de todos los usuarios (solo para administradores)
app.get('/api/progress/all', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const userRol = req.user.rol;
  let connection;

  if (userRol !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
  }

  try {
    connection = await createConnection();

    const [rows] = await connection.execute(
      `SELECT 
         u.nombre AS nombre,
         c.title AS curso,
         cp.course_id,
         cp.video_completed,
         cp.evaluation_score,
         cp.evaluation_total,
         cp.evaluation_status,
         cp.attempts_used,
         cp.updated_at
       FROM course_progress cp
       JOIN usuarios u ON cp.user_id = u.id
       JOIN courses c ON cp.course_id = c.id
       ORDER BY cp.updated_at DESC`
    );

    await connection.end();
    // Si no hay registros, devolver un array vacío (no 404)
    return res.json({ success: true, progress: rows });

  } catch (error) {
    if (connection) await connection.end();
    return res.status(500).json({ success: false, message: "Error al obtener el progreso general." });
  }
});

// Ruta para obtener progreso de un curso específico
app.get('/api/progress/:courseId', verifyToken, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  console.log(`=== ENDPOINT PROGRESS/${courseId} LLAMADO ===`);
  console.log('Usuario ID:', userId);
  console.log('Course ID:', courseId);

  let connection;
  try {
    connection = await createConnection();

    const [progress] = await connection.execute(
      `SELECT * FROM course_progress WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );

    await connection.end();

    console.log('Progreso encontrado:', progress.length);

    if (progress.length === 0) {
      // Devolver un objeto de progreso vacío en lugar de 404
      console.log('Devolviendo progreso vacío para usuario nuevo');
      return res.json({ 
        success: true, 
        progress: {
          user_id: userId,
          course_id: parseInt(courseId),
          video_completed: false,
          evaluation_score: null,
          evaluation_total: null,
          evaluation_status: null,
          attempts_used: 0,
          created_at: null,
          updated_at: null
        }
      });
    }

    console.log('Devolviendo progreso existente');
    return res.json({ success: true, progress: progress[0] });

  } catch (error) {
    console.error('Error en endpoint progress:', error);
    if (connection) await connection.end();
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// 📋 RUTAS DE BITÁCORA

app.get('/api/bitacora', verifyToken, async (req, res) => {
  console.log('=== ENDPOINT BITACORA LLAMADO ===');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT id, titulo, descripcion, estado, asignados, deadline, created_at, updated_at 
      FROM bitacora_global 
      ORDER BY created_at DESC
    `);
    await connection.end();

    console.log('Tareas de bitácora encontradas:', rows.length);
    res.json({ success: true, tareas: rows || [] });
  } catch (error) {
    console.error('Error en endpoint bitácora:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear tarea (una por usuario asignado)
app.post('/api/bitacora', verifyToken, async (req, res) => {
  const { rol } = req.user;
  const { titulo, descripcion, estado, asignados, deadline } = req.body;

  if (rol !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Solo los administradores pueden crear tareas' });
  }

  try {
    const connection = await createConnection();

    for (const userId of asignados) {
      await connection.execute(`
        INSERT INTO bitacora_global (titulo, descripcion, estado, asignados, deadline)
        VALUES (?, ?, ?, ?, ?)
      `, [
        titulo,
        descripcion,
        estado || 'rojo',
        JSON.stringify([userId]),
        deadline
      ]);
      // Notificar al usuario asignado
      await connection.execute(
        'INSERT INTO notifications (user_id, message, type, data) VALUES (?, ?, ?, ?)',
        [userId, `Tienes una nueva tarea: ${titulo}`, 'tarea_nueva', JSON.stringify({ titulo, descripcion, deadline })]
      );
    }

    await connection.end();
    res.json({ success: true, message: 'Tareas creadas para cada usuario asignado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al crear tarea' });
  }
});

// Editar tarea (admin: todo, usuario: solo estado si está asignado)
app.put('/api/bitacora/:id', verifyToken, async (req, res) => {
  const { rol, id: userId } = req.user;
  const tareaId = req.params.id;
  const { titulo, descripcion, estado, asignados, deadline } = req.body;

  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(`SELECT * FROM bitacora_global WHERE id = ?`, [tareaId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });

    const tarea = rows[0];
    const yaVenció = new Date(tarea.deadline) < new Date();

    if (rol === 'Admin') {
      await connection.execute(`
        UPDATE bitacora_global 
        SET titulo = ?, descripcion = ?, estado = ?, asignados = ?, deadline = ?, updated_at = NOW()
        WHERE id = ?
      `, [titulo, descripcion, estado, JSON.stringify(asignados), deadline, tareaId]);
    } else {
      const asignadosArr = JSON.parse(tarea.asignados || "[]");
      if (!asignadosArr.includes(userId)) {
        await connection.end();
        return res.status(403).json({ success: false, message: 'No tienes permisos para editar esta tarea' });
      }
      if (yaVenció) {
        await connection.end();
        return res.status(400).json({ success: false, message: 'La tarea ha vencido y no puede ser modificada' });
      }

      await connection.execute(`
        UPDATE bitacora_global SET estado = ?, updated_at = NOW() WHERE id = ?
      `, [estado, tareaId]);
    }
    // Si la tarea se marca como completa, notificar a los admins
    if (estado === 'verde') {
      const [admins] = await connection.execute("SELECT id FROM usuarios WHERE rol = 'Admin' AND activo = 1");
      const [[userRow]] = await connection.execute('SELECT nombre FROM usuarios WHERE id = ?', [userId]);
      for (const admin of admins) {
        await connection.execute(
          'INSERT INTO notifications (user_id, message, type, data) VALUES (?, ?, ?, ?)',
          [admin.id, `El usuario ${userRow.nombre} ha marcado como completada la tarea: ${tarea.titulo}`, 'tarea_completada', JSON.stringify({ tareaId })]
        );
      }
    }

    await connection.end();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener usuarios (para mostrar nombres)
app.get('/api/usuarios', verifyToken, async (req, res) => {
  console.log('=== ENDPOINT USUARIOS LLAMADO ===');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT id, nombre FROM usuarios');
    await connection.end();
    console.log('Usuarios encontrados:', rows.length);
    res.json({ success: true, usuarios: rows });
  } catch (error) {
    console.error('Error en endpoint usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

app.delete('/api/bitacora/:id', verifyToken, async (req, res) => {
  const { rol } = req.user;
  if (rol !== 'Admin') return res.status(403).json({ success: false, message: 'Solo Admin puede eliminar' });

  try {
    const connection = await createConnection();
    const [result] = await connection.execute(`DELETE FROM bitacora_global WHERE id = ?`, [req.params.id]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// NUEVAS RUTAS PARA GESTIÓN DE CARGOS

// Obtener todos los cargos
app.get('/api/cargos', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [cargos] = await connection.execute(
      'SELECT * FROM cargos ORDER BY nombre ASC'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      cargos: cargos
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte Excel de cargos
app.get('/api/cargos/reporte-excel', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden generar reportes'
      });
    }

    const connection = await createConnection();
    
    // Obtener datos completos de cargos con estadísticas detalladas
    const [cargos] = await connection.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT u.id) as usuarios_count,
        COUNT(CASE WHEN u.activo = 1 THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN u.activo = 0 THEN 1 END) as usuarios_inactivos,
        (SELECT COUNT(*) FROM courses WHERE role = c.nombre) as cursos_count,
        (SELECT COUNT(DISTINCT d.id) FROM documents d 
         JOIN document_targets dt ON d.id = dt.document_id 
         WHERE dt.target_type = 'role' AND dt.target_value = c.nombre) as documentos_count,
        (SELECT COUNT(*) FROM course_progress cp 
         JOIN usuarios u2 ON cp.user_id = u2.id 
         WHERE u2.cargo_id = c.id AND cp.evaluation_status = 'aprobado') as cursos_aprobados,
        (SELECT ROUND(AVG(
          CASE 
            WHEN cp.evaluation_score IS NOT NULL AND cp.evaluation_total > 0 
            THEN (cp.evaluation_score / cp.evaluation_total) * 100
            ELSE 0 
          END
        ), 2) FROM course_progress cp 
         JOIN usuarios u3 ON cp.user_id = u3.id 
         WHERE u3.cargo_id = c.id) as promedio_progreso,
        (SELECT ROUND(AVG(cp.attempts_used), 2) FROM course_progress cp 
         JOIN usuarios u4 ON cp.user_id = u4.id 
         WHERE u4.cargo_id = c.id AND cp.attempts_used > 0) as intentos_promedio,
        (SELECT ROUND(
          (COUNT(CASE WHEN cp.evaluation_status = 'aprobado' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(cp.id), 0)), 2
        ) FROM course_progress cp 
         JOIN usuarios u5 ON cp.user_id = u5.id 
         WHERE u5.cargo_id = c.id) as tasa_aprobacion
      FROM cargos c
      LEFT JOIN usuarios u ON u.cargo_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);
    
    await connection.end();

    // Generar reporte Excel
    const workbook = await excelReportService.generateCargosReport(cargos);
    const buffer = await excelReportService.generateExcelBuffer(workbook);

    // Configurar headers para descarga
    const fileName = `Reporte_Cargos_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);

  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando reporte Excel'
    });
  }
});

// Generar reporte Excel individual de un cargo
app.get('/api/cargos/:id/reporte-excel', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden generar reportes'
      });
    }

    const cargoId = req.params.id;
    const connection = await createConnection();
    
    // Obtener datos completos del cargo específico
    const [cargos] = await connection.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT u.id) as usuarios_count,
        COUNT(CASE WHEN u.activo = 1 THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN u.activo = 0 THEN 1 END) as usuarios_inactivos,
        (SELECT COUNT(*) FROM courses WHERE role = c.nombre) as cursos_count,
        (SELECT COUNT(DISTINCT d.id) FROM documents d 
         JOIN document_targets dt ON d.id = dt.document_id 
         WHERE dt.target_type = 'role' AND dt.target_value = c.nombre) as documentos_count,
        (SELECT COUNT(*) FROM course_progress cp 
         JOIN usuarios u2 ON cp.user_id = u2.id 
         WHERE u2.cargo_id = c.id AND cp.evaluation_status = 'aprobado') as cursos_aprobados,
        (SELECT ROUND(AVG(
          CASE 
            WHEN cp.evaluation_score IS NOT NULL AND cp.evaluation_total > 0 
            THEN (cp.evaluation_score / cp.evaluation_total) * 100
            ELSE 0 
          END
        ), 2) FROM course_progress cp 
         JOIN usuarios u3 ON cp.user_id = u3.id 
         WHERE u3.cargo_id = c.id) as promedio_progreso,
        (SELECT ROUND(AVG(cp.attempts_used), 2) FROM course_progress cp 
         JOIN usuarios u4 ON cp.user_id = u4.id 
         WHERE u4.cargo_id = c.id AND cp.attempts_used > 0) as intentos_promedio,
        (SELECT ROUND(
          (COUNT(CASE WHEN cp.evaluation_status = 'aprobado' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(cp.id), 0)), 2
        ) FROM course_progress cp 
         JOIN usuarios u5 ON cp.user_id = u5.id 
         WHERE u5.cargo_id = c.id) as tasa_aprobacion
      FROM cargos c
      LEFT JOIN usuarios u ON u.cargo_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [cargoId]);
    
    if (cargos.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado'
      });
    }
    
    await connection.end();

    // Generar reporte Excel individual
    const workbook = await excelReportService.generateIndividualCargoReport(cargos[0]);
    const buffer = await excelReportService.generateExcelBuffer(workbook);

    // Configurar headers para descarga
    const fileName = `Reporte_${cargos[0].nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);

  } catch (error) {
    console.error('Error generando reporte individual:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando reporte individual'
    });
  }
});

  // Crear nuevo cargo
  app.post('/api/cargos', verifyToken, async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;
      
      if (!nombre || !descripcion) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y descripción son requeridos'
        });
      }
      
      const connection = await createConnection();
      
      // Verificar si el cargo ya existe
      const [existingCargo] = await connection.execute(
        'SELECT id FROM cargos WHERE nombre = ?',
        [nombre]
      );
      
      if (existingCargo.length > 0) {
        await connection.end();
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cargo con ese nombre'
        });
      }
      
      const [result] = await connection.execute(
        'INSERT INTO cargos (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion]
      );
      
      await connection.end();
      
      res.status(201).json({
        success: true,
        message: 'Cargo creado exitosamente',
        cargoId: result.insertId
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

// Actualizar cargo existente
app.put('/api/cargos/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    
    if (!nombre || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y descripción son requeridos'
      });
    }
    
    const connection = await createConnection();
    
    // Verificar si el cargo existe
    const [existingCargo] = await connection.execute(
      'SELECT id FROM cargos WHERE id = ?',
      [id]
    );
    
    if (existingCargo.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado'
      });
    }
    
    // Verificar si el nombre ya existe en otro cargo
    const [duplicateName] = await connection.execute(
      'SELECT id FROM cargos WHERE nombre = ? AND id != ?',
      [nombre, id]
    );
    
    if (duplicateName.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Ya existe otro cargo con ese nombre'
      });
    }
    
    await connection.execute(
      'UPDATE cargos SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre, descripcion, id]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'Cargo actualizado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar cargo con limpieza en cascada y desactivación de usuarios
app.delete('/api/cargos/:id', verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();
    await connection.beginTransaction();

    // 1) Verificar cargo y obtener su nombre
    const [cargoRows] = await connection.execute(
      'SELECT id, nombre FROM cargos WHERE id = ?',
      [id]
    );
    if (cargoRows.length === 0) {
      await connection.rollback();
      await connection.end();
      return res.status(404).json({ success: false, message: 'Cargo no encontrado' });
    }
    const cargoNombre = cargoRows[0].nombre;

    // 2) Desactivar usuarios del cargo y limpiar relación
    await connection.execute('UPDATE usuarios SET activo = 0 WHERE cargo_id = ?', [id]);
    await connection.execute('UPDATE usuarios SET cargo_id = NULL WHERE cargo_id = ?', [id]);

    // 3) Eliminar cursos del cargo (y dependencias)
    const [courseIdsRows] = await connection.execute(
      'SELECT id FROM courses WHERE role = ?',
      [cargoNombre]
    );
    const courseIds = courseIdsRows.map(r => r.id);
    if (courseIds.length > 0) {
      const inClause = '(' + courseIds.map(() => '?').join(',') + ')';
      // Eliminar progreso primero por seguridad
      await connection.execute(
        `DELETE FROM course_progress WHERE course_id IN ${inClause}`,
        courseIds
      );
      // Eliminar preguntas
      await connection.execute(
        `DELETE FROM questions WHERE course_id IN ${inClause}`,
        courseIds
      );
      // Eliminar cursos
      await connection.execute(
        `DELETE FROM courses WHERE id IN ${inClause}`,
        courseIds
      );
    }

    // 4) Quitar asignaciones de documentos por este rol
    await connection.execute(
      `DELETE FROM document_targets WHERE target_type = 'role' AND target_value = ?`,
      [cargoNombre]
    );

    // 5) Borrar documentos huérfanos no globales (sin targets)
    const [orphanDocs] = await connection.execute(
      `SELECT d.id, d.filename FROM documents d
       LEFT JOIN document_targets dt ON dt.document_id = d.id
       WHERE d.is_global = 0
       GROUP BY d.id, d.filename
       HAVING COUNT(dt.id) = 0`
    );
    if (orphanDocs.length > 0) {
      const orphanIds = orphanDocs.map(d => d.id);
      const inClauseDocs = '(' + orphanIds.map(() => '?').join(',') + ')';
      await connection.execute(
        `DELETE FROM documents WHERE id IN ${inClauseDocs}`,
        orphanIds
      );
      // Intentar borrar archivos físicos (no crítico para la transacción)
      try {
        const docsDir = path.join(process.cwd(), 'backend', 'uploads', 'documents');
        for (const doc of orphanDocs) {
          const filePath = path.join(docsDir, doc.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch {}
    }

    // 6) Eliminar el cargo
    await connection.execute('DELETE FROM cargos WHERE id = ?', [id]);

    await connection.commit();
    await connection.end();

    res.json({ success: true, message: 'Cargo eliminado y datos relacionados limpiados' });
  } catch (error) {
    try {
      if (connection) {
        await connection.rollback();
        await connection.end();
      }
    } catch {}
    res.status(500).json({ success: false, message: 'Error eliminando cargo: ' + error.message });
  }
});

// Obtener métricas de un cargo específico (versión corregida)
app.get('/api/cargos/:id/metrics', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = await getCargoMetrics(id);
    
    res.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas generales del sistema
app.get('/api/stats/general', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden acceder a las estadísticas generales'
      });
    }

    const connection = await createConnection();
    
    // Estadísticas generales
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as usuarios_activos,
        (SELECT COUNT(*) FROM usuarios WHERE activo = 0) as usuarios_inactivos,
        (SELECT COUNT(*) FROM courses) as total_cursos,
        (SELECT COUNT(*) FROM cargos) as total_cargos,
        (SELECT COUNT(*) FROM documents) as total_documentos,
        (SELECT COUNT(*) FROM course_progress WHERE video_completed = 1) as videos_completados,
        (SELECT COUNT(*) FROM course_progress WHERE evaluation_status = 'aprobado') as evaluaciones_aprobadas,
        (SELECT COUNT(*) FROM course_progress WHERE evaluation_status = 'reprobado') as evaluaciones_reprobadas,
        (SELECT COALESCE(ROUND(AVG(
          CASE 
            WHEN evaluation_score IS NOT NULL AND evaluation_total > 0 
            THEN (evaluation_score / evaluation_total) * 100
            WHEN video_completed = 1 AND (evaluation_score IS NULL OR evaluation_total = 0)
            THEN 50
            ELSE 0 
          END
        ), 2), 0) FROM course_progress) as progreso_promedio_general
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      stats: stats[0]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener cargos para el registro
app.get('/api/cargos/activos', async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [cargos] = await connection.execute(
      'SELECT id, nombre, descripcion FROM cargos ORDER BY nombre ASC'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      cargos: cargos
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener cargos para la creación de cursos (solo admin)
app.get('/api/cargos/para-cursos', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden acceder a esta información'
      });
    }

    const connection = await createConnection();
    
    const [cargos] = await connection.execute(
      'SELECT id, nombre, descripcion FROM cargos ORDER BY nombre ASC'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      cargos: cargos
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ========================================
// 🚀 RUTAS DE IA PARA GENERACIÓN DE PREGUNTAS
// ========================================

// RUTA: Generar preguntas automáticamente para un curso existente
app.post('/api/courses/:id/generate-questions', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden generar preguntas con IA'
      });
    }

    const { id } = req.params;
    const { numQuestions = 5 } = req.body;

    // Generar preguntas usando IA
    const questions = await aiService.generateQuestionsForCourse(parseInt(id));
    
    res.json({
      success: true,
      message: `Se generaron ${questions.length} preguntas automáticamente`,
      questions: questions,
      courseId: parseInt(id)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generando preguntas con IA: ' + error.message
    });
  }
});

// RUTA: Generar preguntas personalizadas con IA
app.post('/api/ai/generate-questions', verifyToken, async (req, res) => {
  console.log('=== ENDPOINT GENERATE-QUESTIONS LLAMADO ===');
  console.log('=== INICIO GENERACIÓN DE PREGUNTAS ===');
  console.log('Usuario:', req.user);
  console.log('Body:', req.body);
  
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      console.log('Error: Usuario no es admin');
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden usar el servicio de IA'
      });
    }

    const { title, description, content, contentType, numQuestions = 5 } = req.body;
    console.log('Parámetros recibidos:', { title, description, content, contentType, numQuestions });

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Título y descripción son requeridos'
      });
    }

    // Preparar datos del curso
    const courseData = {
      title,
      description,
      content: content || '',
      contentType: contentType || 'text'
    };

    // Generar preguntas usando IA
    const questions = await aiService.generateQuestions(courseData, numQuestions);
    
    res.json({
      success: true,
      message: `Se generaron ${questions.length} preguntas personalizadas`,
      questions: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generando preguntas personalizadas con IA: ' + error.message
    });
  }
});

// RUTA: Analizar contenido de YouTube y generar preguntas
app.post('/api/ai/analyze-youtube', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden analizar videos de YouTube'
      });
    }

    const { videoUrl, title, description, numQuestions = 5 } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL del video de YouTube es requerida'
      });
    }

    // Extraer información del video de YouTube
    const videoData = await aiService.extractYouTubeTranscript(videoUrl);
    
    // Combinar con datos personalizados si se proporcionan
    const courseData = {
      title: title || videoData.title,
      description: description || videoData.content,
      content: videoData.content,
      contentType: 'youtube'
    };

    // Generar preguntas usando IA
    const questions = await aiService.generateQuestions(courseData, numQuestions);
    
    res.json({
      success: true,
      message: `Se generaron ${questions.length} preguntas para el video de YouTube`,
      videoInfo: videoData,
      questions: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analizando video de YouTube: ' + error.message
    });
  }
});

// RUTA: Analizar archivo de video MP4 y generar preguntas
app.post('/api/ai/analyze-video-file', videoAnalysisUpload.single('videoFile'), verifyToken, async (req, res) => {
  console.log('=== ENDPOINT ANALYZE-VIDEO-FILE LLAMADO ===');
  console.log('=== INICIO ANÁLISIS DE VIDEO ===');
  console.log('Usuario:', req.user);
  console.log('Archivo recibido:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No hay archivo');
  console.log('Body:', req.body);
  
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      console.log('Error: Usuario no es admin');
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden analizar archivos de video'
      });
    }

    if (!req.file) {
      console.log('Error: No se envió archivo');
      return res.status(400).json({
        success: false,
        message: 'No se envió ningún archivo de video'
      });
    }

    const { title, description, numQuestions = 5 } = req.body;
    console.log('Parámetros recibidos:', { title, description, numQuestions });
    
    // Con multer.memoryStorage(), el archivo está en req.file.buffer
    // Necesitamos guardarlo temporalmente para procesarlo
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, 'temp', 'videos');
    
    console.log('Directorio temporal:', tempDir);
    
    // Crear directorio temporal si no existe
    if (!fs.existsSync(tempDir)) {
      console.log('Creando directorio temporal...');
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFileName = `temp_${Date.now()}_${req.file.originalname}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    console.log('Archivo temporal:', tempFilePath);
    
    // Guardar archivo temporalmente
    console.log('Guardando archivo temporal...');
    fs.writeFileSync(tempFilePath, req.file.buffer);
    console.log('Archivo guardado exitosamente');
    
    try {
      // Analizar contenido del archivo de video con transcripción real
      console.log('Iniciando análisis de video con IA...');
      console.log('Ruta del archivo temporal:', tempFilePath);
      console.log('Archivo existe:', require('fs').existsSync(tempFilePath));
      
      const videoData = await aiService.processMP4WithTranscription(tempFilePath);
      console.log('Análisis completado:', videoData);
    
    // Combinar con datos personalizados si se proporcionan
    const courseData = {
      title: title || videoData.title,
      description: description || videoData.content,
      content: videoData.content,
      contentType: 'video'
    };

    // Generar preguntas usando IA
    const questions = await aiService.generateQuestions(courseData, numQuestions);
    
      res.json({
        success: true,
        message: `Se generaron ${questions.length} preguntas para el archivo de video`,
        videoInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          ...videoData
        },
        questions: questions
      });
      
    } finally {
      // Limpiar archivo temporal
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn('Error limpiando archivo temporal:', cleanupError);
      }
    }

  } catch (error) {
    // Limpiar archivo temporal en caso de error
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.warn('Error limpiando archivo temporal:', cleanupError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error analizando archivo de video: ' + error.message
    });
  }
});

// RUTA: Analizar archivo y generar preguntas
app.post('/api/ai/analyze-file', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden analizar archivos'
      });
    }

    const { filePath, title, description, numQuestions = 5 } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Ruta del archivo es requerida'
      });
    }

    // Analizar contenido del archivo
    const fileData = await aiService.analyzeFileContent(filePath);
    
    // Combinar con datos personalizados si se proporcionan
    const courseData = {
      title: title || fileData.title,
      description: description || fileData.content,
      content: fileData.content,
      contentType: 'file'
    };

    // Generar preguntas usando IA
    const questions = await aiService.generateQuestions(courseData, numQuestions);
    
    res.json({
      success: true,
      message: `Se generaron ${questions.length} preguntas para el archivo`,
      fileInfo: fileData,
      questions: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analizando archivo: ' + error.message
    });
  }
});

// === RUTAS DEL CHATBOT ===
// Endpoint para el chatbot de atención al cliente
app.post('/api/chatbot', verifyToken, async (req, res) => {
  try {
    const { message, conversation_history = [] } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    // Preparar historial de conversación
    const messages = [
      {
        role: "system",
        content: "👨‍⚕️ Eres un asistente médico llamado Don Davivir, especializado en enfermedades comunes del cuerpo humano. Tu función es proporcionar información general y educativa sobre síntomas, causas, tratamientos básicos y medidas preventivas de afecciones frecuentes como gripes, alergias, dolores musculares, infecciones y más.🩺 Siempre preséntate como Don Davivir con un tono cálido, profesional y accesible. Usa emojis cuando ayuden a mejorar la comprensión o hacer el mensaje más amigable.⚠️ IMPORTANTE: Solo responde preguntas relacionadas con salud y enfermedades comunes. Si te preguntan sobre otros temas (tecnología, cursos, plataformas, etc.), responde educadamente que solo puedes ayudar con información sobre salud.📌 Recuerda que esta información es solo educativa y no reemplaza la consulta médica profesional. Si los síntomas son graves, persistentes o empeoran, recomienda consultar con un médico."

      },
      ...conversation_history,
      {
        role: "user",
        content: message
      }
    ];

    // Generar respuesta con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: messages,
      temperature: 0.2
    });

    const botResponse = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      response: botResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando la consulta del chatbot: ' + error.message
    });
  }
});

// Endpoint para obtener historial de conversaciones del usuario
app.get('/api/chatbot/history', verifyToken, async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT id, message, response, timestamp FROM chatbot_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20',
      [req.user.id]
    );
    await connection.end();
    
    res.json({
      success: true,
      history: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de conversaciones'
    });
  }
});

// Endpoint para guardar conversación en el historial
app.post('/api/chatbot/save', verifyToken, async (req, res) => {
  try {
    const { message, response } = req.body;
    
    const connection = await createConnection();
    await connection.execute(
      'INSERT INTO chatbot_history (user_id, message, response, timestamp) VALUES (?, ?, ?, NOW())',
      [req.user.id, message, response]
    );
    await connection.end();
    
    res.json({
      success: true,
      message: 'Conversación guardada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error guardando conversación'
    });
  }
});

// Limpieza automática de archivos temporales cada hora
setInterval(() => {
  videoProcessor.cleanup();
}, 3600000); // 1 hora

// Middleware para manejar rutas no encontradas (evitar 404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/test',
      'POST /api/login',
      'POST /api/register',
      'GET /api/users',
      'GET /api/courses',
      'POST /api/courses',
      'GET /api/documents',
      'POST /api/documents',
      'GET /api/bitacora',
      'POST /api/bitacora',
      'GET /api/cargos',
      'POST /api/chatbot'
    ]
  });
});

// Middleware global para manejar errores (evitar 500)
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  
  // Si es error de CORS
  if (error.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por CORS',
      origin: req.headers.origin
    });
  }
  
  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas fuera de /api
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Iniciar servidor SIN requerir conexión a la base de datos (compatible con versiones antiguas)
function startServer() {
  // Iniciar servidor inmediatamente
  app.listen(PORT, '0.0.0.0', function() {
    console.log('🚀 Servidor corriendo en puerto ' + PORT);
    console.log('🌐 Ambiente: ' + (process.env.NODE_ENV || 'development'));
    console.log('🔒 CORS configurado para: ' + (process.env.NODE_ENV === 'production' ? 'producción' : 'desarrollo'));
    console.log('🗄️ Base de datos: ' + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.database);
    console.log('✅ Servidor listo para recibir peticiones');
    
    // Probar conexión a la base de datos en segundo plano
    testConnection()
      .then(function(dbConnected) {
        if (dbConnected) {
          console.log('✅ Base de datos conectada correctamente');
        } else {
          console.log('⚠️ Base de datos no disponible - algunas funciones pueden no funcionar');
        }
      })
      .catch(function(error) {
        console.log('⚠️ Error probando base de datos:', error.message);
      });
  });
}

startServer();

// Exportar para uso
module.exports = app;
