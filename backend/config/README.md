# 📁 Configuraciones Centralizadas

## 🗄️ `database.js`
Configuración centralizada de la base de datos.

**Para cambiar la base de datos, edita solo este archivo:**
```javascript
export const dbConfig = {
  host: 'tu-servidor-db.com',
  port: 3306,
  user: 'tu-usuario',
  password: 'tu-password',
  database: 'tu-base-de-datos'
};
```

## ⚙️ `app.js`
Configuración general de la aplicación.

**Para cambiar configuraciones, edita solo este archivo:**
- **Puerto del servidor**
- **JWT Secret**
- **Dominios permitidos en CORS**
- **Límites de archivos**
- **Configuración de OpenAI**

## 🔧 Ventajas:
- ✅ **Un solo lugar** para cambiar configuraciones
- ✅ **No se te pasa nada** - todo centralizado
- ✅ **Fácil mantenimiento**
- ✅ **Configuración por ambiente** (desarrollo/producción)
- ✅ **Reutilizable** en toda la aplicación

## 📝 Uso:
```javascript
import { dbConfig, createConnection } from './config/database.js';
import { appConfig } from './config/app.js';

// Usar configuración de base de datos
const connection = await createConnection();

// Usar configuración de la app
const port = appConfig.server.port;
```



