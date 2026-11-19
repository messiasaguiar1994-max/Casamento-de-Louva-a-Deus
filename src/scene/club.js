// =============================================================
//  CENÁRIO: BALADA ZUMBI (igual à imagem de referência)
//  - Palco com degraus de neon ao fundo, arco do altar com
//    cortinas rasgadas, rosas, caveiras e a placa "Casamento de Zumbi"
//  - Pista de LED quadrada na frente, com coração partido neon
//  - Caixas de som gigantes, treliça com holofotes e globo espelhado
//  - Candelabros, grade de ossos com tecido roxo e rosas
//  - Janelas góticas verdes, lápides, lua verde com castelo, morcegos
//  - Escada lateral com pétalas: é por ela que os convidados chegam
//  - Placas "Envie Rosas" e "Participe e faça parte dessa festa!"
// =============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { merge, roseGeo } from '../mantis/geometry.js';
import urlZombot from '../assets/chars/zombot.glb?url';

// planta (o resto do jogo usa estes números)
export const STAGE = { x: 0, y: 1.3, z: -6.3, w: 8, d: 4.4 };      // palco dos noivos
export const FLOOR = { x0: -6, x1: 6, z0: -2.6, z1: 8.6 };          // pista de LED
export const ENTRY = new THREE.Vector3(-9.6, 0, 3.2);               // pé da escada de entrada
export const STAIR_TOP = new THREE.Vector3(-15, 3.2, 3.2);          // de onde os convidados aparecem
export const FLOOR_R = 10.5;   // compatibilidade
export const ALTAR_Z = STAGE.z;

const rnd = (a, b) => a + Math.random() * (b - a);
let seed = 11;
const srnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true, clamp = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const neon = (col, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: false });

// placa de madeira com letras neon
function woodSign(lines, { w = 1200, h = 900, font = 150, colors = ['#ff6ad5'], extra } = {}) {
  return canvasTex(w, h, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#5a3418'); grd.addColorStop(1, '#3a200e');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, (i / 6) * h, w, 4); }
    for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(30,15,5,${Math.random() * 0.4})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rnd(-8, 8), w * 0.7, y + rnd(-8, 8), w, y + rnd(-6, 6)); g.stroke(); }
    g.strokeStyle = '#2a1608'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26);
    for (const [x, y] of [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]]) { g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((t, i) => {
      const c = colors[i % colors.length];
      g.font = `900 ${font}px "Arial Black", Impact, sans-serif`;
      g.shadowColor = c; g.shadowBlur = 40; g.fillStyle = c;
      const y = h * (0.5 + (i - (n - 1) / 2) * (font * 1.05 / h));
      g.fillText(t, extra ? w * 0.4 : w / 2, y);
      g.shadowBlur = 12; g.fillStyle = '#fff6ff'; g.globalAlpha = 0.55; g.fillText(t, extra ? w * 0.4 : w / 2, y); g.globalAlpha = 1;
    });
    g.shadowBlur = 0;
    if (extra) extra(g, w, h);
  }, { clamp: true });
}

