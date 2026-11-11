// Humo del título: vetas de mármol que suben y se enroscan despacio.
//
// Es el dibujo de las letras de "LEGIÓN". Lo pinta el navegador con WebGL
// (ver Portada.astro) y, congelado en el primer instante, es también la imagen
// fija src/assets/marmol.webp que se ve antes de que arranque la animación o
// cuando no puede haberla. Después de tocar este archivo hay que regenerarla
// con "npm run marmol".
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform vec2 u_origen; // dónde empieza el lienzo dentro de la caja del título, en píxeles del lienzo
uniform vec2 u_escala; // de píxeles del lienzo a unidades del dibujo (1 = alto de la caja)
uniform float u_px; // lo que mide un píxel del lienzo en unidades del dibujo
uniform float u_t; // segundos de animación

const vec3 MARFIL = vec3(0.957, 0.925, 0.851); // el mismo de --marfil
const vec3 HUMO = vec3(0.36, 0.34, 0.32);
const float FUERZA = 1.45; // cuánto se marcan las vetas
const float SUBIDA = 0.045; // velocidad de subida: recorre el alto del título en medio minuto

// Números al azar a partir de una posición. Sin senos: así sale el mismo
// dibujo en todas las tarjetas gráficas.
float azar(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 azar2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

// Ruido suave. x: el valor; yz: su pendiente en cada eje.
vec3 ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = azar2(i) * 2.0 - 1.0;
  vec2 gb = azar2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 gc = azar2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 gd = azar2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  return vec3(
    va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k,
    ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va)
  );
}

float campana(float x) {
  return exp(-x * x);
}

// Un haz de humo por cada franja: un hilo principal, dos compañeros que se
// juntan y se abren con la corriente, y un velo que se difumina hacia un lado.
//   fase: coordenada que cruza las vetas (hay una en cada número entero)
//   pend: cuánto cambia la fase por unidad de dibujo (da el grosor real)
float haz(float fase, float pend, vec2 r, float semilla, float grosor) {
  float id = floor(fase + 0.5);
  float lado = fase - id;
  float h1 = azar(vec2(id, 1.7 + semilla));
  float h2 = azar(vec2(id, 5.3 + semilla));
  float h3 = azar(vec2(id, 9.1 + semilla));

  // a medio camino entre dos vetas no queda nada de ninguna
  float borde = 1.0 - smoothstep(0.4, 0.5, abs(lado));
  // unas difuminan hacia un lado y otras hacia el otro
  lado *= h3 > 0.5 ? 1.0 : -1.0;
  // cada veta aparece y se desvanece a lo largo de su recorrido
  float vida = smoothstep(-0.30, 0.22, ruido(r * 0.85 + 31.0 * vec2(h1, h2) + semilla).x);
  // pocas vetas marcadas y muchas tenues
  float peso = mix(0.22, 1.0, h1 * h1) * vida * borde;

  // un hilo nunca es más fino que el píxel: en su lugar se aclara
  float minimo = 0.75 * u_px;
  float w0 = grosor * 0.0050 * (0.55 + 0.9 * h2);
  float w1 = grosor * 0.0030;
  float w2 = grosor * 0.0024;
  float e0 = max(w0, minimo), e1 = max(w1, minimo), e2 = max(w2, minimo);
  float hilo0 = campana(lado / (e0 * pend)) * (w0 / e0);
  float hilo1 = campana((lado - 0.05 - 0.09 * h3) / (e1 * pend)) * (w1 / e1);
  float hilo2 = campana((lado + 0.04 + 0.07 * h2) / (e2 * pend)) * (w2 / e2);

  float velo = lado >= 0.0 ? pow(clamp(1.0 - lado / 0.45, 0.0, 1.0), 3.0) : campana(lado / (2.5 * e0 * pend));

  return peso * (0.52 * hilo0 + 0.28 * hilo1 + 0.20 * hilo2 + (0.14 + 0.06 * h3) * velo);
}

void main() {
  vec2 p = (gl_FragCoord.xy + u_origen) * u_escala;
  float t = u_t;

  // el dibujo entero sube despacio
  vec2 r = p * 1.45 + vec2(4.1, 2.3);
  r.y -= SUBIDA * t;

  // Remolinos que lo arrastran: grandes y perezosos primero, luego más finos.
  // Cada uno empuja en la dirección en que el ruido no cambia, de modo que la
  // corriente ni amontona ni separa las vetas: solo las dobla, como hace el
  // aire con el humo. Suben más despacio que el dibujo, que al atravesarlos
  // va cambiando de forma.
  vec3 a = ruido(r * 0.72 + vec2(0.0, 0.016 * t));
  r += 0.52 * vec2(a.z, -a.y);
  vec3 b = ruido(r * 1.65 + vec2(0.011 * t, 0.029 * t) + 19.0);
  r += 0.17 * vec2(b.z, -b.y);
  vec3 c = ruido(r * 3.7 + vec2(-0.019 * t, 0.048 * t) + 41.0);
  r += 0.034 * vec2(c.z, -c.y);

  // franjas inclinadas sobre el dibujo ya deformado: cada una es una veta
  float fase = dot(r, vec2(0.93, 0.36)) * 3.3 + 0.9 * a.x;
  float pend = max(length(vec2(dFdx(fase), dFdy(fase)) / u_escala), 0.6);

  float alfa = haz(fase, pend, r, 0.0, 1.0);
  // hebras más finas entre las vetas
  alfa += 0.5 * haz(fase * 2.37 + 0.31, pend * 2.37, r, 13.0, 0.6);
  alfa *= FUERZA * (0.85 + 0.5 * c.x);
  // y una bruma muy leve
  alfa += 0.045 * smoothstep(-0.25, 0.45, b.x + 0.6 * a.x);

  gl_FragColor = vec4(mix(MARFIL, HUMO, clamp(alfa, 0.0, 1.0)), 1.0);
}
