// =============================================================
//  Animações procedurais dos louva-a-deus.
//  Cada animação recebe (t = tempo local, P = pose, c = contexto)
//  e escreve desvios na pose. c.beat = batida da música (sincroniza
//  a dança de todo mundo com o ritmo).
//  Para criar uma dança nova, basta adicionar uma função aqui.
// =============================================================
import { defaultPose, POSE_KEYS } from './rig.js';

const S = Math.sin, C = Math.cos, PI = Math.PI;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const pulse = (x) => Math.max(0, S(x));

export const ANIMS = {
  // ===== MÚSICOS =====
  sanfona(t, P, c) {
    const b = c.beat * PI, o = S(b) * 0.35;
    P.lRaise = 1.0; P.rRaise = 1.0; P.lEl = 1.2; P.rEl = 1.2;
    P.lOut = 0.25 + o; P.rOut = 0.25 + o; P.lFold = -1.1; P.rFold = -1.1;
    P.bob = -Math.abs(S(b * 2)) * 0.05; P.hipRoll = S(b) * 0.08;
    P.headRoll = S(b) * 0.25; P.eye = 0.7; P.step = 0.8; P.stepPh = b * 2;
  },
  zabumba(t, P, c) {
    const b = c.beat * PI;
    P.lRaise = 0.9; P.lEl = 0.8; P.lFold = -0.8; P.lOut = 0.1;
    P.rRaise = 0.9 + Math.max(0, S(b * 2)) * 0.8; P.rEl = 0.9; P.rFold = -1.2; P.rOut = 0.25;
    P.bob = -Math.abs(S(b * 2)) * 0.06; P.headPitch = Math.abs(S(b * 2)) * 0.15;
    P.step = 0.8; P.stepPh = b * 2; P.mouth = 0;
  },
  triangulo(t, P, c) {
    const b = c.beat * PI;
    P.lRaise = 1.5; P.lEl = 1.0; P.lFold = -1.3; P.lOut = 0.35;
    P.rRaise = 1.2 + S(b * 4) * 0.25; P.rEl = 1.0; P.rFold = -1.2 + S(b * 4) * 0.4; P.rOut = 0.1;
    P.hipRoll = S(b) * 0.1; P.bob = -Math.abs(S(b * 2)) * 0.05;
    P.headRoll = -S(b) * 0.15; P.step = 1; P.stepPh = b * 2;
  },
  violao(t, P, c) {
    const b = c.beat * PI;
    P.lRaise = 1.4; P.lEl = 1.4; P.lFold = -1.6; P.lOut = 0.5;
    P.rRaise = 0.8 + S(b * 4) * 0.3; P.rEl = 0.9; P.rFold = -1.0; P.rOut = -0.1;
    P.lean = 0.08; P.hipRoll = S(b) * 0.08; P.bob = -Math.abs(S(b * 2)) * 0.05;
    P.headRoll = S(b) * 0.2; P.mouth = 2; P.step = 0.9; P.stepPh = b * 2;
  },

  // ===== PISEIRO / PASSINHOS (rápidos) =====
  // Passinho básico: pezinho alternando a cada meia batida, peso de um lado pro outro
  piseiro(t, P, c) {
    const b = c.beat * PI;
    P.shiftX = S(b) * 0.13;
    P.hipRoll = -S(b) * 0.1; P.tilt = S(b) * 0.06;
    P.bob = -Math.abs(S(b * 2)) * 0.07;
    P.step = 1.2; P.stepPh = b * 2; P.kick = 0.14;
    P.lRaise = 0.55 + S(b * 2) * 0.3; P.rRaise = 0.55 - S(b * 2) * 0.3; P.lOut = 0.3; P.rOut = 0.3;
    P.lEl = 0.6; P.rEl = 0.6; P.lFold = -1.3; P.rFold = -1.3;
    P.headRoll = S(b) * 0.14; P.headPitch = Math.abs(S(b * 2)) * 0.08;
    P.antWig = 1.2; P.mouth = 0;
  },
  // Passinho cruzado: gira o quadril e cruza os pés, braços balançando
  passinho(t, P, c) {
    const b = c.beat * PI;
    P.hipYaw = S(b) * 0.38; P.twist = -S(b) * 0.3;
    P.shiftZ = S(b * 2) * 0.06; P.shiftX = S(b) * 0.06;
    P.bob = -Math.abs(S(b * 2)) * 0.06;
    P.step = 1.3; P.stepPh = b * 2; P.kick = 0.2;
    P.lRaise = 0.7 + S(b) * 0.7; P.rRaise = 0.7 - S(b) * 0.7;
    P.lFold = -0.9; P.rFold = -0.9; P.lOut = 0.2; P.rOut = 0.2;
    P.headYaw = -S(b) * 0.3;
    P.antWig = 1.1;
  },
  // Arrasta-pé: desliza de lado com uma garra pra cima
  arrasta(t, P, c) {
    const b = c.beat * PI;
    const side = S(b * 0.5);
    P.shiftX = side * 0.22;
    P.lean = 0.12; P.hipRoll = -side * 0.12;
    P.bob = -Math.abs(S(b * 2)) * 0.08;
    P.step = 1; P.stepPh = b * 2; P.kick = 0.08;
    P.lRaise = 2.1 + S(b * 2) * 0.2; P.lEl = 1.3; P.lFold = -1.6 + S(b * 2) * 0.5; P.lOut = 0.4;
    P.rRaise = 0.7; P.rFold = -1.2; P.rEl = 0.5;
    P.headRoll = -side * 0.2; P.mouth = 2; P.eye = 1.1;
    P.antWig = 1.3;
  },
  // Tremidinha: ombros e corpo tremendo rápido, pulinho em cada batida
  tremidinha(t, P, c) {
    const b = c.beat * PI;
    P.tilt = S(b * 4) * 0.09; P.twist = S(b * 4) * 0.18;
    P.hipRoll = -S(b * 4) * 0.05;
    P.hop = pulse(b * 2) * 0.07;
    P.bob = -0.05 - Math.abs(S(b * 2)) * 0.05;
    P.lRaise = 1.2; P.rRaise = 1.2; P.lEl = 0.9; P.rEl = 0.9;
    P.lFold = -1.4 + S(b * 8) * 0.3; P.rFold = -1.4 - S(b * 8) * 0.3;
    P.lOut = S(b * 4) * 0.15; P.rOut = -S(b * 4) * 0.15;
    P.headRoll = S(b * 4) * 0.12; P.mouth = 2; P.eye = 1.15;
    P.step = 0.6; P.stepPh = b * 2;
    P.antWig = 1.6;
  },
  // Sapateado: bate os pés bem rápido, cabeça marcando o ritmo
  sapateado(t, P, c) {
    const b = c.beat * PI;
    P.step = 1.4; P.stepPh = b * 4; P.kick = 0.06;
    P.bob = -Math.abs(S(b * 4)) * 0.05;
    P.lean = 0.15 + S(b * 2) * 0.04;
    P.squash = 1 - Math.abs(S(b * 4)) * 0.05;
    P.lRaise = 0.5 + S(b * 4) * 0.25; P.rRaise = 0.5 - S(b * 4) * 0.25;
    P.lFold = -0.6; P.rFold = -0.6; P.lOut = 0.35; P.rOut = 0.35;
    P.headPitch = Math.abs(S(b * 2)) * 0.18 - 0.05;
    P.hipYaw = S(b) * 0.15;
    P.antWig = 1.2;
  },
  // Pulo do piseiro: pulinhos de lado com as garras pra cima
  pulapula(t, P, c) {
    const b = c.beat * PI;
    const j = pulse(b * 2);
    P.hop = j * 0.18; P.shiftX = S(b) * 0.12;
    P.squash = 1 + (j - 0.4) * 0.14;
    P.lRaise = 1.8 + j * 0.5; P.rRaise = 1.8 + j * 0.5; P.lEl = 1.2; P.rEl = 1.2;
    P.lFold = -1.8; P.rFold = -1.8; P.lOut = 0.5 + S(b) * 0.2; P.rOut = 0.5 - S(b) * 0.2;
    P.hipRoll = S(b) * 0.1;
    P.mouth = j > 0.5 ? 2 : 0; P.eye = 1.1; P.antL = j * 0.6; P.antR = j * 0.6;
  },

  // Respirando, olhando em volta
  idle(t, P, c) {
    const k = t + c.seed * 10;
    P.bob = S(k * 2) * 0.015;
    P.lean = S(k * 0.7) * 0.03;
    P.headYaw = S(k * 0.45) * 0.35;
    P.headPitch = S(k * 0.6) * 0.06;
    P.pupX = S(k * 0.45 + 0.5) * 0.4;
    P.lRaise = S(k * 1.3) * 0.05; P.rRaise = S(k * 1.3 + 1) * 0.05;
    P.abdPitch = S(k * 0.9) * 0.04;
  },

  // Caminhada articulada
  walk(t, P, c) {
    const k = t * 8;
    P.bob = -Math.abs(S(k)) * 0.04;
    P.hipRoll = S(k) * 0.05;
    P.lean = 0.1;
    P.lRaise = S(k) * 0.25; P.rRaise = -S(k) * 0.25;
    P.headPitch = -0.05 + S(k * 2) * 0.03;
    P.antWig = 0.6;
  },

  // Dança 1: balançando o corpo de um lado para o outro
  sway(t, P, c) {
    const b = c.beat * PI;
    P.hipRoll = S(b) * 0.14; P.tilt = -S(b) * 0.12;
    P.bob = -Math.abs(S(b)) * 0.07;
    P.lRaise = 0.5 + S(b) * 0.55; P.rRaise = 0.5 - S(b) * 0.55;
    P.lFold = -0.3; P.rFold = -0.3;
    P.headRoll = S(b) * 0.22;
    P.abdYaw = -S(b) * 0.2;
    P.step = 1; P.stepPh = b;
    P.antWig = 0.8;
  },

  // Dança 2: bracinhos para cima, acenando
  armsUp(t, P, c) {
    const b = c.beat * PI;
    P.lRaise = 2.0 + S(b * 2) * 0.25; P.rRaise = 2.0 - S(b * 2) * 0.25;
    P.lOut = 0.5 + S(b) * 0.2; P.rOut = 0.5 - S(b) * 0.2;
    P.lEl = 1.2; P.rEl = 1.2; P.lFold = -1.5 + S(b * 2) * 0.6; P.rFold = -1.5 - S(b * 2) * 0.6;
    P.hop = pulse(b * 2) * 0.08;
    P.bob = -pulse(b * 2 + PI) * 0.05;
    P.hipYaw = S(b) * 0.25;
    P.mouth = 2; P.eye = 1.15;
    P.headPitch = -0.15;
    P.step = 0.6; P.stepPh = b;
  },

  // Dança 3: disco (aponta para cima e para baixo)
  disco(t, P, c) {
    const b = c.beat * PI;
    const side = S(b * 0.5) > 0 ? 1 : -1;
    const up = (S(b) + 1) / 2;
    if (side > 0) { P.lRaise = 0.5 + up * 2.0; P.lEl = 1.4 * up; P.lFold = -2 * up; P.rRaise = 0.2; }
    else { P.rRaise = 0.5 + up * 2.0; P.rEl = 1.4 * up; P.rFold = -2 * up; P.lRaise = 0.2; }
    P.hipYaw = side * 0.3; P.twist = side * 0.2;
    P.hipRoll = (up - 0.5) * 0.2 * side;
    P.bob = -up * 0.06;
    P.headYaw = side * 0.4; P.headPitch = -up * 0.2;
    P.step = 1; P.stepPh = b;
  },

  // Dança 4: requebrado com o abdômen
  wiggle(t, P, c) {
    const b = c.beat * PI;
    P.abdYaw = S(b * 2) * 0.55; P.abdPitch = S(b) * 0.15;
    P.hipYaw = S(b) * 0.2; P.twist = -S(b) * 0.35;
    P.lean = 0.15 + S(b * 2) * 0.05;
    P.lRaise = 0.8; P.rRaise = 0.8; P.lOut = 0.5; P.rOut = 0.5;
    P.lFold = S(b * 2) * 0.5; P.rFold = -S(b * 2) * 0.5;
    P.bob = -0.08 - Math.abs(S(b)) * 0.05;
    P.headRoll = -S(b) * 0.25;
    P.mouth = 0;
    P.step = 0.5; P.stepPh = b;
  },

  // Dança 5: pulinhos com estica e encolhe
  bounce(t, P, c) {
    const b = c.beat * PI;
    const j = pulse(b * 2);
    P.hop = j * 0.22;
    P.squash = 1 + (j - 0.4) * 0.18;
    P.lRaise = 0.3 + j * 1.4; P.rRaise = 0.3 + j * 1.4;
    P.lOut = j * 0.6; P.rOut = j * 0.6;
    P.antL = j; P.antR = j;
    P.eye = 1 + j * 0.2;
    P.mouth = j > 0.6 ? 2 : 0;
    P.headPitch = -j * 0.15;
  },

  // Dança 6: robô engraçado (movimentos travados)
  robot(t, P, c) {
    const st = Math.floor(c.beat * 2);
    const r = (n) => ((Math.sin(st * 12.9898 + n * 78.233 + c.seed * 43.1) * 43758.5453) % 1 + 1) % 1;
    P.headYaw = (r(1) - 0.5) * 1.2; P.headPitch = (r(2) - 0.5) * 0.5;
    P.lRaise = r(3) * 2; P.rRaise = r(4) * 2;
    P.lFold = -r(5) * 2; P.rFold = -r(6) * 2;
    P.hipYaw = (r(7) - 0.5) * 0.8;
    P.lean = (r(8) - 0.5) * 0.3;
    P.eye = 0.6 + r(9) * 0.6;
    P.antWig = 0;
    P.antL = r(10) - 0.5; P.antR = r(11) - 0.5;
    P.step = 0.7; P.stepPh = c.beat * PI;
  },

  // Dança 7: onda (corpo ondulando como uma minhoca)
  wave(t, P, c) {
    const b = c.beat * PI * 0.5;
    P.lean = S(b) * 0.25; P.headPitch = S(b - 1) * 0.35;
    P.abdPitch = -S(b + 1) * 0.3;
    P.bob = S(b + 0.5) * 0.08;
    P.lRaise = 1 + S(b - 1.5) * 0.8; P.rRaise = 1 + S(b - 1.5) * 0.8;
    P.lFold = S(b - 2) * 1.2; P.rFold = S(b - 2) * 1.2;
    P.antCurl = S(b) * 0.8;
    P.antWig = 1;
    P.eye = 0.75;
    P.step = 0.4; P.stepPh = b * 2;
  },

  // Dança especial (rosa): giro + sequência exagerada
  special(t, P, c) {
    const b = c.beat * PI;
    P.spin = ease(t / 1.2) * PI * 2 + (t > 3 ? ease((t - 3) / 1.2) * PI * 2 : 0);
    P.hop = (t < 1.2 ? S((t / 1.2) * PI) * 0.6 : pulse(b * 2) * 0.12);
    P.lRaise = 2.2 + S(b * 2) * 0.4; P.rRaise = 2.2 - S(b * 2) * 0.4;
    P.lOut = 0.7; P.rOut = 0.7; P.lEl = 1.5; P.rEl = 1.5; P.lFold = -2; P.rFold = -2;
    P.hipRoll = S(b) * 0.2;
    P.mouth = 2; P.eye = 1.25; P.antL = 1; P.antR = 1; P.antWig = 1.4;
    P.headRoll = S(b) * 0.3;
  },

  // Comemoração: salto com os braços para cima
  celebrate(t, P, c) {
    const k = t * 6.5;
    const j = pulse(k);
    P.hop = j * 0.45;
    P.squash = 1 + (j - 0.3) * 0.2;
    P.lRaise = 2.4; P.rRaise = 2.4; P.lOut = 0.6 + S(k * 2) * 0.2; P.rOut = 0.6 - S(k * 2) * 0.2;
    P.lEl = 1.6; P.rEl = 1.6; P.lFold = -2.2; P.rFold = -2.2;
    P.mouth = 2; P.eye = 1.3; P.antL = 1.2; P.antR = 1.2; P.antWig = 1.5;
    P.headPitch = -0.3;
  },

  // Surpresa: pulo para trás, olhos arregalados, boca aberta
  surprise(t, P, c) {
    const a = ease(t / 0.18);
    const hold = t < 0.18 ? 0 : Math.exp(-(t - 0.18) * 0.6);
    P.hop = S(Math.min(1, t / 0.4) * PI) * 0.3;
    P.lean = -0.35 * a;
    P.lRaise = 1.5 * a; P.rRaise = 1.5 * a; P.lOut = 0.8 * a; P.rOut = 0.8 * a;
    P.lFold = -1.6 * a; P.rFold = -1.6 * a;
    P.eye = 1 + 0.5 * a; P.mouth = 2;
    P.antL = 1.6 * a; P.antR = 1.6 * a; P.antWig = 0.2 + (1 - hold) * 0.5;
    P.headPitch = -0.2 * a;
    P.squash = 1 + 0.12 * a * hold;
  },

  // Dança romântica (noivos)
  romantic(t, P, c) {
    const b = c.beat * PI * 0.5;
    P.hipRoll = S(b) * 0.08; P.tilt = -S(b) * 0.06;
    P.bob = -Math.abs(S(b)) * 0.03;
    P.headRoll = 0.25 * c.side; P.headPitch = 0.08;
    P.eye = 0.55; P.pupX = -0.4 * c.side;
    // braço mais próximo do par estica para "dar as mãos"
    if (c.side > 0) { P.rRaise = 0.95; P.rEl = 1.9; P.rFold = -1.6; P.rOut = -0.35; P.lRaise = 0.7; }
    else { P.lRaise = 0.95; P.lEl = 1.9; P.lFold = -1.6; P.lOut = -0.35; P.rRaise = 0.7; }
    P.antCurl = 0.4; P.antWig = 0.4;
    P.step = 0.35; P.stepPh = b * 2;
  },

  // Beijo (noivos)
  kiss(t, P, c) {
    const a = ease(t / 0.8) * (t > 3.4 ? 1 - ease((t - 3.4) / 0.6) : 1);
    P.lean = 0.2 * a; P.headPitch = 0.08 * a;
    P.headRoll = 0.22 * a * c.side;
    P.mouth = a > 0.4 ? 1 : 0;
    P.eye = 1 - 0.98 * a;
    P.lRaise = 0.6 + 0.4 * a; P.rRaise = 0.6 + 0.4 * a; P.lOut = -0.3 * a; P.rOut = -0.3 * a;
    P.lEl = 1.2 * a; P.rEl = 1.2 * a;
    P.antCurl = 0.9 * a; P.antWig = 0.2 + (t > 1 && t < 3.4 ? 1 : 0);
    P.abdPitch = 0.2 * a;
    P.hop = t > 1.2 && t < 3.2 ? pulse((t - 1.2) * 6) * 0.04 : 0;
  },

  // Acenando ("oi!")
  hello(t, P, c) {
    P.lRaise = 2.3; P.lOut = 0.6; P.lEl = 1.4; P.lFold = -1.2 + S(t * 12) * 0.8;
    P.headRoll = S(t * 6) * 0.1; P.mouth = 2; P.eye = 1.1;
    P.bob = S(t * 6) * 0.02;
    P.hipRoll = S(t * 6) * 0.04;
  },

  // Batendo palmas com as garras
  clap(t, P, c) {
    const k = t * 10;
    const o = pulse(k) * 0.5;
    P.lRaise = 1.3; P.rRaise = 1.3; P.lEl = 1.2; P.rEl = 1.2;
    P.lOut = 0.2 + o - 0.45; P.rOut = 0.2 + o - 0.45;
    P.lFold = -1.2; P.rFold = -1.2;
    P.mouth = 2; P.eye = 1.1; P.bob = -pulse(k) * 0.03;
  },

  // Tontura (depois de pousar do foguete)
  dizzy(t, P, c) {
    P.headRoll = S(t * 5) * 0.35; P.headYaw = C(t * 5) * 0.35;
    P.hipRoll = S(t * 5 + 1) * 0.12; P.lean = C(t * 5) * 0.1;
    P.eye = 0.45; P.pupX = S(t * 9) * 0.8; P.pupY = C(t * 9) * 0.8;
    P.mouth = 2; P.lRaise = 0.3; P.rRaise = 0.3;
    P.antWig = 2; P.antCurl = 0.6;
  },

  // Voando (foguete)
  fly(t, P, c) {
    P.lRaise = 2.7; P.rRaise = 2.7; P.lEl = 1.8; P.rEl = 1.8; P.lFold = -2.4; P.rFold = -2.4;
    P.lOut = 0.2; P.rOut = 0.2;
    P.mouth = 2; P.eye = 1.4; P.antL = -1; P.antR = -1; P.antWig = 2;
    P.headPitch = -0.35;
  },

  // Reverência (padrinho/madrinha)
  bow(t, P, c) {
    const a = S(Math.min(1, t / 2) * PI);
    P.lean = 0.6 * a; P.headPitch = 0.4 * a; P.abdPitch = 0.3 * a;
    P.lRaise = 0.3; P.rRaise = 1.2 * a; P.rOut = -0.4 * a; P.rEl = 1 * a;
    P.eye = 1 - 0.5 * a;
  },

  // "Toca aqui" com o vizinho
  highfive(t, P, c) {
    const a = ease(t / 0.4) * (t > 1.4 ? 1 - ease((t - 1.4) / 0.4) : 1);
    const hit = t > 0.5 && t < 0.8 ? 1 : 0;
    P.rRaise = 2.2 * a; P.rEl = 1.3 * a; P.rFold = -1.5 * a; P.rOut = -0.2;
    P.hop = hit * 0.08;
    P.mouth = 2; P.eye = 1.15;
    P.lean = 0.1 * a;
  },
};

