// =============================================================
//  Acessórios e roupas dos convidados (geometrias com cores de
//  vértice). Cada um é desenhado com instancing = 1 chamada só
//  para todos os convidados que usam aquele acessório.
//  "slot": head (cabeça), face (rosto), neck (pescoço),
//          chest (tronco), body (cintura)
// =============================================================
import * as THREE from 'three';
import { merge, paint, roseGeo, chestR, wrapSurface } from './geometry.js';

const T = THREE;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

function topHat() {
  return merge([
    paint(new T.CylinderGeometry(0.11, 0.1, 0.24, 18).translate(0, 0.14, 0), 0x18181f),
    paint(new T.CylinderGeometry(0.2, 0.2, 0.015, 22).translate(0, 0.02, 0), 0x18181f),
    paint(new T.CylinderGeometry(0.104, 0.103, 0.05, 18).translate(0, 0.055, 0), 0xffffff), // faixa = cor do convidado
  ], true);
}
function partyHat() {
  const cone = new T.ConeGeometry(0.11, 0.3, 18, 6);
  cone.translate(0, 0.17, 0);
  // listras
  const p = cone.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const stripe = Math.sin(a * 3 + p.getY(i) * 25) > 0;
    const c = stripe ? [1, 1, 1] : [1, 0.85, 0.3];
    col.set(c, i * 3);
  }
  cone.setAttribute('color', new T.BufferAttribute(col, 3));
  return merge([cone, paint(new T.SphereGeometry(0.04, 10, 8).translate(0, 0.33, 0), 0xffffff)], true);
}
function flowerCrown() {
  const parts = [];
  const cols = [0xff8fb1, 0xffffff, 0xffd34d, 0xc9a7ff, 0xff5f7e, 0x9fe8ff];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = roseGeo(0.045, 0).clone();
    r.rotateZ(Math.PI / 2); r.rotateY(-a);
    r.translate(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.15);
    parts.push(paint(r, cols[i % cols.length]));
    const leaf = new T.SphereGeometry(0.035, 6, 4).scale(0.5, 0.15, 1);
    leaf.rotateY(-a + 0.6); leaf.translate(Math.cos(a + 0.3) * 0.175, -0.01, Math.sin(a + 0.3) * 0.155);
    parts.push(paint(leaf, 0x4f9a35));
  }
  return merge(parts, true);
}
function bigBow() {
  const parts = [];
  for (const s of [1, -1]) {
    const w = new T.SphereGeometry(0.08, 12, 8); w.scale(1.2, 0.8, 0.45); w.translate(s * 0.09, 0, 0); w.rotateZ(s * 0.25);
    parts.push(paint(w, 0xffffff));
  }
  parts.push(paint(new T.SphereGeometry(0.04, 10, 8), 0xffffff));
  return merge(parts, true);
}
function glasses() {
  const parts = [];
  for (const s of [1, -1]) {
    const rim = new T.TorusGeometry(0.105, 0.014, 6, 24);
    rim.translate(s * 0.215, 0, 0);
    parts.push(paint(rim, 0xffffff));
    const lens = new T.CircleGeometry(0.1, 20).translate(s * 0.215, 0, -0.005);
    parts.push(paint(lens, 0x222244));
  }
  parts.push(paint(new T.CylinderGeometry(0.01, 0.01, 0.12, 6).rotateZ(Math.PI / 2), 0xffffff));
  return merge(parts, true);
}
function tiaraSmall() {
  const parts = [paint(new T.TorusGeometry(0.17, 0.01, 6, 20, Math.PI).rotateX(-0.3), 0xe8e8f0)];
  for (let i = 0; i < 5; i++) {
    const a = 0.3 + (i / 4) * (Math.PI - 0.6);
    parts.push(paint(new T.OctahedronGeometry(i === 2 ? 0.035 : 0.022).translate(Math.cos(a) * 0.17, Math.sin(a) * 0.16 + 0.02, 0), i === 2 ? 0xff5fa0 : 0xffffff));
  }
  return merge(parts, true);
}
function bowtie() {
  const parts = [];
  for (const s of [1, -1]) {
    const w = new T.ConeGeometry(0.045, 0.09, 4); w.rotateZ(s * Math.PI / 2); w.translate(s * 0.045, 0, 0); w.scale(1, 1, 0.4);
    parts.push(paint(w, 0xffffff));
  }
  parts.push(paint(new T.SphereGeometry(0.02, 8, 6), 0xffffff));
  return merge(parts, true);
}
function pearls() {
  const parts = [];
  for (let i = 0; i < 16; i++) {
    const a = -1.4 + (i / 15) * 2.8;
    const y = 0.73 - Math.cos(a * 0.5) * 0.05 + 0.05;
    const r = chestR(y) + 0.025;
    parts.push(paint(new T.SphereGeometry(0.017, 6, 5).translate(Math.sin(a) * r, y - 0.02, Math.cos(a) * r * 0.86), 0xffffff));
  }
  return merge(parts, true);
}
function lei() {
  const parts = [];
  const cols = [0xff5f9e, 0xffd34d, 0xffffff, 0xff8a3d, 0xc9a7ff];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 0.17;
    parts.push(paint(new T.SphereGeometry(0.035, 7, 5).translate(Math.sin(a) * r, 0.72 - Math.max(0, Math.cos(a)) * 0.12, Math.cos(a) * r * 0.9), cols[i % 5]));
  }
  return merge(parts, true);
}

