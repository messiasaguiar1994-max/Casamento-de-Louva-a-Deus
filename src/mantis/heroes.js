// =============================================================
//  NOIVO e NOIVA — louva-a-deus em alta qualidade, com roupas
// =============================================================
import * as THREE from 'three';
import { MantisRig } from './rig.js';
import { Animator } from './anims.js';
import { heroMaterials, laceTex, woolTex, satinTex } from './materials.js';
import { chestR, wrapSurface, limb, merge, paint, roseGeo, lashGeo } from './geometry.js';

const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

class Hero {
  constructor({ body, iris }) {
    this.mats = heroMaterials({ body, iris });
    this.meshes = {};
    const sink = (parent, key, geo, mk) => {
      const m = new THREE.Mesh(geo, this.mats[mk]);
      m.castShadow = true; m.receiveShadow = true;
      parent.add(m);
      (this.meshes[key] ||= []).push(m);
      return m;
    };
    this.rig = new MantisRig({ q: 'hi', sink, eyeR: 0.15 });
    this.group = this.rig.root;
    this.anim = new Animator(Math.random());
    this.side = 1;
    this.walkSpeed = 0;
    this.blinkT = 2 + Math.random() * 3;
    this.extraUpdate = null;
  }
  add(parent, geo, mat, { shadow = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  update(dt, time, beat) {
    const P = this.anim.update(dt, beat, { side: this.side });
    if (this.footSpread) P.footSpread = this.footSpread;
    // piscar
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.rig.blink = 1; this.blinkT = 2 + Math.random() * 4; }
    if (this.rig.blink > 0) this.rig.blink = Math.max(0, this.rig.blink - dt / 0.16);
    this.rig.apply(P, time, this.walkSpeed, dt);
    if (this.extraUpdate) this.extraUpdate(dt, time, P);
  }
}

// ------------------------------------------------------------------
export class Groom extends Hero {
  constructor() {
    super({ body: 0x6fbb3c, iris: 0x1f9fb0 });
    this.side = 1;
    const R = this.rig;
    const black = new THREE.MeshPhysicalMaterial({ color: 0x15151c, map: woolTex(), roughness: 0.62, sheen: 1, sheenColor: new THREE.Color(0x5a5a80), sheenRoughness: 0.4, side: THREE.DoubleSide });
    const satin = new THREE.MeshPhysicalMaterial({ color: 0x0c0c10, map: satinTex(), roughness: 0.22, clearcoat: 0.6, sheen: 0.8, sheenColor: new THREE.Color(0x8888aa), side: THREE.DoubleSide });
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf7f7f2, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
    const red = new THREE.MeshPhysicalMaterial({ color: 0xc8102e, roughness: 0.45, sheen: 0.7, sheenColor: new THREE.Color(0xff8080) });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffcf5a, metalness: 1, roughness: 0.25 });

