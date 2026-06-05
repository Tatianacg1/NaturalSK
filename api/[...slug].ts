import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Catch-all API route para SPA fallback en Vercel
 *
 * Sirve index.html para todas las rutas que no sean archivos estáticos,
 * permitiendo que el frontend maneje el routing client-side.
 *
 * Las rutas reales de API están en rewrites de vercel.json
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string[]) || [];
  const path = slug.join('/');

  // Si intenta acceder a /api directamente sin ruta, no manejar
  if (!path || path === '') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Serve index.html for client-side routing
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    if (!existsSync(indexPath)) {
      return res.status(404).json({ error: 'dist/index.html not found' });
    }

    const indexHtml = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(indexHtml);
  } catch (error) {
    console.error('Error serving index.html:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
