// =============================================================
//  CASAMENTO DOS LOUVA-A-DEUS — jogo para TikTok LIVE
//  Ponto de entrada: junta cenário, noivos, convidados, efeitos,
//  áudio, câmera, interface, painel e a ligação com a live.
// =============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHall } from './scene/hall.js';
import { Groom, Bride } from './mantis/heroes.js';
import { Crowd } from './crowd/crowd.js';
import { FX } from './fx/particles.js';
import { AudioEngine } from './audio/audio.js';
import { CameraDirector, WeddingDirector } from './scene/director.js';
import { HUD } from './ui/hud.js';
import { buildPanel } from './ui/panel.js';
import { TikTokLink, cleanServer, IS_APP } from './net/tiktok.js';
import { buildMenu } from './ui/menu.js';
import { loadConfig, saveConfig, resolveGift } from './config.js';

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');           // modo de teste (captura de tela)
const cfg = loadConfig();
if (params.get('q')) cfg.quality = params.get('q');

// ---------------- renderizador 9:16 ----------------
const stage = document.getElementById('stage');
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;

const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(540, 960), 0.45, 0.5, 1.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let viewW = 540, viewH = 960;
let fx = null;
function resize() {
  const W = window.innerWidth, H = window.innerHeight;
  let h = H, w = Math.round(H * 9 / 16);
  if (w > W) { w = W; h = Math.round(W * 16 / 9); }
  if (W / H <= 9 / 16) { w = W; h = H; } // celular comprido: ocupa a tela inteira
  viewW = w; viewH = h;
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.fontSize = Math.min(h / 1920 * 26, w / 1080 * 30) + 'px';
  camera.aspect = w / h;
  camera.fov = w / h < 0.5 ? 46 : 42;
  camera.updateProjectionMatrix();
  const maxPr = cfg.quality === 'low' ? 0.85 : cfg.quality === 'medium' ? 1.25 : 2;
  const pr = Math.min(window.devicePixelRatio || 1, 1920 / h, maxPr);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(pr);
  composer.setSize(w, h);
  bloom.resolution.set(w * pr * 0.5, h * pr * 0.5);
  if (fx) fx.setViewport(h * pr);
}
function setQuality(q) {
  cfg.quality = q;
  bloom.enabled = q !== 'low';
  renderer.shadowMap.enabled = q !== 'low';
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  resize();
}

// ---------------- mundo ----------------
const hall = buildHall(scene, { quality: cfg.quality });
fx = new FX(scene);
const audio = new AudioEngine();
audio.setMusicVolume(cfg.musicVolume);
audio.setSfxVolume(cfg.sfxVolume);
audio.fileBpm = cfg.danceBpm || 150;

const groom = new Groom();
const bride = new Bride();
scene.add(groom.group, bride.group);
{ // sombra de contato dos noivos
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  for (const h of [groom, bride]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), mat); b.position.y = 0.022; h.group.add(b); }
}

const hud = new HUD(document.getElementById('hud'));
const camDir = new CameraDirector(camera);
const crowd = new Crowd(scene, {
  fx, labelsEl: document.getElementById('labels'),
  sfx: (n) => audio.sfx(n),
  onFocus: (g, dur, kind) => camDir.focusOn(g, dur, kind),
  onCount: (n) => { hud.setCount(n); camDir.crowdCount = n; },
});
crowd.setLimit(cfg.limit);
const wedding = new WeddingDirector(groom, bride, { crowd, fx, audio, camDir });
resize();
window.addEventListener('resize', resize);
if (cfg.quality !== 'high') setQuality(cfg.quality);

// ---------------- nomes dos noivos ----------------
const coupleTags = [groom, bride].map((h, i) => {
  const el = document.createElement('div');
  el.className = 'tag hero ' + (i ? 'bride' : 'groom');
  document.getElementById('labels').appendChild(el);
  return { h, el };
});
function updateCoupleLabels() {
  coupleTags[0].el.innerHTML = `<div class="role">💍 NOIVO</div><div class="nm">${escapeHtml(cfg.groomName || 'Noivo')}</div>`;
  coupleTags[1].el.innerHTML = `<div class="role">💍 NOIVA</div><div class="nm">${escapeHtml(cfg.brideName || 'Noiva')}</div>`;
}
updateCoupleLabels();
const _tv = new THREE.Vector3();
function placeCoupleLabels() {
  for (const { h, el } of coupleTags) {
    h.rig.headC.localToWorld(_tv.set(0, 0.7, 0));
    const d = _tv.distanceTo(camera.position);
    _tv.project(camera);
    if (_tv.z > 1) { el.style.display = 'none'; continue; }
    el.style.display = '';
    const s = Math.max(0.45, Math.min(1.35, 14 / d));
    el.style.transform = `translate(${((_tv.x * 0.5 + 0.5) * viewW).toFixed(1)}px,${((-_tv.y * 0.5 + 0.5) * viewH).toFixed(1)}px) translate(-50%,-100%) scale(${s.toFixed(3)})`;
    el.style.zIndex = '2000';
  }
}

