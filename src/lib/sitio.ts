import { getEntry } from 'astro:content';

/** Un archivo único de contenido/ (sitio.yaml, novela.md…). */
export async function unico<C extends 'sitio' | 'novela' | 'universo' | 'autor' | 'librerias'>(
  coleccion: C,
) {
  const entrada = await getEntry(coleccion, coleccion);
  if (!entrada) throw new Error(`Falta el archivo de contenido "${coleccion}" en contenido/.`);
  return entrada;
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ruta interna que respeta la carpeta base del sitio. */
export const ruta = (destino = '/') => `${base}${destino.startsWith('/') ? destino : `/${destino}`}`;

/** Enlace a una sección de la página principal. */
export const seccion = (id: string) => `${ruta('/')}#${id}`;

export const SECCIONES = [
  { id: 'novela', nombre: 'La novela' },
  { id: 'conseguir', nombre: 'Dónde conseguirla' },
  { id: 'encuentros', nombre: 'Encuentros' },
  { id: 'autor', nombre: 'El autor' },
] as const;

export const MOTIVOS = [
  'Consulta general',
  'Conseguir un ejemplar',
  'Ventas y encuentros',
  'Invitar al autor',
  'Futuros proyectos',
] as const;
export type Motivo = (typeof MOTIVOS)[number];