    // abertura em V na frente do paletó
    const open = (y) => 0.12 + smooth(0.0, 0.66, y) * 0.55;
    const jacketR = (y) => (y < 0.02 ? 0.215 + (0.02 - y) * 0.55 : chestR(y) + 0.032);
    const jacket = wrapSurface({ y0: -0.16, y1: 0.66, radiusFn: jacketR, widthFn: (y) => Math.PI - open(y), center: Math.PI, segY: 30, segA: 48 });
    this.add(R.chestJ, jacket, black);
    // camisa branca + colete
    const shirt = wrapSurface({ y0: 0.0, y1: 0.7, radiusFn: (y) => chestR(y) + 0.02, widthFn: (y) => open(y) + 0.06, segY: 20, segA: 16 });
    this.add(R.chestJ, shirt, white);
    // lapelas de cetim
    for (const s of [1, -1]) {
      const lap = wrapSurface({ y0: 0.22, y1: 0.66, radiusFn: (y) => chestR(y) + 0.045 + (y - 0.22) * 0.03, widthFn: () => 0.13, center: s * (0.12 + 0.3), segY: 14, segA: 6 });
      lap.rotateY(0);
      const m = this.add(R.chestJ, lap, satin);
      m.rotation.y = s * 0.05;
    }
    // botões
    for (let i = 0; i < 2; i++) {
      const b = this.add(R.chestJ, new THREE.SphereGeometry(0.018, 10, 8), satin);
      const y = 0.08 + i * 0.1;
      b.position.set(0, y, (chestR(y) + 0.04) * 0.86);
    }
    // gola + gravata borboleta
    const collar = new THREE.TorusGeometry(0.115, 0.025, 8, 24);
    collar.rotateX(Math.PI / 2); collar.scale(1, 1, 0.86);
    this.add(R.chestJ, collar, white).position.set(0, 0.71, 0);
    const bow = new THREE.Group();
    for (const s of [1, -1]) {
      const wing = new THREE.ConeGeometry(0.055, 0.11, 4);
      wing.rotateZ(s * Math.PI / 2); wing.translate(s * 0.055, 0, 0); wing.scale(1, 1, 0.4);
      this.add(bow, wing, satin);
    }
    this.add(bow, new THREE.SphereGeometry(0.025, 10, 8), satin);
    bow.position.set(0, 0.68, chestR(0.68) * 0.86 + 0.05);
    R.chestJ.add(bow);
    // rosa na lapela
    const bout = new THREE.Group();
    this.add(bout, roseGeo(0.05, 1), red).scale.setScalar(0.9);
    bout.position.set(0.12, 0.47, chestR(0.47) * 0.86 + 0.05);
    bout.rotation.set(1.2, 0, 0);
    R.chestJ.add(bout);

    // cauda do fraque
    for (const s of [1, -1]) {
      const tail = wrapSurface({ y0: -0.62, y1: -0.1, radiusFn: (y) => 0.26 + (-0.1 - y) * 0.35, widthFn: (y) => 0.18 + (-y) * 0.15, center: Math.PI + s * 0.22, zScale: 1, segY: 14, segA: 8 });
      const m = this.add(R.chestJ, tail, black);
      m.rotation.x = -0.25;
    }

    // mangas do paletó nos braços (coxa) + punho branco
    for (const a of R.arms) {
      this.add(a.coxa, limb(0.3, 0.085, 0.08, 0.008, 20, 6), black);
      const cuff = new THREE.TorusGeometry(0.075, 0.018, 8, 20);
      cuff.rotateY(Math.PI / 2);
      this.add(a.coxa, cuff, white).position.x = 0.31;
    }

    // cartola
    const hat = new THREE.Group();
    this.add(hat, new THREE.CylinderGeometry(0.14, 0.125, 0.32, 32, 1, false), satin).position.y = 0.17;
    this.add(hat, new THREE.CylinderGeometry(0.141, 0.141, 0.008, 32), satin).position.y = 0.33;
    const brim = new THREE.LatheGeometry([new THREE.Vector2(0.12, 0.02), new THREE.Vector2(0.24, 0.0), new THREE.Vector2(0.26, 0.03), new THREE.Vector2(0.24, 0.015), new THREE.Vector2(0.12, 0.03)], 40);
    this.add(hat, brim, satin);
    this.add(hat, new THREE.CylinderGeometry(0.129, 0.128, 0.06, 32, 1, true), red).position.y = 0.06;
    const buckle = this.add(hat, new THREE.TorusGeometry(0.022, 0.006, 6, 4), gold);
    buckle.position.set(0, 0.06, 0.13); buckle.rotation.z = Math.PI / 4;
    hat.position.set(0.02, 0.215, -0.04);
    hat.rotation.set(-0.12, 0, -0.16);
    R.headC.add(hat);
    this.hat = hat;
    // no beijo a cartola inclina para trás (não bate na noiva)
    this.extraUpdate = (dt) => {
      const k = this.anim.name === 'kiss' ? 1 : 0;
      this._hk = (this._hk || 0) + (k - (this._hk || 0)) * Math.min(1, dt * 4);
      hat.rotation.x = -0.12 - this._hk * 0.55;
      hat.position.z = -0.04 - this._hk * 0.08;
    };

