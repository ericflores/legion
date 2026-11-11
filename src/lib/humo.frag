// Humo del título: humo denso, como el de un cigarrillo, que sube muy despacio
// por delante de las letras de "LEGIÓN".
//
// Lo pinta el navegador con WebGL (ver Portada.astro) y, congelado en el primer
// instante, es también la imagen fija src/assets/marmol.webp que se ve antes de
// que arranque la animación o cuando no puede haberla. Después de tocar este
// archivo hay que regenerarla con "npm run marmol".
//
// Cómo está hecho: una mancha de ruido suave (la masa de humo) se arrastra por
// una corriente de remolinos, que la estira en velos y hebras como hace el
// aire con el humo de verdad. La mancha sube; la corriente casi no se mueve.
precision highp float;

uniform vec2 u_origen; // dónde empieza el lienzo dentro de la caja del título, en píxeles del lienzo
uniform vec2 u_escala; // de píxeles del lienzo a unidades del dibujo (1 = alto de la caja)
uniform float u_t; // segundos de animación
uniform vec2 u_semilla; // desplazamiento al azar: da un humo distinto en cada visita
uniform float u_mezcla; // 0 = el humo de la imagen fija; 1 = el de esta visita

const vec3 MARFIL = vec3(0.957, 0.925, 0.851); // las letras: el mismo de --marfil
const vec3 HUMO = vec3(0.36, 0.36, 0.37); // gris del humo más espeso
const float FUERZA = 0.60; // cuánto llega a velar las letras el humo (0 = nada)
const float SUBIDA = 0.036; // velocidad de subida: recorre el alto del título en menos de medio minuto
const float CUBRE = 0.05; // cuánta superficie ocupa el humo (más alto = más humo)

// Números al azar a partir de una posición. Sin senos: así sale el mismo
// dibujo en todas las tarjetas gráficas.
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

// cada escala de ruido va girada respecto a la anterior, y es el doble de fina
const mat2 GIRO = mat2(1.624, 1.218, -1.218, 1.624);

// Cuánto vela el humo las letras en un punto (0 = nada, 1 = lo más espeso).
float humo(vec2 p, float t) {

  // La corriente. Unos remolinos altos y estrechos, que hacen subir el humo
  // en columnas que se mecen, y otros más pequeños que lo enroscan. Cada
  // punto se lleva hacia atrás por ella unos cuantos pasos; siempre en la
  // dirección en que el ruido no cambia, para que la corriente ni amontone ni
  // separe el humo: solo lo estira y lo dobla.
  const vec2 COLUMNAS = vec2(1.3, 0.715);
  vec2 q = p;
  for (int paso = 0; paso < 4; paso++) {
    vec3 a = ruido(q * COLUMNAS + vec2(0.0, -0.004 * t));
    vec3 b = ruido(q * 3.1 + vec2(5.2 + 0.003 * t, 1.3 - 0.009 * t));
    q -= 0.18 * (vec2(a.z * 0.66, -a.y * 1.2) + 0.22 * vec2(b.z, -b.y));
  }

  // La masa de humo: ruido de varias escalas sobre el dibujo ya arrastrado.
  // Sube entera, y lo más fino un poco más deprisa que lo grueso.
  float masa = 0.0, cuerpo = 0.0, peso = 0.5;
  vec2 s = q * 3.4;
  vec2 sube = vec2(0.0, -SUBIDA * 3.4 * t);
  for (int escala = 0; escala < 4; escala++) {
    masa += peso * ruido(s + sube * (1.0 + 0.25 * float(escala))).x;
    if (escala == 1) cuerpo = masa;
    s = GIRO * s + 11.7;
    sube = GIRO * sube;
    peso *= 0.55;
  }

  // El humo pasa por delante de las letras: donde hay, las vela de gris, más
  // cuanto más espeso; donde no, queda el marfil limpio. Las hebras salen de
  // la masa entera y, detrás, una bruma desenfocada de sus escalas gruesas.
  float espeso = max(masa + CUBRE, 0.0);
  float velo = 1.0 - exp(-5.0 * espeso * espeso / (espeso + 0.06));
  velo = 1.0 - (1.0 - velo) * (1.0 - 0.40 * smoothstep(-0.10, 0.22, cuerpo));
  return velo;
}

void main() {
  vec2 p = (gl_FragCoord.xy + u_origen) * u_escala + vec2(3.7, 1.9);
  // La página arranca con el humo de la imagen fija y en un par de segundos
  // se funde con el de esta visita, que sale de otro rincón del mismo dibujo.
  float velo = 0.0;
  if (u_mezcla < 1.0) velo += (1.0 - u_mezcla) * humo(p, u_t);
  if (u_mezcla > 0.0) velo += u_mezcla * humo(p + u_semilla, u_t);

  gl_FragColor = vec4(mix(MARFIL, HUMO, FUERZA * velo), 1.0);
}
