// =============================================================
//  DIRETORES
//  CameraDirector: troca de enquadramento sozinha (geral, média,
//    close nos noivos, passeio pela pista) e dá close em quem
//    mandou presente. Movimento constante = live nunca parada.
//  WeddingDirector: comanda a rotina dos noivos (dança romântica,
//    dança animada, beijo, comemoração, surpresa).
// =============================================================
import * as THREE from 'three';
import { DANCES } from '../chars/models.js';
import { STAGE, FLOOR } from './club.js';

const C = new THREE.Vector3(0, STAGE.y, STAGE.z + 0.4);           // centro do casal (no palco)
const FZ = (FLOOR.z0 + FLOOR.z1) / 2;                                 // centro da pista

const pick = (a) => a[(Math.random() * a.length) | 0];

export class CameraDirector {
  constructor(camera) {
    this.cam = camera;
    this.pos = new THREE.Vector3(0, 7.5, 17);
    this.look = new THREE.Vector3(0, 3.5, -4);
    this.dPos = this.pos.clone();
    this.dLook = this.look.clone();
    this.shot = 'wide';
    this.shotT = 0;
    this.shotDur = 14;
    this.focus = null;
    this.shotIdx = 0;
    this.couple = new THREE.Vector3(0, 1.6, 0.3);
    this.crowdCount = 0;
    this.locked = null; // nome de enquadramento fixo (painel)
    this._v = new THREE.Vector3();
  }
  /** close em um convidado */
  focusOn(guest, dur = 5, kind = '') {
    this.focus = { guest, t: dur, kind };
    if (this.crowdRef) this.crowdRef.focused = guest;
  }
  focusCouple(dur = 6) { this.focus = { couple: true, t: dur }; }

