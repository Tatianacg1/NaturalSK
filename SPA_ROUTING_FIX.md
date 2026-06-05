# 🐛 Fix: 404 en Navegación de Producción (SPA Routing)

## 🔍 El Problema

La app usa **client-side routing manual** (sin React Router), navegando con `window.history.pushState()`:
- Localmente: ✅ funciona porque Vite dev server sirve todas las rutas a `index.html`
- Producción: ❌ 404 porque el servidor web NO sabe servir `index.html` para rutas como `/admin`, `/reservar`

## ✅ Soluciones

### **Opción 1: Servidor Express integrado (RECOMENDADO)**

El backend ya soporta esto. Para usarlo en producción:

```bash
# 1. Build del frontend
npm run build

# 2. Copia dist/ al servidor junto con el backend
# (dist/ debe estar en la raíz del proyecto, server/ puede estar dentro o junto)

# 3. Inicia el backend (Express ahora sirve frontend automáticamente)
cd server
npm run dev
# o en producción: npm start
```

**Backend automáticamente:**
- ✅ Sirve archivos estáticos de `dist/`
- ✅ Fallback todas las rutas a `index.html` (SPA routing)
- ✅ Las APIs en `/api` siguen funcionando normalmente

**Ventajas:**
- Un solo servidor, un solo puerto
- Fácil de desplegar (ambos están juntos)
- CORS simplificado

---

### **Opción 2: Preview Server (Testing Local)**

Para probar la build localmente antes de producción:

```bash
# 1. Build
npm run build

# 2. Preview
node preview-server.js

# 3. Accede a http://localhost:5173
```

---

### **Opción 3: Nginx (Frontend separado del backend)**

Si el frontend y backend están en servidores distintos:

1. **Build el frontend:**
   ```bash
   npm run build
   ```

2. **Copia `dist/` al servidor web:**
   ```bash
   scp -r dist/ user@production.com:/var/www/naturalsound/dist
   ```

3. **Configura Nginx** (usa el archivo `nginx.conf.example`):
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/naturalsound
   sudo ln -s /etc/nginx/sites-available/naturalsound /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

La configuración:
- ✅ Sirve archivos estáticos con cache
- ✅ Fallback a `index.html` para SPA routing
- ✅ Proxy `/api` al backend (puerto 5000)

---

### **Opción 4: Apache (Frontend separado del backend)**

Si usas Apache:

1. **Build el frontend:**
   ```bash
   npm run build
   ```

2. **Copia `dist/` al DocumentRoot de Apache:**
   ```bash
   cp -r dist/* /var/www/html/
   ```

3. **Copia `.htaccess` a la raíz:**
   ```bash
   cp dist.htaccess.example /var/www/html/.htaccess
   ```

4. **Habilita mod_rewrite:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl reload apache2
   ```

La configuración:
- ✅ Reescribe todas las rutas a `index.html`
- ✅ Cache headers automáticos
- ✅ Compresión gzip

---

## 🚀 Pasos para Producción (Recomendado)

### Setup inicial:
```bash
# 1. En la máquina de desarrollo
npm run build

# 2. En el servidor de producción
git clone <tu-repo>
cd NaturalSK
npm run build
cd server
npm install

# 3. Configura variables de entorno (.env)
# MONGODB_URI=<tu-conexion-mongodb>
# NODE_ENV=production
# PORT=5000

# 4. Inicia el servidor
npm run dev  # o usa PM2 para producción: pm2 start npm -- run dev
```

### Con PM2 (recomendado para producción):
```bash
# Instala PM2 globalmente
npm install -g pm2

# En la carpeta server/
pm2 start "npm run dev" --name "naturalsound"
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### "Aún recibo 404 en producción"

**Verifica:**

1. ¿Está el `dist/` generado?
   ```bash
   ls -la dist/
   ```
   Debe tener `index.html` y archivos compilados.

2. ¿Está el servidor sirviendo desde el directorio correcto?
   ```bash
   # Express
   node -e "console.log(require('path').join(__dirname, '../../dist'))"
   
   # Nginx
   curl http://localhost/index.html  # Debe retornar HTML, no 404
   ```

3. ¿El servidor web tiene permisos?
   ```bash
   # Para Nginx/Apache
   sudo chown -R www-data:www-data /var/www/naturalsound/
   sudo chmod -R 755 /var/www/naturalsound/
   ```

4. **¿APIs funcionan pero rutas no?**
   - Fallback no está configurado
   - Verifica que `/api` no caiga en el fallback (las rutas en server.js lo previenen)

---

## 📋 Checklist Producción

- ✅ Build correctamente: `npm run build`
- ✅ `dist/index.html` existe
- ✅ Backend servidor (Express/Nginx/Apache) está configurado
- ✅ Fallback a `index.html` está activo
- ✅ `/api` routes NOT rebotando a fallback
- ✅ CORS configurado para dominio de producción
- ✅ SSL/HTTPS habilitado
- ✅ Cache headers para archivos estáticos

---

## 📚 Referencias

- [Vite SPA Routing](https://vitejs.dev/guide/ssr.html#generating-preloaded-directives)
- [Express static middleware](https://expressjs.com/en/api/express.static.html)
- [Nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Apache mod_rewrite](https://httpd.apache.org/docs/current/mod/mod_rewrite.html)
