# 🚂 Configuración MySQL en Railway

Este directorio contiene los scripts necesarios para configurar la base de datos MySQL en Railway.

## 📁 Archivos

- `railway-mysql-setup.sql` - Script SQL completo para crear tablas y datos
- `railway-setup.js` - Script Node.js para configuración automática
- `README-RAILWAY.md` - Esta documentación

## 🚀 Configuración Rápida

### Opción 1: Script Automático (Recomendado)

```bash
# Desde el directorio backend
cd db-setup
node railway-setup.js setup
```

### Opción 2: Manual con phpMyAdmin

1. Accede a tu panel de Railway
2. Ve a la sección MySQL
3. Abre phpMyAdmin
4. Copia y pega el contenido de `railway-mysql-setup.sql`
5. Ejecuta el script

## 🧪 Verificar Configuración

```bash
# Probar conexión
node railway-setup.js test

# Ver información de conexión
node railway-setup.js info
```

## 📊 Datos Iniciales

El script crea automáticamente:

### 👥 Usuarios
- **Admin**: `admin@proyecto.com` / `admin123`

### 🏢 Cargos
- Admin
- Contabilidad
- Compras
- Atención al Cliente
- Operativo

### 📚 Cursos
- Curso de Introducción (para Admin)
- Capacitación Contabilidad (para Contabilidad)

### 📋 Tablas Creadas
- `usuarios` - Usuarios del sistema
- `cargos` - Cargos/roles
- `courses` - Cursos de capacitación
- `questions` - Preguntas de evaluación
- `course_progress` - Progreso de cursos
- `documents` - Documentos
- `document_targets` - Destinos de documentos
- `notifications` - Notificaciones
- `user_preferences` - Preferencias de usuario
- `bitacora_global` - Bitácora global
- `bitacora_personal` - Bitácora personal
- `chatbot_history` - Historial del chatbot

## 🔧 Variables de Entorno

El script usa estas variables (con valores por defecto):

```env
RAILWAY_DB_HOST=trolley.proxy.rlwy.net
RAILWAY_DB_PORT=17594
RAILWAY_DB_USER=root
RAILWAY_DB_PASSWORD=CEgMeCUPsqySFOidbBiATJoUvEbEdEyZ
RAILWAY_DB_NAME=railway
```

## ✅ Verificación Post-Configuración

Después de ejecutar el script, verifica:

1. **Conexión**: `node railway-setup.js test`
2. **Tablas**: Deben aparecer 12 tablas
3. **Datos**: Al menos 1 usuario, 5 cargos, 2 cursos
4. **Login**: Prueba con `admin@proyecto.com` / `admin123`

## 🚨 Solución de Problemas

### Error de Conexión
```bash
# Verificar variables de entorno
node railway-setup.js info

# Probar conexión
node railway-setup.js test
```

### Tablas No Creadas
- Verifica permisos de usuario en Railway
- Ejecuta el script SQL manualmente en phpMyAdmin
- Revisa logs de Railway

### Datos Duplicados
- El script usa `INSERT IGNORE` para evitar duplicados
- Es seguro ejecutar múltiples veces

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Railway
2. Verifica las variables de entorno
3. Prueba la conexión manualmente
4. Contacta al administrador del sistema
