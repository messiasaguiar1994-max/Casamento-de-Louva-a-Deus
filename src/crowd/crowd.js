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
import { createChar, GUEST_CHARS, DANCES, HEIGHT } from '../chars/models.js';
import { chitinTex, chitinBump, wingTex } from '../mantis/materials.js';
import { accessoryDefs, HEAD_ACCS, FACE_ACCS, NECK_ACCS } from '../mantis/accessories.js';
import { InstrumentPlayer } from '../chars/instruments.js';
import { ENTRY, STAIR_TOP, FLOOR, STAGE, colliders } from '../scene/club.js';
const COLL = colliders();
const BODY_R = 0.33;   // "raio do corpo": ninguém chega mais perto que 2x isso de outro personagem

export const CAP = 240;
// palco da banda (atrás dos noivos, dos dois lados do tapete)
// banda: em cima do palco, dos dois lados dos noivos
const BAND = [[-3.3, -5.9], [-2.1, -7.2], [2.1, -7.2], [3.3, -5.9]];
const ENTRY_DANCES = ['chicken', 'runningman', 'charleston', 'twist'];  // entrada rápida e engraçada
const SLOT_GAP = 1.45;   // espaço entre lugares: sobra corredor entre as fileiras
const LANE_X = -6.25;    // corredor junto da grade da esquerda (por onde quem chega anda)
// um instrumento por lugar da banda (no trompete, às vezes vem trombone)
const INSTRUMENTS = ['violao', 'trompete', 'sax', 'guitarra'];
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
    const seed = hash(this.id);
    this.seed = seed;
    // personagem 3D (modelo do Mixamo, com esqueleto)
    const key = info.model || GUEST_CHARS[Math.floor(seed * 9973) % GUEST_CHARS.length];
    this.char = createChar(key, { seed });
    this.anim = this.char.anim;
    this.rig = { root: this.char.root };
    crowd.scene.add(this.char.root);
    this.bodyCol = new THREE.Color(BODY_COLORS[(seed * 997) % BODY_COLORS.length | 0]);
    this.accs = {};
    this.scale = 0.9 + ((seed * 53) % 1) * 0.18;
    this.baseScale = this.scale;
    this.role = 'guest';
    // estado
    this.pos = ENTRY.clone();
    this.yaw = 0; this.yawTarget = 0;
    this.path = [];
    this.speed = 0;
    this.state = 'arriving';
    this.slot = null;
    this.timer = rnd(0.5, 3);
    this.busy = 0;
    this.special = null;
    this.lastActive = performance.now();
    this.label = crowd.makeLabel(this);
    this.alive = true;
  }

  /** acessórios: só o instrumento do músico (preso no corpo, na frente do peito) */
  setAcc(slot, name, color = 0xffffff) {
    const old = this.accs[slot];
    if (old) { old.node.parent && old.node.parent.remove(old.node); delete this.accs[slot]; }
    if (!name || slot !== 'instr') return;
    const def = accessoryDefs()[name];
    if (!def) return;
    const m = new THREE.Mesh(def.geo, this.crowd.accMat);
    m.position.set(0.12, HEIGHT * 0.55, 0.3);
    m.rotation.set(0, 0, -0.9);
    m.scale.setScalar(1.25);
    this.char.root.add(m);
    this.accs[slot] = { node: m };
  }
  setHidden() {}

  headPos(v) { return this.char.headTop(v); }
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
    this.accMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
    this.guests = new Map();
    this.list = [];
    this.limit = 100;
    this.center = new THREE.Vector3(0, 0, (FLOOR.z0 + FLOOR.z1) / 2);
    this.lookAt = new THREE.Vector3(0, 0, STAGE.z);   // todos dançam virados para o palco
    this.entranceQ = []; this.entranceBusy = 0;
    this.slots = [];
    this.computeSlots(CAP);
    this.mode = null;          // dança em grupo
    this.modeT = 0;
    this.interactT = 3;
    this._m = new THREE.Matrix4();
    this._v = new THREE.Vector3();
    this._c = new THREE.Color();
    this._white = new THREE.Color(1, 1, 1);
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
    // palco da banda
    this.bandSlots = BAND.map(([x, z], i) => ({ pos: new THREE.Vector3(x, STAGE.y, z), inst: INSTRUMENTS[i], guest: null, since: 0 }));
    this.vipSlot = { pos: new THREE.Vector3(0, 0, FLOOR.z0 + 0.9), guest: null };
  }

  get count() { return this.list.length; }

  // ---------------- lugares em círculos ----------------
  computeSlots(n) {
    // grade na pista de LED, fileiras da frente (perto do palco) primeiro,
    // do meio para os lados. Se lotar, continua atrás e nas laterais.
    const slots = [];
    const z0 = FLOOR.z0 + 0.9;
    for (let row = 0; slots.length < n && row < 30; row++) {
      const z = z0 + row * SLOT_GAP;
      const wide = z > FLOOR.z1 - 0.4;              // fora da pista: fileiras mais largas
      const half = wide ? 9.5 : (FLOOR.x1 - 0.7);
      const off = (row % 2) * SLOT_GAP * 0.5;
      const xs = [];
      for (let k = -12; k <= 12; k++) { const x = k * SLOT_GAP + off; if (Math.abs(x) <= half + 1e-6) xs.push(x); }
      xs.sort((p, q) => Math.abs(p) - Math.abs(q));
      for (const x of xs) {
        if (Math.abs(x) < 0.8 || Math.abs(x - LANE_X) < 0.95) continue;  // corredores: do meio (até o palco) e o da esquerda (entrada)
        slots.push({ pos: new THREE.Vector3(x, 0, z), row, guest: null });
      }
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
      this.sfx('arrive');
      const clock = this.clock || 0;   // vários juntos: entram em fila pela escada
      const startAt = Math.max(clock + 0.4, (this._lastEntry || 0) + 1.6);
      this._lastEntry = startAt; g.arriveDelay = startAt - clock;
      this._queueEntrance(g);
    }
    this.onCount(this.list.length);
    return g;
  }

  /** chega sem caminhar (usado para encher a festa rápido nos testes) */
  addInstant(info) {
    const g = this.add(info, { silent: true });
    if (g && g.slot) { g.pos.copy(g.slot.pos); g.path = []; g.state = 'placed'; g.yaw = g.yawTarget = this._faceCenter(g); g.entering = false; g.waiting = false; g.arriveDelay = 0; g.char.root.visible = true; g.anim.play(pick(DANCES)); }
    return g;
  }

  _planArrival(g) {
    // surge no portal no alto da escada, desce dançando e vai para o lugar
    const s = g.slot;
    g.path = [];
    g.path.push(new THREE.Vector3(ENTRY.x, 0, ENTRY.z));
    g.path.push(new THREE.Vector3(LANE_X, 0, ENTRY.z));
    if (s && s.pos.y > 0.1) g.path.push(...this._lanePath(new THREE.Vector3(0, 0, FLOOR.z0 + 0.2), new THREE.Vector3(LANE_X, 0, ENTRY.z)).slice(0, -1), ...this._stagePath(s.pos));
    else if (s) g.path.push(...this._lanePath(s.pos, new THREE.Vector3(LANE_X, 0, ENTRY.z)));
    g.state = 'arriving';
    g.pos.copy(STAIR_TOP);
    g.yaw = Math.PI / 2;
    g.entryDance = pick(ENTRY_DANCES);
    // um de cada vez pela escada (se chegarem vários juntos, entram em fila)
    g.arriveDelay = 0.4;
    g.waiting = true; g.char.root.visible = false;
    g.entering = true;
  }
  /** pela grade da esquerda até a fileira certa, depois pelo meio das fileiras até o lugar (sem atravessar ninguém) */
  _lanePath(p, from) {
    const mid = p.z + SLOT_GAP / 2;
    if (Math.abs(p.x) < 0.8) return [new THREE.Vector3(LANE_X, 0, from.z), new THREE.Vector3(LANE_X, 0, mid), new THREE.Vector3(p.x, 0, mid), p.clone()];
    return [new THREE.Vector3(LANE_X, 0, mid), new THREE.Vector3(p.x, 0, mid), p.clone()];
  }
  /** do lugar na pista até o corredor do meio e dali até os degraus */
  _toAisle(from) {
    const mid = from.z + SLOT_GAP / 2;
    return [new THREE.Vector3(from.x, 0, mid), new THREE.Vector3(0, 0, mid), new THREE.Vector3(0, 0, FLOOR.z0 + 0.3)];
  }
  /** caminho até um lugar em cima do palco (sobe pelos degraus do meio) */
  _stagePath(p) {
    const sx = Math.sign(p.x) || 1;
    return [new THREE.Vector3(0, 0, STAGE.z + STAGE.d / 2 + 1.9), new THREE.Vector3(0, STAGE.y, STAGE.z + STAGE.d / 2 - 0.3),
      new THREE.Vector3(sx * 2.7, STAGE.y, STAGE.z + STAGE.d / 2 - 0.5), p.clone()];   // contorna os noivos pela frente
  }
  /** fila de close: cada um que entra ganha o seu momento na câmera */
  _queueEntrance(g) {
    this.entranceQ.push(g);
    if (this.entranceQ.length > 8) this.entranceQ.shift();
  }

  remove(id, { poof = true } = {}) {
    const g = this.guests.get(id);
    if (!g) return;
    if (poof) this.fx.poof(g.pos, [1, 1, 1]);
    if (g.slot) g.slot.guest = null;
    if (g.band) g.band.guest = null;
    if (g.player) { g.player.dispose(); g.player = null; }
    g.label.remove();
    this.scene.remove(g.char.root);
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
    const roleTxt = g.role === 'musician' ? '🎵 Músico' : g.role === 'padrinho' ? 'Padrinho' : g.role === 'madrinha' ? 'Madrinha' : g.role === 'vip' ? '⭐ Convidado de honra' : '';
    el.className = 'tag' + (g.role === 'vip' || g.role === 'musician' ? ' vip' : g.role === 'padrinho' || g.role === 'madrinha' ? ' pad' : '');
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

  /** vira músico da banda (presente de 10 moedas). Se a banda estiver cheia, sai o mais antigo. */
  makeMusician(g) {
    if (!g || !g.alive) return;
    let slot = this.bandSlots.find((s) => s.guest === g);
    if (!slot) {
      slot = this.bandSlots.find((s) => !s.guest) || [...this.bandSlots].sort((a, b) => a.since - b.since)[0];
      if (slot.guest) this.leaveBand(slot.guest);
      if (g.slot) g.slot.guest = null;
      slot.guest = g; g.slot = slot; g.band = slot;
      g.role = 'musician';
      g.setAcc('face', null);
      const forced = new URLSearchParams(location.search).get('inst'); // só para testes
      g.instKind = forced || (slot.inst === 'trompete' && Math.random() < 0.5 ? 'trombone' : slot.inst);
      g.path = g.state === 'arriving' && g.entering ? [new THREE.Vector3(ENTRY.x, 0, ENTRY.z), new THREE.Vector3(LANE_X, 0, ENTRY.z), new THREE.Vector3(LANE_X, 0, FLOOR.z0 + 0.3), new THREE.Vector3(0, 0, FLOOR.z0 + 0.3), ...this._stagePath(slot.pos)] : [...(g.pos.y < 0.3 ? this._toAisle(g.pos) : []), ...this._stagePath(slot.pos)]; g.state = 'arriving'; g.arriveDelay = g.arriveDelay > 0 ? g.arriveDelay : 0.3;
      this.updateLabel(g);
    }
    slot.since = performance.now();
    g.lastActive = performance.now();
    this.fx.notes(g.headPos(this._v.clone()), 8);
    this.fx.sparkles(g.pos.clone().setY(1.2), 25, [1, 0.85, 0.4], 1, 2);
    this.sfx('special');
    this.onFocus(g, 5);
  }
  leaveBand(g) {
    const slot = g.band;
    if (slot) slot.guest = null;
    g.band = null; g.role = 'guest';
    if (g.player) { g.player.dispose(); g.player = null; }
    const s = this.freeSlot();
    g.slot = s; if (s) { s.guest = g; const sx = Math.sign(g.pos.x) || 1; g.path = [new THREE.Vector3(sx * 2.7, STAGE.y, STAGE.z + STAGE.d / 2 - 0.5), new THREE.Vector3(0, STAGE.y, STAGE.z + STAGE.d / 2 - 0.3), new THREE.Vector3(0, 0, STAGE.z + STAGE.d / 2 + 1.9), new THREE.Vector3(0, 0, s.pos.z + SLOT_GAP / 2), new THREE.Vector3(s.pos.x, 0, s.pos.z + SLOT_GAP / 2), s.pos.clone()]; g.state = 'arriving'; g.arriveDelay = 0; }
    this.updateLabel(g);
  }

  /** todos reagem (palmas, comemoração, surpresa) */
  react(type, except = null) {
    for (const g of this.list) {
      if (g === except || g.special || g.state !== 'placed' || g.band) continue;
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
    for (const g of this.list) if (!g.special && g.state === 'placed' && !g.band) { g.anim.play(name, { blend: 0.6 }); g.busy = 0; g.timer = dur; }
  }

  /** raio ocupado pelos convidados (para a vista aérea pegar todo mundo) */
  extent() {
    let r = 5.5;
    for (const g of this.list) if (!g.band && g.state === 'placed') r = Math.max(r, Math.abs(g.pos.x - this.center.x) + 1.4, (Math.abs(g.pos.z - this.center.z) + 1.4) * 0.62);
    return Math.min(r, 26);
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

  _faceCenter(g) { return Math.atan2((this.lookAt.x - g.pos.x) * 0.35, this.lookAt.z - g.pos.z); }

  // ---------------- atualização por quadro ----------------
  update(dt, time, beat, camera, viewW, viewH) {
    if (this.mode) { this.modeT -= dt; if (this.modeT <= 0) this.mode = null; }
    this.interactT -= dt;
    if (this.interactT <= 0) { this.interactT = rnd(1.5, 3.5); this._interact(); }

    // fila de closes das entradas
    this.entranceBusy -= dt;
    this.clock = (this.clock || 0) + dt;
    while (this.entranceQ.length && !(this.entranceQ[0].alive && this.entranceQ[0].state === 'arriving')) this.entranceQ.shift();
    if (this.entranceBusy <= 0 && this.entranceQ.length && !this.entranceQ[0].waiting) {
      const g = this.entranceQ.shift();
      this.onFocus(g, 6.5, 'entrance'); this.entranceBusy = 6.5;
    }
    this.R.begin();
    this._frame = (this._frame || 0) + 1;
    const camPos = camera.position;
    for (const g of this.list) {
      this._behave(g, dt, time);
      const root = g.char.root;
      root.position.copy(g.pos);
      root.rotation.y = g.yaw;
      root.scale.setScalar(g.scale);
      // otimização: quem está longe da câmera anima a cada 2 quadros
      g._acc = (g._acc || 0) + dt;
      const far = g.pos.distanceToSquared(camPos) > 300 && !g.special && g.state === 'placed';
      if (!(far && ((this._frame + (g.seed * 10 | 0)) & 1))) { g.char.update(g._acc); g._acc = 0; }
      if (g.player && g.state === 'placed') g.player.update(dt, beat);
      this._m.makeScale(g.scale, 1, g.scale).setPosition(g.pos.x, g.pos.y + 0.025, g.pos.z);
      this.R.push('blob', this._m, this._white);
      // efeitos contínuos
      if (g.fxT) {
        g.fxT.t -= dt;
        if (g.fxT.t <= 0) g.fxT = null;
        else if (g.fxT.type === 'special' && Math.random() < 0.35) { this.fx.notes(g.headPos(this._v.clone()), 1); this.fx.sparkles(g.pos.clone().setY(1), 2, [1, 0.6, 0.9], 0.8, 1.5); }
        else if (g.fxT.type === 'hearts' && Math.random() < 0.5) this.fx.hearts(g.headPos(this._v.clone()), 2, 0.6);
      }
      if (g.band && Math.random() < 0.04) this.fx.notes(g.headPos(this._v.clone()), 1);
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
      if (g.waiting) { // aparece no portal, acena e desce dançando
        g.waiting = false; g.char.root.visible = true;
        this.fx.poof(g.pos.clone().setY(g.pos.y + 0.6), [0.9, 0.5, 1]);
        g.anim.play('hello', { dur: 1.0, next: g.entryDance }); g.arriveDelay = 0.9; return;
      }
      const tgt = g.path[0];
      if (!tgt) { g.state = 'placed'; g.speed = 0; return; }
      const dx = tgt.x - g.pos.x, dz = tgt.z - g.pos.z, d = Math.hypot(dx, dz);
      // quem está entrando vem dançando (passo rápido e engraçado); os outros andam
      const moveAnim = g.entering ? g.entryDance : 'walk';
      if (g.anim.name !== moveAnim && g.anim.name !== 'hello') g.anim.play(moveAnim, { blend: 0.25 });
      const sp = g.entering ? 1.9 : 2.3;
      if (d < (g.path.length > 1 ? 0.35 : 0.12)) {
        g.pos.y = tgt.y;
        g.path.shift();
        if (!g.path.length) {
          g.state = 'placed'; g.speed = 0; g.entering = false;
          g.yawTarget = this._faceCenter(g);
          if (g.band) {
            if (!g.player) g.player = new InstrumentPlayer(g.char, g.instKind || g.band.inst);
            g.anim.play(g.player.bodyAnim, { blend: 0.4 });
          } else g.anim.play(this.mode || pick(DANCES), { blend: 0.4 });
          g.timer = rnd(6, 14);
        }
      } else {
        const step = Math.min(d, sp * dt);
        const ox = g.pos.x, oz = g.pos.z;
        g.pos.x += (dx / d) * step; g.pos.z += (dz / d) * step;
        this._collide(g, dx / d, dz / d, g.path.length === 1 && d < 0.6);
        // empacou (alguém parado bem no caminho)? por um instante passa "de lado" mais forte
        g._prog = (g._prog || 0) + Math.hypot(g.pos.x - ox, g.pos.z - oz);
        g._progT = (g._progT || 0) + dt;
        if (g._progT > 1.2) { g._side = g._prog < 0.25 ? (g._side || 1) * -1 * 1.6 : 0; g._prog = 0; g._progT = 0; }
        // altura: escada da entrada segue os degraus; subir no palco é suave
        if (g.pos.x < ENTRY.x - 0.05 && Math.abs(g.pos.z - ENTRY.z) < 1.4) {
          const u = Math.min(1, Math.max(0, (g.pos.x - STAIR_TOP.x) / (ENTRY.x - STAIR_TOP.x)));
          const nSt = 9, k = Math.min(nSt - 1, Math.floor(u * nSt));
          g.pos.y = (STAIR_TOP.y / nSt) * (nSt - k);
        } else g.pos.y += (tgt.y - g.pos.y) * Math.min(1, step / Math.max(d, 0.001));
        g.speed = sp;
        g.yawTarget = Math.atan2(dx, dz);
      }
      g.yaw += angDiff(g.yaw, g.yawTarget) * Math.min(1, dt * 8);
      return;
    }
    // ---- no lugar: dança e interage ----
    g.speed = 0;
    if (g.band) { // músico: toca de frente para o público, balançando no ritmo
      g.yawTarget = Math.atan2(-g.pos.x * 0.25, 4) + Math.sin(time * 0.9 + g.seed * 9) * 0.18;
      g.yaw += angDiff(g.yaw, g.yawTarget) * Math.min(1, dt * 3);
      if (g.player && g.anim.name !== g.player.bodyAnim && g.busy <= 0) g.anim.play(g.player.bodyAnim, { blend: 0.4 });
      return;
    }
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

  /** empurra quem está andando para fora dos objetos do cenário e dos outros personagens */
  _collide(g, fx, fz, nearEnd) {
    const onStagePath = g.band || g.pos.y > 0.3 || (g.path[0] && g.path[0].y > 0.3) || g.path.some((p) => p.y > 0.3);
    const minD = BODY_R * 2;
    // outros personagens (e os noivos)
    const others = this.extraObstacles ? this.extraObstacles() : [];
    for (let pass = 0; pass < 3; pass++) {
      for (const o of this.list) {
        if (o === g || Math.abs(o.pos.y - g.pos.y) > 0.6) continue;
        this._pushFrom(g, o.pos.x, o.pos.z, minD, fx, fz);
      }
      for (const p of others) if (Math.abs(p.y - g.pos.y) < 0.6) this._pushFrom(g, p.x, p.z, minD + 0.12, fx, fz);
      // cenário (segmentos)
      for (const c of COLL) {
        if (c.stage && onStagePath) continue;
        if (g.pos.y > 0.3 && !c.stage && g.pos.y < STAGE.y - 0.2) continue; // na escada da entrada
        const ex = c.x2 - c.x1, ez = c.z2 - c.z1, L2 = ex * ex + ez * ez;
        let t = L2 > 0 ? ((g.pos.x - c.x1) * ex + (g.pos.z - c.z1) * ez) / L2 : 0; t = Math.max(0, Math.min(1, t));
        this._pushFrom(g, c.x1 + ex * t, c.z1 + ez * t, c.r + BODY_R, fx, fz);
      }
    }
  }
  _pushFrom(g, px, pz, minD, fx, fz) {
    let ax = g.pos.x - px, az = g.pos.z - pz, dd = Math.hypot(ax, az);
    if (dd >= minD) return;
    if (dd < 1e-4) { ax = -fz; az = fx; dd = 1; }
    ax /= dd; az /= dd;
    // se o empurrão é bem contra a direção do passo, desvia para um lado (contorna em vez de travar)
    if (ax * fx + az * fz < -0.7) { const sd = (g._side || (g.seed > 0.5 ? 1 : -1)); ax += -fz * 0.6 * sd; az += fx * 0.6 * sd; const n = Math.hypot(ax, az); ax /= n; az /= n; }
    g.pos.x = px + ax * minD; g.pos.z = pz + az * minD;
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
    const free = this.list.filter((g) => g.state === 'placed' && !g.special && g.busy <= 0 && !g.band);
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
      g.headPos(v);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const hide = g.waiting || v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.3;
      if (hide !== g._hid) { g._hid = hide; g.label.style.display = hide ? 'none' : ''; }
      if (hide) continue;
      const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
      let s = Math.max(0.35, Math.min(1.15, 10 / dist));
      if (many && g.role === 'guest') s *= 0.85;
      if (g.role === 'vip') s *= 1.25;
      if (this.focused === g) s = Math.max(s, 1.4) * 1.15; // em close: foto bem grande
      if (this.overview) s = this.list.length > 60 ? 0.62 : this.list.length > 30 ? 0.75 : 0.9; // vista aérea: todas as fotos visíveis
      const tr = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px) translate(-50%,-100%) scale(${s.toFixed(2)})`;
      if (tr !== g._tr) { g._tr = tr; g.label.style.transform = tr; }
      const z = String(1000 - Math.round(dist * 4));
      if (z !== g._z) { g._z = z; g.label.style.zIndex = z; }
    }
  }
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