export function buildHall(scene, { quality = 'high' } = {}) {
  const hall = new THREE.Group(); scene.add(hall);
  const updaters = []; const hi = quality !== 'low'; seed = 11;

  // ---------------- céu, lua verde e castelo ----------------
  const skyTex = canvasTex(1024, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#08020f'); grd.addColorStop(0.5, '#1f0838'); grd.addColorStop(0.8, '#4a1660'); grd.addColorStop(1, '#5a1a6a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,230,255,${Math.random() * 0.8})`; g.fillRect(Math.random() * w, Math.random() * h * 0.6, 1.5, 1.5); }
  });
  hall.add(new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false, color: 0xbbbbbb })));
  const moonTex = canvasTex(512, 512, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, w * 0.2, w / 2, w / 2, w / 2);
    grd.addColorStop(0, '#f4ffb0'); grd.addColorStop(0.36, '#dcf07a'); grd.addColorStop(0.42, 'rgba(180,255,90,0.35)'); grd.addColorStop(1, 'rgba(120,255,60,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(150,170,70,0.35)'; for (const [x, y, r] of [[220, 210, 26], [300, 280, 18], [240, 300, 12], [290, 200, 10]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    // castelo na frente da lua
    g.fillStyle = '#12061a';
    const base = w * 0.78;
    g.fillRect(w * 0.42, base - 70, w * 0.3, 90);
    for (const [x, tw, th] of [[0.42, 28, 140], [0.5, 22, 190], [0.58, 34, 120], [0.66, 24, 165], [0.7, 30, 95]]) {
      g.fillRect(w * x, base - th, tw, th); g.beginPath(); g.moveTo(w * x - 6, base - th); g.lineTo(w * x + tw / 2, base - th - 45); g.lineTo(w * x + tw + 6, base - th); g.fill();
    }
    g.fillStyle = '#ffd36a'; for (let i = 0; i < 9; i++) g.fillRect(w * (0.44 + Math.random() * 0.26), base - 40 - Math.random() * 100, 6, 9);
    g.fillStyle = '#12061a'; g.beginPath(); g.ellipse(w * 0.55, base + 40, w * 0.4, 50, 0, 0, 7); g.fill();
  });
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, toneMapped: false, depthWrite: false }));
  moon.position.set(16, 17, -40); moon.scale.setScalar(24); hall.add(moon);

  // ---------------- chão e paredes góticas ----------------
  const stoneTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#231a2a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = `rgb(${40 + Math.random() * 20},${30 + Math.random() * 15},${48 + Math.random() * 20})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
  }, { repeat: [16, 16] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; hall.add(ground);
  const wallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2b1838'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { const ox = (y % 2) * 32; g.fillStyle = `rgb(${45 + Math.random() * 18},${28 + Math.random() * 10},${58 + Math.random() * 18})`; g.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 28); }
  }, { repeat: [6, 3] });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  // ruína gótica atrás do palco (com janelas verdes nos lados)
  const back = new THREE.Mesh(new THREE.BoxGeometry(34, 14, 0.8), wallMat); back.position.set(0, 7, -14); back.receiveShadow = true; hall.add(back);
  const winTex = canvasTex(256, 512, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, h * 0.6); grd.addColorStop(0, '#c8ff8a'); grd.addColorStop(1, '#2fae3a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#120818'; g.lineWidth = 12;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h * 0.45); g.lineTo(w, h * 0.45); g.moveTo(0, h * 0.75); g.lineTo(w, h * 0.75); g.stroke();
    g.beginPath(); g.arc(w / 2, h * 0.25, w * 0.3, 0, 7); g.stroke();
  }, { clamp: true });
  const winShape = new THREE.Shape(); winShape.moveTo(-1.3, 0); winShape.lineTo(1.3, 0); winShape.lineTo(1.3, 3.6); winShape.quadraticCurveTo(1.3, 5.6, 0, 6.4); winShape.quadraticCurveTo(-1.3, 5.6, -1.3, 3.6); winShape.lineTo(-1.3, 0);
  const winGeo = new THREE.ShapeGeometry(winShape, 12);
  { const uv = winGeo.attributes.uv, p = winGeo.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 1.3) / 2.6, p.getY(i) / 6.4); }
  const winMat = new THREE.MeshBasicMaterial({ map: winTex, toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3) });
  for (const x of [-12.5, -8.8, 8.8, 12.5]) {
    const wv = new THREE.Mesh(winGeo, winMat); wv.position.set(x, 3.2, -13.55); hall.add(wv);
    const fr = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3a2a44 })); fr.position.set(x, 7.0, -13.5); fr.scale.y = 1.6; hall.add(fr);
  }
  const winLight = new THREE.PointLight(0x6aff4a, 18, 18, 2); winLight.position.set(-10.5, 5, -11.5); scene.add(winLight);
  const winLight2 = winLight.clone(); winLight2.position.x = 10.5; scene.add(winLight2);

  // ---------------- palco com degraus neon ----------------
  const woodTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a2210'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.2})`; g.fillRect(0, i * 32, w, 3); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,55,25,${Math.random() * 0.5})`; g.fillRect(Math.random() * w, Math.random() * h, 30, 1); } }, { repeat: [3, 2] });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });
  const stage = new THREE.Mesh(new THREE.BoxGeometry(STAGE.w, STAGE.y, STAGE.d), woodMat);
  stage.position.set(STAGE.x, STAGE.y / 2, STAGE.z); stage.receiveShadow = true; stage.castShadow = true; hall.add(stage);
  const purpleNeon = neon(0xb44dff, 2.6);
  const stepN = 3, stepH = STAGE.y / stepN;
  for (let i = 0; i < stepN; i++) {
    const w = 4.6 - i * 0.2, dz = STAGE.z + STAGE.d / 2 + (stepN - i) * 0.45 - 0.22;
    const st = new THREE.Mesh(new THREE.BoxGeometry(w, stepH * (i + 1), 0.45), woodMat);
    st.position.set(0, stepH * (i + 1) / 2, dz); st.receiveShadow = true; hall.add(st);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.04), purpleNeon); strip.position.set(0, stepH * (i + 1) + 0.01, dz + 0.22); hall.add(strip);
  }
  const edge = new THREE.Mesh(new THREE.BoxGeometry(STAGE.w, 0.05, 0.05), purpleNeon); edge.position.set(0, STAGE.y + 0.02, STAGE.z + STAGE.d / 2); hall.add(edge);
  updaters.push((t, beat) => { const k = 2 + Math.pow(1 - (beat % 1), 3) * 1.5; purpleNeon.color.setRGB(0.7 * k, 0.3 * k, 1.0 * k); });

  // ---------------- arco do altar ----------------
  const arch = new THREE.Group(); arch.position.set(0, STAGE.y, STAGE.z - 1.4); hall.add(arch);
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x2e1a10, roughness: 0.8 });
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.4, 0.45), darkWood); p.position.set(s * 2.7, 2.7, 0); p.castShadow = true; arch.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.5, 0.5), darkWood); beam.position.set(0, 5.4, 0); arch.add(beam);
  // cortinas rasgadas (brancas/rosadas)
  const curtainGeo = (() => {
    const g = new THREE.PlaneGeometry(1.5, 4.8, 10, 12), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 9) * 0.08); if (y < -1.8) p.setY(i, y + Math.abs(Math.sin(x * 23)) * 0.5); p.setX(i, x * (1 - (y + 2.4) / 4.8 * 0.35)); }
    g.computeVertexNormals(); return g;
  })();
  const curtainTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#f2dde6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(120,60,90,${Math.random() * 0.25})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 14, 0, 7); g.fill(); } for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(160,110,140,0.3)'; g.fillRect(i * 22, 0, 6, h); } });
  const curtainMat = new THREE.MeshStandardMaterial({ map: curtainTex, side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 0.95 });
  const curtains = [];
  for (const s of [1, -1]) { const c = new THREE.Mesh(curtainGeo, curtainMat); c.position.set(s * 2.25, 2.85, 0.35); c.rotation.y = -s * 0.25; arch.add(c); curtains.push(c); }
  updaters.push((t) => { curtains.forEach((c, i) => { c.rotation.z = Math.sin(t * 0.8 + i) * 0.03; }); });
  // fundo roxo atrás do arco
  const drape = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5), new THREE.MeshStandardMaterial({ color: 0x5a1a6a, roughness: 0.9, side: THREE.DoubleSide }));
  drape.position.set(0, 2.6, -0.3); arch.add(drape);
  // rosas e caveiras no arco
  const roseMat = new THREE.MeshPhysicalMaterial({ color: 0xc8102e, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0xff6080) });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f4a1a, roughness: 0.7 });
  function roseCluster(parent, pts, size = 0.18) {
    const rg = roseGeo(size, 1), m = new THREE.InstancedMesh(rg, roseMat, pts.length);
    const lg = new THREE.SphereGeometry(size, 6, 4); lg.scale(0.5, 0.08, 1.1);
    const lm = new THREE.InstancedMesh(lg, leafMat, pts.length);
    const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    pts.forEach((p, i) => {
      q.setFromEuler(e.set(1.2 + srnd(-0.4, 0.4), srnd(-0.6, 0.6), srnd(-0.5, 0.5)));
      m.setMatrixAt(i, mx.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(srnd(0.8, 1.3))));
      q.setFromEuler(e.set(srnd(-1, 1), srnd(0, 6), srnd(-1, 1)));
      lm.setMatrixAt(i, mx.compose(p.clone().add(new THREE.Vector3(srnd(-0.15, 0.15), -0.08, srnd(-0.1, 0.05))), q, new THREE.Vector3(1, 1, 1)));
    });
    m.castShadow = true; parent.add(m, lm); return m;
  }
  const archRoses = [];
  for (let i = 0; i < 46; i++) archRoses.push(new THREE.Vector3(srnd(-3.0, 3.0), 5.4 + srnd(-0.3, 0.45), srnd(0.1, 0.45)));
  for (const s of [1, -1]) for (let i = 0; i < 18; i++) archRoses.push(new THREE.Vector3(s * (2.7 + srnd(-0.3, 0.3)), srnd(0.4, 5.2), srnd(0.15, 0.4)));
  roseCluster(arch, archRoses, 0.17);
  const skullGeo = (() => {
    const head = new THREE.SphereGeometry(0.22, 18, 14); const p = head.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.05) p.setXYZ(i, p.getX(i) * 0.82, y * 1.1, p.getZ(i) * 0.9); }
    head.computeVertexNormals();
    const jaw = new THREE.BoxGeometry(0.24, 0.1, 0.18).translate(0, -0.24, 0.04);
    return merge([head, jaw]);
  })();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x110a10 });
  function skull(parent, x, y, z, s = 1, ry = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.y = ry;
    const m = new THREE.Mesh(skullGeo, boneMat); m.castShadow = true; g.add(m);
    for (const e of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), eyeMat); ey.scale.z = 0.4; ey.position.set(e * 0.08, -0.02, 0.19); g.add(ey); }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 3), eyeMat); nose.position.set(0, -0.1, 0.2); nose.rotation.x = Math.PI; g.add(nose);
    parent.add(g); return g;
  }
  skull(arch, -1.9, 5.85, 0.3, 1.1); skull(arch, 1.9, 5.85, 0.3, 1.1); skull(arch, -2.7, 5.9, 0.3, 0.9); skull(arch, 2.7, 5.9, 0.3, 0.9);
  // placa "Casamento de Zumbi"
  const titleTex = canvasTex(1400, 820, (g, w, h) => {
    g.fillStyle = '#3a200e';
    g.beginPath(); g.moveTo(80, 60); g.quadraticCurveTo(w / 2, -20, w - 80, 60); g.lineTo(w - 40, h - 120); g.quadraticCurveTo(w / 2, h - 40, 40, h - 120); g.closePath(); g.fill();
    g.strokeStyle = '#1e0f05'; g.lineWidth = 30; g.stroke();
    for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(20,10,3,${Math.random() * 0.4})`; g.beginPath(); const y = 80 + Math.random() * (h - 220); g.moveTo(60, y); g.bezierCurveTo(w * 0.3, y + rnd(-6, 6), w * 0.7, y + rnd(-6, 6), w - 60, y); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 170px "Arial Black", Impact, sans-serif';
    g.lineWidth = 16; g.strokeStyle = '#4a2a5a'; g.strokeText('Casamento', w / 2, 210);
    g.fillStyle = '#ffe9ff'; g.shadowColor = '#ff6ad5'; g.shadowBlur = 30; g.fillText('Casamento', w / 2, 210); g.shadowBlur = 0;
    g.font = '900 110px "Arial Black", Impact, sans-serif'; g.fillStyle = '#ffe9ff'; g.fillText('de', w / 2, 345);
    g.font = '900 250px Impact, "Arial Black", sans-serif';
    g.lineWidth = 22; g.strokeStyle = '#0b2a06'; g.strokeText('ZUMBI', w / 2, 525);
    const gr = g.createLinearGradient(0, 420, 0, 640); gr.addColorStop(0, '#e6ff8a'); gr.addColorStop(0.6, '#6ae024'); gr.addColorStop(1, '#2f8a10');
    g.fillStyle = gr; g.shadowColor = '#7dff3a'; g.shadowBlur = 40; g.fillText('ZUMBI', w / 2, 525); g.shadowBlur = 0;
    g.fillStyle = '#6ae024';
    for (let i = 0; i < 18; i++) { const x = w * 0.3 + Math.random() * w * 0.4, y = 610, l = 20 + Math.random() * 60; g.fillRect(x, y, 12, l); g.beginPath(); g.arc(x + 6, y + l, 9, 0, 7); g.fill(); }
  }, { clamp: true });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.7), new THREE.MeshStandardMaterial({ map: titleTex, transparent: true, emissive: 0xffffff, emissiveMap: titleTex, emissiveIntensity: 0.45, roughness: 0.8, side: THREE.DoubleSide }));
  title.position.set(0, 6.45, 0.55); arch.add(title);
  updaters.push((t) => { title.material.emissiveIntensity = 0.42 + Math.sin(t * 3) * 0.06; title.rotation.z = Math.sin(t * 0.7) * 0.012; });

  // ---------------- caixas de som gigantes ----------------
  const spkTex = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#14101a'; g.fillRect(0, 0, w, h);
    const cone = (y, r) => { const grd = g.createRadialGradient(w / 2, y, 2, w / 2, y, r); grd.addColorStop(0, '#5a4a6a'); grd.addColorStop(0.25, '#0a0810'); grd.addColorStop(0.85, '#2a2236'); grd.addColorStop(1, '#b44dff'); g.fillStyle = grd; g.beginPath(); g.arc(w / 2, y, r, 0, 7); g.fill(); };
    cone(h * 0.24, 80); cone(h * 0.68, 110);
  }, { clamp: true });
  const speakers = [];
  for (const s of [1, -1]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.6, 1.3), [darkWood, darkWood, darkWood, darkWood, new THREE.MeshStandardMaterial({ map: spkTex, roughness: 0.6, emissive: 0x6a2a9a, emissiveIntensity: 0.15 }), darkWood]);
    box.position.set(s * 4.9, 1.8, STAGE.z - 0.6); box.castShadow = true; hall.add(box); speakers.push(box);
  }
  updaters.push((t, beat) => { const k = 1 + Math.pow(1 - (beat % 1), 6) * 0.025; for (const b of speakers) b.scale.set(k, 1, k); });

  // ---------------- treliça, holofotes e globo espelhado ----------------
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x2a2a32, metalness: 0.8, roughness: 0.4 });
  const truss = (len) => { const parts = []; for (const [y, z] of [[0, 0], [0.4, 0], [0, 0.4], [0.4, 0.4]]) parts.push(new THREE.CylinderGeometry(0.035, 0.035, len, 6).rotateZ(Math.PI / 2).translate(0, y, z)); for (let i = 0; i < len / 0.5; i++) parts.push(new THREE.CylinderGeometry(0.02, 0.02, 0.57, 4).rotateX(Math.PI / 4).translate(-len / 2 + i * 0.5, 0.2, 0.2)); return merge(parts); };
  const tA = new THREE.Mesh(truss(16), trussMat); tA.position.set(0, 9.2, -3.5); hall.add(tA);
  const tB = new THREE.Mesh(truss(16), trussMat); tB.position.set(0, 9.2, 3); hall.add(tB);
  const frontRig = [tB];   // escondido na vista aérea (não fica cruzando a tela)
  for (const s of [1, -1]) for (const z of [-3.5, 3]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9.2, 0.4), trussMat); leg.position.set(s * 8, 4.6, z + 0.2); hall.add(leg); if (z > 0) frontRig.push(leg); }
  // globo
  const ballTex = canvasTex(256, 128, (g, w, h) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) { const v = 120 + Math.random() * 135; g.fillStyle = `rgb(${v},${v * 0.9},${v})`; g.fillRect(x * 8, y * 8, 7, 7); } });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 20), new THREE.MeshStandardMaterial({ map: ballTex, metalness: 1, roughness: 0.15, emissive: 0x6a2a9a, emissiveMap: ballTex, emissiveIntensity: 0.5 }));
  ball.position.set(-4.2, 8.5, 3.2); hall.add(ball);
  const ballWire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1), trussMat); ballWire.position.set(-4.2, 9.3, 3.2); hall.add(ballWire); frontRig.push(ball, ballWire);
  // pontinhos de luz do globo girando pelo cenário
  const dotsN = hi ? 90 : 45;
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.09, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 2.4), toneMapped: false, transparent: true, opacity: 0.8, depthWrite: false }), dotsN);
  const dotDirs = []; for (let i = 0; i < dotsN; i++) dotDirs.push(new THREE.Vector3(srnd(-1, 1), srnd(-1.6, -0.3), srnd(-1, 1)).normalize());
  hall.add(dots); frontRig.push(dots);
  updaters.push((t) => {
    ball.rotation.y = t * 0.6;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t * 0.6);
    for (let i = 0; i < dotsN; i++) {
      const d = dotDirs[i].clone().applyQuaternion(rot);
      // projeta no chão (y=0.02) ou numa "parede" distante
      const k = d.y < -0.15 ? (8.5 - 0.03) / -d.y : 14;
      const p = new THREE.Vector3(-4.2, 8.5, 3.2).addScaledVector(d, k);
      if (d.y < -0.15) { q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); p.y = 0.03; } else q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.clone().negate());
      dots.setMatrixAt(i, m.compose(p, q, d.y < -0.15 ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(0, 0, 0)));  // só os pontinhos que caem no chão
    }
    dots.instanceMatrix.needsUpdate = true;
  });
  // holofotes (latas na treliça) com feixes coloridos
  const beamMat = (col) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(col) }, uI: { value: 0.3 } },
    vertexShader: 'varying float vY; varying float vD; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uI; varying float vY; varying float vD; void main(){ gl_FragColor = vec4(uColor * uI * pow(vY, 1.5) * smoothstep(3.0, 11.0, vD), 1.0); }' });
  const spots = [];
  const spotDefs = [[-6, -3.5, 0xb44dff], [-2.5, -3.5, 0x7dff3a], [2.5, -3.5, 0xb44dff], [6, -3.5, 0x7dff3a], [-5, 3, 0xff4de0], [5, 3, 0xb44dff]];
  spotDefs.forEach(([x, z, col], i) => {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.55, 12), trussMat); can.position.set(x, 8.85, z + 0.2); hall.add(can);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), neon(col, 3)); lens.position.set(x, 8.57, z + 0.2); lens.rotation.x = Math.PI / 2; hall.add(lens);
    const sl = (i < 4 || hi) ? new THREE.SpotLight(col, 38, 30, 0.26, 0.5, 1.6) : null;
    if (sl) { sl.position.set(x, 8.6, z + 0.2); scene.add(sl, sl.target); }
    const cg = new THREE.ConeGeometry(1.9, 10, 20, 1, true); cg.translate(0, -5, 0);
    const bm = new THREE.Mesh(cg, beamMat(col)); bm.position.set(x, 8.6, z + 0.2); scene.add(bm);
    spots.push({ sl, bm, can, i, x, z });
    if (z > 0) frontRig.push(can, lens, bm);
  });
  const down = new THREE.Vector3(0, -1, 0), tv = new THREE.Vector3();
  updaters.push((t, beat) => {
    for (const s of spots) {
      const a = t * (0.5 + s.i * 0.07) + s.i;
      const target = new THREE.Vector3(Math.sin(a) * 4.5, 0, 2.5 + Math.cos(a * 0.8) * 4 + (s.i < 4 ? -2 : 1));
      if (s.sl) s.sl.target.position.copy(target);
      tv.copy(target).sub(s.bm.position).normalize();
      s.bm.quaternion.setFromUnitVectors(down, tv); s.can.quaternion.copy(s.bm.quaternion);
      s.bm.material.uniforms.uI.value = 0.09 + Math.pow(1 - (beat % 1), 3) * 0.08;
    }
  });

  // ---------------- pista de LED quadrada com coração partido ----------------
  const fw = FLOOR.x1 - FLOOR.x0, fd = FLOOR.z1 - FLOOR.z0;
  const fu = { uTime: { value: 0 }, uBeat: { value: 0 }, uPower: { value: 1 } };
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x120818, roughness: 0.55, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.4 })  // sem brilho estourado nos closes;
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, fu);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; uniform float uTime; uniform float uBeat; uniform float uPower;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float heart(vec2 p){ p.y -= 0.25; p.x = abs(p.x); float a = atan(p.x, p.y) / 3.14159; float r = length(p); float hh = abs(a); float d = (13.0*hh - 22.0*hh*hh + 10.0*hh*hh*hh) / (6.0 - 5.0*hh); return r - d * 0.55; }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec2 q = vWP.xz; vec2 cell = floor(q / 1.4);
        vec2 f = fract(q / 1.4);
        float edge = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x) * smoothstep(0.0, 0.05, f.y) * smoothstep(1.0, 0.95, f.y);
        float hsh = h21(cell);
        float wave = 0.5 + 0.5 * sin(uTime * 2.0 + hsh * 6.28 + cell.y * 0.7);
        float flash = pow(fract(-uBeat), 3.0) * step(0.75, h21(cell + floor(uBeat)));
        vec3 col = mix(vec3(0.55, 0.15, 1.0), vec3(0.15, 0.45, 1.0), hsh);
        float lum = (0.12 + wave * 0.45 + flash * 1.2) * edge;
        vec2 hp = (vWP.xz - vec2(0.0, ${((FLOOR.z0 + FLOOR.z1) / 2 + 0.6).toFixed(2)})) / 2.1; hp.y = -hp.y;
        float hd = heart(hp);
        float line = smoothstep(0.06, 0.0, abs(hd));
        float crack = smoothstep(0.05, 0.0, abs(hp.x - 0.12 * sin(hp.y * 9.0)));
        line *= 1.0 - crack * step(hd, 0.0) * 0.0;
        line = max(line, crack * step(hd, 0.02) * 0.8);
        totalEmissiveRadiance += col * lum * uPower + vec3(1.0, 0.3, 0.85) * line * (2.0 + sin(uTime * 4.0) * 0.6);
      }`);
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set((FLOOR.x0 + FLOOR.x1) / 2, 0.015, (FLOOR.z0 + FLOOR.z1) / 2); floor.receiveShadow = true; hall.add(floor);
  const borderMat = neon(0xff4de0, 2.4);
  for (const [w, d, x, z] of [[fw, 0.08, (FLOOR.x0 + FLOOR.x1) / 2, FLOOR.z0], [fw, 0.08, (FLOOR.x0 + FLOOR.x1) / 2, FLOOR.z1], [0.08, fd, FLOOR.x0, (FLOOR.z0 + FLOOR.z1) / 2], [0.08, fd, FLOOR.x1, (FLOOR.z0 + FLOOR.z1) / 2]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), borderMat); b.position.set(x, 0.04, z); hall.add(b);
  }
  updaters.push((t, beat) => { fu.uTime.value = t; fu.uBeat.value = beat; });

  // ---------------- candelabros ----------------
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a540, metalness: 1, roughness: 0.3 });
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xf4ead2, roughness: 0.7 });
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.1, 0.8), toneMapped: false });
  const flames = [];
  function candelabra(x, y, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.12, 16), gold));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 10), gold); stem.position.y = 0.6; g.add(stem);
    const arms = [[-0.45, 1.2], [-0.25, 1.35], [0, 1.5], [0.25, 1.35], [0.45, 1.2]];
    for (const [ax, ay] of arms) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Math.hypot(ax, ay - 1.1) + 0.01, 6), gold);
      arm.position.set(ax / 2, (ay + 1.1) / 2, 0); arm.rotation.z = -Math.atan2(ax, ay - 1.1); g.add(arm);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.06, 10), gold); cup.position.set(ax, ay, 0); g.add(cup);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 10), candleMat); c.position.set(ax, ay + 0.22, 0); g.add(c);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), flameMat); f.scale.y = 1.8; f.position.set(ax, ay + 0.5, 0); g.add(f); flames.push(f);
    }
    hall.add(g);
  }
  candelabra(-3.6, STAGE.y, STAGE.z - STAGE.d / 2 + 0.4, 1.0); candelabra(3.6, STAGE.y, STAGE.z - STAGE.d / 2 + 0.4, 1.0);  // cantos de trás do palco (não tampam a banda)
  candelabra(-7.2, 0, -1.6, 1.3); candelabra(7.2, 0, -1.6, 1.3);
  const candleLight = new THREE.PointLight(0xffb060, 18, 14, 2); candleLight.position.set(0, STAGE.y + 2.5, STAGE.z + 1.5); scene.add(candleLight);
  updaters.push((t) => { flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 17 + i) * 0.12, 1.8 + Math.sin(t * 23 + i * 2) * 0.3, 1); }); candleLight.intensity = 16 + Math.sin(t * 13) * 2; });
  // velinhas soltas no palco
  for (let i = 0; i < 10; i++) { const x = srnd(-3.6, 3.6); if (Math.abs(x) < 1.6) continue; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, srnd(0.15, 0.35), 8), candleMat); c.position.set(x, STAGE.y + 0.1, STAGE.z + srnd(-1.6, 1.8)); hall.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), flameMat); f.position.set(c.position.x, c.position.y + 0.2, c.position.z); hall.add(f); flames.push(f); }

  // ---------------- grade de ossos e caveiras com tecido roxo e rosas ----------------
  const fabric = new THREE.MeshStandardMaterial({ color: 0xc89ad8, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const boneGeo = merge([new THREE.CylinderGeometry(0.09, 0.09, 1.4, 10).translate(0, 0.7, 0),
    new THREE.SphereGeometry(0.14, 10, 8).translate(0.08, 0.02, 0), new THREE.SphereGeometry(0.14, 10, 8).translate(-0.08, 0.02, 0),
    new THREE.SphereGeometry(0.14, 10, 8).translate(0.08, 1.4, 0), new THREE.SphereGeometry(0.14, 10, 8).translate(-0.08, 1.4, 0)]);
  const rail = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.8 });
  const posts = [];
  for (const s of [1, -1]) {
    const x = s * (FLOOR.x1 + 1.1);
    const zs = [];
    for (let i = 0; i < 5; i++) zs.push(FLOOR.z0 + 0.8 + i * ((fd - 1.6) / 4));
    // do lado esquerdo fica uma abertura: é por ali que os convidados entram
    const side = s < 0 ? zs.filter((z) => Math.abs(z - ENTRY.z) > 1.5) : zs;
    side.forEach((z) => posts.push(new THREE.Vector3(x, 0, z)));
    for (let i = 0; i < side.length - 1; i++) {
      const za = side[i], zb = side[i + 1], len = zb - za;
      if (len > 3) continue;
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, len), rail); r.position.set(x, 1.55, (za + zb) / 2); hall.add(r);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.6, -len / 2), new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0, 1.6, len / 2));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.12, 6), fabric); m.scale.x = 0.4;
      m.position.set(x, 0, (za + zb) / 2); hall.add(m);
    }
  }
  for (const p of posts) {
    const b = new THREE.Mesh(boneGeo, boneMat); b.position.copy(p); b.castShadow = true; hall.add(b);
    skull(hall, p.x, 1.82, p.z, 1.15, p.x > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  roseCluster(hall, posts.map((p) => new THREE.Vector3(p.x, 2.15, p.z + 0.1)), 0.24);

  // ---------------- lápides e cruzes ao fundo ----------------
  const graveMat = new THREE.MeshStandardMaterial({ color: 0x4e4a58, roughness: 0.95 });
  const slab = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.9); s.absarc(0, 0.9, 0.5, 0, Math.PI, false); s.lineTo(-0.5, 0); const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }); g.translate(0, 0, -0.09); return g; })();
  const crossG = merge([new THREE.BoxGeometry(0.18, 1.5, 0.16).translate(0, 0.75, 0), new THREE.BoxGeometry(0.75, 0.16, 0.16).translate(0, 1.05, 0)]);
  const graves = [];
  for (let i = 0; i < 40; i++) {
    const x = srnd(-17, 17), z = srnd(-12.5, 9);
    if (x > -9.5 && x < 9.5 && z > -10) continue;
    if (x < -8 && z > 0 && z < 6) continue; // escada de entrada
    graves.push([x, z, srnd(0, 3) | 0]);
  }
  [slab, crossG, slab].forEach((geo, k) => {
    const list = graves.filter((g) => g[2] === k); if (!list.length) return;
    const m = new THREE.InstancedMesh(geo, graveMat, list.length), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([x, z], i) => { q.setFromEuler(e.set(srnd(-0.15, 0.15), srnd(-0.6, 0.6), srnd(-0.15, 0.15))); m.setMatrixAt(i, mx.compose(new THREE.Vector3(x, -0.05, z), q, new THREE.Vector3(1, 1, 1).multiplyScalar(srnd(0.9, 1.4)))); });
    m.castShadow = true; hall.add(m);
  });

  // ---------------- escada lateral de entrada com pétalas ----------------
  const stairs = new THREE.Group(); hall.add(stairs);
  const nSt = 9;
  for (let i = 0; i < nSt; i++) {
    const h = (STAIR_TOP.y / nSt) * (nSt - i);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.62, h, 2.4), woodMat);
    st.position.set(STAIR_TOP.x + 0.31 + i * 0.6, h / 2, ENTRY.z); st.receiveShadow = true; st.castShadow = true; stairs.add(st);
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.4), purpleNeon); n.position.set(STAIR_TOP.x + 0.61 + i * 0.6, h + 0.01, ENTRY.z); stairs.add(n);
  }
  for (const s of [1, -1]) {
    const len = Math.hypot(nSt * 0.6, STAIR_TOP.y);
    const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.12), purpleNeon);
    r.position.set(STAIR_TOP.x + nSt * 0.3, STAIR_TOP.y / 2 + 1.0, ENTRY.z + s * 1.25); r.rotation.z = -Math.atan2(STAIR_TOP.y, nSt * 0.6); stairs.add(r);
  }
  {
    const petal = new THREE.CircleGeometry(0.07, 6); petal.rotateX(-Math.PI / 2); petal.scale(1, 1, 0.6);
    const N = 160, pm = new THREE.InstancedMesh(petal, new THREE.MeshStandardMaterial({ color: 0xb0102a, side: THREE.DoubleSide, roughness: 0.6 }), N);
    const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      const u = Math.random(), x = STAIR_TOP.x + 0.31 + u * nSt * 0.6, step = Math.min(nSt - 1, Math.floor(u * nSt)), y = (STAIR_TOP.y / nSt) * (nSt - step) + 0.02;
      q.setFromEuler(e.set(0, rnd(0, 6), 0));
      pm.setMatrixAt(i, mx.compose(new THREE.Vector3(x, y, ENTRY.z + rnd(-1.0, 1.0)), q, new THREE.Vector3(1, 1, 1)));
    }
    hall.add(pm);
  }
  // portal brilhante no topo da escada (de onde surgem)
  const portalMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.5, 2.2), toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 10, 40), portalMat); portal.position.set(STAIR_TOP.x - 0.2, STAIR_TOP.y + 1.3, ENTRY.z); portal.rotation.y = Math.PI / 2; hall.add(portal);
  const portalIn = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ color: 0x2a0838, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  portalIn.position.copy(portal.position); portalIn.rotation.y = Math.PI / 2; hall.add(portalIn);
  updaters.push((t) => { portal.rotation.x = t * 0.8; const k = 1 + Math.sin(t * 3) * 0.04; portal.scale.set(k, k, k); });

  // ---------------- placas "Envie Rosas" e "Participe..." ----------------
  const leftTex = woodSign(['Envie', 'Rosas'], { font: 210, colors: ['#ff8ae6'], extra: (g, w, h) => {
    // rosa neon + seta
    g.save(); g.translate(w * 0.8, h * 0.4); g.shadowColor = '#ff2d6a'; g.shadowBlur = 30;
    g.strokeStyle = '#ff4d7a'; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(-10, -6, 38, 0.5, 5.5); g.stroke(); g.beginPath(); g.arc(10, 4, 20, 2.5, 7); g.stroke();
    g.strokeStyle = '#4dff6a'; g.shadowColor = '#4dff6a'; g.beginPath(); g.moveTo(0, 70); g.lineTo(0, 260); g.stroke();
    g.beginPath(); g.moveTo(0, 160); g.quadraticCurveTo(-60, 130, -70, 190); g.quadraticCurveTo(-30, 200, 0, 170); g.stroke(); g.restore();
    g.save(); g.translate(w * 0.4, h * 0.88); g.strokeStyle = '#c86aff'; g.shadowColor = '#c86aff'; g.shadowBlur = 25; g.lineWidth = 14;
    g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 20); g.moveTo(-40, -15); g.lineTo(0, 25); g.lineTo(40, -15); g.stroke(); g.restore();
  } });
  const rightTex = woodSign(['Participe', 'e faça', 'parte dessa', 'festa! ♥'], { font: 130, colors: ['#ff8ae6', '#ff8ae6', '#c6ff6a', '#c6ff6a'] });
  const signMat = (tx) => new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.5, roughness: 0.8 });
  const signs = [];
  for (const [x, z, tx, ry] of [[-9.0, -3.2, leftTex, 0.5], [9.0, -3.2, rightTex, -0.5]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
    for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.4, 0.22), darkWood); p.position.set(s * 1.7, 2.2, -0.05); g.add(p); }
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.85, 0.12), [darkWood, darkWood, darkWood, darkWood, signMat(tx), darkWood]);
    board.position.y = 3.45; g.add(board);
    skull(g, -1.7, 5.05, 0.05, 1); skull(g, 1.7, 5.05, 0.05, 1);
    roseCluster(g, [new THREE.Vector3(-1.4, 4.95, 0.1), new THREE.Vector3(1.4, 4.95, 0.1), new THREE.Vector3(-1.1, 4.9, 0.12), new THREE.Vector3(1.15, 4.9, 0.12)], 0.2);
    hall.add(g); signs.push(board);
  }
  updaters.push((t) => { signs.forEach((b, i) => { b.material[4].emissiveIntensity = 0.45 + Math.sin(t * 2.5 + i * 2) * 0.12; }); });

  // ---------------- neblina roxa, morcegos ----------------
  {
    const fogTex = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 60; const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(210,160,255,0.28)'); grd.addColorStop(1, 'rgba(210,160,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, w, h); } });
    const layers = [];
    for (let i = 0; i < 2; i++) {
      const t = fogTex.clone(); t.needsUpdate = true; t.repeat.set(3, 3);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.35, depthWrite: false, color: 0xb070e0 }));
      f.rotation.x = -Math.PI / 2; f.position.set(0, 0.3 + i * 0.3, -6); f.renderOrder = 2; hall.add(f); layers.push({ t, sp: 0.005 + i * 0.004 });
    }
    // neblina só fora da pista (a pista de LED fica limpa): um disco escuro recorta? -> neblina mais fraca na frente
    updaters.push((time) => { for (const L of layers) { L.t.offset.x = time * L.sp; L.t.offset.y = time * L.sp * 0.6; } });
    const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.quadraticCurveTo(0.35, 0.25, 0.75, 0.05); wing.lineTo(0.6, -0.05); wing.lineTo(0.5, 0.02); wing.lineTo(0.35, -0.08); wing.lineTo(0.2, 0); wing.lineTo(0, -0.06);
    const wg = new THREE.ShapeGeometry(wing), bmat = new THREE.MeshBasicMaterial({ color: 0x08040c, side: THREE.DoubleSide });
    const bats = [];
    for (let i = 0; i < 10; i++) { const b = new THREE.Group(); const L = new THREE.Mesh(wg, bmat), R = new THREE.Mesh(wg, bmat); R.scale.x = -1; b.add(L, R); b.scale.setScalar(rnd(1, 1.8)); hall.add(b); bats.push({ b, L, R, r: rnd(6, 16), h: rnd(10, 15), sp: rnd(0.2, 0.4) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, 6) }); }
    updaters.push((t) => { for (const o of bats) { const a = t * o.sp + o.ph; o.b.position.set(10 + Math.cos(a) * o.r * 0.6, o.h + Math.sin(t * 1.3 + o.ph), -25 + Math.sin(a) * o.r * 0.4); o.b.rotation.y = -a; const fl = Math.sin(t * 18 + o.ph) * 0.9; o.L.rotation.y = fl; o.R.rotation.y = -fl; } });
  }

  // ---------------- Zombot de enfeite (atrás, à direita, perto da lua) ----------------
  new GLTFLoader().load(urlZombot, (g) => {
    const z = g.scene; const box = new THREE.Box3().setFromObject(z), size = box.getSize(new THREE.Vector3());
    const s = 6 / size.y; z.scale.setScalar(s);
    z.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
    const holder = new THREE.Group(); holder.add(z); holder.position.set(13.5, 0, -10.5); holder.rotation.y = -0.6; hall.add(holder);
    z.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    const eye = new THREE.PointLight(0xff3020, 8, 10, 2); eye.position.set(12.5, 4.8, -8.5); hall.add(eye);
    updaters.push((t) => { holder.position.y = Math.sin(t * 1.2) * 0.1; eye.intensity = 6 + Math.sin(t * 4) * 3; });
  });

  // ---------------- luzes gerais ----------------
  scene.add(new THREE.HemisphereLight(0xb080e0, 0x1a0a24, 0.75));
  const key = new THREE.DirectionalLight(0xe0c8ff, 1.5); key.position.set(4, 14, 10); key.target.position.set(0, 0, -2);
  key.castShadow = true; key.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
  const sc = key.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 2; sc.far = 40; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const greenRim = new THREE.DirectionalLight(0x7dff3a, 0.9); greenRim.position.set(10, 6, -12); scene.add(greenRim);
  const front = new THREE.PointLight(0xff8ae6, 14, 26, 2); front.position.set(0, 5, 10); scene.add(front);
  scene.fog = new THREE.Fog(0x1a0828, 28, 75);
  scene.background = new THREE.Color(0x0c0414);

  return { group: hall, keyLight: key, setAerial(v) { for (const o of frontRig) o.visible = !v; }, setDancePower(v) { fu.uPower.value = v; }, update(t, beat) { for (const u of updaters) u(t, beat); } };
}
