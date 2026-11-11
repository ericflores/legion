import type { ImageMetadata } from 'astro';

const archivos = import.meta.glob<{ default: ImageMetadata }>(
  '/contenido/imagenes/*.{avif,gif,jpeg,jpg,png,svg,webp,AVIF,GIF,JPEG,JPG,PNG,SVG,WEBP}',
  { eager: true },
);

/**
 * Busca una imagen de contenido/imagenes/ por su nombre de archivo.
 * Acepta "portada.webp" o cualquier ruta que termine en ese nombre,
 * que es lo que escriben los editores visuales.
 */
export function imagen(ruta: string | undefined): ImageMetadata | undefined {
  if (!ruta) return undefined;
  const nombre = ruta.split('/').pop();
  const clave = Object.keys(archivos).find((k) => k.split('/').pop() === nombre);
  if (!clave) {
    const disponibles = Object.keys(archivos).map((k) => k.split('/').pop()).join(', ');
    throw new Error(
      `No encuentro la imagen "${ruta}" en contenido/imagenes/. ` +
        `Archivos que sí están: ${disponibles || '(ninguno)'}. ` +
        'Revisa que el nombre esté escrito igual, con mayúsculas y extensión.',
    );
  }
  return archivos[clave].default;
}
