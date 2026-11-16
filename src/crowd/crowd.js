// =============================================================
//  CONVIDADOS (espectadores da live)
//  - Cada espectador vira um louva-a-deus com cor, olhos e
//    acessórios próprios, nome e foto acima da cabeça.
//  - Todos são desenhados com InstancedMesh (poucas chamadas de
//    desenho, aguenta 200 personagens).
//  - Lugares em círculos ao redor dos noivos, sem sobreposição,
//    com um corredor livre ligando o arco de entrada à pista.
// =============================================================
import * as THREE from 'three';
import { MantisRig } from '../mantis/rig.js';
import { Animator, DANCES } from '../mantis/anims.js';
import { chitinTex, chitinBump, wingTex } from '../mantis/materials.js';
import { accessoryDefs, HEAD_ACCS, FACE_ACCS, NECK_ACCS } from '../mantis/accessories.js';
import { ENTRY } from '../scene/hall.js';

export const CAP = 240; // capacidade máxima de personagens
const AISLE = 1.35;
const RING0 = 4.0, RING_GAP = 1.75, SPACING = 1.55;

const BODY_COLORS = [0x7cc244, 0x5fae3a, 0x9bd65a, 0x4f9f52, 0xa8c94a, 0x6cc48a, 0xb5d86a, 0x86b83c,
  0xf29ac2, 0xffd166, 0x7ad3e0, 0xc39bf2, 0xf4a259, 0xe8e4d8, 0x8fd6a8, 0xd9e36b, 0xff8f8f, 0x9fb4ff];
const IRIS_COLORS = [0x1f9fb0, 0x2d8a3c, 0x7a4a1f, 0x6b3fc0, 0x1f5fd0, 0xc0392b, 0x2a2a2a, 0xd28a00, 0xe0408a];
const ACC_COLORS = [0xff5f9e, 0xffd34d, 0x3dd5ff, 0x9b5bff, 0xff8a3d, 0x7cc244, 0xffffff, 0xff2d55, 0x2dd5a0];
const DRESS_COLORS = [0xd7b8ff, 0xffc4dd, 0xbfe8ff, 0xfff0b3, 0xc8f5c0, 0xffd1b8];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

// ------------------------------------------------------------------
class PartRenderer {
  constructor(scene) {
    this.scene = scene;
    this.groups = new Map();
    this.white = new THREE.Color(1, 1, 1);
  }
  ensure(key, geo, mat, cap) {
    let g = this.groups.get(key);
    if (g) return g;
    const mesh = new THREE.InstancedMesh(geo, mat, cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, this.white);
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.count = 0;
    this.scene.add(mesh);
    g = { mesh, cursor: 0, cap };
    this.groups.set(key, g);
    return g;
  }
  begin() { for (const g of this.groups.values()) g.cursor = 0; }
  push(key, m, c) {
    const g = this.groups.get(key);
    if (!g || g.cursor >= g.cap) return;
    g.mesh.setMatrixAt(g.cursor, m);
    g.mesh.setColorAt(g.cursor, c);
    g.cursor++;
  }
  end() {
    for (const g of this.groups.values()) {
      g.mesh.count = g.cursor;
      g.mesh.instanceMatrix.needsUpdate = true;
      g.mesh.instanceColor.needsUpdate = true;
    }
  }
}

function guestMaterials() {
  return {
    body: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: chitinTex(), bumpMap: chitinBump(), bumpScale: 0.5, roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.5, sheenColor: new THREE.Color(0xeeffaa) }),
    sclera: new THREE.MeshStandardMaterial({ color: 0xfbfcf6, roughness: 0.15 }),
    iris: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }),
    pupil: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 }),
    shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x23400f, roughness: 0.6 }),
    lips: new THREE.MeshStandardMaterial({ color: 0xff5f8f, roughness: 0.4 }),
    mouthIn: new THREE.MeshStandardMaterial({ color: 0x5a1020, roughness: 0.7 }),
    wing: new THREE.MeshStandardMaterial({ color: 0xffffff, map: wingTex(), side: THREE.DoubleSide, roughness: 0.4, transparent: true, opacity: 0.92 }),
    acc: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide }),
    accMetal: new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.9, roughness: 0.25 }),
    blob: null,
  };
}

