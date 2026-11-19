// =============================================================
//  PERSONAGENS 3D (modelos .glb com esqueleto do Mixamo)
//  - Todos usam o mesmo esqueleto ("mixamorig"), então as
//    animações de animacoes.glb servem para qualquer um.
//  - createChar(chave) devolve um personagem pronto, com as
//    animações e o controle de troca suave entre elas.
// =============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadGLB } from '../util/glb.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import urlAnims from '../assets/chars/animacoes.glb?url';
import urlNoivo from '../assets/chars/noivo_zumbi.glb?url';
import urlAzul from '../assets/chars/zumbi_azul.glb?url';
import urlGoblin from '../assets/chars/goblin.glb?url';
import urlTung from '../assets/chars/tung_tung.glb?url';
import urlPalhaco from '../assets/chars/palhaco.glb?url';
import urlNoiva from '../assets/chars/noiva.glb?url';

export const CHAR_URLS = { noivo_zumbi: urlNoivo, zumbi_azul: urlAzul, goblin: urlGoblin, tung_tung: urlTung, palhaco: urlPalhaco, noiva: urlNoiva };
export const GUEST_CHARS = ['zumbi_azul', 'goblin', 'tung_tung', 'palhaco', 'noivo_zumbi'];
// danças rápidas (Mixamo)
export const DANCES = ['samba', 'step', 'booty', 'twist', 'slide', 'soul', 'runningman', 'house', 'charleston', 'chicken'];
export const HEIGHT = 2.1;

// nomes antigos (louva-a-deus) -> animação nova
const ALIAS = {
  special: 'soul', bounce: 'celebrate', like: 'celebrate', highfive: 'hello', bow: 'hello', dizzy: 'surprise', fly: 'celebrate',
  romantic: 'samba', sanfona: 'guitar', zabumba: 'guitar', triangulo: 'guitar', violao: 'guitar',
  piseiro: 'samba', passinho: 'step', arrasta: 'slide', tremidinha: 'booty', sapateado: 'charleston', pulapula: 'runningman',
  sway: 'step', armsUp: 'celebrate', disco: 'house', wiggle: 'booty', robot: 'runningman', wave: 'twist',
};
const LOOP_ONCE = new Set(['surprise']);

const clean = (n) => n.replace(/^mixamorig[:_]?/, '').replace(/_\d+$/, '');
const T = { templates: {}, rawClips: [], animHips: null, clipCache: {} };

export async function loadChars(onProgress = () => {}) {
  const L = new GLTFLoader();
  const keys = Object.keys(CHAR_URLS);
  let done = 0;
  const anim = await loadGLB(urlAnims, L);
  onProgress(++done / (keys.length + 1));
  anim.scene.updateMatrixWorld(true);
  anim.scene.traverse((o) => { if (o.isBone) { o.name = clean(o.name); if (o.name === 'Hips') { T.animHips = o.position.clone(); T.animParentQ = o.parent.getWorldQuaternion(new THREE.Quaternion()); } } });
  T.rawClips = anim.animations;
  await Promise.all(keys.map(async (k) => {
    const g = await loadGLB(CHAR_URLS[k], L);
    const sc = g.scene;
    let hips = null;
    sc.traverse((o) => {
      if (o.isBone) { o.name = clean(o.name); if (o.name === 'Hips') hips = o; }
      if (o.isMesh) {
        o.frustumCulled = false;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { if (m.name === 'renda') { m.alphaTest = 0.35; m.transparent = false; m.depthWrite = true; m.side = THREE.DoubleSide; } if (m.name === 'cetim' || m.name === 'rosa') m.side = THREE.DoubleSide; if (m.name === 'cetim') m.color.setRGB(0.72, 0.69, 0.68); if (m.name === 'renda') m.color.setRGB(0.86, 0.84, 0.83); m.metalness = 0; m.roughness = Math.max(0.55, m.roughness ?? 0.6); if (m.map) { m.map.anisotropy = 8; m.map.needsUpdate = true; } }
      }
    });
    sc.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(sc);
    const h = box.max.y - box.min.y;
    const parentQ = hips ? hips.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
    T.templates[k] = { scene: sc, scale: HEIGHT / h, minY: box.min.y, cx: (box.min.x + box.max.x) / 2, cz: (box.min.z + box.max.z) / 2, hips: hips ? hips.position.clone() : null, parentQ };
    onProgress(++done / (keys.length + 1));
  }));
}

