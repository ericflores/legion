import type { APIRoute } from 'astro';
import { ruta } from '../lib/sitio';

// El sitio de pruebas (rama dev) pide a los buscadores que no entren
export const GET: APIRoute = ({ site }) =>
  new Response(
    process.env.SITIO_DE_PRUEBAS
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${new URL(ruta('/sitemap-index.xml'), site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
