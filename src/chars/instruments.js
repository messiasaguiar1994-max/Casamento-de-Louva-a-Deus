// =============================================================
//  INSTRUMENTOS DE VERDADE NA MÃO DOS MÚSICOS
//  - Modelos .glb (violão, guitarra, trompete, trombone, sax),
//    já virados num padrão: sopro com o bocal na origem e a
//    campana para a frente (+Z); cordas com a boca/captadores na
//    origem, o braço para a esquerda do músico (+X) e a frente (+Z).
//  - O instrumento fica preso na boca (sopro) ou na barriga
//    (cordas) de cada personagem, medido no próprio modelo.
//  - As mãos vão até o instrumento com IK de dois ossos (braço e
//    antebraço), então nunca atravessam e fazem o movimento de tocar:
//    batida nas cordas, troca de casa, vara do trombone, pistos...
// =============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadGLB } from '../util/glb.js';
import { createChar } from './models.js';
import urlViolao from '../assets/instr/violao.glb?url';
import urlGuitarra from '../assets/instr/guitarra.glb?url';
import urlTrumpet from '../assets/instr/trumpet.glb?url';
import urlTrombone from '../assets/instr/trombone.glb?url';
import urlSax from '../assets/instr/sax.glb?url';

// tamanho no jogo (personagens têm 2,1 de altura), onde prende e onde ficam as mãos (coordenadas do modelo, antes da escala)
const DEFS = {
  violao: {
    url: urlViolao, size: 1.12, socket: 'belly', body: 'guitar', wind: false,
    pos: [-0.12, -0.02, 0.1], rot: [0, -0.3, 0.42],
    hands: { L: { p: [0.36, -0.01, -0.06], f: [0, 1, 0.35], n: [0, 0, 1] },   // atrás do braço, dedos por cima
      R: { p: [-0.04, 0, 0.075], f: [0.3, -1, 0], n: [0, 0, -1] } },           // palma virada para as cordas
  },
  guitarra: {
    url: urlGuitarra, size: 1.08, socket: 'belly', body: 'guitar', wind: false,
    pos: [-0.1, -0.02, 0.1], rot: [0, -0.3, 0.42],
    hands: { L: { p: [0.42, -0.01, -0.055], f: [0, 1, 0.35], n: [0, 0, 1] },
      R: { p: [-0.03, 0, 0.07], f: [0.3, -1, 0], n: [0, 0, -1] } },
  },
  trompete: {
    url: urlTrumpet, size: 0.62, socket: 'mouth', body: 'idle', wind: true,
    pos: [0, 0, 0.02], rot: [0.16, 0, 0],
    hands: { L: { p: [0.1, -0.02, 0.43], f: [0, 1, 0.2], n: [-1, 0, 0] },       // segura os pistos pelo lado
      R: { p: [0.03, 0.17, 0.4], f: [0, 0, 1], n: [0, -1, 0] } },               // dedos em cima dos pistos
  },
  trombone: {
    url: urlTrombone, size: 1.05, socket: 'mouth', body: 'idle', wind: true,
    pos: [0, 0, 0.02], rot: [0.14, 0, -1.15],
    hands: { L: { p: [0.02, 0.16, 0.22] }, R: { p: [0.03, 0.0, 0.6] } },
  },
  sax: {
    // como na foto: o sax desce na diagonal, para a frente e para a direita do músico
    url: urlSax, size: 0.85, socket: 'mouth', body: 'idle', wind: true,
    pos: [0, 0, 0.03], rot: [-0.22, 0.25, -0.42],
    hands: { L: { p: [0, -0.33, 0.25], f: [-1, 0.1, 0.25], n: [0, 0, 1] },     // mão de cima
      R: { p: [0, -0.63, 0.27], f: [1, 0.1, 0.25], n: [0, 0, 1] } },            // mão de baixo
  },
};
export const INSTRUMENT_KINDS = Object.keys(DEFS);