// danças usadas na festa (só as rápidas, estilo piseiro)
export const DANCES = ['piseiro', 'passinho', 'arrasta', 'tremidinha', 'sapateado', 'pulapula'];

/** Controla a animação atual de um personagem, com transição suave. */
export class Animator {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.cur = { name: 'idle', t: 0, dur: Infinity, next: null };
    this.prev = null;
    this.blend = 1;
    this.blendDur = 0.35;
    this.pose = defaultPose();
    this._a = defaultPose();
    this._b = defaultPose();
    this.ctx = { beat: 0, seed, side: 1 };
  }
  get name() { return this.cur.name; }
  /** toca uma animação; dur = segundos (depois volta para "next") */
  play(name, { dur = Infinity, next = null, blend = 0.3 } = {}) {
    if (!ANIMS[name]) return;
    this.prev = { ...this.cur };
    this.cur = { name, t: 0, dur, next };
    this.blend = 0;
    this.blendDur = blend;
  }
  update(dt, beat, extra) {
    this.ctx.beat = beat;
    if (extra) Object.assign(this.ctx, extra);
    this.cur.t += dt;
    if (this.cur.t >= this.cur.dur) {
      const n = this.cur.next || 'idle';
      this.play(typeof n === 'function' ? n() : n);
    }
    this._eval(this.cur, this._a);
    if (this.blend < 1 && this.prev) {
      this.prev.t += dt;
      this.blend = Math.min(1, this.blend + dt / this.blendDur);
      this._eval(this.prev, this._b);
      const w = ease(this.blend);
      for (const k of POSE_KEYS) this.pose[k] = this._b[k] + (this._a[k] - this._b[k]) * w;
      // trocas discretas
      this.pose.mouth = w > 0.5 ? this._a.mouth : this._b.mouth;
    } else {
      for (const k of POSE_KEYS) this.pose[k] = this._a[k];
    }
    return this.pose;
  }
  _eval(st, out) {
    const d = defaultPose();
    for (const k of POSE_KEYS) out[k] = d[k];
    ANIMS[st.name](st.t, out, this.ctx);
  }
}
