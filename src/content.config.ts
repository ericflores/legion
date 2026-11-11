// Describe la forma de cada archivo de la carpeta contenido/.
// Si falta un dato obligatorio o una fecha está mal escrita, la
// compilación falla con un mensaje que dice qué archivo arreglar,
// y el sitio publicado se queda como estaba.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un campo que se puede dejar vacío ("enlace:" sin nada a la derecha).
const opcional = <T extends z.ZodType>(tipo: T) =>
  z.preprocess((v) => (v === null || v === '' ? undefined : v), tipo.optional());

const texto = z.string().trim().min(1);
const enlace = z.url({ protocol: /^https?$/ });

const encabezado = { etiqueta: texto, titular: texto };

const unArchivo = (nombre: string) => glob({ pattern: nombre, base: './contenido' });

const sitio = defineCollection({
  loader: unArchivo('sitio.yaml'),
  schema: z.object({
    titulo: texto,
    autor: texto,
    genero: texto,
    editorial: texto,
    // una línea o varias: cada línea de la lista se muestra en su renglón
    lema: z
      .union([texto, z.array(texto).min(1)])
      .transform((v) => (Array.isArray(v) ? v : [v])),
    gancho: z.array(texto).default([]),
    frase: opcional(texto),
    portada: texto,
    portada_descripcion: texto,
    descripcion_buscadores: texto,
    personajes: z.object(encabezado),
    banda_sonora: z.object({
      ...encabezado,
      texto,
      enlace: opcional(enlace),
      enlace_texto: texto.default('Escuchar la playlist'),
    }),
    encuentros: z.object({ ...encabezado, sin_fechas: texto }),
    interludio: z.object({ titular: opcional(texto), texto: opcional(texto) }),
    contacto: z.object({
      ...encabezado,
      texto: opcional(texto),
      clave_web3forms: opcional(texto),
    }),
  }),
});

const novela = defineCollection({
  loader: unArchivo('novela.md'),
  schema: z.object({ ...encabezado, cita: opcional(texto), cierre: opcional(texto) }),
});

const universo = defineCollection({
  loader: unArchivo('universo.md'),
  schema: z.object({
    ...encabezado,
    datos: z.array(z.object({ titulo: texto, texto })).default([]),
  }),
});

const autor = defineCollection({
  loader: unArchivo('autor.md'),
  schema: z.object({
    etiqueta: texto,
    nombre: texto,
    foto: opcional(texto),
    foto_descripcion: opcional(texto),
    proyectos_titulo: opcional(texto),
    proyectos_texto: opcional(texto),
  }),
});

const librerias = defineCollection({
  loader: unArchivo('librerias.yaml'),
  schema: z.object({
    ...encabezado,
    nota: opcional(texto),
    lista: z
      .array(z.object({ nombre: texto, lugar: opcional(texto), enlace: opcional(enlace) }))
      .default([]),
  }),
});

const personajes = defineCollection({
  loader: glob({ pattern: '*.md', base: './contenido/personajes' }),
  schema: z.object({
    nombre: texto,
    rol: opcional(texto),
    orden: z.number().default(99),
  }),
});

const encuentros = defineCollection({
  loader: glob({ pattern: '*.md', base: './contenido/encuentros' }),
  schema: z.object({
    titulo: texto,
    fecha: z.coerce.date(),
    hora: opcional(texto),
    lugar: texto,
    direccion: opcional(texto),
    mapa: opcional(enlace),
  }),
});

export const collections = { sitio, novela, universo, autor, librerias, personajes, encuentros };