  /** enquadra rosto e corpo do personagem, escolhendo um ângulo sem ninguém na frente */
  _frame(F, g, dt) {
    const head = g.headPos(this._v.clone());
    const base = g.pos;
    const hgt = THREE.MathUtils.clamp(head.y - base.y, 1.4, 3.2);
    const look = new THREE.Vector3(base.x, base.y + hgt * 0.6, base.z);
    const vf = THREE.MathUtils.degToRad(this.cam.fov) / 2;
    const dist = (hgt * (F.kind === 'vip' ? 0.95 : 0.75)) / Math.tan(vf);
    F.re = (F.re || 0) - dt;
    if (F.re <= 0 || F.ang === undefined) {
      F.re = 0.5;
      const yaw = g.yaw;
      const offs = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6];
      let best = null, bestScore = Infinity;
      for (const [df, dpen] of [[1, 0], [0.7, 0.8]]) {
        for (const [elev, pen] of [[0.28, 0], [0.5, 1.2], [0.72, 2.4]]) {
          for (const o of offs) {
            const a = yaw + o;
            const p = this._camAt(look, a, elev, dist * df);
            const same = F.ang !== undefined && Math.abs(a - F.ang) < 0.01 && Math.abs(elev - F.elev) < 0.01 && df === F.df;
            const sc = this._blocked(p, look, head, g) * 10 + Math.abs(o) + pen + dpen + (same ? -0.6 : 0);
            if (sc < bestScore) { bestScore = sc; best = { a, elev, df }; }
          }
        }
      }
      F.ang = best.a; F.elev = best.elev; F.df = best.df;
    }
    this.dLook.copy(look);
    this.dPos.copy(this._camAt(look, F.ang, F.elev, dist * F.df));
  }
  _camAt(look, a, elev, dist) {
    const p = new THREE.Vector3(look.x + Math.sin(a) * dist * Math.cos(elev), look.y + Math.sin(elev) * dist, look.z + Math.cos(a) * dist * Math.cos(elev));
    return p;
  }
  /** quantos obstáculos ficam entre a câmera e o personagem (outros personagens, palco, parede) */
  _blocked(p, look, head, g) {
    let n = 0;
    if (p.z < -13 || Math.abs(p.x) > 16) n += 3;
    if (Math.abs(p.x) < STAGE.w / 2 + 0.3 && p.z > STAGE.z - STAGE.d / 2 && p.z < STAGE.z + STAGE.d / 2 + 1.5 && p.y < STAGE.y + 0.4) n += 3;
    // candelabros do palco e da pista
    for (const [cx, cy, cz, top] of [[-5.65, STAGE.y, STAGE.z - STAGE.d / 2 + 0.35, 1.9], [5.65, STAGE.y, STAGE.z - STAGE.d / 2 + 0.35, 1.9], [-7.2, 0, -1.6, 2.4], [7.2, 0, -1.6, 2.4]]) {
      if (p.distanceTo(new THREE.Vector3(cx, cy + top, cz)) < 3) n += 2; // chamas das velas brilham demais de perto
      const A = p, Bp = head;
      for (const k of [0.4, 0.8]) {
        const P = new THREE.Vector3(cx, cy + top * k, cz), ab = Bp.clone().sub(A);
        const t = THREE.MathUtils.clamp(P.clone().sub(A).dot(ab) / ab.lengthSq(), 0, 1);
        if (A.clone().addScaledVector(ab, t).distanceTo(P) < 0.6) { n++; break; }
      }
    }
    if (!this.obstacles) return n;
    const seg = (A, B, P, r) => { // distância do ponto P ao segmento AB < r
      const ab = B.clone().sub(A), t = THREE.MathUtils.clamp(P.clone().sub(A).dot(ab) / ab.lengthSq(), 0, 1);
      return A.clone().addScaledVector(ab, t).distanceTo(P) < r;
    };
    for (const o of this.obstacles()) {
      if (o.g === g) continue;
      // corpo como 3 pontos (pés, meio, cabeça)
      const rad = o.g && o.g.char && o.g.char.key === 'tung_tung' ? 0.95 : 0.65; // o tronco é bem largo
      for (const k of [0.3, 0.6, 0.85, 1.0]) {
        const P = o.pos.clone().lerp(o.head, k);
        if (seg(p, head, P, rad) || seg(p, look, P, rad * 0.65)) { n++; break; }
      }
      if (Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < 0.9 && p.y < o.head.y + 0.6) n += 2;
      if (o.head.distanceTo(p) < 1.7) n += 1; // alguém colado na câmera fica enorme na tela
    }
    return n;
  }

  update(dt, time) {
    // rodízio: alterna enquadramentos gerais / noivos com close em participantes ('guest')
    const SHOTS = ['wide', 'guest', 'pan', 'couple', 'guest', 'band', 'aerial', 'guest', 'pan', 'medium', 'guest', 'band', 'pan', 'aerial'];
    if (this.focus) {
      this.focus.t -= dt;
      if (this.focus.t <= 0 || (this.focus.guest && !this.focus.guest.alive)) { this.focus = null; if (this.crowdRef) this.crowdRef.focused = null; }
    }
    if (!this.focus) {
      this.shotT += dt;
      if (this.shotT > this.shotDur && !this.locked) {
        this.shotT = 0; this.shotIdx = (this.shotIdx + 1) % SHOTS.length;
        this.shot = SHOTS[this.shotIdx]; this.shotDur = 8 + Math.random() * 4;
        // banda sem músicos: não filma o palco vazio
        if (this.shot === 'band' && !(this.crowdRef && this.crowdRef.list.some((g) => g.band && g.state === 'placed'))) this.shot = 'pan';
        if (this.shot === 'pan') { this.shotDur = 16; this.panDir = this.panDir === 1 ? -1 : 1; }
        if (this.shot === 'guest') {
          const g = this.pickGuest ? this.pickGuest() : null;
          if (g) { this.focusOn(g, 4.5, 'tour'); this.shotT = this.shotDur; } // ao terminar o close, segue o rodízio
          else this.shotT = this.shotDur;
          this.shot = SHOTS[(this.shotIdx + SHOTS.length - 1) % SHOTS.length];
        }
      }
    }
    const shot = this.locked || this.shot;
    const k = this.shotT;
    if (this.focus && this.focus.guest) {
      const g = this.focus.guest;
      const head = g.headPos(this._v.clone());
      // câmera na frente do rosto do convidado
      const face = new THREE.Vector3(Math.sin(g.yaw), 0, Math.cos(g.yaw));
      if (this.focus.kind === 'rocket') {
        this.dLook.copy(head);
        this.dPos.set(g.pos.x * 0.5, Math.max(4, head.y * 0.7), g.pos.z * 0.5 + 12);
      } else if (this.focus.kind === 'entrance') {
        // entrada: câmera vai na frente de quem chega, bem pertinho, acompanhando
        this.dLook.copy(head).add(new THREE.Vector3(0, -0.7, 0));
        this.dPos.set(head.x + face.x * 4.6 + face.z * 1.2, head.y + 1.1, head.z + face.z * 4.6 - face.x * 1.2);
      } else {
        // close de corpo inteiro (rosto + corpo), sem nada na frente
        this._frame(this.focus, g, dt);
      }
    } else if (this.focus && this.focus.couple) {
      this.dLook.set(0, C.y + 1.45, C.z);
      this.dPos.set(Math.sin(time * 0.2) * 1.0, C.y + 2.4, C.z + 6.8);  // os dois inteiros, com as fotos em cima
    } else if (shot === 'wide') {
      // de frente: palco, altar e a pista inteira
      const a = Math.sin(time * 0.06);
      this.dPos.set(a * 3, 9.2, FLOOR.z1 + 9);
      this.dLook.set(0, 3.2, -3.5);
    } else if (shot === 'medium') {
      const a = Math.sin(time * 0.07);
      this.dPos.set(a * 5, 4.6, FLOOR.z1 + 1.5);
      this.dLook.set(a * 1.2, 1.6, FZ - 2);
    } else if (shot === 'couple') {
      const a = Math.sin(time * 0.12) * 0.5;
      this.dPos.set(Math.sin(a) * 7.5, C.y + 3.6, C.z + Math.cos(a) * 7.5);
      this.dLook.set(0, C.y + 1.3, C.z);
    } else if (shot === 'sweep') {
      // passeia por cima da pista, de um lado ao outro
      const x = -6 + ((k * 0.9) % 12);
      this.dPos.set(x, 3.4, FZ + 5);
      this.dLook.set(x * 0.6, 1.2, FZ - 1.5);
    } else if (shot === 'pan') {
      // passeio lento da esquerda para a direita (ou volta) pela plateia, de frente para os rostos
      const u = THREE.MathUtils.clamp(k / this.shotDur, 0, 1), e = u * u * (3 - 2 * u);
      const ext = this.crowdRef ? Math.min(9, Math.max(4, this.crowdRef.list.reduce((m, g) => g.band ? m : Math.max(m, Math.abs(g.pos.x)), 0))) : 6;
      const x = (this.panDir || 1) * (-ext + 2 * ext * e);
      this.dPos.set(x * 0.9, 2.0, FLOOR.z0 - 1.8);
      this.dLook.set(x, 1.55, FLOOR.z0 + 3.0);
    } else if (shot === 'band') {
      // mira onde estão os músicos (nunca o palco vazio)
      const B = this.crowdRef ? this.crowdRef.list.filter((g) => g.band && g.state === 'placed') : [];
      const side = 1;
      const S = B.filter((g) => Math.sign(g.pos.x) === (Math.sin(time * 0.07) > 0 ? 1 : -1));
      const grp = S.length ? S : B.filter((g) => Math.sign(g.pos.x) === Math.sign(B[0] ? B[0].pos.x : 1));
      const cx = grp.length ? grp.reduce((a, g) => a + g.pos.x, 0) / grp.length : side * 3.5;
      const cz = grp.length ? grp.reduce((a, g) => a + g.pos.z, 0) / grp.length : C.z;
      const a = Math.sin(time * 0.15);
      this.dPos.set(cx * 0.9 + a * 0.6, C.y + 2.5, cz + 6.4);
      this.dLook.set(cx, C.y + 1.1, cz);
    } else if (shot === 'aerial') {
      // vista aérea: enquadra a pista inteira (todos os convidados) de cima
      const ctr = this.crowdRef ? this.crowdRef.center : new THREE.Vector3(0, 0, FZ);
      const R = (this.crowdRef ? this.crowdRef.extent() : 8) * 1.06;
      const vf = THREE.MathUtils.degToRad(this.cam.fov);
      const hf = 2 * Math.atan(Math.tan(vf / 2) * this.cam.aspect);
      const dist = R / Math.tan(hf / 2);
      const a = time * 0.05;
      // inclinada (~35°), para aparecer o corpo de todo mundo e não só a cabeça
      const d2 = dist * 1.08;
      this.dPos.set(ctr.x + Math.sin(a) * d2 * 0.12, d2 * 0.8, ctr.z + d2 * 0.58);
      this.dLook.set(ctr.x, 0.6, ctr.z - 0.6);
    } else if (shot === 'high') {
      this.dPos.set(0, 22, FZ + 10); this.dLook.set(0, 0, FZ - 3);
    } else if (shot === 'altar') {
      this.dPos.set(0, C.y + 3, C.z + 7); this.dLook.set(0, C.y + 4.5, C.z - 1.5);
    }
    if (this.crowdRef) this.crowdRef.overview = !this.focus && shot === 'aerial';
    if (this.hallRef && this.hallRef.setAerial) { const av = !this.focus && shot === 'aerial'; if (av !== this._aer) { this._aer = av; this.hallRef.setAerial(av); } }
    const f = 1 - Math.exp(-dt * (this.focus ? 2.2 : 1.1));
    this.pos.lerp(this.dPos, f);
    this.look.lerp(this.dLook, f);
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.look);
  }
}

