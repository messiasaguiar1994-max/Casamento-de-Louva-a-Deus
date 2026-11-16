// =============================================================
//  Esqueleto (rig) articulado do louva-a-deus
//  - Juntas: corpo, abdômen, tórax, pescoço, cabeça, olhos,
//    antenas (3 segmentos), 2 braços raptoriais (3 segmentos)
//    e 4 pernas de caminhada com IK (pés fixos no chão).
//  - "sink" decide como as peças viram malhas:
//      noivos  -> THREE.Mesh normal (alta qualidade)
//      convidados -> marcadores lidos pelo InstancedMesh (rápido)
// =============================================================
import * as THREE from 'three';
import { bodyGeos, eyeGeos, mouthGeos } from './geometry.js';

export const BODY_Y = 1.0;

/** Valores neutros de pose. As animações escrevem desvios sobre eles. */
export function defaultPose() {
  return {
    hop: 0, bob: 0, lean: 0, tilt: 0, twist: 0, hipYaw: 0, hipRoll: 0, spin: 0,
    abdPitch: 0, abdYaw: 0,
    headPitch: 0, headYaw: 0, headRoll: 0,
    antL: 0, antR: 0, antCurl: 0, antWig: 0.25,
    lRaise: 0, lOut: 0, lEl: 0, lFold: 0,
    rRaise: 0, rOut: 0, rEl: 0, rFold: 0,
    eye: 1, pupX: 0, pupY: 0, mouth: 0,
    squash: 1, step: 0, stepPh: 0, footSpread: 1, shiftX: 0, shiftZ: 0, kick: 0,
  };
}
export const POSE_KEYS = Object.keys(defaultPose());

// Pés de descanso (espaço do personagem, olhando para +Z)
const LEGS = [
  { side: 1, hip: [0.12, -0.06, 0.1], foot: [0.78, 0, 0.62], phase: 0.0 },
  { side: -1, hip: [-0.12, -0.06, 0.1], foot: [-0.78, 0, 0.62], phase: 0.5 },
  { side: 1, hip: [0.12, -0.08, -0.14], foot: [0.74, 0, -0.78], phase: 0.5 },
  { side: -1, hip: [-0.12, -0.08, -0.14], foot: [-0.74, 0, -0.78], phase: 0.0 },
];
const FEMUR = 0.62, TIBIA = 0.7, TARSUS = 0.2, TAR_ANG = -0.35;

const alignDown = (() => {
  // geometria +X -> -Y (segmento pendurado), espinhos (-Y geo) -> +Z
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
})();

