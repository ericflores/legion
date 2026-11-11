// Convierte el dibujo del mármol (src/assets/marmol.svg) en la imagen que usa
// el título. Ejecutar con "npm run marmol" después de tocar el SVG.
import sharp from 'sharp';

const origen = new URL('../src/assets/marmol.svg', import.meta.url);
const destino = new URL('../src/assets/marmol.webp', import.meta.url);

const info = await sharp(origen.pathname).webp({ quality: 82 }).toFile(destino.pathname);
console.log(`marmol.webp: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} kB`);