// ------------------------------------------------------------------
class Guest {
  constructor(crowd, info) {
    this.crowd = crowd;
    this.id = info.id;
    this.name = info.name || info.id;
    this.pic = info.pic || '';
    this.parts = [];
    this.byKey = {};
    const seed = hash(this.id);
    this.seed = seed;
    const sink = (parent, key, geo, matKey) => {
      const o = new THREE.Object3D();
      parent.add(o);
      const cap = CAP * (crowd.perGuest[key] || 1);
      crowd.R.ensure(key, geo, crowd.mats[matKey], cap);
      const p = { node: o, key, matKey };
      this.parts.push(p);
      (this.byKey[key] ||= []).push(o);
      return o;
    };
    this.rig = new MantisRig({ q: 'lo', sink, eyeR: 0.15 });
    this.anim = new Animator(seed);
    // aparência
    this.bodyCol = new THREE.Color(BODY_COLORS[(seed * 997) % BODY_COLORS.length | 0]);
    this.baseBody = this.bodyCol.clone();
    this.irisCol = new THREE.Color(IRIS_COLORS[(seed * 131) % IRIS_COLORS.length | 0]);
    this.wingCol = this.bodyCol.clone().lerp(new THREE.Color(0xffffee), 0.45);
    this.accs = {};
    this.scale = 0.92 + ((seed * 53) % 1) * 0.16;
    this.baseScale = this.scale;
    this.role = 'guest';
    this.setAcc('head', HEAD_ACCS[(seed * 17) % HEAD_ACCS.length | 0], pick(ACC_COLORS));
    this.setAcc('face', FACE_ACCS[(seed * 29) % FACE_ACCS.length | 0], pick([0xffffff, 0xff5f9e, 0xffd34d, 0x222222]));
    this.setAcc('neck', NECK_ACCS[(seed * 41) % NECK_ACCS.length | 0], pick(ACC_COLORS));
    // estado
    this.pos = ENTRY.clone();
    this.yaw = 0; this.yawTarget = 0;
    this.path = [];
    this.speed = 0;
    this.state = 'arriving';
    this.slot = null;
    this.timer = rnd(0.5, 3);
    this.busy = 0;           // segundos com animação especial (não troca de dança)
    this.special = null;     // foguete etc.
    this.lastActive = performance.now();
    this.blinkT = rnd(1, 5);
    this.label = crowd.makeLabel(this);
    this.alive = true;
  }

  setAcc(slot, name, color = 0xffffff) {
    const old = this.accs[slot];
    if (old) { old.node.parent.remove(old.node); delete this.accs[slot]; }
    if (!name) return;
    const def = accessoryDefs()[name];
    if (!def) return;
    const R = this.rig;
    const parent = { head: R.headC, face: R.headC, neck: R.chestJ, chest: R.chestJ, body: R.body, root: R.inner }[def.slot];
    const node = new THREE.Object3D();
    node.position.set(...def.pos); node.rotation.set(...def.rot);
    parent.add(node);
    const key = 'acc_' + name;
    this.crowd.R.ensure(key, def.geo, name === 'crown' ? this.crowd.mats.accMetal : this.crowd.mats.acc, CAP);
    this.accs[slot] = { node, key, color: new THREE.Color(color) };
  }

  setHidden(keys, hidden) { for (const k of keys) for (const o of this.byKey[k] || []) o.visible = !hidden; }

  headPos(v) { return this.rig.headC.localToWorld(v.set(0, 0.55, 0)); }
}

