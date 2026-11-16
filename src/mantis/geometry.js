// =============================================================
//  Geometrias dos louva-a-deus (corpo, membros, olhos, roupas)
//  Todas são criadas uma única vez e reutilizadas (cache), tanto
//  pelos noivos quanto pelos convidados (que usam instancing).
// =============================================================
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V2 = THREE.Vector2;
const cache = new Map();
export function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** Pinta toda a geometria com uma cor de vértice (para juntar peças coloridas). */
export function paint(geo, color) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** Junta geometrias garantindo os mesmos atributos (position, normal, uv, color opcional). */
export function merge(list, withColor = false) {
  const prepared = list.map((g) => {
    let geo = g.index ? g.toNonIndexed() : g.clone();
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (withColor && !geo.attributes.color) paint(geo, 0xffffff);
    for (const k of Object.keys(geo.attributes)) {
      if (!['position', 'normal', 'uv', ...(withColor ? ['color'] : [])].includes(k)) geo.deleteAttribute(k);
    }
    return geo;
  });
  return mergeGeometries(prepared, false);
}

/** Torno ao longo do eixo +X. profile = [[raio, x], ...] */
export function latheX(profile, radial = 16) {
  const pts = profile.map(([r, x]) => new V2(Math.max(0, r), x));
  const g = new THREE.LatheGeometry(pts, radial);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Segmento de membro arredondado (cápsula afunilada com leve barriga), ao longo de +X. */
export function limb(len, r0, r1, bulge = 0, radial = 14, steps = 10) {
  const pts = [];
  const capN = 5;
  for (let i = 0; i <= capN; i++) {
    const a = -Math.PI / 2 + (i / capN) * Math.PI / 2;
    pts.push([r0 * Math.cos(a), r0 * Math.sin(a)]);
  }
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    pts.push([lerp(r0, r1, t) + bulge * Math.sin(Math.PI * t), t * len]);
  }
  for (let i = 0; i <= capN; i++) {
    const a = (i / capN) * Math.PI / 2;
    pts.push([r1 * Math.cos(a), len + r1 * Math.sin(a)]);
  }
  return latheX(pts, radial);
}

/** Espinhos (cones pequenos) ao longo de um segmento, apontando para -Y local. */
function spines(len, r, count, size, startT = 0.15, endT = 0.9, dir = -1) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const t = lerp(startT, endT, i / Math.max(1, count - 1));
    for (const side of [-1, 1]) {
      const c = new THREE.ConeGeometry(size * 0.32, size * (i % 2 ? 1 : 0.7), 6);
      c.translate(0, -size * 0.5, 0);
      c.rotateZ(0.5); // inclinado para trás
      c.translate(t * len, dir * r * 0.82, side * r * 0.35);
      parts.push(c);
    }
  }
  return parts;
}

/** Raio do tórax na altura y (espaço da junta do tórax). Usado pelas roupas. */
export function chestR(y) {
  const t = Math.min(1, Math.max(0, y / 0.86));
  let r = lerp(0.2, 0.105, smooth(0.05, 1.0, t));
  r += 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t);
  return r;
}

/**
 * Superfície que "veste" um corpo de revolução (eixo Y).
 * radiusFn(y) -> raio; widthFn(y) -> meia-largura angular (rad, PI = volta toda)
 * zScale achata frente/trás como o tórax.
 */
