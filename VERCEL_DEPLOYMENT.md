# 🚀 Deploying NaturalSK en Vercel

## El Problema (Resuelto)

Vercel por defecto intenta servir archivos estáticos de `dist/`. Cuando accedes a una ruta SPA como `/admin`, Vercel busca un archivo `dist/admin` que no existe → 404.

## ✅ La Solución

Ahora hay un servidor Express en `api/index.js` que actúa como fallback:

1. **Archivo estático existe** (ej: `/assets/app.js`) → Vercel lo sirve directamente
2. **Archivo NO existe** (ej: `/admin`) → Vercel reescribe a `/api/index.js` → Express sirve `index.html` (SPA routing)

## 🔧 Configuración en Vercel

### 1. Conecta tu repo a Vercel
```bash
# En tu proyecto
git push
# Vercel va a detectar automáticamente y desplegar
```

### 2. Variables de Entorno (si el backend está en otro servidor)

En Vercel Dashboard:
- Ir a Settings → Environment Variables
- Agregar variables según sea necesario

### 3. Verificar Deployment

Después de que Vercel termine:
- ✅ Accede a `https://your-project.vercel.app/admin` (debe funcionar)
- ✅ Accede a `https://your-project.vercel.app/reservar` (debe funcionar)
- ✅ Recarga la página (no debe dar 404)
- ✅ Accede a `https://your-project.vercel.app/api/health` (si el backend está mismo servidor)

## 📁 Estructura en Vercel

```
dist/                   ← Archivos estáticos (compilados por npm run build)
├── index.html          ← SPA entry point
├── assets/             ← JS, CSS, imágenes compiladas
└── ...

api/
├── index.js           ← Express server (fallback SPA)
├── package.json       ← Dependencias de la función serverless
└── ...

vercel.json           ← Configuración de Vercel
```

## 🔌 Si tu Backend está en otro servidor

Si tu backend (MongoDB, Express real) está en **Heroku, Railway, etc.** y NO en Vercel:

1. Modifica `vercel.json` para hacer proxy a tu backend:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

2. En `api/index.js`, agrega proxy para `/api`:

```javascript
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer();

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    proxy.web(req, res, {
      target: 'https://your-backend.herokuapp.com', // Cambiar a tu backend
      changeOrigin: true
    });
  } else {
    // ... código SPA fallback
  }
});
```

Y agrega al `api/package.json`:
```json
"dependencies": {
  "express": "^4.18.2",
  "http-proxy": "^1.18.1"
}
```

## 🧪 Testing Local Antes de Vercel

```bash
# Build
npm run build

# Preview (simula Vercel localmente)
node preview-server.js

# Accede a http://localhost:5173
```

## ⚠️ Troubleshooting

### "Sigue dando 404"

1. **¿Se completó el build en Vercel?**
   - Verifica en Vercel Dashboard → Deployments
   - Mira los logs del build

2. **¿Está el `dist/` correcto?**
   ```bash
   npm run build
   ls dist/index.html  # Debe existir
   ```

3. **¿El `api/index.js` está siendo ejecutado?**
   - Verifica en Vercel Logs → Function Logs
   - Agrega `console.log()` en `api/index.js` y recarga

4. **¿El `api/package.json` tiene Express?**
   ```bash
   cat api/package.json  # Verifica que tenga "express": "^4.18.2"
   ```

### "Error: Cannot find module 'express'"

Vercel no instaló las dependencias. Soluciones:
- Reconstruir el deployment (Settings → Redeploy)
- O borrar el deployment y crear uno nuevo

## 📝 Resumen del Flujo

1. **Git push** → Vercel detecta cambios
2. **Vercel ejecuta** `npm run build`
3. **Genera** `dist/` con archivos compilados
4. **Vercel instala** `api/package.json` → Express
5. **Configura rewrites** según `vercel.json`
6. **Resultado:**
   - Rutas estáticas → serve desde `dist/`
   - Rutas SPA (no existen) → `/api/index.js` → Express → index.html
   - ✅ SPA routing funciona

## 🎉 Listo

Tu app ahora está desplegada y el routing SPA funciona en Vercel sin errores 404.