    // sobrancelhas elegantes
    for (const e of R.eyes) {
      const brow = new THREE.TorusGeometry(0.1, 0.012, 6, 12, Math.PI * 0.5);
      const m = this.add(e.base, brow, this.mats.mouth);
      m.position.set(0, 0.06, 0.08); m.rotation.set(0, 0, Math.PI * 0.25);
    }
  }
}

// ------------------------------------------------------------------
export class Bride extends Hero {
  constructor() {
    super({ body: 0x93cf55, iris: 0x2d8a3c });
    this.side = -1;
    const R = this.rig;
    this.mats.mouth = this.mats.lips;
    for (const m of this.meshes.mSmile) m.material = this.mats.lips;
    // abdômen e asas ficam embaixo do vestido
    for (const k of ['abdomen', 'wing', 'pelvis']) for (const m of this.meshes[k]) m.visible = false;

    const lace = new THREE.MeshPhysicalMaterial({ color: 0xeee9ef, map: laceTex(), roughness: 0.45, sheen: 0.7, sheenColor: new THREE.Color(0xfff4ff), sheenRoughness: 0.35, side: THREE.DoubleSide });
    const satin = new THREE.MeshPhysicalMaterial({ color: 0xe9e4ea, map: satinTex(), roughness: 0.32, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xf6e6f0), side: THREE.DoubleSide });
    const tulle = new THREE.MeshPhysicalMaterial({ color: 0xf2eef4, roughness: 0.6, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, sheen: 1, sheenColor: new THREE.Color(0xffffff) });
    const pearl = new THREE.MeshPhysicalMaterial({ color: 0xfff6ee, roughness: 0.15, clearcoat: 1, iridescence: 0.6 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, metalness: 1, roughness: 0.2 });
    const gem = new THREE.MeshPhysicalMaterial({ color: 0x9fe8ff, roughness: 0, transmission: 0.6, thickness: 0.2, emissive: 0x3388aa, emissiveIntensity: 0.4 });

