# 🎬 Instalación de yt-dlp para Videos Sin Transcripción

## 🚀 ¿Qué es yt-dlp?

`yt-dlp` es el sucesor moderno y más confiable de `ytdl-core`. Permite descargar videos de YouTube y otros sitios web, incluso cuando no tienen transcripción disponible.

## 📋 Instalación

### En Producción (Linux/Ubuntu):

```bash
# Instalar yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verificar instalación
yt-dlp --version
```

### En Windows:

```bash
# Usando pip
pip install yt-dlp

# O descargar directamente
# Ve a: https://github.com/yt-dlp/yt-dlp/releases/latest
# Descarga yt-dlp.exe y colócalo en tu PATH
```

### En macOS:

```bash
# Usando Homebrew
brew install yt-dlp

# O usando pip
pip install yt-dlp
```

## 🔧 Configuración en el Proyecto

El proyecto ya está configurado para usar `yt-dlp`. Solo necesitas:

1. **Instalar yt-dlp** en tu servidor de producción
2. **Reiniciar el servidor** Node.js
3. **Probar** con un video de YouTube

## 🎯 Cómo Funciona Ahora

### Orden de Intentos:

1. **Transcripción directa** (más rápido) - Usa `youtube-transcript`
2. **yt-dlp + transcripción** (más robusto) - Descarga audio y transcribe
3. **ytdl-core + transcripción** (fallback) - Método original

### Ventajas de yt-dlp:

- ✅ **Más confiable** que ytdl-core
- ✅ **Funciona con más videos**
- ✅ **Maneja restricciones mejor**
- ✅ **Actualizaciones frecuentes**
- ✅ **Soporte para más sitios web**

## 🧪 Pruebas

Para probar que funciona:

```bash
# Probar yt-dlp directamente
yt-dlp --extract-audio --audio-format mp3 "https://www.youtube.com/watch?v=VIDEO_ID"

# Probar en el proyecto
# Usa la interfaz web para analizar un video de YouTube
```

## 🚨 Solución de Problemas

### Error: "yt-dlp not found"
```bash
# Verificar que yt-dlp esté instalado
which yt-dlp
yt-dlp --version
```

### Error: "Permission denied"
```bash
# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/yt-dlp
```

### Error: "No such file or directory"
```bash
# Reinstalar yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

## 📊 Logs del Sistema

El sistema ahora muestra logs detallados:

```
🎬 === INICIANDO EXTRACCIÓN DE TRANSCRIPCIÓN DE YOUTUBE ===
🔄 Intentando método de transcripción directa...
⚠️ Transcripción directa falló: No se encontró transcripción disponible
🔄 Intentando método yt-dlp (más robusto)...
⬇️ Descargando audio...
✅ Audio descargado: /path/to/audio.mp3
🎤 Transcribiendo audio...
✅ Transcripción con yt-dlp obtenida exitosamente
🔧 Método usado: yt-dlp + transcripción
```

## 🎉 Resultado

Ahora tu sistema puede:
- ✅ Procesar videos **con transcripción** (método rápido)
- ✅ Procesar videos **sin transcripción** (descarga + transcripción)
- ✅ Manejar **errores automáticamente**
- ✅ Usar **múltiples métodos** de respaldo
