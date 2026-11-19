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
    url: urlViolao, size: 1.12, socket: 'belly', body: 'guitar',
    pos: [-0.12, -0.02, 0.1], rot: [0, -0.3, 0.42],
    hands: { L: [0.36, 0, 0.0], R: [-0.03, 0, 0.12] },
  },
  guitarra: {
    url: urlGuitarra, size: 1.08, socket: 'belly', body: 'guitar',
    pos: [-0.1, -0.02, 0.1], rot: [0, -0.3, 0.42],
    hands: { L: [0.42, 0, 0.0], R: [-0.02, 0, 0.11] },
  },
  trompete: {
    url: urlTrumpet, size: 0.62, socket: 'mouth', body: 'idle',
    pos: [0, 0, 0.02], rot: [0.16, 0, 0],
    hands: { L: [0.05, -0.1, 0.42], R: [0.03, 0.12, 0.4] },
  },
  trombone: {
    url: urlTrombone, size: 1.05, socket: 'mouth', body: 'idle',
    pos: [0, 0, 0.02], rot: [0.14, 0, -1.15],
    hands: { L: [0.02, 0.16, 0.22], R: [0.03, 0.0, 0.6] },
  },
  sax: {
    url: urlSax, size: 0.85, socket: 'mouth', body: 'idle',
    pos: [0, 0, 0.03], rot: [-0.12, 0, -0.22],
    hands: { L: [0, -0.32, 0.31], R: [0, -0.62, 0.33] },
  },
};
export const INSTRUMENT_KINDS = Object.keys(DEFS);

const T = { models: {}, sockets: {} };
// altura da boca de cada modelo (medida olhando o rosto de cada um)
const MOUTH_DY = { zumbi_azul: -0.13, noiva: -0.13, noivo_zumbi: -0.17, palhaco: -0.17, goblin: -0.14, tung_tung: -0.18 };

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
  make('mouth', B.Head ? 'Head' : 'Neck', new THREE.Vector3(H.x, my, front(H.x, my, H.z, H.z + hs * 0.45)));
  const sb = B.Spine || B.Hips, S = wp(sb);
  const by = S.y + 0.05;
  make('belly', B.Spine1 ? 'Spine1' : sb.name, new THREE.Vector3(S.x, by, front(S.x, by, S.z, S.z + 0.25)));
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
export class InstrumentPlayer {
  constructor(char, kind) {
    this.char = char; this.kind = kind; this.def = DEFS[kind];
    const d = this.def, sk = socketsFor(char.key)[d.socket];
    this.socket = new THREE.Object3D();
    if (sk) { sk.local.decompose(this.socket.position, this.socket.quaternion, this.socket.scale); char.bones[sk.bone].add(this.socket); }
    else char.root.add(this.socket);
    const inst = T.models[kind].clone(true);
    inst.scale.setScalar(d.size);
    inst.position.set(...d.pos); inst.rotation.set(...d.rot);
    this.socket.add(inst); this.inst = inst;
    this.mk = {};
    for (const s of ['L', 'R']) { const o = new THREE.Object3D(); o.position.set(...d.hands[s]); inst.add(o); this.mk[s] = o; }
    this.base = { L: new THREE.Vector3(...d.hands.L), R: new THREE.Vector3(...d.hands.R) };
    this.fret = 0; this.fretT = 0;
    this.tgt = new THREE.Vector3(); this.pole = new THREE.Vector3();
    this.t = Math.random() * 10;
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
      // vara do trombone indo e voltando
      R.set(bR.x, bR.y, bR.z + 0.18 * Math.sin(ph * 0.5 + this.t * 0.6));
      L.copy(bL);
    } else {
      // pistos / chaves: dedos batendo de leve
      R.set(bR.x, bR.y + Math.max(0, Math.sin(ph * 2)) * 0.012, bR.z);
      L.set(bL.x, bL.y + Math.max(0, Math.sin(ph * 2 + 1.5)) * 0.01, bL.z);
    }
  }
  /** depois da animação do corpo: leva as mãos até o instrumento */
  update(dt, beat) {
    this._play(dt, beat);
    const c = this.char, B = c.bones;
    c.root.updateMatrixWorld(true);
    const rq = c.root.getWorldQuaternion(_wq).clone();
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rq), left = new THREE.Vector3(1, 0, 0).applyQuaternion(rq);
    for (const s of ['L', 'R']) {
      const side = s === 'L' ? 'Left' : 'Right';
      const up = B[side + 'Arm'], lo = B[side + 'ForeArm'], hd = B[side + 'Hand'];
      if (!up || !lo || !hd) continue;
      this.mk[s].getWorldPosition(this.tgt);
      // cotovelo para baixo, um pouco para fora e para trás
      this.pole.set(0, -1, 0).addScaledVector(left, s === 'L' ? 0.55 : -0.55).addScaledVector(fwd, -0.35);
      solveArm(up, lo, hd, this.tgt, this.pole);
      // a palma (base dos dedos) é que encosta no instrumento, não o pulso:
      // mede a distância pulso -> dedos e resolve de novo com o alvo recuado
      const knuckle = B[side + 'HandMiddle1'] || B[side + 'HandIndex1'];
      if (knuckle) {
        hd.getWorldPosition(_a); knuckle.getWorldPosition(_b);
        _c.subVectors(_b, _a).multiplyScalar(0.8);
        this.tgt.sub(_c);
        solveArm(up, lo, hd, this.tgt, this.pole);
      }
    }
  }
  dispose() { this.socket.parent && this.socket.parent.remove(this.socket); }
}