const T = { models: {}, sockets: {} };
// boca fechada em "bico" para quem toca sopro: tampa a boca aberta do modelo com pele
// (cor e tamanho de cada personagem) e faz os lábios franzidos em volta do bocal
// quanto a boca fica à frente do ponto medido (boca aberta funda: o bocal fica nos lábios, não lá dentro)
const MOUTH_DZ = { noivo_zumbi: 0.23, goblin: 0.05, zumbi_azul: 0.01, noiva: 0.01 };
const LIPS = {
  zumbi_azul: { col: 0x3a9590, w: 0.2, h: 0.12, dy: -0.015, dz: 0.02 }, noiva: { col: 0x3a9590, w: 0.2, h: 0.12, dy: -0.015, dz: 0.02 },
  noivo_zumbi: { col: 0x5e8a2c, w: 0.42, h: 0.32, dy: 0.06, dz: 0.02, d: 0.4 }, palhaco: { col: 0xcfcfd2, w: 0.14, h: 0.08, dy: 0, dz: 0 },
  goblin: { col: 0x6aa83a, w: 0.3, h: 0.15, dy: 0.04, dz: 0.065, d: 0.18 }, tung_tung: { col: 0x5a3f2a, w: 0.2, h: 0.09, dy: 0, dz: 0.005 },
};
// altura da boca de cada modelo (medida olhando o rosto de cada um)
const MOUTH_DY = { zumbi_azul: -0.17, noiva: -0.17, noivo_zumbi: -0.17, palhaco: -0.17, goblin: -0.14, tung_tung: -0.18 };

export async function loadInstruments() {
  const L = new GLTFLoader();
  await Promise.all(Object.entries(DEFS).map(async ([k, d]) => {
    const g = await loadGLB(d.url, L);
    g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { m.side = THREE.DoubleSide; if (m.map) m.map.anisotropy = 8; } } });
    T.models[k] = g.scene;
  }));
}

