#!/usr/bin/env node
/**
 * Servidor para servir la SPA en modo preview/producción
 * Sirve archivos estáticos de dist/ y fallback a index.html para SPA routing
 * Proxea /api → http://localhost:5000 (backend Express)
 *
 * Uso:
 *   npm run build
 *   node preview-server.js
 *
 * Accede a http://localhost:5173 (o el puerto configurado)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5173;
const BACKEND_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';
const DIST_DIR = path.join(__dirname, 'dist');

// Proxy /api → backend (debe ir ANTES de los archivos estáticos)
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('[proxy error]', err.message);
      res.status(502).json({ error: 'Backend no disponible. Asegúrate de que el servidor esté corriendo.' });
    },
  },
}));

// Servir archivos estáticos de dist/
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  etag: false,
}));

// Fallback para SPA: todas las rutas no-archivo sirven index.html
app.use((req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send('File not found');
  }
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Run: npm run build');
  }
});

app.listen(PORT, () => {
  console.log(`✅ SPA Preview Server escuchando en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo desde: ${DIST_DIR}`);
  console.log(`🔗 API proxy → ${BACKEND_URL}`);
  console.log(`💡 Todas las rutas SPA redirigen a index.html\n`);
});