// ---------------- eventos da live ----------------
const likeGate = new Map();
function handleEvent(e) {
  const u = e.user;
  if (!u || !u.id) return;
  if (game.onLog && e.type !== 'like') {
    const n = u.name || u.id;
    game.onLog(e.type === 'join' ? `${n} entrou` : e.type === 'chat' ? `${n}: ${e.comment || ''}` : e.type === 'gift' ? `${n} enviou ${e.giftName}${e.count > 1 ? ' x' + e.count : ''}` : e.type === 'follow' ? `${n} seguiu` : `${n} compartilhou`);
  }
  const known = crowd.guests.has(u.id);
  const join = () => {
    const g = crowd.add({ id: u.id, name: u.name || u.id, pic: u.pic });
    if (g && !known) hud.toast(u, 'chegou na festa! 💚');
    return g;
  };
  switch (e.type) {
    case 'join':
      if (cfg.joinOnEnter) join();
      break;
    case 'chat': {
      const g = join();
      if (g && known) runAction(g, cfg.commentAction);
      break;
    }
    case 'like': {
      const g = join();
      const now = performance.now();
      if (g && known && now - (likeGate.get(u.id) || 0) > 1500) { likeGate.set(u.id, now); crowd.act(g, 'like'); }
      break;
    }
    case 'follow': { const g = join(); if (g) setTimeout(() => runAction(g, cfg.followAction), known ? 0 : 3500); break; }
    case 'share': { const g = join(); if (g) setTimeout(() => runAction(g, cfg.shareAction), known ? 0 : 3500); break; }
    case 'gift': {
      const g = join();
      hud.gift(u, e.giftName || 'presente', e.count || 1);
      const action = resolveGift(cfg, e.giftName, e.diamonds, e.count);
      if (g) setTimeout(() => runAction(g, action), known ? 200 : 3200);
      break;
    }
  }
}
function runAction(g, action) {
  if (!g || !g.alive || !action || action === 'none') return;
  if (action === 'kiss') { wedding.trigger('kiss'); crowd.act(g, 'celebrate'); return; }
  if (action === 'groupdance') { crowd.groupDance(); crowd.act(g, 'special'); return; }
  if (action === 'vip' || action === 'rocket') wedding.trigger('surprise');
  crowd.act(g, action);
}

// ---------------- convidados de teste e parentes ----------------
const TEST_NAMES = ['ana', 'bia', 'carla', 'duda', 'edu', 'fabio', 'gabi', 'hugo', 'iara', 'joao', 'kaka', 'leo', 'malu', 'nina', 'otavio', 'pri', 'quel', 'rafa', 'sofia', 'teo', 'vini', 'wesley', 'xande', 'yasmin', 'zeca', 'lulu', 'mel', 'davi', 'lara', 'caio', 'jade', 'nando', 'tati', 'gui', 'lia'];
let testN = 0;
function testUser() {
  testN++;
  const nm = TEST_NAMES[testN % TEST_NAMES.length] + '_' + (100 + ((testN * 37) % 900));
  return { id: 'teste_' + testN + '_' + Math.floor(Math.random() * 1e6), name: nm, pic: '' };
}
function addTest(n, instant) {
  for (let i = 0; i < n; i++) {
    const u = testUser();
    if (instant) crowd.addInstant(u);
    else setTimeout(() => handleEvent({ type: 'chat', user: u }), i * 350);
  }
}
const BOT_NAMES = ['Tia Mantídia', 'Vovô Louvadão', 'Prima Louvinha', 'Dinda Orquídea', 'Tio Galhinho', 'Vovó Florinda', 'Primo Raminho', 'Tia Esmeralda', 'Padrinho Folhão', 'Prima Clorofila', 'Tio Capim', 'Vovó Hortelã', 'Primo Broto', 'Tia Samambaia', 'Tio Trevo', 'Prima Margarida', 'Vovô Bambu', 'Tia Alfavaca', 'Primo Musgo', 'Tia Violeta'];
function syncBots() {
  const bots = crowd.list.filter((g) => g.bot);
  for (let i = bots.length; i < cfg.bots; i++) {
    const g = crowd.addInstant({ id: 'bot_' + i, name: BOT_NAMES[i % BOT_NAMES.length], bot: true });
    if (g) g.bot = true;
  }
  for (const g of bots.slice(cfg.bots)) crowd.remove(g.id);
}
function reset() {
  crowd.clear();
  wedding.trigger('dance');
  syncBots();
}