// --- roupas especiais ---
function suit() {
  const open = (y) => 0.12 + smooth(0, 0.66, y) * 0.5;
  const jr = (y) => (y < 0.02 ? 0.21 + (0.02 - y) * 0.5 : chestR(y) + 0.03);
  return merge([
    paint(wrapSurface({ y0: -0.14, y1: 0.64, radiusFn: jr, widthFn: (y) => Math.PI - open(y), center: Math.PI, segY: 12, segA: 18 }), 0x1b1b24),
    paint(wrapSurface({ y0: 0.0, y1: 0.68, radiusFn: (y) => chestR(y) + 0.018, widthFn: (y) => open(y) + 0.05, segY: 8, segA: 6 }), 0xf6f6f0),
    paint(new T.TorusGeometry(0.11, 0.022, 6, 16).rotateX(Math.PI / 2).scale(1, 1, 0.86).translate(0, 0.7, 0), 0xf6f6f0),
    ...bowtieAt(0.67, 0x18181f),
    paint(roseGeo(0.04, 0).clone().rotateX(1.2).translate(0.12, 0.47, chestR(0.47) * 0.86 + 0.04), 0xff5f9e),
  ], true);
}
function bowtieAt(y, col) {
  const parts = [];
  for (const s of [1, -1]) {
    const w = new T.ConeGeometry(0.05, 0.1, 4); w.rotateZ(s * Math.PI / 2); w.translate(s * 0.05, 0, 0); w.scale(1, 1, 0.4);
    w.translate(0, y, chestR(y) * 0.86 + 0.045);
    parts.push(paint(w, col));
  }
  parts.push(paint(new T.SphereGeometry(0.022, 8, 6).translate(0, y, chestR(y) * 0.86 + 0.045), col));
  return parts;
}
function dressTop() {
  return merge([
    paint(wrapSurface({ y0: -0.1, y1: 0.56, radiusFn: (y) => chestR(Math.max(0, y)) + 0.02, segY: 10, segA: 20 }), 0xffffff),
    paint(new T.TorusGeometry(chestR(0.56) + 0.022, 0.018, 6, 20).rotateX(Math.PI / 2).scale(1, 1, 0.86).translate(0, 0.56, 0), 0xffffff),
  ], true);
}
function dressSkirt() {
  const segY = 10, segA = 32, pos = [], idx = [];
  for (let j = 0; j <= segY; j++) {
    const d = (j / segY) * 0.62;
    for (let i = 0; i <= segA; i++) {
      const a = (i / segA) * Math.PI * 2;
      const r = (0.25 + 0.5 * (1 - Math.pow(1 - d / 0.62, 2))) * (1 + 0.05 * Math.sin(a * 10) * Math.min(1, d / 0.3));
      pos.push(Math.cos(a) * r, 0.06 - d, Math.sin(a) * r);
    }
  }
  for (let j = 0; j < segY; j++) for (let i = 0; i < segA; i++) {
    const a = j * (segA + 1) + i, b = a + segA + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return merge([paint(g, 0xffffff)], true);
}
function crown() {
  const parts = [];
  const band = new T.CylinderGeometry(0.15, 0.14, 0.09, 20, 1, true);
  parts.push(paint(band, 0xffd34d));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = new T.ConeGeometry(0.03, 0.11, 6).translate(Math.cos(a) * 0.145, 0.09, Math.sin(a) * 0.145);
    parts.push(paint(sp, 0xffd34d));
    parts.push(paint(new T.SphereGeometry(0.018, 6, 5).translate(Math.cos(a) * 0.145, 0.15, Math.sin(a) * 0.145), 0xffffff));
    parts.push(paint(new T.OctahedronGeometry(0.02).translate(Math.cos(a + 0.4) * 0.152, 0.0, Math.sin(a + 0.4) * 0.152), i % 2 ? 0xff2d55 : 0x2dd5ff));
  }
  return merge(parts, true);
}
function cape() {
  const g = wrapSurface({ y0: -0.85, y1: 0.66, center: Math.PI, zScale: 1, segY: 14, segA: 14,
    radiusFn: (y) => chestR(Math.max(0, Math.min(0.86, y))) + 0.04 + Math.max(0, 0.3 - y) * 0.35,
    widthFn: (y) => 0.9 + Math.max(0, 0.4 - y) * 0.3 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0.2) p.setZ(i, p.getZ(i) - (0.2 - y) * 0.35);
  }
  g.computeVertexNormals();
  const collar = new T.TorusGeometry(0.15, 0.04, 6, 20).rotateX(Math.PI / 2).scale(1, 1, 0.9).translate(0, 0.66, -0.01);
  return merge([paint(g, 0xb3123a), paint(collar, 0xffffff)], true);
}
function parachute() {
  const canopy = new T.SphereGeometry(0.9, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const p = canopy.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 2;
    col.set(k ? [1, 0.35, 0.6] : [1, 1, 1], i * 3);
  }
  canopy.setAttribute('color', new T.BufferAttribute(col, 3));
  canopy.translate(0, 0.6, 0);
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const top = new T.Vector3(Math.cos(a) * 0.86, 0.85, Math.sin(a) * 0.86);
    const len = top.length();
    const c = new T.CylinderGeometry(0.006, 0.006, len, 3);
    c.translate(0, len / 2, 0);
    c.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), top.clone().normalize()));
    lines.push(paint(c, 0xeeeeee));
  }
  return merge([canopy, ...lines], true);
}

