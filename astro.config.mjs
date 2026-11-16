import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE y BASE los pone solo el workflow de GitHub Pages
// (.github/workflows/publicar.yml), así el sitio funciona igual en
// usuario.github.io/repositorio que con un dominio propio.
const site = process.env.SITE || 'http://localhost:4321';
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // /home es una dirección de quien tenía este dominio antes y que Google aún
  // recuerda: en vez de un 404, lleva a la portada
  redirects: { '/home': base.endsWith('/') ? base : `${base}/` },
  // La página de agradecimiento del formulario no va al mapa del sitio
  integrations: [sitemap({ filter: (pagina) => !pagina.includes('/gracias/') })],
});