export class MantisRig {
  /**
   * @param {object} o
   * @param {'hi'|'lo'} o.q   qualidade
   * @param {(parent, key, geo, mat?) => THREE.Object3D} o.sink
   * @param {number} o.eyeR  raio do olho
   */
  constructor({ q = 'hi', sink, eyeR = 0.15 }) {
    this.q = q;
    const G = bodyGeos(q);
    const E = eyeGeos(q, eyeR);
    const M = mouthGeos(q);
    const add = (parent, key, geo, mat) => sink(parent, key, geo, mat);
    const J = (parent, x = 0, y = 0, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };

    this.root = new THREE.Object3D();
    this.inner = J(this.root);
    this.body = J(this.inner, 0, BODY_Y, 0);
    add(this.body, 'pelvis', G.pelvis, 'body');

    // abdômen para trás e para baixo
    this.abdJ = J(this.body, 0, 0.03, -0.2);
    const abdAlign = J(this.abdJ);
    abdAlign.rotation.set(0, Math.PI / 2, 0);
    this.abdAlignBase = -0.42;
    this.abdAlign = abdAlign;
    add(abdAlign, 'abdomen', G.abdomen, 'body');
    for (const s of [1, -1]) {
      const w = J(abdAlign, 0.06, 0.17, s * 0.015);
      w.rotation.set(-Math.PI / 2 * s + (s > 0 ? 0.35 : -0.35), 0, -0.06);
      if (s < 0) w.rotation.x = Math.PI / 2 - 0.35;
      add(w, 'wing', G.wing, 'wing');
    }

    // tórax vertical
    this.chestJ = J(this.body, 0, 0.06, 0.12);
    add(this.chestJ, 'chest', G.chest, 'body');
    this.neckJ = J(this.chestJ, 0, 0.8, 0.0);
    add(this.neckJ, 'neck', G.neck, 'body');
    this.headJ = J(this.neckJ, 0, 0.12, 0.0);
    this.headC = J(this.headJ, 0, 0.27, 0.03); // centro da cabeça
    add(this.headC, 'head', G.head, 'body');

    // olhos
    this.eyes = [];
    for (const s of [1, -1]) {
      const base = J(this.headC, s * 0.215, 0.1, 0.075);
      base.rotation.y = s * 0.32;
      const look = J(base);
      add(look, 'sclera', E.sclera, 'sclera');
      add(look, 'iris', E.iris, 'iris');
      add(look, 'pupil', E.pupil, 'pupil');
      add(base, 'shine', E.shine, 'shine');
      const lid = J(base);
      add(lid, 'lid', E.lid, 'body');
      this.eyes.push({ base, look, lid, s });
    }
    // boca
    this.mouthJ = J(this.headC, 0, -0.235, 0.17);
    this.mouthJ.rotation.x = -0.25;
    this.mSmile = add(this.mouthJ, 'mSmile', M.smile, 'mouth');
    this.mKiss = add(this.mouthJ, 'mKiss', M.kiss, 'lips');
    this.mOpen = add(this.mouthJ, 'mOpen', M.open, 'mouthIn');

    // antenas (3 segmentos)
    this.ants = [];
    for (const s of [1, -1]) {
      const a0 = J(this.headC, s * 0.06, 0.2, 0.15);
      add(a0, 'antenna', G.antenna, 'body');
      const a1 = J(a0, 0, 0.3, 0); add(a1, 'antenna', G.antenna, 'body');
      const a2 = J(a1, 0, 0.3, 0); add(a2, 'antenna', G.antenna, 'body');
      this.ants.push({ a0, a1, a2, s });
    }

    // braços raptoriais
    this.arms = [];
    for (const s of [1, -1]) {
      const sh = J(this.chestJ, s * 0.12, 0.6, 0.07);
      sh.rotation.order = 'ZXY';
      const c = J(sh); c.quaternion.copy(alignDown); add(c, 'coxa', G.coxa, 'body');
      const e1 = J(sh, 0, -0.34, 0);
      const f = J(e1); f.quaternion.copy(alignDown); add(f, 'femurR', G.femurR, 'body');
      const e2 = J(e1, 0, -0.46, 0);
      const t = J(e2); t.quaternion.copy(alignDown); add(t, 'tibiaR', G.tibiaR, 'body');
      const hand = J(e2, 0, -0.36, 0.02);
      this.arms.push({ sh, e1, e2, hand, s, coxa: c, femur: f, tibia: t });
    }

    // pernas (IK)
    this.legs = LEGS.map((L) => {
      const root = J(this.inner, ...L.hip);
      const fem = J(root); add(fem, 'legFemur', G.legFemur, 'body');
      const knee = J(fem, FEMUR, 0, 0); add(knee, 'legTibia', G.legTibia, 'body');
      const ankle = J(knee, TIBIA, 0, 0); add(ankle, 'tarsus', G.tarsus, 'body');
      return { ...L, root, fem, knee, ankle, off: new THREE.Vector3(), lift: 0 };
    });

    this.walkPhase = 0;
    this.blink = 0;
    this._tmp = new THREE.Vector3();
  }

