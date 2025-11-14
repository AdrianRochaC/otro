# 🚀 Guía de Despliegue: Frontend en Dongee + Backend en Render

Esta guía te explica cómo desplegar el frontend en **Dongee** y conectarlo con el backend en **Render**.

## ✅ ¿Funciona Frontend en Dongee + Backend en Render?

**¡SÍ!** Funciona perfectamente. Solo necesitas:
1. Configurar las URLs correctas en el frontend
2. Permitir CORS en el backend para tu dominio de Dongee
3. Hacer el build del frontend y subirlo a Dongee

---

## 📋 Paso 1: Configuración del Dominio

✅ **Ya está configurado para `farmeoa.com`**

El dominio `farmeoa.com` ya está configurado en:
- ✅ `src/utils/api.js` - Apunta al backend en Render
- ✅ `backend/config/app.js` - Permite CORS desde farmeoa.com

**No necesitas hacer cambios adicionales**, pero si quieres verificar:

### 1.1 Verificar `src/utils/api.js`

El archivo ya tiene esta configuración (líneas 25-29):
```javascript
// Si estamos en farmeoa.com (Frontend en Dongee, Backend en Render)
if (window.location.hostname === 'farmeoa.com' || 
    window.location.hostname === 'www.farmeoa.com') {
  return "https://otro-k5x5.onrender.com";
}
```

### 1.2 Verificar CORS en el Backend

El archivo `backend/config/app.js` ya incluye `farmeoa.com` en la lista de dominios permitidos (líneas 38-41).

**⚠️ IMPORTANTE:** Después de cualquier cambio en el backend, debes **redesplegar en Render** para que los cambios surtan efecto.

---

## 📦 Paso 2: Hacer el Build del Frontend

En tu terminal, ejecuta:

```bash
# Asegúrate de estar en la raíz del proyecto
cd "C:\otro - copia"

# Instalar dependencias (si no lo has hecho)
npm install

# Hacer el build de producción
npm run build
```

Esto creará una carpeta `dist/` con todos los archivos estáticos listos para subir.

---

## 📤 Paso 3: Subir el Frontend a Dongee

### 3.1 Acceder a cPanel de Dongee

1. Inicia sesión en tu cuenta de Dongee
2. Accede a **cPanel**

### 3.2 Subir Archivos

**Opción A: Usando el Administrador de Archivos**

1. En cPanel, busca **"Administrador de archivos"** o **"File Manager"**
2. Navega a la carpeta `public_html` (o la carpeta raíz de tu dominio)
3. **Elimina** todos los archivos existentes (si los hay)
4. Sube **todos los archivos** de la carpeta `dist/`:
   - Selecciona todos los archivos de `dist/`
   - Comprímelos en un ZIP
   - Súbelo a `public_html`
   - Extrae el ZIP en `public_html`

**Opción B: Usando FTP**

1. Usa un cliente FTP (FileZilla, WinSCP, etc.)
2. Conéctate a tu servidor Dongee con las credenciales FTP
3. Navega a `public_html`
4. Sube todos los archivos de la carpeta `dist/`

### 3.3 Estructura Final en Dongee

Tu `public_html` debe verse así:

```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── (otros archivos estáticos)
```

---

## 🔧 Paso 4: Configurar el Backend en Render

### 4.1 Verificar CORS

Asegúrate de que el backend en Render tenga tu dominio de Dongee en la lista de CORS permitidos (ya lo hiciste en el Paso 1.2).

### 4.2 Redesplegar el Backend

Después de actualizar `backend/config/app.js`:
1. Haz commit y push de los cambios
2. Render detectará los cambios y redesplegará automáticamente
3. O haz un despliegue manual desde el dashboard de Render

### 4.3 Verificar que el Backend Funciona

Abre en tu navegador:
```
https://otro-k5x5.onrender.com/api/test
```

Deberías ver una respuesta JSON.

---

## ✅ Paso 5: Probar la Conexión

1. Abre tu sitio en Dongee: `https://farmeoa.com`
2. Abre la **Consola del Navegador** (F12 → Console)
3. Verifica que no haya errores de CORS
4. Intenta hacer login o cualquier acción que llame al backend

### Errores Comunes:

**❌ Error: "No permitido por CORS"**
- Verifica que agregaste tu dominio en `backend/config/app.js`
- Verifica que redesplegaste el backend en Render
- Verifica que el dominio en `api.js` coincide exactamente

**❌ Error: "No se puede conectar con el servidor"**
- Verifica que el backend en Render esté funcionando
- Verifica la URL del backend en `api.js`
- Verifica que la URL de Render sea correcta

**❌ Error 404 en las rutas**
- Asegúrate de que subiste `index.html` a la raíz de `public_html`
- Verifica la configuración de reescritura de URLs en Dongee (si es necesario)

---

## 🔄 Actualizaciones Futuras

Cada vez que quieras actualizar el frontend:

1. Haz los cambios en tu código
2. Ejecuta `npm run build`
3. Sube los nuevos archivos de `dist/` a Dongee (reemplazando los antiguos)

---

## 📝 Resumen de URLs

- **Frontend (Dongee):** `https://farmeoa.com`
- **Backend (Render):** `https://otro-k5x5.onrender.com`
- **API Endpoint:** `https://otro-k5x5.onrender.com/api/...`

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend en Render
3. Verifica que ambas configuraciones (frontend y backend) tengan el mismo dominio

¡Listo! Tu aplicación debería funcionar con el frontend en Dongee y el backend en Render. 🎉

