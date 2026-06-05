import { readFileSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Fallback SPA para Vercel — sirve index.html para client-side routing
 *
 * Vercel ejecuta esto cuando:
 * 1. El archivo NO existe en dist/
 * 2. NO es una ruta /api (esas se reescriben en vercel.json)
 *
 * De esta forma:
 * - /admin → sirve dist/index.html (SPA routing)
 * - /reservar → sirve dist/index.html (SPA routing)
 * - /api/auth → va a vercel.json rewrites → backend real
 * - /assets/app.js → sirve archivo estático (Vercel)
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const indexHtml = readFileSync(indexPath, 'utf-8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(indexHtml);
  } catch (error) {
    console.error('SPA fallback error:', error);
    res.status(500).send('Error loading application');
  }
}
