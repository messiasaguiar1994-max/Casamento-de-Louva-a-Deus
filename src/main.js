// =============================================================
//  CASAMENTO ZUMBI — jogo para TikTok LIVE
//  Ponto de entrada: junta cenário, noivos, convidados, efeitos,
//  áudio, câmera, interface, painel e a ligação com a live.
// =============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHall, FLOOR } from './scene/club.js';
import { loadInstruments, socketsFor } from './chars/instruments.js';
import { createChar } from './chars/models.js';
import { Groom3D, Bride3D } from './chars/heroes3d.js';
import { loadChars } from './chars/models.js';
import { Crowd, showBubble } from './crowd/crowd.js';
import { FX } from './fx/particles.js';
import { AudioEngine } from './audio/audio.js';
import { CameraDirector, WeddingDirector } from './scene/director.js';
import { HUD } from './ui/hud.js';
import { buildPanel } from './ui/panel.js';
import { TikTokLink, cleanServer, IS_APP } from './net/tiktok.js';
import { buildMenu } from './ui/menu.js';
import { startGiftHints } from './ui/giftIcons.js';
import { loadConfig, saveConfig, resolveGift } from './config.js';

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');           // modo de teste (captura de tela)
const cfg = loadConfig();
// modo OBS (fonte de navegador): ?obs=1&user=seu_usuario
const OBS = params.has('obs');
// OBS: leve por padrão (o PC também está codificando a live). ?q=high para máximo
const ULTRA = params.get('q') === 'ultra';  // ?q=ultra: o mais leve possível (PC sem placa de vídeo)
if (OBS) cfg.quality = ['low', 'medium', 'high'].includes(params.get('q')) ? params.get('q') : ULTRA ? 'low' : 'medium';
const FPS_CAP = 0;  // o próprio OBS já limita os quadros da fonte de navegador
if (params.get('user')) cfg.username = params.get('user').replace(/^@/, '');
if (params.get('q')) cfg.quality = ULTRA ? 'low' : params.get('q');

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
  let pr = Math.min(window.devicePixelRatio || 1, 1920 / h, maxPr);
  if (OBS) pr = (ULTRA ? 640 : cfg.quality === 'high' ? 1920 : cfg.quality === 'medium' ? 1280 : 960) / h;  // desenha em 720p e o OBS amplia
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
  renderer.shadowMap.enabled = q === 'high' || (q === 'medium' && !OBS);
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  resize();
}

// ---------------- mundo ----------------
const hall = buildHall(scene, { quality: cfg.quality, lite: OBS && params.get('q') !== 'high' });
fx = new FX(scene);
const audio = new AudioEngine();
audio.setMusicVolume(params.get('musica') === '0' ? 0 : cfg.musicVolume);  // ?musica=0: sem música do jogo (toca a sua no PC), efeitos continuam
audio.setSfxVolume(cfg.sfxVolume);
audio.fileBpm = cfg.danceBpm || 150;

await loadChars();
await loadInstruments();
const groom = new Groom3D();
const bride = new Bride3D();
scene.add(groom.group, bride.group);
{ // sombra de contato dos noivos
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  for (const h of [groom, bride]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), mat); b.position.y = 0.022; h.group.add(b); }
}

