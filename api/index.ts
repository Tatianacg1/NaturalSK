import { readFileSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Si es una ruta API, no manejar aquí (ya está en rewrites)
  if (req.url?.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // SPA Fallback: servir index.html para todas las demás rutas
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(indexHtml);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to serve index.html' });
  }
}
