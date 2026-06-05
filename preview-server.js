#!/usr/bin/env node
/**
 * Servidor para servir la SPA en modo preview/producción
 * Sirve archivos estáticos de dist/ y fallback a index.html para SPA routing
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

// Servir archivos estáticos de dist/
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  etag: false,
}));

// Fallback para SPA: todas las rutas no-archivo sirven index.html
app.use((req, res, next) => {
  // Si la solicitud es para un archivo (tiene extensión), 404
  if (path.extname(req.path)) {
    return res.status(404).send('File not found');
  }

  // Si no, es una ruta SPA → servir index.html
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
  console.log(`💡 Todas las rutas son redirigidas a index.html (SPA routing)\n`);
});