// ------------------------------------------------------------------
//  "tomadas" medidas no personagem parado (pose original):
//  boca = frente do rosto; barriga = frente do corpo na altura do Spine
// ------------------------------------------------------------------
export function socketsFor(key) {
  if (T.sockets[key]) return T.sockets[key];
  const c = createChar(key);
  c.root.updateMatrixWorld(true);
  const meshes = []; c.model.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const B = c.bones;
  const wp = (b) => b.getWorldPosition(new THREE.Vector3());
  const ray = new THREE.Raycaster();
  const front = (x, y, zc, fallback) => {
    ray.set(new THREE.Vector3(x, y, zc + 4), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.point.z : fallback;
  };
  const H = wp(B.Head || B.Neck), top = c.headTop(new THREE.Vector3());
  const hs = Math.max(0.15, top.y - H.y);
  const out = {};
  const make = (name, boneName, pos) => {
    const bone = B[boneName]; if (!bone) return;
    const want = new THREE.Matrix4().compose(pos, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    const local = bone.matrixWorld.clone().invert().multiply(want);
    out[name] = { bone: boneName, local };
  };
  const my = H.y + hs * 0.28 + (MOUTH_DY[key] || 0);
  make('mouth', B.Head ? 'Head' : 'Neck', new THREE.Vector3(H.x, my, front(H.x, my, H.z, H.z + hs * 0.45) + (MOUTH_DZ[key] || 0)));
  const sb = B.Spine || B.Hips, S = wp(sb);
  const by = S.y + 0.05;
  make('belly', B.Spine1 ? 'Spine1' : sb.name, new THREE.Vector3(S.x, by, front(S.x, by, S.z, S.z + 0.25)));
  // eixos da mão (no espaço do osso da mão): para onde apontam os dedos e a palma
  out.hand = {};
  for (const side of ['Left', 'Right']) {
    const hd = B[side + 'Hand'], mid = B[side + 'HandMiddle1'], idx = B[side + 'HandIndex1'], pk = B[side + 'HandPinky1'] || B[side + 'HandRing1'];
    if (!hd || !mid || !idx || !pk) continue;
    const iq = hd.getWorldQuaternion(new THREE.Quaternion()).invert();
    const f = wp(mid).sub(wp(hd)).normalize(), sd = wp(idx).sub(wp(pk)).normalize();
    const n = new THREE.Vector3().crossVectors(f, sd).normalize(); if (side === 'Right') n.negate();
    out.hand[side] = { f: f.applyQuaternion(iq).normalize(), n: n.applyQuaternion(iq).normalize(), len: wp(mid).distanceTo(wp(hd)) };
  }
  return (T.sockets[key] = out);
}

// ------------------------------------------------------------------
//  IK de dois ossos (ombro -> cotovelo -> mão), no espaço do mundo
// ------------------------------------------------------------------
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3();
const _n = new THREE.Vector3(), _m = new THREE.Vector3(), _d1 = new THREE.Vector3(), _d2 = new THREE.Vector3();
const _q = new THREE.Quaternion(), _wq = new THREE.Quaternion(), _pq = new THREE.Quaternion();
function rotateWorld(bone, from, to) {
  _q.setFromUnitVectors(from, to);
  bone.getWorldQuaternion(_wq);
  bone.parent.getWorldQuaternion(_pq);
  _wq.premultiply(_q);
  bone.quaternion.copy(_pq.invert().multiply(_wq));
  bone.updateMatrixWorld(true);
}
function solveArm(upper, lower, hand, target, pole) {
  upper.getWorldPosition(_a); lower.getWorldPosition(_b); hand.getWorldPosition(_c);
  const l1 = _a.distanceTo(_b), l2 = _b.distanceTo(_c);
  if (l1 < 1e-4 || l2 < 1e-4) return;
  _n.subVectors(target, _a); let d = _n.length();
  d = THREE.MathUtils.clamp(d, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3); _n.normalize();
  // cotovelo: no plano que contém o alvo e a direção do "polo" (cotovelo para baixo/fora)
  _m.copy(pole).addScaledVector(_n, -pole.dot(_n));
  if (_m.lengthSq() < 1e-6) _m.set(0, -1, 0); _m.normalize();
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  _e.copy(_a).addScaledVector(_n, x).addScaledVector(_m, h);
  rotateWorld(upper, _d1.subVectors(_b, _a).normalize(), _d2.subVectors(_e, _a).normalize());
  lower.getWorldPosition(_b); hand.getWorldPosition(_c);
  rotateWorld(lower, _d1.subVectors(_c, _b).normalize(), _d2.subVectors(target, _b).normalize());
}

// ------------------------------------------------------------------
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _iq = new THREE.Quaternion(), _hq = new THREE.Quaternion();
const _F = new THREE.Vector3(), _N = new THREE.Vector3(), _X = new THREE.Vector3(), _fl = new THREE.Vector3(), _nl = new THREE.Vector3(), _xl = new THREE.Vector3();
/** gira a mão para os dedos apontarem para F e a palma para N (mundo) */
function orientHand(hand, ax, F, N) {
  _N.copy(N).addScaledVector(F, -N.dot(F)).normalize();
  _X.crossVectors(F, _N);
  _fl.copy(ax.f); _nl.copy(ax.n).addScaledVector(_fl, -ax.n.dot(_fl)).normalize(); _xl.crossVectors(_fl, _nl);
  _m1.makeBasis(F, _N, _X); _m2.makeBasis(_fl, _nl, _xl).transpose();
  _hq.setFromRotationMatrix(_m1.multiply(_m2));            // rotação da mão no mundo
  hand.parent.getWorldQuaternion(_iq).invert();
  hand.quaternion.copy(_iq.multiply(_hq));
  hand.updateMatrixWorld(true);
}

export class InstrumentPlayer {
  constructor(char, kind) {
    this.char = char; this.kind = kind; this.def = DEFS[kind];
    const d = this.def, socks = socketsFor(char.key), sk = socks[d.socket];
    this.handAx = socks.hand || {};
    this.socket = new THREE.Object3D();
    if (sk) { sk.local.decompose(this.socket.position, this.socket.quaternion, this.socket.scale); char.bones[sk.bone].add(this.socket); }
    else char.root.add(this.socket);
    this.sockScale = this.socket.scale.clone();
    const inst = T.models[kind].clone(true);
    inst.scale.setScalar(d.size);
    inst.position.set(...d.pos); inst.rotation.set(...d.rot);
    this.socket.add(inst); this.inst = inst;
    if (d.wind) {
      const L = LIPS[char.key] || { col: 0x777777, w: 0.16, h: 0.09 };
      const skin = new THREE.MeshStandardMaterial({ color: L.col, roughness: 0.75 });
      const lipMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(L.col).multiplyScalar(0.62), roughness: 0.6 });
      const lips = new THREE.Group();
      const cover = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), skin);   // boca fechada
      const dep = L.d || 0.09; cover.scale.set(L.w, L.h, dep); cover.position.set(0, L.dy || 0, (L.dz || 0) - dep / 3); lips.add(cover);   // grosso o bastante p/ fechar a boca vista de lado
      const bico = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.013, 8, 18), lipMat);  // lábios em bico no bocal
      bico.position.z = 0.012 + Math.max(0, (L.dz || 0) - 0.01); bico.scale.set(1.15, 0.9, 1.3); lips.add(bico);
      this.socket.add(lips); this.lips = lips;
    }
    this.mk = {}; this.base = {};
    for (const s of ['L', 'R']) { const h = d.hands[s]; const o = new THREE.Object3D(); o.position.set(...h.p); inst.add(o); this.mk[s] = o; this.base[s] = new THREE.Vector3(...h.p); }
    this.fret = 0; this.fretT = 0;
    this.tgt = new THREE.Vector3(); this.pole = new THREE.Vector3();
    this.t = Math.random() * 10;
    this.headBase = char.bones.Head ? char.bones.Head.scale.clone() : null;
    this.modelY = char.model.position.y;
  }
  get bodyAnim() { return this.def.body; }
  /** movimento de tocar (mexe os marcadores das mãos no próprio instrumento) */
  _play(dt, beat) {
    const k = this.kind, L = this.mk.L.position, R = this.mk.R.position, bL = this.base.L, bR = this.base.R;
    this.t += dt;
    const ph = (beat % 1) * Math.PI * 2;
    if (k === 'violao' || k === 'guitarra') {
      // batida: mão direita sobe e desce nas cordas no ritmo; esquerda troca de casa
      R.set(bR.x, bR.y + Math.sin(ph * 2) * 0.07, bR.z);
      this.fretT -= dt; if (this.fretT <= 0) { this.fretT = 0.9 + Math.random() * 1.2; this.fret = (Math.random() - 0.5) * 0.16; }
      L.x += (bL.x + this.fret - L.x) * Math.min(1, dt * 10); L.y = bL.y; L.z = bL.z;
    } else if (k === 'trombone') {
      R.set(bR.x, bR.y, bR.z + 0.18 * Math.sin(ph * 0.5 + this.t * 0.6));   // vara indo e voltando
      L.copy(bL);
    } else {
      R.set(bR.x, bR.y + Math.max(0, Math.sin(ph * 2)) * 0.012, bR.z);       // dedos nas chaves
      L.set(bL.x, bL.y + Math.max(0, Math.sin(ph * 2 + 1.5)) * 0.01, bL.z);
    }
  }
  /** corpo de quem toca sopro (como o saxofonista da foto): balança, inclina para trás e
   *  para a frente no ritmo, dobra o joelho, cabeça acompanha; bochechas "sopram" */
  _windBody(beat) {
    const B = this.char.bones, t = this.t, ph = (beat % 1) * Math.PI * 2;
    const rot = (bone, ax, ay, az) => { if (!bone) return; _q.setFromEuler(new THREE.Euler(ax, ay, az)); bone.quaternion.multiply(_q); };
    rot(B.Spine, -0.1 - 0.1 * Math.sin(ph * 0.5), 0.18 * Math.sin(t * 0.9), 0.06 * Math.sin(t * 0.9 + 1));
    rot(B.Spine1, -0.05 * Math.sin(ph * 0.5), 0.08 * Math.sin(t * 0.9), 0);
    rot(B.Head || B.Neck, 0.04 + 0.04 * Math.sin(ph), 0, 0);   // cabeça baixa, para o bocal
    this.char.model.position.y = this.modelY - 0.035 * (0.5 + 0.5 * Math.cos(ph)) * this.char.root.scale.y; // joelho no ritmo
    // bochechas enchendo de ar ao soprar (a cabeça "infla" um pouco; o instrumento não muda de tamanho)
    if (this.headBase && B.Head) {
      const k = 0.5 + 0.5 * Math.sin(ph * 2);
      B.Head.scale.set(this.headBase.x * (1 + 0.07 * k), this.headBase.y * (1 - 0.02 * k), this.headBase.z * (1 + 0.09 * k));
      this.socket.scale.set(this.sockScale.x / (1 + 0.07 * k), this.sockScale.y / (1 - 0.02 * k), this.sockScale.z / (1 + 0.09 * k));
    }
  }
  /** depois da animação do corpo: leva as mãos até o instrumento */
  update(dt, beat) {
    this._play(dt, beat);
    const c = this.char, B = c.bones;
    if (this.def.wind) this._windBody(beat);
    c.root.updateMatrixWorld(true);
    const rq = c.root.getWorldQuaternion(_wq).clone();
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rq), left = new THREE.Vector3(1, 0, 0).applyQuaternion(rq);
    const iqw = this.inst.getWorldQuaternion(new THREE.Quaternion());
    for (const s of ['L', 'R']) {
      const side = s === 'L' ? 'Left' : 'Right';
      const up = B[side + 'Arm'], lo = B[side + 'ForeArm'], hd = B[side + 'Hand'];
      if (!up || !lo || !hd) continue;
      const h = this.def.hands[s], ax = this.handAx[side];
      const palm = this.mk[s].getWorldPosition(new THREE.Vector3());
      this.pole.set(0, -1, 0).addScaledVector(left, s === 'L' ? 0.55 : -0.55).addScaledVector(fwd, -0.35);
      // 2 passadas: braço até perto -> vira a mão -> recua o pulso para a palma ficar no ponto certo
      for (let it = 0; it < 2; it++) {
        if (it === 0) this.tgt.copy(palm);
        solveArm(up, lo, hd, this.tgt, this.pole);
        if (h.f && ax) orientHand(hd, ax, _a.set(...h.f).applyQuaternion(iqw).normalize().clone(), _b.set(...h.n).applyQuaternion(iqw).normalize().clone());
        const knuckle = B[side + 'HandMiddle1'] || B[side + 'HandIndex1'];
        if (!knuckle) break;
        hd.getWorldPosition(_c); knuckle.getWorldPosition(_e);
        this.tgt.copy(palm).sub(_e.sub(_c).multiplyScalar(0.55));
      }
      solveArm(up, lo, hd, this.tgt, this.pole);
      if (h.f && ax) orientHand(hd, ax, _a.set(...h.f).applyQuaternion(iqw).normalize().clone(), _b.set(...h.n).applyQuaternion(iqw).normalize().clone());
    }
  }
  dispose() {
    this.socket.parent && this.socket.parent.remove(this.socket);
    const B = this.char.bones;
    if (this.headBase && B.Head) B.Head.scale.copy(this.headBase);
    this.char.model.position.y = this.modelY;
  }
}