export class WeddingDirector {
  constructor(groom, bride, { crowd, fx, audio, camDir }) {
    this.groom = groom; this.bride = bride;
    this.crowd = crowd; this.fx = fx; this.audio = audio; this.camDir = camDir;
    this.center = C.clone();
    this.mode = 'dance';
    this.modeT = 0;
    this.modeDur = 18;
    this.pairAng = 0;
    this.sep = 0.78;
    this.yawIn = 0.85;
    this.sepBoost = 0;
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
    this.seq = ['dance', 'dance', 'kiss', 'dance', 'dance', 'celebrate'];
    this.seqIdx = 0;
    this.set('dance');
  }

  set(mode, dur) {
    this.mode = mode; this.modeT = 0;
    const g = this.groom, b = this.bride;
    switch (mode) {
      case 'romantic':
        this.modeDur = dur || 16;
        g.anim.play('romantic', { blend: 0.8 }); b.anim.play('romantic', { blend: 0.8 });
        break;
      case 'dance': {
        this.modeDur = dur || 12;
        const d = pick(DANCES);
        g.anim.play(d, { blend: 0.6 }); b.anim.play(d, { blend: 0.6 });
        break;
      }
      case 'kiss':
        this.modeDur = dur || 4.6;
        g.anim.play('kiss', { blend: 0.6 }); b.anim.play('kiss', { blend: 0.6 });
        this.camDir.focusCouple(5.5);
        setTimeout(() => {
          this.fx.hearts(new THREE.Vector3(0, C.y + 2.6, C.z + 0.1), 30, 0.6);
          this.fx.heartRing(new THREE.Vector3(0, C.y + 1.6, C.z + 0.1), 24, 1.6);
          this.audio.sfx('kiss');
          this.crowd.react('clap');
        }, 1300);
        break;
      case 'celebrate':
        this.modeDur = dur || 3;
        g.anim.play('celebrate'); b.anim.play('celebrate');
        this.fx.confetti(new THREE.Vector3(0, C.y + 3, C.z), 80, 2.2, 5);
        this.audio.sfx('cheer');
        break;
      case 'surprise':
        this.modeDur = dur || 2.4;
        g.anim.play('surprise'); b.anim.play('surprise');
        this.audio.sfx('boing');
        break;
    }
  }
  /** chamado pelo painel ou por presente */
  trigger(mode) { this.set(mode); this.seqIdx = Math.max(0, this.seq.indexOf(mode)); }