export function wrapSurface({ y0, y1, radiusFn, widthFn = () => Math.PI, center = 0, zScale = 0.86, segY = 24, segA = 32, closed = false }) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segY; j++) {
    const v = j / segY, y = lerp(y0, y1, v);
    const r = radiusFn(y, v), w = widthFn(y, v);
    for (let i = 0; i <= segA; i++) {
      const u = i / segA;
      const a = center + (u * 2 - 1) * w;
      pos.push(Math.sin(a) * r, y, Math.cos(a) * r * zScale);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < segY; j++) for (let i = 0; i < segA; i++) {
    const a = j * (segA + 1) + i, b = a + segA + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Rosa estilizada (pétalas em espiral), base na origem, abrindo para +Y. */
export function roseGeo(size = 0.1, detail = 1) {
  return cached('rose' + size + detail, () => {
    const parts = [];
    const n = detail > 0.5 ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const ring = i / n;
      const p = new THREE.SphereGeometry(size * (0.45 + ring * 0.5), detail > 0.5 ? 8 : 5, detail > 0.5 ? 6 : 4, 0, Math.PI, 0, Math.PI * 0.55);
      p.scale(1, 1.1, 0.5);
      p.rotateX(-0.3 - ring * 0.9);
      p.translate(0, size * 0.25, size * 0.12 * ring);
      p.rotateY(i * 2.4);
      parts.push(p);
    }
    parts.push(new THREE.SphereGeometry(size * 0.35, 8, 6).translate(0, size * 0.35, 0));
    return merge(parts);
  });
}

// ------------------------------------------------------------------
//  Peças do corpo. q = 'hi' (noivos) ou 'lo' (convidados)
// ------------------------------------------------------------------
export function bodyGeos(q = 'hi') {
  return cached('body-' + q, () => {
    const R = q === 'hi' ? 28 : 14; // segmentos radiais
    const S = q === 'hi' ? 1 : 0.6;

    // Abdômen segmentado (torno com sulcos), ao longo de +X
    const abd = [];
    const AN = Math.round(60 * S);
    const len = 1.05;
    abd.push([0, 0]);
    for (let i = 1; i < AN; i++) {
      const t = i / AN;
      const u = t < 0.32 ? (t / 0.32) * 0.5 : 0.5 + ((t - 0.32) / 0.68) * 0.5;
      let r = 0.27 * Math.pow(Math.sin(Math.PI * u), 0.75);
      const groove = Math.pow(Math.abs(Math.sin(t * Math.PI * 7)), 6);
      r *= 1 - 0.07 * (1 - groove) * smooth(0.05, 0.2, t);
      abd.push([r, t * len]);
    }
    abd.push([0, len]);
    const abdomen = latheX(abd, R);
    abdomen.scale(1, 0.82, 1);

    // Tórax (protórax "peito" vertical), ao longo de +Y
    const ch = [];
    const CN = Math.round(30 * S);
    const clen = 0.86;
    ch.push([0, -0.05]);
    for (let i = 0; i <= CN; i++) {
      const t = i / CN;
      let r = lerp(0.2, 0.105, smooth(0.05, 1.0, t));
      r += 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t);
      ch.push([r, t * clen]);
    }
    ch.push([0.07, clen + 0.03]);
    ch.push([0, clen + 0.05]);
    const chest = latheX(ch, R);
    chest.rotateZ(Math.PI / 2); // +X -> +Y
    chest.scale(1, 1, 0.86);

    // Pelve (meso/metatórax)
    const pelvis = new THREE.SphereGeometry(1, R, Math.round(R * 0.7));
    pelvis.scale(0.24, 0.2, 0.34);

    // Pescoço curto
    const neck = limb(0.14, 0.07, 0.06, 0, Math.round(R * 0.6), 4);
    neck.rotateZ(Math.PI / 2);

    // Cabeça triangular de louva-a-deus
    const head = headGeo(q);

    // Membros
    const coxa = limb(0.34, 0.06, 0.055, 0.012, Math.round(R * 0.5), 8);
    const femurR = merge([limb(0.46, 0.075, 0.05, 0.03, Math.round(R * 0.6), 10), ...spines(0.46, 0.07, 5, 0.07)]);
    const tibiaR = merge([
      limb(0.36, 0.05, 0.028, 0.01, Math.round(R * 0.5), 8),
      ...spines(0.36, 0.045, 4, 0.05, 0.2, 0.8),
      hookGeo(),
    ]);
    const legFemur = limb(0.62, 0.042, 0.032, 0.008, Math.round(R * 0.4), 6);
    const legTibia = limb(0.7, 0.032, 0.02, 0.004, Math.round(R * 0.4), 6);
    const tarsus = merge([
      limb(0.2, 0.02, 0.016, 0, 8, 3),
      new THREE.SphereGeometry(0.035, 10, 8).scale(1.6, 0.6, 1.2).translate(0.21, -0.008, 0),
    ]);
    const antenna = limb(0.3, 0.013, 0.009, 0, 6, 3);
    antenna.rotateZ(Math.PI / 2);

    // Asas dobradas (folha) sobre o abdômen
    const wing = wingGeo(q);

    return { abdomen, chest, pelvis, neck, head, coxa, femurR, tibiaR, legFemur, legTibia, tarsus, antenna, wing };
  });
}