    // corpete
    const bodice = wrapSurface({ y0: -0.08, y1: 0.58, radiusFn: (y) => chestR(Math.max(0, y)) + 0.022, segY: 26, segA: 48 });
    this.add(R.chestJ, bodice, lace);
    const trim = new THREE.TorusGeometry(chestR(0.58) + 0.025, 0.02, 8, 40);
    trim.rotateX(Math.PI / 2); trim.scale(1, 1, 0.86);
    this.add(R.chestJ, trim, satin).position.y = 0.58;
    // faixa na cintura com laço
    const sash = new THREE.TorusGeometry(0.24, 0.04, 10, 40);
    sash.rotateX(Math.PI / 2); sash.scale(1, 1, 0.9);
    const sashM = new THREE.MeshPhysicalMaterial({ color: 0xf6b8c8, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xffd0e0) });
    this.add(R.body, sash, sashM).position.set(0, 0.06, 0.04);
    // laço grande nas costas da cintura
    for (const s2 of [1, -1]) {
      const loop = new THREE.TorusGeometry(0.11, 0.035, 8, 20);
      loop.scale(1.3, 0.8, 0.5);
      const lm = this.add(R.body, loop, sashM);
      lm.position.set(s2 * 0.13, 0.08, -0.27); lm.rotation.set(0, 0, s2 * 0.3);
      const tail = new THREE.BoxGeometry(0.07, 0.38, 0.015);
      const tm = this.add(R.body, tail, sashM);
      tm.position.set(s2 * 0.07, -0.12, -0.3); tm.rotation.set(0.25, 0, s2 * 0.2);
    }
    this.add(R.body, new THREE.SphereGeometry(0.05, 10, 8), sashM).position.set(0, 0.07, -0.28);
    // colar de pérolas
    const pearls = [];
    for (let i = 0; i < 22; i++) {
      const a = -1.5 + (i / 21) * 3.0;
      const y = 0.7 - Math.cos(a * 0.5) * 0.06 + 0.06;
      const r = chestR(y) + 0.03;
      pearls.push(new THREE.SphereGeometry(0.016, 8, 6).translate(Math.sin(a) * r, y - 0.02, Math.cos(a) * r * 0.86));
    }
    this.add(R.chestJ, merge(pearls), pearl);

    // saia "baile" com pregas (presa ao corpo)
    this.skirt = this.add(R.body, skirtGeo(0.0), satin);
    this.tulle = this.add(R.body, skirtGeo(1.3, 1.04, 0.92), tulle, { shadow: false });
    // babado da barra
    const hem = new THREE.TorusGeometry(0.93, 0.035, 8, 96);
    hem.rotateX(Math.PI / 2);
    const p = hem.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
      const k = 1 + 0.045 * Math.sin(a * 16);
      p.setXYZ(i, x * k, p.getY(i) + Math.sin(a * 32) * 0.012, z * k);
    }
    hem.computeVertexNormals();
    this.add(R.body, hem, lace).position.y = -0.75;
    // pétalas/aplicações no vestido
    const appl = [];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, d = 0.25 + Math.random() * 0.4;
      const y = 0.03 - d;
      const r = skirtRadius(d, a) + 0.012;
      const g = roseGeo(0.03, 0).clone();
      g.rotateX(Math.PI / 2);
      g.lookAt(new THREE.Vector3(Math.cos(a), 0.3, Math.sin(a)));
      g.translate(Math.cos(a) * r, y, Math.sin(a) * r);
      appl.push(g);
    }
    this.add(R.body, merge(appl), new THREE.MeshPhysicalMaterial({ color: 0xffe2ec, roughness: 0.4, sheen: 1 }));

    // véu
    const veil = wrapSurface({
      y0: -1.55, y1: 0.24, center: Math.PI, zScale: 1, segY: 40, segA: 40,
      radiusFn: (y) => 0.2 + Math.pow(Math.max(0, 0.24 - y) / 1.8, 0.8) * 0.62,
      widthFn: (y) => 1.15 + Math.max(0, 0.24 - y) * 0.45,
    });
    const vp = veil.attributes.position;
    for (let i = 0; i < vp.count; i++) {
      const x = vp.getX(i), y = vp.getY(i), z = vp.getZ(i);
      const a = Math.atan2(x, z), d = Math.max(0, 0.24 - y);
      const k = 1 + 0.06 * Math.sin(a * 9) * Math.min(1, d);
      vp.setXYZ(i, x * k, y, z * k - d * 0.12);
    }
    veil.computeVertexNormals();
    this.veil = this.add(R.headC, veil, tulle, { shadow: false });
    this.veil.position.set(0, 0, -0.06);
    this.veil.rotation.x = 0.18;
    // tiara
    const tiara = new THREE.Group();
    const band = new THREE.TorusGeometry(0.2, 0.012, 6, 30, Math.PI);
    band.rotateX(-0.3);
    this.add(tiara, band, silver);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      const h = i === 4 ? 0.08 : i % 2 ? 0.035 : 0.05;
      const pm = this.add(tiara, new THREE.SphereGeometry(i === 4 ? 0.028 : 0.016, 10, 8), i === 4 ? gem : pearl);
      pm.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2 * 0.95 + h * 0.2, 0);
    }
    tiara.position.set(0, 0.2, 0.0);
    tiara.rotation.x = -0.6;
    R.headC.add(tiara);
    // flor no véu
    const fl = new THREE.Group();
    this.add(fl, roseGeo(0.06, 1), new THREE.MeshPhysicalMaterial({ color: 0xffd6e2, roughness: 0.4, sheen: 1 }));
    fl.position.set(0.17, 0.2, -0.08); fl.rotation.set(0.4, 0, -0.9);
    R.headC.add(fl);

    // cílios
    for (const e of R.eyes) {
      const l = this.add(e.lid, lashGeo(0.15), this.mats.pupil, { shadow: false });
      if (e.s < 0) l.scale.x = 1; else { l.rotation.y = 0; }
      l.position.x = e.s > 0 ? 0.0 : 0.0;
      l.rotation.set(0.15, e.s > 0 ? 0.25 : -0.25, 0);
      l.scale.x = e.s;
    }
    // bochechas rosadas
    const blushM = new THREE.MeshBasicMaterial({ color: 0xff7da0, transparent: true, opacity: 0.38, depthWrite: false });
    for (const s of [1, -1]) {
      const b = this.add(R.headC, new THREE.CircleGeometry(0.045, 16), blushM, { shadow: false });
      b.position.set(s * 0.12, -0.12, 0.19); b.rotation.y = s * 0.55;
    }

    // buquê na mão esquerda
    this.bouquet = bouquetGeo();
    const bq = this.add(R.arms[0].hand, this.bouquet.geo, this.bouquet.mat);
    bq.position.set(0, -0.02, 0.06);
    bq.rotation.set(-0.2, 0, 0);
    this.bouquetMesh = bq;

    // a noiva fica com os pés um pouco mais abertos (escondidos no vestido)
    this.footSpread = 1.22;
    this.extraUpdate = (dt, time, P) => {
      // saia balança com o movimento
      const sw = P.hipRoll * 0.6 + Math.sin(time * 2.2) * 0.012;
      this.skirt.rotation.z = -sw * 0.5; this.tulle.rotation.z = -sw * 0.7;
      this.veil.rotation.z = -P.headRoll * 0.4;
      this.veil.rotation.x = 0.18 - P.lean * 0.6 - P.headPitch * 0.4 + Math.sin(time * 1.7) * 0.02;
    };
  }
}