// ------------------------------------------------------------------
export class Crowd {
  constructor(scene, { fx, labelsEl, sfx = () => {}, onFocus = () => {}, onCount = () => {} }) {
    this.scene = scene;
    this.fx = fx;
    this.labelsEl = labelsEl;
    this.sfx = sfx;
    this.onFocus = onFocus;
    this.onCount = onCount;
    this.R = new PartRenderer(scene);
    this.mats = guestMaterials();
    this.guests = new Map();
    this.list = [];
    this.limit = 100;
    this.center = new THREE.Vector3(0, 0, 0.3);
    this.slots = [];
    this.computeSlots(CAP);
    this.mode = null;          // dança em grupo
    this.modeT = 0;
    this.interactT = 3;
    this._m = new THREE.Matrix4();
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this._white = new THREE.Color(1, 1, 1);
    // quantas peças de cada tipo cada louva-a-deus tem
    this.perGuest = {};
    new MantisRig({ q: 'lo', sink: (p, key) => { this.perGuest[key] = (this.perGuest[key] || 0) + 1; const o = new THREE.Object3D(); p.add(o); return o; } });
    // sombra (mancha) no chão
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(0,0,0,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const blobGeo = new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2);
    this.R.ensure('blob', blobGeo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }), CAP);
    this.R.groups.get('blob').mesh.renderOrder = -1;
    // holofote do convidado de honra
    this.vipLight = new THREE.SpotLight(0xffe08a, 0, 30, 0.28, 0.5, 1.2);
    this.vipLight.position.set(0, 14, 4);
    scene.add(this.vipLight, this.vipLight.target);
    this.vip = null;
    // lugar de destaque: no corredor da frente, entre os noivos e a câmera
    this.vipSlot = { pos: new THREE.Vector3(0, 0, this.center.z + 2.7), r: 2.7, a: Math.PI / 2, ring: -1, guest: null };
  }

  get count() { return this.list.length; }

  // ---------------- lugares em círculos ----------------
  computeSlots(n) {
    const slots = [];
    let ring = 0;
    while (slots.length < n && ring < 20) {
      const r = RING0 + ring * RING_GAP;
      const cnt = Math.floor((Math.PI * 2 * r) / SPACING);
      const ringSlots = [];
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2 + (ring % 2) * (Math.PI / cnt);
        const x = Math.cos(a) * r, z = Math.sin(a) * r + this.center.z;
        if (Math.abs(x) < AISLE) continue; // corredor (atrás: do arco até a pista; frente: visão da câmera)
        ringSlots.push({ pos: new THREE.Vector3(x, 0, z), r, a, ring, guest: null });
      }
      // ordem de preenchimento espalhada (não lota um lado só)
      const order = [];
      const used = new Set();
      for (let k = 0; order.length < ringSlots.length; k++) {
        let idx = Math.floor(((k * 0.6180339887) % 1) * ringSlots.length);
        while (used.has(idx)) idx = (idx + 1) % ringSlots.length;
        used.add(idx); order.push(ringSlots[idx]);
      }
      slots.push(...order);
      ring++;
    }
    this.slots = slots;
  }
  freeSlot() {
    for (let i = 0; i < Math.min(this.slots.length, this.limit); i++) if (!this.slots[i].guest) return this.slots[i];
    return this.slots.find((s) => !s.guest) || null;
  }

  // ---------------- entrada / saída ----------------
  add(info, { silent = false } = {}) {
    if (!info || !info.id) return null;
    let g = this.guests.get(info.id);
    if (g) {
      g.lastActive = performance.now();
      if (info.pic && !g.pic) { g.pic = info.pic; this.updateLabel(g); }
      if (info.name && info.name !== g.name) { g.name = info.name; this.updateLabel(g); }
      return g;
    }
    if (this.list.length >= this.limit) {
      // festa cheia: o convidado comum mais "parado" dá lugar ao novo
      const cand = this.list.filter((x) => x.role === 'guest' && x.state === 'placed' && !x.special)
        .sort((a, b) => (a.bot ? 0 : 1) - (b.bot ? 0 : 1) || a.lastActive - b.lastActive)[0];
      if (!cand) return null;
      this.remove(cand.id);
    }
    g = new Guest(this, info);
    g.bot = !!info.bot;
    const slot = this.freeSlot();
    if (!slot) { g.label.remove(); return null; }
    slot.guest = g; g.slot = slot;
    this.guests.set(g.id, g);
    this.list.push(g);
    this._planArrival(g);
    if (!silent) {
      this.fx.poof(ENTRY.clone().setY(0.3), [0.8, 1, 0.6]);
      this.sfx('arrive');
    }
    this.onCount(this.list.length);
    return g;
  }

  /** chega sem caminhar (usado para encher a festa rápido nos testes) */
  addInstant(info) {
    const g = this.add(info, { silent: true });
    if (g && g.slot) { g.pos.copy(g.slot.pos); g.path = []; g.state = 'placed'; g.yaw = g.yawTarget = this._faceCenter(g); g.anim.play(pick(DANCES)); }
    return g;
  }

  _planArrival(g) {
    const s = g.slot;
    const rr = s.r + RING_GAP * 0.5;
    g.path = [];
    const aisleZ = this.center.z - rr;
    g.path.push(new THREE.Vector3(0, 0, Math.min(ENTRY.z + 1.5, aisleZ)));
    g.path.push(new THREE.Vector3(0, 0, aisleZ));
    const a0 = -Math.PI / 2, a1 = s.a > Math.PI ? s.a - Math.PI * 2 : s.a;
    let d = angDiff(a0, a1);
    const steps = Math.max(1, Math.ceil(Math.abs(d) / 0.28));
    for (let i = 1; i <= steps; i++) {
      const a = a0 + (d * i) / steps;
      g.path.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr + this.center.z));
    }
    g.path.push(s.pos.clone());
    g.state = 'arriving';
    g.pos.copy(ENTRY);
    g.yaw = 0;
    g.anim.play('hello', { dur: 1.3, next: 'walk' });
    g.arriveDelay = 1.1;
  }

  remove(id, { poof = true } = {}) {
    const g = this.guests.get(id);
    if (!g) return;
    if (poof) this.fx.poof(g.pos, [1, 1, 1]);
    if (g.slot) g.slot.guest = null;
    g.label.remove();
    g.alive = false;
    this.guests.delete(id);
    this.list = this.list.filter((x) => x !== g);
    if (this.vip === g) this.vip = null;
    this.onCount(this.list.length);
  }
  clear() {
    for (const g of [...this.list]) this.remove(g.id, { poof: false });
    this.fx.clear();
  }
  setLimit(n) {
    this.limit = Math.max(1, Math.min(CAP - 10, n | 0));
    while (this.list.length > this.limit) {
      const g = this.list.filter((x) => x.role === 'guest').sort((a, b) => a.lastActive - b.lastActive)[0] || this.list[0];
      this.remove(g.id);
    }
    // quem estiver em lugar acima do limite muda para um lugar livre
    for (const g of this.list) {
      const idx = this.slots.indexOf(g.slot);
      if (idx >= this.limit) {
        const s = this.freeSlot();
        if (s && this.slots.indexOf(s) < idx) { g.slot.guest = null; s.guest = g; g.slot = s; g.path = [s.pos.clone()]; g.state = 'arriving'; g.arriveDelay = 0; g.anim.play('walk'); }
      }
    }
  }

  // ---------------- etiquetas com nome e foto ----------------
  makeLabel(g) {
    const el = document.createElement('div');
    el.className = 'tag';
    this.labelsEl.appendChild(el);
    g.label = el;
    this.updateLabel(g);
    return el;
  }
  updateLabel(g) {
    const el = g.label;
    const initial = (g.name || '?').trim().charAt(0).toUpperCase();
    const roleTxt = g.role === 'padrinho' ? 'Padrinho' : g.role === 'madrinha' ? 'Madrinha' : g.role === 'vip' ? '⭐ Convidado de honra' : '';
    el.className = 'tag' + (g.role === 'vip' ? ' vip' : g.role === 'padrinho' || g.role === 'madrinha' ? ' pad' : '');
    el.innerHTML = `${roleTxt ? `<div class="role">${roleTxt}</div>` : ''}<div class="pic"${g.pic ? ` style="background-image:url('${encodeURI(g.pic).replace(/'/g, '%27')}')"` : ''}>${g.pic ? '' : `<span>${escapeHtml(initial)}</span>`}</div><div class="nm">${escapeHtml(g.name)}</div>`;
    if (!g.pic) el.querySelector('.pic').style.background = '#' + g.bodyCol.getHexString();
  }

  // ---------------- ações (presentes / comandos) ----------------
  act(g, action, opts = {}) {
    if (!g || !g.alive) return;
    g.lastActive = performance.now();
    const head = () => g.headPos(this._v.clone());
    switch (action) {
      case 'hello':
        if (!g.busy && g.state === 'placed') { g.anim.play('hello', { dur: 1.6, next: () => pick(DANCES) }); g.busy = 1.6; }
        break;
      case 'like':
        if (!g.busy && g.state === 'placed') { g.anim.play('bounce', { dur: 1.2, next: () => pick(DANCES) }); }
        this.fx.hearts(head(), 2, 0.3);
        break;
      case 'special':
        g.anim.play('special', { dur: 6, next: () => pick(DANCES) }); g.busy = 6;
        g.fxT = { type: 'special', t: 6 };
        this.fx.sparkles(g.pos.clone().setY(1.2), 40, [1, 0.6, 0.9], 1.2, 2.5);
        this.sfx('special');
        this.onFocus(g, 5);
        break;
      case 'hearts':
        g.anim.play('bounce', { dur: 3.5, next: () => pick(DANCES) }); g.busy = 3.5;
        g.fxT = { type: 'hearts', t: 3.5 };
        this.fx.heartRing(g.pos.clone().setY(1.4), 20, 1.0);
        this.sfx('hearts');
        break;
      case 'padrinho':
        this.makeRole(g, opts.role || (g.seed > 0.5 ? 'madrinha' : 'padrinho'));
        g.anim.play('bow', { dur: 2.2, next: 'celebrate' }); g.busy = 4.5;
        setTimeout(() => g.alive && g.anim.name === 'celebrate' && g.anim.play(pick(DANCES)), 4500);
        this.fx.confetti(g.pos.clone().setY(2.2), 90, 2, 5);
        this.fx.sparkles(g.pos.clone().setY(1.2), 30, [1, 0.8, 0.9], 1, 2);
        this.sfx('padrinho');
        this.onFocus(g, 5);
        break;
      case 'rocket':
        if (g.special) break;
        g.special = { type: 'rocket', t: 0, base: g.pos.clone(), land: g.slot ? g.slot.pos.clone() : g.pos.clone() };
        g.state = 'special';
        g.anim.play('surprise', { dur: 0.7, next: 'fly' }); g.busy = 9;
        this.sfx('rocketPrep');
        this.onFocus(g, 7, 'rocket');
        break;
      case 'vip':
        this.makeVip(g);
        break;
      case 'celebrate':
        g.anim.play('celebrate', { dur: 2.5, next: () => pick(DANCES) }); g.busy = 2.5;
        this.fx.confetti(g.pos.clone().setY(2.4), 40, 1.2, 4);
        this.sfx('cheer');
        break;
      case 'confetti':
        this.fx.confettiRain(this.center, 11, 420);
        this.react('celebrate');
        this.sfx('cheer');
        break;
      case 'groupdance':
        this.groupDance();
        break;
      default:
        if (g.anim && action) g.anim.play(action, { dur: 4, next: () => pick(DANCES) });
    }
  }

  makeRole(g, role) {
    if (g.role === 'vip') return;
    g.role = role;
    g.setAcc('face', null);
    if (role === 'padrinho') {
      g.setAcc('chest', 'suit', 0xffffff);
      g.setAcc('head', 'tophat', pick([0xff5f9e, 0xffd34d, 0x9b5bff]));
      g.setAcc('neck', null);
      g.setAcc('body', null);
      g.setHidden(['abdomen', 'wing'], false);
    } else {
      const dc = pick(DRESS_COLORS);
      g.setAcc('chest', 'dressTop', dc);
      g.setAcc('body', 'dressSkirt', dc);
      g.setAcc('head', 'flowercrown', 0xffffff);
      g.setAcc('neck', 'pearls', 0xffffff);
      g.setHidden(['abdomen', 'wing'], true);
    }
    this.updateLabel(g);
  }

  makeVip(g) {
    // antigo convidado de honra volta ao normal (mantém a roupa de padrinho)
    if (this.vip && this.vip !== g && this.vip.alive) {
      const o = this.vip;
      o.role = 'padrinho'; o.setAcc('cape', null); o.setAcc('chest', 'suit'); o.setAcc('head', 'tophat', 0xffd34d);
      o.bodyCol.copy(o.baseBody); o.scale = o.baseScale; this.updateLabel(o);
    }
    this.vip = g;
    g.role = 'vip';
    g.bodyCol.set(0xe8b93a);
    g.wingCol.set(0xfff2b0);
    g.irisCol.set(0x8a2be2);
    g.scale = 1.35;
    g.setAcc('head', 'crown', 0xffffff);
    g.setAcc('face', null);
    g.setAcc('neck', 'pearls', 0xffffff);
    g.setAcc('body', null);
    g.setAcc('chest', 'cape', 0xffffff);
    g.setHidden(['abdomen', 'wing'], false);
    this.updateLabel(g);
    // vai para o lugar de destaque (frente dos noivos)
    const front = this.vipSlot;
    if (g.slot !== front) {
      const other = front.guest;
      if (other && other !== g) {
        // o antigo destaque volta para o lugar que era do novo
        other.slot = g.slot; if (g.slot) g.slot.guest = other;
        if (other.slot) { other.path = [other.slot.pos.clone()]; other.state = 'arriving'; other.arriveDelay = 0; other.anim.play('walk'); }
      } else if (g.slot) g.slot.guest = null;
      front.guest = g; g.slot = front;
      g.path = [front.pos.clone()]; g.state = g.special ? g.state : 'arriving'; g.arriveDelay = 0.6;
      if (g.special) g.special.land = front.pos.clone();
    }
    g.anim.play('celebrate', { dur: 3, next: 'special' }); g.busy = 9;
    g.fxT = { type: 'vip', t: 9 };
    this.fx.confettiRain(this.center, 9, 350);
    this.fx.firework(new THREE.Vector3(-4, 9, -2), [1, 0.85, 0.3]);
    this.fx.firework(new THREE.Vector3(4, 9.5, -2), [1, 0.5, 0.8]);
    this.react('surprise', g);
    this.sfx('vip');
    this.onFocus(g, 8, 'vip');
  }

  /** todos reagem (palmas, comemoração, surpresa) */
  react(type, except = null) {
    for (const g of this.list) {
      if (g === except || g.special || g.state !== 'placed') continue;
      const delay = Math.random() * 0.5;
      const dur = type === 'surprise' ? 1.4 : type === 'clap' ? 2.5 : 2.4;
      setTimeout(() => {
        if (!g.alive || g.special) return;
        g.anim.play(type, { dur, next: type === 'surprise' ? 'celebrate' : () => (this.mode || pick(DANCES)) });
        g.busy = type === 'surprise' ? dur + 2 : dur;
        if (type === 'surprise') setTimeout(() => g.alive && !g.special && g.anim.name === 'celebrate' && g.anim.play(this.mode || pick(DANCES)), (dur + 2) * 1000);
      }, delay * 1000);
    }
  }

  /** dança em grupo sincronizada */
  groupDance(name = pick(DANCES), dur = 16) {
    this.mode = name; this.modeT = dur;
    for (const g of this.list) if (!g.special && g.state === 'placed') { g.anim.play(name, { blend: 0.6 }); g.busy = 0; g.timer = dur; }
  }

  /** escolhe quem ganha close no rodízio da câmera: quem interagiu por último e ainda não apareceu */
  pickForCamera() {
    const now = performance.now();
    const cands = this.list.filter((g) => g.state === 'placed' && !g.special);
    if (!cands.length) return null;
    const fresh = cands.filter((g) => !g._shownAt || now - g._shownAt > 60000);
    const pool = fresh.length ? fresh : cands;
    pool.sort((a, b) => (a.bot ? 1 : 0) - (b.bot ? 1 : 0) || b.lastActive - a.lastActive || (a._shownAt || 0) - (b._shownAt || 0));
    const g = fresh.length ? pool[0] : pool.sort((a, b) => (a._shownAt || 0) - (b._shownAt || 0))[0];
    g._shownAt = now;
    if (g.busy <= 0) { g.anim.play('hello', { dur: 1.6, next: () => this.mode || pick(DANCES) }); g.busy = 1.6; }
    return g;
  }

  _faceCenter(g) { return Math.atan2(this.center.x - g.pos.x, this.center.z - g.pos.z); }

  // ---------------- atualização por quadro ----------------
  update(dt, time, beat, camera, viewW, viewH) {
    if (this.mode) { this.modeT -= dt; if (this.modeT <= 0) this.mode = null; }
    this.interactT -= dt;
    if (this.interactT <= 0) { this.interactT = rnd(1.5, 3.5); this._interact(); }

    this.R.begin();
    const m = this._m;
    this._frame = (this._frame || 0) + 1;
    const camPos = camera.position;
    for (const g of this.list) {
      this._behave(g, dt, time);
      // otimização: quem está longe da câmera anima a cada 2 quadros
      const far = g.pos.distanceToSquared(camPos) > 300 && !g.special && g.state === 'placed';
      g._acc = (g._acc || 0) + dt;
      if (far && ((this._frame + (g.seed * 10 | 0)) & 1)) {
        g.rig.root.position.copy(g.pos);
        this._pushGuest(g);
        continue;
      }
      const gdt = g._acc; g._acc = 0;
      // fixar transformações
      const root = g.rig.root;
      root.position.copy(g.pos);
      root.rotation.y = g.yaw;
      root.scale.setScalar(g.scale);
      g.blinkT -= gdt;
      if (g.blinkT < 0) { g.rig.blink = 1; g.blinkT = rnd(2, 6); }
      if (g.rig.blink > 0) g.rig.blink = Math.max(0, g.rig.blink - gdt / 0.16);
      const P = g.anim.update(gdt, beat + g.seed * (this.mode ? 0 : 0.25));
      if (g.special && g.special.type === 'rocket') P.hop += g.special.h || 0;
      if (g.accs.body) P.footSpread = 1.1;
      g.rig.apply(P, time + g.seed * 10, g.speed, gdt);
      root.updateMatrixWorld(true);
      this._pushGuest(g);
      // efeitos contínuos
      if (g.fxT) {
        g.fxT.t -= dt;
        if (g.fxT.t <= 0) g.fxT = null;
        else if (g.fxT.type === 'special' && Math.random() < 0.35) { this.fx.notes(g.headPos(this._v.clone()), 1); this.fx.sparkles(g.pos.clone().setY(1), 2, [1, 0.6, 0.9], 0.8, 1.5); }
        else if (g.fxT.type === 'hearts' && Math.random() < 0.5) this.fx.hearts(g.headPos(this._v.clone()), 2, 0.6);
        else if (g.fxT.type === 'vip' && Math.random() < 0.6) this.fx.aura(g.pos.clone().setY(0.3), [1, 0.85, 0.3]);
      }
      if (g.role === 'vip' && Math.random() < 0.12) this.fx.aura(g.pos.clone().setY(0.2), [1, 0.85, 0.35]);
    }
    this.R.end();
    // holofote dourado
    if (this.vip && this.vip.alive) {
      this.vipLight.intensity = 40;
      this.vipLight.target.position.copy(this.vip.pos);
      this.vipLight.position.set(this.vip.pos.x * 0.6, 14, this.vip.pos.z + 5);
    } else this.vipLight.intensity = 0;
    this._labels(camera, viewW, viewH);
  }

  _pushGuest(g) {
    for (const p of g.parts) {
      if (!p.node.visible) continue;
      const col = p.matKey === 'body' ? g.bodyCol : p.matKey === 'iris' ? g.irisCol : p.matKey === 'wing' ? g.wingCol : this._white;
      this.R.push(p.key, p.node.matrixWorld, col);
    }
    for (const slot in g.accs) { const a = g.accs[slot]; this.R.push(a.key, a.node.matrixWorld, a.color); }
    const sh = Math.max(0.35, 1 - g.rig.inner.position.y * 0.3);
    this._m.makeScale(g.scale * sh, 1, g.scale * sh).setPosition(g.pos.x, 0.025, g.pos.z);
    this.R.push('blob', this._m, this._white);
  }

  _behave(g, dt, time) {
    if (g.busy > 0) g.busy -= dt;
    // ---- foguete ----
    if (g.special && g.special.type === 'rocket') { this._rocket(g, dt); return; }
    // ---- andando até o lugar ----
    if (g.state === 'arriving') {
      if (g.arriveDelay > 0) { g.arriveDelay -= dt; g.speed = 0; return; }
      const tgt = g.path[0];
      if (!tgt) { g.state = 'placed'; g.speed = 0; return; }
      const dx = tgt.x - g.pos.x, dz = tgt.z - g.pos.z, d = Math.hypot(dx, dz);
      if (g.anim.name !== 'walk') g.anim.play('walk', { blend: 0.25 });
      const sp = 2.3;
      if (d < 0.12) {
        g.path.shift();
        if (!g.path.length) {
          g.state = 'placed'; g.speed = 0;
          g.yawTarget = this._faceCenter(g);
          g.anim.play(this.mode || pick(DANCES), { blend: 0.4 });
          g.timer = rnd(6, 14);
        }
      } else {
        const step = Math.min(d, sp * dt);
        g.pos.x += (dx / d) * step; g.pos.z += (dz / d) * step;
        g.speed = sp;
        g.yawTarget = Math.atan2(dx, dz);
      }
      g.yaw += angDiff(g.yaw, g.yawTarget) * Math.min(1, dt * 8);
      return;
    }
    // ---- no lugar: dança e interage ----
    g.speed = 0;
    if (g.faceT > 0) { g.faceT -= dt; }
    else if (g.role === 'vip') g.yawTarget = Math.sin(time * 0.4) * 0.4; // convidado de honra olha para a câmera
    else g.yawTarget = this._faceCenter(g) + Math.sin(time * 0.3 + g.seed * 20) * 0.35;
    g.yaw += angDiff(g.yaw, g.yawTarget) * Math.min(1, dt * 3);
    g.timer -= dt;
    if (g.timer <= 0 && g.busy <= 0) {
      g.timer = this.mode ? this.modeT + 0.1 : rnd(5, 10);
      const r = Math.random();
      const next = this.mode || (r < 0.06 ? 'clap' : pick(DANCES));
      g.anim.play(next, { blend: 0.5, dur: next === 'clap' ? 3 : Infinity, next: () => pick(DANCES) });
    }
  }

  _rocket(g, dt) {
    const S = g.special;
    S.t += dt;
    const t = S.t;
    const PEAK = 22;
    g.speed = 0;
    if (t < 0.7) { S.h = 0; if (Math.random() < 0.5) this.fx.flame(g.pos.clone().setY(0.2)); }
    else if (t < 2.2) {
      const k = (t - 0.7) / 1.5;
      S.h = PEAK * k * k;
      g.yaw += dt * 14 * (1 - k * 0.5);
      if (!S.launched) { S.launched = true; this.sfx('rocket'); }
      for (let i = 0; i < 2; i++) this.fx.flame(g.pos.clone().setY(S.h + 0.1));
    } else if (t < 2.5) {
      if (!S.boom) { S.boom = true; this.fx.firework(g.pos.clone().setY(PEAK + 1)); this.fx.firework(g.pos.clone().setY(PEAK + 2).add(new THREE.Vector3(1.5, 0, 0))); this.sfx('boom'); }
      S.h = PEAK;
    } else if (t < 6.5) {
      if (!g.accs.root) { g.setAcc('root', 'parachute', 0xffffff); g.anim.play('fly'); }
      const k = (t - 2.5) / 4;
      S.h = PEAK * (1 - k);
      // desce na direção do lugar
      g.pos.lerp(S.land, Math.min(1, dt * 1.2));
      g.yaw += Math.sin(t * 2) * dt * 0.5;
    } else if (!S.landed) {
      S.landed = true; S.h = 0;
      g.pos.copy(S.land);
      g.setAcc('root', null);
      this.fx.poof(g.pos, [1, 0.95, 0.8]);
      g.anim.play('dizzy', { dur: 2.4, next: () => pick(DANCES) });
      this.sfx('land');
    } else if (t > 9) {
      g.special = null; g.state = 'placed'; g.busy = 0;
      g.yawTarget = this._faceCenter(g);
    }
  }

  _interact() {
    const free = this.list.filter((g) => g.state === 'placed' && !g.special && g.busy <= 0);
    if (free.length < 2) return;
    const a = pick(free);
    let best = null, bd = 2.6;
    for (const b of free) { if (b === a) continue; const d = a.pos.distanceTo(b.pos); if (d < bd) { bd = d; best = b; } }
    if (!best) return;
    const kind = pick(['highfive', 'piseiro', 'passinho', 'pulapula', 'clap']);
    for (const [x, y] of [[a, best], [best, a]]) {
      x.yawTarget = Math.atan2(y.pos.x - x.pos.x, y.pos.z - x.pos.z);
      x.faceT = 3.2; x.busy = 3.2;
      x.anim.play(kind, { dur: 3, next: () => this.mode || pick(DANCES), blend: 0.3 });
    }
  }

  _labels(camera, W, H) {
    const v = this._v;
    const many = this.list.length > 90;
    for (const g of this.list) {
      g.rig.headC.localToWorld(v.set(0, 0.42, 0));
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const hide = v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.3;
      if (hide !== g._hid) { g._hid = hide; g.label.style.display = hide ? 'none' : ''; }
      if (hide) continue;
      const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
      let s = Math.max(0.35, Math.min(1.9, 11 / dist));
      if (many && g.role === 'guest') s *= 0.85;
      if (g.role === 'vip') s *= 1.25;
      if (this.focused === g) s = Math.max(s, 1.4) * 1.15; // em close: foto bem grande
      const tr = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px) translate(-50%,-100%) scale(${s.toFixed(2)})`;
      if (tr !== g._tr) { g._tr = tr; g.label.style.transform = tr; }
      const z = String(1000 - Math.round(dist * 4));
      if (z !== g._z) { g._z = z; g.label.style.zIndex = z; }
    }
  }
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
