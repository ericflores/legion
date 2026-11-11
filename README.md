# Legión — sitio web

Sitio de la novela *Legión*, de Efraín A. Flores Acosta. Es un sitio
estático hecho con [Astro](https://astro.build): no tiene servidor ni base
de datos, y se publica gratis en GitHub Pages.

Todo el texto y las imágenes viven en la carpeta [`contenido/`](contenido/).
Para cambiar el sitio no hace falta tocar nada más.

## Cambiar el contenido

Cada cambio guardado se publica solo en uno o dos minutos.

| Quiero cambiar…                              | Archivo                              |
| -------------------------------------------- | ------------------------------------ |
| Lema, frases, textos de portada y de contacto | `contenido/sitio.yaml`               |
| La sinopsis                                  | `contenido/novela.md`                |
| Ambientación y temas                         | `contenido/universo.md`              |
| Un personaje                                 | `contenido/personajes/` (uno por archivo) |
| Las canciones de la banda sonora             | `contenido/canciones.yaml`           |
| Las librerías que tienen la novela           | `contenido/librerias.yaml`           |
| El directorio de otras librerías, por municipio | `contenido/directorio.yaml`       |
| Una venta o presentación                     | `contenido/encuentros/` (una por archivo) |
| La biografía y los futuros proyectos         | `contenido/autor.md`                 |
| La portada o la foto del autor               | `contenido/imagenes/`                |

Hay dos maneras de editar:

1. **Con el editor visual (recomendado).** Entra a
   [app.pagescms.org](https://app.pagescms.org) con tu cuenta de GitHub,
   elige este repositorio y verás un formulario por cada fila de la tabla.
   Guardar publica el cambio.
2. **Directamente en GitHub.** Abre el archivo, pulsa el lápiz, cambia el
   texto y pulsa **Commit changes**.

### Anunciar un encuentro

Cada encuentro es una tarjeta. Se pueden dejar preparadas muchas a la vez:
el sitio muestra solo las que están dentro de su periodo de visibilidad.

En el editor visual: **Encuentros → Add an entry**. A mano: en
`contenido/encuentros/`, crea un archivo como `2027-03-14-san-juan.md`
copiando el que ya existe:

```md
---
titulo: Venta itinerante de Legión
fecha: 2027-03-14
hora: Desde las 10:00 a. m.
lugar: Nombre del lugar
direccion: Calle, pueblo, Puerto Rico
mapa:
enlace:
enlace_texto:
visible_desde: 2027-02-15
visible_hasta:
---

Aquí puede ir un párrafo opcional con más detalles.
```

- Las fechas siempre van como `año-mes-día`.
- **`visible_desde`**: antes de ese día la tarjeta está guardada pero no se
  ve. Vacío: se ve desde que se publica.
- **`visible_hasta`**: después de ese día se oculta sola. Vacío: se ve hasta
  el día del encuentro (`fecha`).
- El enlace **Cómo llegar** se crea solo a partir del lugar y la dirección.
  Si quieres uno distinto, pégalo en `mapa`.
- `enlace` añade un enlace con más información; `enlace_texto` es lo que
  dice (por omisión, "Más información").
- No hay que borrar las tarjetas viejas. Si no queda ninguna visible, el
  sitio muestra el texto `sin_fechas` de `contenido/sitio.yaml`.
- El sitio se vuelve a publicar solo cada madrugada, y además la página
  comprueba la fecha al abrirse, así que las tarjetas aparecen y
  desaparecen el día exacto sin que nadie haga nada.

### Añadir una canción

En `contenido/canciones.yaml`, copia un bloque de cuatro líneas. `video` es
el código de YouTube de la canción: lo que aparece después de `v=` en su
enlace (por ejemplo, en `youtube.com/watch?v=hLQl3WQQoQ0` es `hLQl3WQQoQ0`).
El orden de la lista es el orden en que suenan. Esta lista es independiente
de la playlist de YouTube: si añades una canción allí, añádela también aquí.

### Añadir una librería

En `contenido/librerias.yaml`, copia un bloque de tres líneas respetando
los espacios del principio. `lugar` y `enlace` pueden quedar vacíos.

### Cambiar una imagen

Sube la imagen nueva a `contenido/imagenes/` y escribe su nombre exacto en
`portada` (en `sitio.yaml`) o en `foto` (en `autor.md`). El sitio la
reduce y la optimiza solo; conviene subirla grande (1200 px de ancho o más).

### Si algo sale mal

Si un cambio tiene un error (por ejemplo, una fecha mal escrita), el sitio
publicado **no se rompe**: se queda como estaba. GitHub envía un correo
avisando, y en la pestaña **Actions** del repositorio el mensaje en rojo
dice qué archivo hay que corregir.

## Puesta en marcha (una sola vez)

1. **GitHub Pages.** En el repositorio: *Settings → Pages → Source* →
   **GitHub Actions**. A partir de ahí cada cambio en `main` se publica solo
   (ver [`.github/workflows/publicar.yml`](.github/workflows/publicar.yml)).
   Si el repositorio es un *fork*, hay que activar antes los workflows en
   la pestaña **Actions**.
2. **Formulario de contacto.** Pide una clave gratuita en
   [web3forms.com](https://web3forms.com) con el correo donde deben llegar
   los mensajes y pégala en `clave_web3forms`, al final de
   `contenido/sitio.yaml`. La clave no es secreta: solo sirve para enviar a
   ese correo. El plan gratuito admite 250 mensajes al mes.
3. **Dominio propio (opcional).** En *Settings → Pages → Custom domain*
   escribe el dominio, y en el DNS crea un registro `CNAME` que apunte a
   `USUARIO.github.io`. El sitio detecta el dominio solo; no hay que cambiar
   ningún archivo.

## Desarrollo local

Requiere Node 22.

```sh
npm install
npm run dev      # http://localhost:4321, se actualiza al guardar
npm run check    # revisa tipos y contenido
npm run build    # genera el sitio en dist/
```

### Dónde está cada cosa

- `contenido/` — textos e imágenes. Su forma se valida en
  `src/content.config.ts`.
- `src/styles/global.css` — colores, tipografías y medidas, como variables
  al principio del archivo.
- `src/components/` — una sección de la página por archivo.
- `src/pages/` — la página principal, la de agradecimiento del formulario y
  la de error 404.
- `.pages.yml` — los formularios del editor visual. Si se añade un campo en
  `src/content.config.ts`, hay que añadirlo también aquí.