/** clipes ajustados para o tamanho de cada personagem (só rotações + sobe/desce do quadril) */
function clipsFor(k) {
  if (T.clipCache[k]) return T.clipCache[k];
  const tpl = T.templates[k];
  const out = {};
  const pre = tpl.parentQ.clone().invert().multiply(T.animParentQ || new THREE.Quaternion());
  const have = new Set(); tpl.scene.traverse((o) => { if (o.isBone) have.add(o.name); });
  for (const c of T.rawClips) {
    const tracks = [];
    for (const tr of c.tracks) {
      const dot = tr.name.lastIndexOf('.');
      const bone = clean(tr.name.slice(0, dot)), prop = tr.name.slice(dot + 1);
      if (!have.has(bone)) continue;
      if (prop === 'quaternion') {
        const t = tr.clone(); t.name = bone + '.quaternion';
        if (bone === 'Hips') { // o "pai" do quadril pode estar girado diferente (Z para cima x Y para cima)
          const v = t.values, q = new THREE.Quaternion();
          for (let i = 0; i < v.length; i += 4) { q.fromArray(v, i); q.premultiply(pre); q.toArray(v, i); }
        }
        tracks.push(t);
      }
      else if (prop === 'position' && bone === 'Hips' && tpl.hips) {
        // só o sobe-e-desce do quadril (sem andar para longe), na escala do personagem
        const v = tr.values, n = v.length / 3;
        const up = (arr, o = 0) => { let k = 0; for (let i = 1; i < 3; i++) if (Math.abs(arr[o + i]) > Math.abs(arr[o + k])) k = i; return k; };
        const uc = up(tpl.hips.toArray());
        const v0 = new THREE.Vector3(v[0], v[1], v[2]);
        const ratio = tpl.hips.length() / (v0.length() || 1);
        const out = new Float32Array(n * 3), d = new THREE.Vector3();
        for (let i = 0; i < n; i++) {
          d.set(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]).sub(v0).applyQuaternion(pre).multiplyScalar(ratio);
          out[i * 3] = tpl.hips.x; out[i * 3 + 1] = tpl.hips.y; out[i * 3 + 2] = tpl.hips.z;
          out[i * 3 + uc] += d.getComponent(uc);
        }
        tracks.push(new THREE.VectorKeyframeTrack('Hips.position', tr.times, out));
      }
    }
    out[c.name] = new THREE.AnimationClip(c.name, c.duration, tracks);
  }
  return (T.clipCache[k] = out);
}

/** controla qual animação está tocando, com troca suave (mesma ideia do Animator antigo) */
class CharAnim {
  constructor(mixer, clips, seed) {
    this.mixer = mixer; this.clips = clips; this.seed = seed;
    this.actions = {}; this.cur = null; this.curName = 'idle'; this.t = 0; this.dur = Infinity; this.next = null;
  }
  get name() { return this.curName; }
  resolve(name) {
    if (this.clips[name]) return name;
    if (ALIAS[name] && this.clips[ALIAS[name]]) return ALIAS[name];
    return DANCES[(Math.random() * DANCES.length) | 0];
  }
  action(n) {
    if (!this.actions[n]) {
      const a = this.mixer.clipAction(this.clips[n]);
      if (LOOP_ONCE.has(n)) { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
      this.actions[n] = a;
    }
    return this.actions[n];
  }
  play(name, { dur = Infinity, next = null, blend = 0.35 } = {}) {
    const n = this.resolve(name);
    const a = this.action(n);
    if (this.cur && this.cur !== a) this.cur.fadeOut(blend);
    a.reset(); a.setEffectiveWeight(1); a.fadeIn(this.cur ? blend : 0); a.play();
    if (DANCES.includes(n)) a.time = (this.seed * 7.3) % a.getClip().duration; // cada um num ponto da dança
    this.cur = a; this.curName = name; this.t = 0; this.dur = dur; this.next = next;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.dur) {
      const n = this.next || DANCES[(Math.random() * DANCES.length) | 0];
      this.play(typeof n === 'function' ? n() : n);
    }
    this.mixer.update(dt);
  }
}

export function createChar(key, { seed = Math.random(), shadow = false } = {}) {
  const tpl = T.templates[key] || T.templates[GUEST_CHARS[0]];
  const model = SkeletonUtils.clone(tpl.scene);
  model.scale.setScalar(tpl.scale);
  model.position.set(-tpl.cx * tpl.scale, -tpl.minY * tpl.scale, -tpl.cz * tpl.scale);
  const root = new THREE.Group();
  root.add(model);
  const bones = {};
  model.traverse((o) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) { o.castShadow = shadow; o.receiveShadow = false; }
  });
  const mixer = new THREE.AnimationMixer(model);
  const anim = new CharAnim(mixer, clipsFor(key), seed);
  anim.play('idle');
  const head = bones.Head || bones.Neck;
  const _q = new THREE.Vector3(), _t = new THREE.Vector3();
  return {
    key, root, model, bones, mixer, anim,
    /** ponto em cima da cabeça (mundo) */
    headTop(v = new THREE.Vector3()) {
      head.getWorldPosition(v);
      if (bones.HeadTop_End) {
        bones.HeadTop_End.getWorldPosition(_t);
        // alguns modelos têm o osso do topo da cabeça fora do lugar (ex.: palhaço): aí usa a cabeça + um pouco
        if (_t.y > v.y + 0.12 * root.scale.y) { v.copy(_t); v.y += 0.08 * root.scale.y; return v; }
      }
      v.y += 0.3 * root.scale.y; return v;
    },
    headPos(v = new THREE.Vector3()) { return head.getWorldPosition(v); },
    update(dt) { anim.update(dt); },
    /** prende um objeto num osso, em tamanho de "mundo" */
    attach(boneName, obj, { pos = [0, 0, 0], scale = 1 } = {}) {
      const b = bones[boneName] || head;
      b.add(obj);
      root.updateMatrixWorld(true);
      b.getWorldScale(_q);
      const s = _q.x || 1;
      obj.scale.setScalar(scale / s);
      obj.position.set(pos[0] / s, pos[1] / s, pos[2] / s);
      return obj;
    },
  };
}