  /** Aplica a pose (objeto de parâmetros) às juntas. */
  apply(P, time, walkSpeed = 0, dt = 0.016) {
    const s = P.squash;
    this.inner.position.y = P.hop;
    this.inner.rotation.y = P.spin;
    this.body.position.set(P.shiftX, BODY_Y + P.bob, P.shiftZ);
    this.body.rotation.set(0, P.hipYaw, P.hipRoll);
    this.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));

    this.abdJ.rotation.set(this.abdAlignBase + P.abdPitch, P.abdYaw, 0);
    this.chestJ.rotation.set(0.08 + P.lean, P.twist, P.tilt);
    this.neckJ.rotation.set(0.05 + P.headPitch * 0.4, P.headYaw * 0.4, P.headRoll * 0.4);
    this.headJ.rotation.set(P.headPitch * 0.6, P.headYaw * 0.6, P.headRoll * 0.6);

    // olhos e piscadas
    let open = P.eye;
    if (this.blink > 0) { open *= Math.abs(this.blink - 0.5) * 2; }
    for (const e of this.eyes) {
      e.look.rotation.set(-P.pupY * 0.45, P.pupX * 0.45 - e.s * 0.1, 0);
      const lidRot = open >= 1 ? -1.0 - (open - 1) * 1.2 : Math.PI / 2 * 0.98 + (open) * (-1.0 - Math.PI / 2 * 0.98);
      e.lid.rotation.set(lidRot, 0, 0);
    }
    this.mSmile.visible = P.mouth < 0.5;
    this.mKiss.visible = P.mouth >= 0.5 && P.mouth < 1.5;
    this.mOpen.visible = P.mouth >= 1.5;

    // antenas ondulando
    for (const a of this.ants) {
      const raise = a.s > 0 ? P.antL : P.antR;
      const w = P.antWig;
      const ph = time * 3.1 + (a.s > 0 ? 0 : 1.7);
      a.a0.rotation.set(-0.35 - raise * 0.4 + Math.sin(ph) * 0.08 * w, 0, -a.s * (0.38 + raise * 0.1));
      a.a1.rotation.set(-0.35 + P.antCurl * 0.6 + Math.sin(ph - 0.8) * 0.25 * w, 0, -a.s * 0.08);
      a.a2.rotation.set(-0.3 + P.antCurl * 0.9 + Math.sin(ph - 1.6) * 0.4 * w, 0, -a.s * 0.1);
    }

    // braços: postura de "oração" + desvios
    for (const a of this.arms) {
      const L = a.s > 0;
      const raise = L ? P.lRaise : P.rRaise;
      const out = L ? P.lOut : P.rOut;
      const el = L ? P.lEl : P.rEl;
      const fold = L ? P.lFold : P.rFold;
      a.sh.rotation.set(-0.55 - raise, a.s * 0.05 * 0, a.s * (0.22 + out));
      a.e1.rotation.set(-2.0 + el, 0, 0);
      a.e2.rotation.set(2.45 + fold, 0, 0);
    }

    // pernas com IK
    this._legs(P, time, walkSpeed, dt);
  }

  _legs(P, time, speed, dt) {
    const stride = Math.min(0.32, speed * 0.16);
    const freq = speed > 0.01 ? Math.max(1.6, speed * 1.6) : 0;
    this.walkPhase = (this.walkPhase + dt * freq) % 1;
    const yawS = Math.sin(P.hipYaw), yawC = Math.cos(P.hipYaw);
    for (let i = 0; i < 4; i++) {
      const L = this.legs[i];
      // quadril acompanha o corpo
      const hx = L.hip[0], hz = L.hip[2];
      L.root.position.set(hx * yawC + hz * yawS + P.shiftX, BODY_Y + P.bob + L.hip[1], -hx * yawS + hz * yawC + P.shiftZ);
      let fx = L.foot[0] * P.footSpread, fy = 0, fz = L.foot[2];
      if (stride > 0) {
        const p = (this.walkPhase + L.phase) % 1;
        if (p < 0.5) { fz += stride * (1 - 4 * p); }
        else { const q = (p - 0.5) * 2; fz += stride * (-1 + 2 * q); fy += Math.sin(Math.PI * q) * 0.16; }
      } else if (P.step > 0) {
        const ph = P.stepPh + (i === 0 || i === 3 ? 0 : Math.PI);
        const up = Math.max(0, Math.sin(ph));
        fy += up * 0.12 * P.step;
        fx += Math.sign(fx) * up * 0.05 * P.step + P.shiftX * 0.5;
        fz += up * P.kick * (i < 2 ? 1 : -0.4) + P.shiftZ * 0.5; // passinho: o pé que sobe vai pra frente
      }
      // pé em relação ao quadril (pés no chão, compensando o salto)
      const dx = fx - L.root.position.x, dz = fz - L.root.position.z;
      let dy = fy - P.hop - L.root.position.y;
      const yaw = Math.atan2(-dz, dx);
      L.root.rotation.set(0, yaw, 0);
      let d = Math.hypot(dx, dz) - TARSUS * Math.cos(TAR_ANG);
      dy += -TARSUS * Math.sin(TAR_ANG);
      let Lh = Math.hypot(d, dy);
      Lh = Math.min(FEMUR + TIBIA - 0.002, Math.max(Math.abs(FEMUR - TIBIA) + 0.01, Lh));
      const line = Math.atan2(dy, d);
      const cA = (FEMUR * FEMUR + Lh * Lh - TIBIA * TIBIA) / (2 * FEMUR * Lh);
      const cK = (FEMUR * FEMUR + TIBIA * TIBIA - Lh * Lh) / (2 * FEMUR * TIBIA);
      const alpha = line + Math.acos(Math.max(-1, Math.min(1, cA)));
      const beta = -(Math.PI - Math.acos(Math.max(-1, Math.min(1, cK))));
      L.fem.rotation.set(0, 0, alpha);
      L.knee.rotation.set(0, 0, beta);
      L.ankle.rotation.set(0, 0, TAR_ANG - alpha - beta);
    }
  }

  /** posição do topo da cabeça em coordenadas do mundo */
  headTop(target) {
    return this.headC.localToWorld(target.set(0, 0.62, 0));
  }
}