  update(dt, time) {
    this.modeT += dt;
    if (this.modeT > this.modeDur) {
      this.seqIdx = (this.seqIdx + 1) % this.seq.length;
      this.set(this.seq[this.seqIdx]);
    }
    // posição do casal: giram devagar na dança romântica, aproximam no beijo
    let tSep = 0.78, tYaw = 0.85, tAng = 0;
    if (this.mode === 'romantic') { tAng = Math.sin(time * 0.18) * 0.7; tSep = 0.72; tYaw = 1.0; }
    else if (this.mode === 'kiss') { tSep = 0.56; tYaw = 1.42; }
    else if (this.mode === 'dance' || this.mode === 'celebrate') { tSep = 0.95; tYaw = 0.3; }
    else if (this.mode === 'surprise') { tSep = 0.9; tYaw = 0.1; }
    const f = 1 - Math.exp(-dt * 2.5);
    this.sep += (tSep - this.sep) * f;
    this.yawIn += (tYaw - this.yawIn) * f;
    this.pairAng += (tAng - this.pairAng) * (1 - Math.exp(-dt * 0.8));
    this.sep += this.sepBoost;
    const ca = Math.cos(this.pairAng), sa = Math.sin(this.pairAng);
    this.groom.group.position.set(this.center.x - this.sep * ca, this.center.y, this.center.z + this.sep * sa);
    this.bride.group.position.set(this.center.x + this.sep * ca, this.center.y, this.center.z - this.sep * sa);
    this.groom.group.rotation.y = this.pairAng + this.yawIn;
    this.bride.group.rotation.y = this.pairAng - this.yawIn;
    this.sep -= this.sepBoost;
  }

  /** depois das poses: se as cabeças (ou a cartola) chegarem perto demais, afasta o casal */
  resolve(dt) {
    this.groom.headPos(this._a); this.bride.headPos(this._b);
    const MIN = 0.42;
    let d = this._a.distanceTo(this._b);
    if (d < MIN) this.sepBoost = Math.min(0.8, this.sepBoost + (MIN - d) * 0.9);
    else this.sepBoost = Math.max(0, this.sepBoost - dt * 0.15);
  }
}
