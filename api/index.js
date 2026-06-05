import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Servir archivos estáticos de dist/
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: false,
}));

// SPA Fallback: todas las rutas no-archivo sirven index.html
app.use((req, res) => {
  // Si tiene extensión, es un intento de archivo que no existe → 404
  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }

  // Si no, es una ruta SPA → servir index.html
  try {
    const indexPath = path.join(distPath, 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading application');
  }
});

export default app;