function hookGeo() {
  const t = new THREE.TorusGeometry(0.05, 0.014, 6, 10, Math.PI * 0.9);
  t.rotateZ(-Math.PI * 0.5);
  t.translate(0.38, -0.04, 0);
  return t;
}

function headGeo(q) {
  const seg = q === 'hi' ? 48 : 22;
  let g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const y = v.y;
    const w = 0.4 + 0.6 * smooth(-1.05, 0.5, y); // queixo estreito, topo largo
    let yy = y > 0 ? y * 0.78 : y * 1.05;
    let z = v.z * 0.62;
    if (y < -0.2) z += (-(y + 0.2)) * 0.18; // focinho levemente para frente
    // leve "testa" (clípeo) no centro frontal
    z += 0.08 * Math.exp(-((v.x * v.x) / 0.08)) * smooth(-0.6, 0.1, y) * (v.z > 0 ? 1 : 0);
    p.setXYZ(i, v.x * w, yy, z);
  }
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  g.scale(0.36, 0.36, 0.36);
  return g;
}

function wingGeo(q) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.15, 0.13, 0.6, 0.15, 0.92, 0.02);
  s.bezierCurveTo(0.6, -0.05, 0.2, -0.05, 0, 0);
  const g = new THREE.ShapeGeometry(s, q === 'hi' ? 24 : 10);
  // curva sobre o abdômen
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, -y * y * 2.2 + Math.sin(x * 3) * 0.02);
  }
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------
//  Olhos (esclera, íris, pupila, brilho, pálpebra) e boca
// ------------------------------------------------------------------
export function eyeGeos(q = 'hi', r = 0.15) {
  return cached('eye-' + q + r, () => {
    const s = q === 'hi' ? 40 : 18;
    const sclera = new THREE.SphereGeometry(r, s, Math.round(s * 0.75));
    const iris = new THREE.SphereGeometry(r * 1.012, s, Math.round(s / 2), 0, Math.PI * 2, 0, 0.62);
    iris.rotateX(Math.PI / 2);
    const pupil = new THREE.SphereGeometry(r * 1.02, s, Math.round(s / 3), 0, Math.PI * 2, 0, 0.33);
    pupil.rotateX(Math.PI / 2);
    const shine = merge([
      new THREE.SphereGeometry(r * 0.16, 10, 8).translate(r * 0.32, r * 0.36, r * 0.9),
      new THREE.SphereGeometry(r * 0.07, 8, 6).translate(-r * 0.25, -r * 0.3, r * 0.97),
    ]);
    // pálpebra superior: hemisfério que gira sobre o olho
    const lid = new THREE.SphereGeometry(r * 1.06, s, Math.round(s / 2), 0, Math.PI * 2, 0, Math.PI / 2);
    return { sclera, iris, pupil, shine, lid };
  });
}

export function mouthGeos(q = 'hi') {
  return cached('mouth-' + q, () => {
    const smile = new THREE.TorusGeometry(0.065, 0.014, 8, 20, Math.PI * 0.8);
    smile.rotateZ(Math.PI + Math.PI * 0.1);
    const kiss = new THREE.TorusGeometry(0.03, 0.017, 8, 16);
    const open = new THREE.SphereGeometry(0.05, 14, 10);
    open.scale(1, 1.3, 0.5);
    return { smile, kiss, open };
  });
}

/** Cílios (noiva / madrinhas) presos na pálpebra. */
export function lashGeo(r = 0.15) {
  return cached('lash' + r, () => {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const a = -0.2 + i * 0.22;
      const c = new THREE.ConeGeometry(0.012, 0.09, 5);
      c.translate(0, 0.045, 0);
      c.rotateZ(-0.6 - i * 0.25);
      c.rotateX(0.3);
      c.translate(Math.cos(a + 0.9) * r * 0.9 + 0.02, Math.sin(a + 0.9) * r * 0.5 + r * 0.55, r * 0.6);
      parts.push(c);
    }
    return merge(parts);
  });
}