// ---------------- painel e conexão ----------------
const game = {
  cfg, crowd, audio, wedding, camDir, hud, cleanServer,
  event: handleEvent, addTest, testUser, syncBots, reset, setQuality, updateCoupleLabels,
  connect: (u) => { link.setServer(cfg.server); link.connect(u); }, onStatus: () => {},
};
const link = new TikTokLink(handleEvent, (state, msg) => {
  hud.setConn(state === 'live' ? '● ao vivo' : '');
  game.onStatus(state, msg);
  if (game.onMenuStatus) game.onMenuStatus(state, msg);
});
game.remote = link.remote;
const panelEl = document.getElementById('panel');
buildPanel(panelEl, game);
hud.showFps(cfg.showFps);
const gear = document.createElement('button');
gear.id = 'gear'; gear.textContent = '⚙'; gear.title = 'Painel (P)';
gear.onclick = () => panelEl.classList.toggle('hidden');
document.body.appendChild(gear);
const APP = IS_APP || params.has('menu');
if (APP) gear.style.display = 'none'; // no app o painel abre pelo ⚙ Menu
if (!SHOT && !APP) game.connect(cfg.username);

// início: um clique libera o som (regra dos navegadores)
let started = false;
let startEl = null;
function start() {
  if (started) return;
  started = true;
  audio.unlock();
  audio.play(0);
  if (startEl) startEl.remove();
}
if (!SHOT && APP) buildMenu(game, { onPlay: start });
if (!SHOT && !APP) {
  startEl = document.createElement('div');
  startEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:30%;z-index:5;cursor:pointer;pointer-events:auto';
  startEl.innerHTML = '<div style="background:rgba(30,10,35,.8);color:#fff;font-weight:800;font-size:1.4em;padding:.7em 1.4em;border-radius:2em;border:3px solid #ffb3cf">🎉 Toque para começar a festa</div>';
  stage.appendChild(startEl);
}
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  const wasStarted = started;
  start();
  if (k === 'p') panelEl.classList.toggle('hidden');
  else if (k === 'm' && wasStarted) { audio.playing ? audio.stop() : audio.play(); }
  else if (k === ' ') { e.preventDefault(); wedding.trigger('kiss'); }
  else if (k === 'g') crowd.groupDance();
  else if (k === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
});
window.addEventListener('pointerdown', (e) => { if (!(e.target instanceof Node) || (!panelEl.contains(e.target) && e.target !== gear)) start(); });

// ---------------- vida própria da festa ----------------
let groupT = 90, chirpT = 4, randomT = 6;
function partyLife(dt) {
  groupT -= dt;
  if (groupT <= 0) { groupT = 120 + Math.random() * 60; if (crowd.count > 3) crowd.groupDance(); }
  chirpT -= dt;
  if (chirpT <= 0) { chirpT = 2 + Math.random() * 5; if (crowd.count) audio.sfx('chirp'); }
  randomT -= dt;
  if (randomT <= 0 && crowd.count) {
    randomT = 6 + Math.random() * 8;
    const g = crowd.list[(Math.random() * crowd.count) | 0];
    if (g && g.busy <= 0 && g.state === 'placed' && !g.special) { g.anim.play(Math.random() < 0.5 ? 'celebrate' : 'special', { dur: 2.5, next: 'piseiro' }); g.busy = 2.5; }
  }
}

// ---------------- laço principal ----------------
const timer = new THREE.Timer();
let time = 0, fpsAcc = 0, fpsN = 0;
function tick(dt) {
  time += dt;
  const beat = audio.beat(time);
  partyLife(dt);
  hall.update(time, beat);
  wedding.update(dt, time);
  groom.update(dt, time, beat);
  bride.update(dt, time, beat);
  crowd.update(dt, time, beat, camera, viewW, viewH);
  fx.update(dt);
  camDir.update(dt, time);
  placeCoupleLabels();
}
function frame() {
  timer.update();
  const dt = Math.min(0.05, timer.getDelta());
  tick(dt);
  composer.render();
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { hud.fps(fpsN / fpsAcc); autoQuality(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
}
// se ficar travando (poucos quadros por segundo), baixa a qualidade sozinho
let slowFor = 0;
function autoQuality(fps) {
  if (time < 12 || cfg.quality === 'low') return;
  slowFor = fps < 26 ? slowFor + 0.5 : 0;
  if (slowFor >= 5) {
    slowFor = 0;
    setQuality(cfg.quality === 'high' ? 'medium' : 'low');
    saveConfig(cfg);
  }
}

syncBots();
if (SHOT) {
  // ?shot=1&guests=40&cam=wide&gift=rocket&t=4  -> desenha um quadro para conferência
  const n = Number(params.get('guests') || 0);
  if (n) addTest(n, true);
  if (params.get('cam')) camDir.locked = params.get('cam');
  if (params.get('wed')) wedding.trigger(params.get('wed'));
  const steps = Math.round(Number(params.get('t') || 2) / 0.05);
  const gift = params.get('gift');
  for (let i = 0; i < steps; i++) {
    if (gift && i === 10) { const g = crowd.list.find((x) => !x.bot) || crowd.list[0]; runAction(g, gift); }
    if (params.has('arrive') && i === 4) handleEvent({ type: 'chat', user: testUser() });
    tick(0.05);
  }
  composer.render();
  window.__ready = true;
} else {
  renderer.setAnimationLoop(frame);
}
window.__game = game;
window.__tick = tick;

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