function skirtRadius(d, a, phase = 0) {
  const k = Math.min(1, d / 0.78);
  const base = 0.24 + 0.68 * (1 - Math.pow(1 - k, 2.3));
  return base * (1 + 0.05 * Math.sin(a * 14 + phase) * Math.min(1, d / 0.35));
}

function skirtGeo(phase = 0, scale = 1, top = 1) {
  const segY = 34, segA = 96;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segY; j++) {
    const v = j / segY;
    const d = v * 0.8 * top; // queda a partir da cintura
    const y = 0.06 - d;
    for (let i = 0; i <= segA; i++) {
      const u = i / segA, a = u * Math.PI * 2;
      const r = skirtRadius(d, a, phase) * (d < 0.05 ? 1 : scale);
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      uv.push(u * 4, v);
    }
  }
  for (let j = 0; j < segY; j++) for (let i = 0; i < segA; i++) {
    const a = j * (segA + 1) + i, b = a + segA + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function bouquetGeo() {
  const parts = [];
  const cols = [0xffffff, 0xffc4d6, 0xff8fb1, 0xfff1d8, 0xe0325f, 0xffffff, 0xffd7e5];
  let n = 0;
  for (let ring = 0; ring < 3; ring++) {
    const cnt = ring === 0 ? 1 : ring === 1 ? 6 : 10;
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2 + ring;
      const rr = ring * 0.075;
      const g = roseGeo(0.055, 1).clone();
      g.rotateX(-ring * 0.35);
      g.rotateY(-a + Math.PI / 2);
      g.translate(Math.cos(a) * rr, -ring * ring * 0.018, Math.sin(a) * rr);
      paint(g, cols[n++ % cols.length]);
      parts.push(g);
    }
  }
  // folhas
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const l = new THREE.SphereGeometry(0.07, 8, 6);
    l.scale(0.45, 0.08, 1); l.translate(0, 0, 0.07);
    l.rotateX(0.5); l.rotateY(a);
    l.translate(Math.cos(a) * 0.12, -0.08, Math.sin(a) * 0.12);
    paint(l, 0x3d7a2a);
    parts.push(l);
  }
  // cabo + fita
  const stem = new THREE.CylinderGeometry(0.035, 0.025, 0.22, 10);
  stem.translate(0, -0.2, 0);
  paint(stem, 0x4f8a35); parts.push(stem);
  const rib = new THREE.TorusGeometry(0.04, 0.015, 6, 14);
  rib.rotateX(Math.PI / 2); rib.translate(0, -0.15, 0);
  paint(rib, 0xfff0f5); parts.push(rib);
  for (const s of [1, -1]) {
    const tail = new THREE.BoxGeometry(0.03, 0.18, 0.005);
    tail.rotateZ(s * 0.3); tail.translate(s * 0.03, -0.24, 0.04);
    paint(tail, 0xfff0f5); parts.push(tail);
  }
  const geo = merge(parts, true);
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  return { geo, mat };
}