const hud = new HUD(document.getElementById('hud'));
// sem figurinhas de presentes na tela (nada que peça presente)
const camDir = new CameraDirector(camera);
const crowd = new Crowd(scene, {
  fx, labelsEl: document.getElementById('labels'),
  sfx: (n) => audio.sfx(n),
  onFocus: (g, dur, kind) => camDir.focusOn(g, dur, kind),
  onCount: (n) => { hud.setCount(n); camDir.crowdCount = n; },
});
crowd.setLimit(ULTRA ? Math.min(cfg.limit, 30) : cfg.limit);
if (ULTRA) {
  // sem luzes coloridas, feixes, neblina e pontinhos do globo; uma luz geral mais forte no lugar
  crowd.lodAll = true;
  const off = [];
  scene.traverse((o) => {
    if ((o.isPointLight || o.isSpotLight) && o !== crowd.vipLight) off.push(o);
    else if (o.isMesh && o.material && (o.material.blending === THREE.AdditiveBlending || (o.material.transparent && o.geometry && o.geometry.parameters && o.geometry.parameters.width === 60))) off.push(o);
    else if (o.isInstancedMesh && o.geometry && o.geometry.type === 'CircleGeometry') off.push(o);
  });
  for (const o of off) o.visible = false;
  scene.add(new THREE.AmbientLight(0xd8b8ff, 1.1));
}
camDir.pickGuest = () => crowd.pickForCamera();
camDir.crowdRef = crowd;
crowd.extraObstacles = () => [groom.group.position, bride.group.position];
camDir.hallRef = hall;
camDir.obstacles = () => {
  const out = [];
  for (const g of crowd.list) out.push({ g, pos: g.pos, head: g.headPos(new THREE.Vector3()) });
  for (const h of [groom, bride]) out.push({ g: h, pos: h.group.position, head: h.headTop(new THREE.Vector3()) });
  return out;
};
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
// quem mandou presente de 30 moedas vira o noivo ou a noiva (nome e foto em cima)
const couple = { groom: null, bride: null };
function coupleHtml(role, who, fallback) {
  const pic = who && who.pic ? `<div class="pic" style="background-image:url('${encodeURI(who.pic).replace(/'/g, '%27')}')"></div>`
    : who ? `<div class="pic" style="background:#7cc244"><span>${escapeHtml((who.name || '?').charAt(0).toUpperCase())}</span></div>` : '';
  return `<div class="role">💍 ${role}</div>${pic}<div class="nm">${escapeHtml(who ? who.name : fallback)}</div>`;
}
function updateCoupleLabels() {
  coupleTags[0].el.innerHTML = coupleHtml('NOIVO', couple.groom, cfg.groomName || 'Noivo');
  coupleTags[1].el.innerHTML = coupleHtml('NOIVA', couple.bride, cfg.brideName || 'Noiva');
}
function becomeCouple(u) {
  const now = performance.now();
  let key = couple.groom && couple.groom.id === u.id ? 'groom' : couple.bride && couple.bride.id === u.id ? 'bride' : null;
  if (!key) {
    key = !couple.groom ? 'groom' : !couple.bride ? 'bride' : (couple.groom.t <= couple.bride.t ? 'groom' : 'bride');
    const old = couple[key];
    if (old) setTimeout(() => crowd.add({ id: old.id, name: old.name, pic: old.pic }), 1500); // o anterior volta para a festa
    const g = crowd.guests.get(u.id);
    if (g) crowd.remove(u.id); // sai da roda e assume o lugar no altar
  }
  couple[key] = { id: u.id, name: u.name || u.id, pic: u.pic, t: now };
  updateCoupleLabels();
  wedding.trigger('celebrate');
  setTimeout(() => wedding.trigger('kiss'), 3000);
  fx.confettiRain(new THREE.Vector3(0, 0, (FLOOR.z0 + FLOOR.z1) / 2), 9, 380);
  fx.firework(new THREE.Vector3(-4, 9, -2), [1, 0.85, 0.3]);
  fx.firework(new THREE.Vector3(4, 9.5, -2), [1, 0.5, 0.8]);
  audio.sfx('vip');
  crowd.react('clap');
  camDir.focusCouple(7);
}
updateCoupleLabels();
const _tv = new THREE.Vector3();
function placeCoupleLabels() {
  const pos = coupleTags.map(({ h }) => {
    h.headTop(_tv); _tv.y += 0.15;
    const d = _tv.distanceTo(camera.position);
    _tv.project(camera);
    return { x: (_tv.x * 0.5 + 0.5) * viewW, y: (-_tv.y * 0.5 + 0.5) * viewH, hide: _tv.z > 1, s: Math.max(0.75, Math.min(1.5, 16 / d)) };  // noivos: foto sempre grande
  });
  // se as plaquinhas dos noivos se encostarem (no beijo), afasta uma da outra
  const minGap = 95 * Math.max(pos[0].s, pos[1].s) * (viewH / 960);
  const dx = pos[1].x - pos[0].x;
  if (Math.abs(dx) < minGap && Math.abs(pos[1].y - pos[0].y) < 60) {
    const push = (minGap - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
    pos[0].x -= push; pos[1].x += push;
  }
  coupleTags.forEach(({ el }, i) => {
    const p = pos[i];
    if (p.hide) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%) scale(${p.s.toFixed(3)})`;
    el.style.zIndex = '2000';
  });
}

// ---------------- eventos da live ----------------
function handleEvent(e) {
  const u = e.user;
  if (!u || !u.id) return;
  if (game.onLog && e.type !== 'like') {
    const n = u.name || u.id;
    game.onLog(e.type === 'join' ? `${n} entrou` : e.type === 'chat' ? `${n}: ${e.comment || ''}` : e.type === 'gift' ? `${n} enviou ${e.giftName}${e.count > 1 ? ' x' + e.count : ''}` : e.type === 'follow' ? `${n} seguiu` : `${n} compartilhou`);
  }
  // REGRAS: só presentes contam.
  //   rosa (ou qualquer presente) -> entra na festa
  //   10 moedas (Tiny Dino)       -> vira músico da banda
  //   30 moedas (Rosquinha/Capivara) -> vira noivo ou noiva
  // comentário de quem já está na festa: balãozinho em cima da cabeça
  if (e.type === 'chat' && e.comment) {
    const txt = String(e.comment);
    if (!crowd.say(u.id, txt)) {
      const k = couple.groom && couple.groom.id === u.id ? 0 : couple.bride && couple.bride.id === u.id ? 1 : -1;
      if (k >= 0) showBubble(coupleTags[k].el, txt.length > 70 ? txt.slice(0, 68) + '…' : txt);
    }
    return;
  }
  if (e.type !== 'gift') return;
  // sem faixa "fulano enviou X": nada na tela associa presente a recompensa
  const action = resolveGift(cfg, e.giftName, e.diamonds, e.count);
  if (action === 'none') return;
  if (action === 'couple') { becomeCouple(u); return; }
  const isCouple = [couple.groom, couple.bride].some((c) => c && c.id === u.id);
  if (isCouple) { wedding.trigger(action === 'musician' ? 'kiss' : 'celebrate'); return; } // noivo/noiva mandando presente
  const known = crowd.guests.has(u.id);
  const g = crowd.add({ id: u.id, name: u.name || u.id, pic: u.pic });
  if (!g) return;
  if (!known) hud.toast(u, 'chegou na festa! 💚');
  if (action === 'musician') setTimeout(() => crowd.makeMusician(g), known ? 200 : 2500);
  else if (known && !g.band) crowd.act(g, 'special'); // mandou rosa de novo: dança especial
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
    else setTimeout(() => handleEvent({ type: 'gift', user: u, giftName: 'Rose', diamonds: 1, count: 1 }), i * 350);
  }
}
const BOT_NAMES = ['Tia Caveirinha', 'Vovô Múmia', 'Prima Assombrada', 'Dinda Morcega', 'Tio Ossinho', 'Vovó Abóbora', 'Primo Fantasma', 'Tia Lápide', 'Padrinho Coveiro', 'Prima Teia', 'Tio Lobisomem', 'Vovó Bruxa', 'Primo Zumbizinho', 'Tia Vampira', 'Tio Frankenstein', 'Prima Gosma', 'Vovô Esqueleto', 'Tia Corujona', 'Primo Uivo', 'Tia Névoa'];
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
  couple.groom = couple.bride = null; updateCoupleLabels();
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
hud.showFps(cfg.showFps || params.has('fps'));
if (params.has('fps')) Object.assign(hud.fpsEl.style, { fontSize: '90px', top: '40%', right: '5%', background: '#000', padding: '10px', zIndex: 9999 });
const gear = document.createElement('button');
gear.id = 'gear'; gear.textContent = '⚙'; gear.title = 'Painel (P)';
gear.onclick = () => panelEl.classList.toggle('hidden');
document.body.appendChild(gear);
const APP = IS_APP || params.has('menu');
if (APP || OBS) gear.style.display = 'none'; // no app o painel abre pelo ⚙ Menu; no OBS fica limpo
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
if (OBS && !SHOT) { setTimeout(start, 500); setInterval(() => { if (audio.ctx && audio.ctx.state !== 'running') audio.ctx.resume(); }, 2000); } // OBS libera o som sozinho
if (!SHOT && !APP && !OBS) {
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
let groupT = 90, chirpT = 4, randomT = 6, howlT = 25;
function partyLife(dt) {
  groupT -= dt;
  if (groupT <= 0) { groupT = 120 + Math.random() * 60; if (crowd.count > 3) crowd.groupDance(); }
  howlT -= dt;
  if (howlT <= 0) { howlT = 35 + Math.random() * 40; audio.sfx('howl'); }
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
  wedding.resolve(dt);
  crowd.update(dt, time, beat, camera, viewW, viewH);
  fx.update(dt);
  camDir.update(dt, time);
  placeCoupleLabels();
}
let _lastF = 0;
function frame(now) {
  if (FPS_CAP && now - _lastF < 1000 / FPS_CAP - 2) return;  // OBS: 30 quadros por segundo bastam
  _lastF = now;
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
  if (OBS || time < 12 || cfg.quality === 'low') return;
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
    if (gift && i === 10) { const g = crowd.list.find((x) => !x.bot) || crowd.list[0]; if (gift === 'musician') { for (const x of crowd.list.slice(0, 4)) crowd.makeMusician(x); } else if (gift === 'couple') becomeCouple({ id: g.id, name: g.name, pic: g.pic }); else crowd.act(g, gift); }
    if (params.has('focus') && i === Math.max(0, steps - 50)) { const L = crowd.list.filter((x) => x.state === 'placed'); const fq = params.get('focus'); const fg = fq.startsWith('band') ? L.filter((x) => x.band)[Number(fq.slice(4) || 0)] : L[Number(fq) % L.length]; if (fg) camDir.focusOn(fg, 30, 'tour'); }
    if (params.has('chat') && i === steps - 20) for (const g of crowd.list.slice(0, 6)) handleEvent({ type: 'chat', user: { id: g.id, name: g.name }, comment: 'Viva os noivos!! que festa 🔥' });
    if (params.has('arrive') && i === 4) handleEvent({ type: 'gift', user: testUser(), giftName: 'Rose', diamonds: 1, count: 1 });
    tick(0.05);
  }
  composer.render(); composer.render();
  window.__ready = true;
} else {
  renderer.setAnimationLoop(frame);
}
window.__dbg = { createChar, socketsFor, THREE }; window.__game = game; window.__scene = scene; window.__render = () => composer.render(); window.__cam = camDir; window.__wed = { groom, bride };
window.__tick = tick;

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