let _defs;
/** Definição de cada acessório: onde fica preso e posição. */
export function accessoryDefs() {
  if (_defs) return _defs;
  _defs = {
    tophat: { slot: 'head', geo: topHat(), pos: [0.02, 0.2, -0.03], rot: [-0.1, 0, -0.15] },
    partyhat: { slot: 'head', geo: partyHat(), pos: [0.05, 0.2, 0], rot: [0, 0, -0.25] },
    flowercrown: { slot: 'head', geo: flowerCrown(), pos: [0, 0.2, 0.0], rot: [-0.25, 0, 0] },
    bow: { slot: 'head', geo: bigBow(), pos: [0.14, 0.22, -0.02], rot: [0, 0, -0.5] },
    tiara: { slot: 'head', geo: tiaraSmall(), pos: [0, 0.2, 0], rot: [-0.6, 0, 0] },
    glasses: { slot: 'face', geo: glasses(), pos: [0, 0.1, 0.17], rot: [0, 0, 0] },
    bowtie: { slot: 'neck', geo: bowtie(), pos: [0, 0.68, 0.135], rot: [0, 0, 0] },
    pearls: { slot: 'neck', geo: pearls(), pos: [0, 0, 0], rot: [0, 0, 0] },
    lei: { slot: 'neck', geo: lei(), pos: [0, 0, 0], rot: [0, 0, 0] },
    suit: { slot: 'chest', geo: suit(), pos: [0, 0, 0], rot: [0, 0, 0] },
    dressTop: { slot: 'chest', geo: dressTop(), pos: [0, 0, 0], rot: [0, 0, 0] },
    dressSkirt: { slot: 'body', geo: dressSkirt(), pos: [0, 0, 0], rot: [0, 0, 0] },
    crown: { slot: 'head', geo: crown(), pos: [0, 0.24, -0.02], rot: [-0.15, 0, 0.1] },
    cape: { slot: 'chest', geo: cape(), pos: [0, 0, 0], rot: [0, 0, 0] },
    parachute: { slot: 'root', geo: parachute(), pos: [0, 2.6, 0], rot: [0, 0, 0] },
  };
  return _defs;
}

export const HEAD_ACCS = ['tophat', 'partyhat', 'flowercrown', 'bow', 'tiara', null, null];
export const FACE_ACCS = ['glasses', null, null, null, null];
export const NECK_ACCS = ['bowtie', 'pearls', 'lei', null, null];
