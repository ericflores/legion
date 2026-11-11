// Dibuja el primer instante del humo del título y lo guarda como imagen fija
// (src/assets/marmol.webp).
//
// El humo del título se anima con WebGL (src/lib/humo.frag). Esta imagen es
// ese mismo dibujo, quieto: lo que se ve mientras carga la página y lo único
// que se ve si el navegador no puede animarlo o el visitante pidió menos
// movimiento. Como sale del mismo código, al arrancar la animación no se nota
// el cambio.
//
// Uso: "npm run marmol", después de tocar src/lib/humo.frag.
// Necesita Chrome o Chromium instalado. Si no lo encuentra:
//   CHROME=/ruta/al/chrome npm run marmol
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const raiz = new URL('../', import.meta.url);
const destino = new URL('src/assets/marmol.webp', raiz).pathname;
const sombreador = readFileSync(new URL('src/lib/humo.frag', raiz), 'utf8').replace(/\/\/.*$/gm, '');

// El título se dibuja estrechado (scaleX en Portada.astro) y la imagen con él:
// se genera ensanchada en la misma proporción para que el humo no se deforme.
const portada = readFileSync(new URL('src/components/Portada.astro', raiz), 'utf8');
const estrecho = Number(portada.match(/scaleX\(([\d.]+)\)/)?.[1]);
if (!estrecho) throw new Error('No encuentro el scaleX del título en src/components/Portada.astro');

// La imagen se ajusta al alto de la caja del título, que mide unas 3,1 veces
// su alto: con 4 sobra.
const ALTO = 560;
const ANCHO = ALTO * 4;

// Esto se ejecuta dentro del navegador.
function pintar({ sombreador, ancho, alto, estrecho }) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const gl = lienzo.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('Este Chrome no tiene WebGL disponible');
  const compilar = (tipo, texto) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, texto);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const programa = gl.createProgram();
  gl.attachShader(programa, compilar(gl.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }'));
  gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, sombreador));
  gl.bindAttribLocation(programa, 0, 'a');
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programa));
  gl.useProgram(programa);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.viewport(0, 0, ancho, alto);
  gl.uniform2f(gl.getUniformLocation(programa, 'u_origen'), 0, 0);
  gl.uniform2f(gl.getUniformLocation(programa, 'u_escala'), estrecho / alto, 1 / alto);
  gl.uniform1f(gl.getUniformLocation(programa, 'u_t'), 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return lienzo.toDataURL('image/png');
}

// Abre un Chrome sin ventana y devuelve la dirección para darle órdenes.
function abrir(ejecutable, perfil) {
  return new Promise((resolver, rechazar) => {
    const chrome = spawn(
      ejecutable,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${perfil}`,
        // dibuja por software: sale igual en cualquier máquina, tenga o no tarjeta gráfica
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let salida = '';
    chrome.on('error', rechazar);
    chrome.on('exit', () => rechazar(new Error(salida.trim() || `${ejecutable} se cerró sin más`)));
    chrome.stderr.on('data', (trozo) => {
      salida += trozo;
      const puerto = salida.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//)?.[1];
      if (puerto) resolver({ chrome, puerto });
    });
  });
}

const perfil = mkdtempSync(join(tmpdir(), 'marmol-'));
const candidatos = [
  process.env.CHROME,
  'google-chrome',
  'chromium',
  'chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

let navegador;
for (const ejecutable of candidatos) {
  try {
    navegador = await abrir(ejecutable, perfil);
    break;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (!navegador) throw new Error('No encuentro Chrome ni Chromium. Indica su ruta: CHROME=/ruta/al/chrome npm run marmol');

try {
  const pestanas = await (await fetch(`http://127.0.0.1:${navegador.puerto}/json`)).json();
  const conexion = new WebSocket(pestanas.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolver, rechazar) => {
    conexion.onopen = resolver;
    conexion.onerror = () => rechazar(new Error('No pude conectar con Chrome'));
  });
  const respuesta = await new Promise((resolver) => {
    conexion.onmessage = (mensaje) => resolver(JSON.parse(mensaje.data));
    conexion.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(${pintar})(${JSON.stringify({ sombreador, ancho: ANCHO, alto: ALTO, estrecho })})`,
          returnByValue: true,
        },
      }),
    );
  });
  conexion.close();
  const fallo = respuesta.result?.exceptionDetails;
  if (fallo) throw new Error(fallo.exception?.description ?? fallo.text);

  const png = Buffer.from(respuesta.result.result.value.split(',')[1], 'base64');
  const info = await sharp(png).webp({ quality: 88 }).toFile(destino);
  console.log(`marmol.webp: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} kB`);
} finally {
  navegador.chrome.removeAllListeners('exit');
  navegador.chrome.kill();
  await new Promise((resolver) => navegador.chrome.on('close', resolver));
  rmSync(perfil, { recursive: true, force: true });
}
