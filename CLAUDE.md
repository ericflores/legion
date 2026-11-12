# Legión — instrucciones para Claude

Sitio estático (Astro) de la novela *Legión*. La guía para personas está en
`README.md`; léela antes de tocar contenido o estructura.

## Flujo de trabajo: primero `dev`, luego `main`

- Los cambios de diseño, estructura o contenido se hacen y se suben primero a
  la rama **`dev`**. Se publican solos en https://dev.legion.fans (sitio de
  pruebas, no indexado).
- El dueño del sitio lo revisa ahí. **Solo cuando él lo apruebe** se pasa el
  cambio a **`main`**, que publica en https://legion.fans.
- No subas cambios directamente a `main` salvo que te lo pidan de forma
  expresa.
- Los cambios hechos desde Pages CMS llegan a `main`; antes de empezar a
  trabajar, trae `main` y ponlo al día en `dev`.

## Comprobaciones antes de subir

```sh
npm run check    # tipos y contenido
npm run build    # el sitio compila
```

Si se toca `src/lib/humo.frag`, hay que ejecutar además `npm run marmol`.
