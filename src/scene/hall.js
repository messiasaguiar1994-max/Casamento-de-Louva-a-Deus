// =============================================================
//  SALÃO DO CASAMENTO
//  Pista de dança circular de LED, altar, arco de flores, tapete
//  vermelho, mesas e cadeiras, lustres, arranjos, balões, luzes
//  coloridas, cortinas, varal de luzinhas e a placa do casamento.
// =============================================================
import * as THREE from 'three';
import { merge, paint, roseGeo } from '../mantis/geometry.js';

export const FLOOR_R = 10.5;      // raio da pista de dança
export const ALTAR_Z = -21;       // posição do altar (fundo)
export const ENTRY = new THREE.Vector3(0, 0, -18.6); // onde os convidados surgem (sob o arco)

const rnd = (a, b) => a + Math.random() * (b - a);

function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildHall(scene, { quality = 'high' } = {}) {
  const hall = new THREE.Group();
  scene.add(hall);
  const updaters = [];
  const hi = quality !== 'low';

  // ---------------------------------------------------------------
  // Chão de mármore
  const marble = canvasTex(1024, 1024, (g, w, h) => {
    const n = 4, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const light = (x + y) % 2 === 0;
      g.fillStyle = light ? '#efe6dc' : '#d9c9b8';
      g.fillRect(x * s, y * s, s, s);
    }
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(150,130,120,${rnd(0.05, 0.18)})`;
      g.lineWidth = rnd(0.6, 2.2);
      g.beginPath();
      let px = rnd(0, w), py = rnd(0, h);
      g.moveTo(px, py);
      for (let k = 0; k < 7; k++) { px += rnd(-80, 80); py += rnd(-80, 80); g.lineTo(px, py); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(190,150,80,0.6)'; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, { repeat: [7, 7] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshPhysicalMaterial({ map: marble, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.15 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  hall.add(floor);

  // ---------------------------------------------------------------
  // Pista de dança circular de LED (shader com ondas de cor)
  const danceUniforms = { uTime: { value: 0 }, uBeat: { value: 0 }, uPower: { value: 1 } };
  const danceMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1024, roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  danceMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, danceUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP; uniform float uTime; uniform float uBeat; uniform float uPower;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        vec3 pal(float t){ return 0.5 + 0.5*cos(6.2831*(t + vec3(0.0,0.33,0.67))); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float r = length(vWP.xz);
          float a = atan(vWP.z, vWP.x);
          float ring = floor(r / 1.05);
          float n = 6.0 + ring * 6.0;
          float sec = floor((a + 3.14159) / 6.28318 * n);
          vec2 cell = vec2(ring, sec);
          float fr = fract(r / 1.05), fa = fract((a + 3.14159) / 6.28318 * n);
          float edge = smoothstep(0.0, 0.06, fr) * smoothstep(1.0, 0.94, fr) * smoothstep(0.0, 0.05, fa) * smoothstep(1.0, 0.95, fa);
          float wave = 0.5 + 0.5 * sin(r * 0.9 - uTime * 2.4 + h21(cell) * 1.5);
          float flash = pow(fract(-uBeat), 3.0) * step(0.78, h21(cell + floor(uBeat)));
          vec3 col = pal(h21(cell) * 0.35 + uTime * 0.05 + r * 0.04);
          float lum = (0.18 + wave * 0.55 + flash * 1.2) * edge;
          float rim = smoothstep(${(FLOOR_R - 0.25).toFixed(2)}, ${(FLOOR_R - 0.05).toFixed(2)}, r);
          totalEmissiveRadiance += (col * lum * uPower + vec3(1.0,0.82,0.45) * rim * 2.0) * step(r, ${FLOOR_R.toFixed(2)});
        }`);
  };
  const dance = new THREE.Mesh(new THREE.CircleGeometry(FLOOR_R, 96), danceMat);
  dance.rotation.x = -Math.PI / 2;
  dance.position.y = 0.012;
  dance.receiveShadow = true;
  hall.add(dance);
  // borda dourada da pista
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe9b949, metalness: 1, roughness: 0.25 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(FLOOR_R, 0.09, 12, 128), goldMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.03;
  hall.add(rim);
  updaters.push((t, beat) => { danceUniforms.uTime.value = t; danceUniforms.uBeat.value = beat; });

  // ---------------------------------------------------------------
  // Paredes, cortinas e janelas
  const wallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#8a6a86'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(240,200,140,0.35)'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
      g.beginPath(); g.moveTo(x + 32, y + 8); g.quadraticCurveTo(x + 56, y + 32, x + 32, y + 56); g.quadraticCurveTo(x + 8, y + 32, x + 32, y + 8); g.stroke();
    }
  }, { repeat: [10, 3] });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
  const W = 30, H = 15;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), wallMat);
  back.position.set(0, H / 2, -27); back.receiveShadow = true; hall.add(back);
  for (const s of [1, -1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(64, H), wallMat);
    side.position.set(s * W, H / 2, 0); side.rotation.y = -s * Math.PI / 2; hall.add(side);
  }
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), wallMat);
  front.position.set(0, H / 2, 32); front.rotation.y = Math.PI; hall.add(front);
  // rodapé/lambri dourado
  for (const [x, z, ry, len] of [[0, -26.9, 0, W * 2], [W - 0.1, 0, -Math.PI / 2, 64], [-W + 0.1, 0, Math.PI / 2, 64]]) {
    const wain = new THREE.Mesh(new THREE.BoxGeometry(len, 1.4, 0.12), new THREE.MeshStandardMaterial({ color: 0xfaf3ea, roughness: 0.5 }));
    wain.position.set(x, 0.7, z); wain.rotation.y = ry; hall.add(wain);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.16), goldMat);
    strip.position.set(x, 1.42, z); strip.rotation.y = ry; hall.add(strip);
  }
  // teto
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({ color: 0x2a1530, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; hall.add(ceil);

  // cortinas com pregas (fundo e laterais)
  const curtainGeo = (w, h, folds) => {
    const g = new THREE.PlaneGeometry(w, h, folds * 6, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const swag = Math.pow(Math.max(0, (y + h / 2) / h), 3) * 0.2;
      p.setZ(i, Math.sin((x / w) * folds * Math.PI * 2) * 0.22 + swag);
    }
    g.computeVertexNormals();
    return g;
  };
  const curtainMat = new THREE.MeshPhysicalMaterial({ color: 0xc8607e, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0xffe6f0), side: THREE.DoubleSide });
  const curtainMat2 = new THREE.MeshPhysicalMaterial({ color: 0xd9b8c8, roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0xffd6e6), side: THREE.DoubleSide });
  const backCurtain = new THREE.Mesh(curtainGeo(18, 13.5, 20), curtainMat2);
  backCurtain.position.set(0, 6.9, -26.6); hall.add(backCurtain);
  for (const s of [1, -1]) {
    const c = new THREE.Mesh(curtainGeo(5, 14, 7), curtainMat);
    c.position.set(s * 10.5, 7, -26.2); hall.add(c);
    // laço/swag do topo
    const swag = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.35, 10, 30, Math.PI), curtainMat);
    swag.rotation.z = Math.PI; swag.position.set(s * 4.6, 14.2, -26.1); swag.scale.set(1, 0.35, 0.6);
    hall.add(swag);
  }

  // janelas em arco nas laterais (céu noturno com estrelas)
  const skyTex = canvasTex(256, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0b1240'); grd.addColorStop(0.7, '#3a2a6a'); grd.addColorStop(1, '#a35a8a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.3, 1)})`; g.fillRect(rnd(0, w), rnd(0, h * 0.7), 1.5, 1.5); }
    g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(w * 0.65, h * 0.2, 22, 0, Math.PI * 2); g.fill();
  });
  const winShape = new THREE.Shape();
  winShape.moveTo(-1.4, 0); winShape.lineTo(1.4, 0); winShape.lineTo(1.4, 4); winShape.absarc(0, 4, 1.4, 0, Math.PI, false); winShape.lineTo(-1.4, 0);
  const winGeo = new THREE.ShapeGeometry(winShape, 16);
  winGeo.computeBoundingBox();
  { const uv = winGeo.attributes.uv, p = winGeo.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 1.4) / 2.8, p.getY(i) / 5.4); }
  const winMat = new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false, color: 0x9999bb });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xfaf3ea, roughness: 0.4 });
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) {
    const z = -18 + i * 9;
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(s * (W - 0.05), 3.4, z); win.rotation.y = -s * Math.PI / 2; hall.add(win);
    const fr = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.12, 8, 24, Math.PI), frameMat);
    fr.position.set(s * (W - 0.1), 7.4, z); fr.rotation.y = -s * Math.PI / 2; hall.add(fr);
  }

  // ---------------------------------------------------------------
  // Altar (plataforma com degraus) + tapete vermelho
  const marbleWhite = new THREE.MeshPhysicalMaterial({ color: 0xfbf7f2, roughness: 0.3, clearcoat: 0.5 });
  for (let i = 0; i < 3; i++) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(5.6 - i * 0.7, 5.7 - i * 0.7, 0.22, 64, 1, false, Math.PI / 2, Math.PI), marbleWhite);
    st.position.set(0, 0.11 + i * 0.22, ALTAR_Z - 2.2);
    st.rotation.y = Math.PI;
    st.receiveShadow = true; st.castShadow = true;
    hall.add(st);
    const tr = new THREE.Mesh(new THREE.TorusGeometry(5.65 - i * 0.7, 0.03, 6, 64, Math.PI), goldMat);
    tr.rotation.x = Math.PI / 2; tr.rotation.z = Math.PI;
    tr.position.set(0, 0.22 + i * 0.22, ALTAR_Z - 2.2); hall.add(tr);
  }
  // fundo do altar
  const altarBack = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.66, 3.2), marbleWhite);
  altarBack.position.set(0, 0.33, ALTAR_Z - 3.8); hall.add(altarBack);
  // tapete
  const carpetTex = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#b0102a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8b44a'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < h; y += 16) g.fillRect(8, y, w - 16, 1);
  }, { repeat: [1, 3] });
  const carpetLen = (ALTAR_Z * -1) - FLOOR_R + 0.4;
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.6, carpetLen), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95 }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, -FLOOR_R - carpetLen / 2 + 0.3);
  carpet.receiveShadow = true;
  hall.add(carpet);
  // pétalas no tapete
  {
    const petal = new THREE.CircleGeometry(0.06, 6); petal.rotateX(-Math.PI / 2); petal.scale(1, 1, 0.6);
    const pm = new THREE.InstancedMesh(petal, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }), 220);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const cols = [0xffffff, 0xff9fbf, 0xff4d7d, 0xffe0ea];
    for (let i = 0; i < 220; i++) {
      q.setFromEuler(e.set(rnd(-0.2, 0.2), rnd(0, 6), 0));
      m.compose(new THREE.Vector3(rnd(-1.6, 1.6), 0.03, rnd(-FLOOR_R - carpetLen + 0.6, -FLOOR_R + 0.3)), q, new THREE.Vector3(1, 1, 1));
      pm.setMatrixAt(i, m); pm.setColorAt(i, new THREE.Color(cols[i % 4]));
    }
    hall.add(pm);
  }

  // ---------------------------------------------------------------
  // ARCO DE FLORES (portal por onde os convidados chegam)
  const arch = new THREE.Group();
  arch.position.set(0, 0.66, ALTAR_Z + 2.2);
  hall.add(arch);
  const archR = 2.7;
  const archFrame = new THREE.Mesh(new THREE.TorusGeometry(archR, 0.09, 10, 48, Math.PI), goldMat);
  archFrame.position.y = 3.0; arch.add(archFrame);
  for (const s of [1, -1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.0, 12), goldMat);
    post.position.set(s * archR, 1.5, 0); arch.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 20), marbleWhite);
    base.position.set(s * archR, 0.2, 0); arch.add(base);
  }
  // flores ao longo do arco
  const archPoint = (u) => { // u 0..1 ao longo do arco + postes
    const total = Math.PI * archR + 6;
    const d = u * total;
    if (d < 3) return new THREE.Vector3(archR, d, 0);
    if (d < 3 + Math.PI * archR) { const a = (d - 3) / archR; return new THREE.Vector3(Math.cos(a) * archR, 3 + Math.sin(a) * archR, 0); }
    return new THREE.Vector3(-archR, 3 - (d - 3 - Math.PI * archR), 0);
  };
  {
    const N = hi ? 520 : 260;
    const rose = roseGeo(0.16, 1);
    const fm = new THREE.InstancedMesh(rose, new THREE.MeshPhysicalMaterial({ roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xffffff) }), N);
    const leaf = new THREE.SphereGeometry(0.16, 6, 4); leaf.scale(0.45, 0.08, 1);
    const lm = new THREE.InstancedMesh(leaf, new THREE.MeshStandardMaterial({ color: 0x3f7f2f, roughness: 0.6 }), N);
    const cols = [0xffffff, 0xffd1df, 0xff8fb1, 0xfff0d0, 0xe23a68, 0xffffff, 0xf9b8cc];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const u = Math.pow(Math.random(), 0.9);
      const p = archPoint(u);
      const dense = p.y > 2.6 && Math.abs(p.x) < 1.6 ? 1.0 : 0.75; // mais cheio no topo
      p.add(new THREE.Vector3(rnd(-0.35, 0.35), rnd(-0.25, 0.25), rnd(-0.35, 0.4)));
      const out = new THREE.Vector3(p.x, Math.max(0, p.y - 3), rnd(0.4, 1)).normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
      q.multiply(new THREE.Quaternion().setFromEuler(e.set(0, rnd(0, 6), 0)));
      const s = rnd(0.8, 1.5) * dense;
      m.compose(p, q, sc.set(s, s, s));
      fm.setMatrixAt(i, m); fm.setColorAt(i, new THREE.Color(cols[(Math.random() * cols.length) | 0]));
      q.setFromEuler(e.set(rnd(-1, 1), rnd(0, 6), rnd(-1, 1)));
      m.compose(p.clone().add(new THREE.Vector3(rnd(-0.2, 0.2), rnd(-0.2, 0.2), rnd(-0.3, 0))), q, sc.set(1.3, 1, 1.3));
      lm.setMatrixAt(i, m);
    }
    fm.castShadow = true;
    arch.add(fm, lm);
  }
  // cortina de tule atrás do arco (o "portal")
  const portal = new THREE.Mesh(new THREE.CircleGeometry(archR - 0.1, 48, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xfff2fa, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  portal.position.set(0, 3.0, -0.05); arch.add(portal);
  const portalLow = new THREE.Mesh(new THREE.PlaneGeometry(archR * 2 - 0.2, 3.0), portal.material);
  portalLow.position.set(0, 1.5, -0.05); arch.add(portalLow);

  // ---------------------------------------------------------------
  // PLACA "CASAMENTO DOS LOUVA-A-DEUS" com lâmpadas
  const signW = 12, signH = 2.6;
  const signTex = canvasTex(2048, 444, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#3a0d2e'); grd.addColorStop(1, '#1a0618');
    g.fillStyle = grd;
    roundRect(g, 0, 0, w, h, 70); g.fill();
    g.strokeStyle = '#f2c65a'; g.lineWidth = 16; roundRect(g, 18, 18, w - 36, h - 36, 56); g.stroke();
    g.strokeStyle = 'rgba(242,198,90,0.5)'; g.lineWidth = 4; roundRect(g, 42, 42, w - 84, h - 84, 40); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'italic 700 92px Georgia, "Times New Roman", serif';
    g.fillStyle = '#ffd9ea';
    g.fillText('~  Casamento dos  ~', w / 2, h * 0.3);
    g.font = '900 172px "Arial Black", Impact, sans-serif';
    const tg = g.createLinearGradient(0, h * 0.45, 0, h * 0.9);
    tg.addColorStop(0, '#fff3b0'); tg.addColorStop(0.5, '#f5c242'); tg.addColorStop(1, '#c4861c');
    g.shadowColor = 'rgba(255,200,80,0.8)'; g.shadowBlur = 30;
    g.fillStyle = tg;
    g.fillText('LOUVA-A-DEUS', w / 2, h * 0.68);
    g.shadowBlur = 0;
    g.lineWidth = 5; g.strokeStyle = '#7a4a0a'; g.strokeText('LOUVA-A-DEUS', w / 2, h * 0.68);
  }, { repeat: [1, 1] });
  signTex.wrapS = signTex.wrapT = THREE.ClampToEdgeWrapping;
  const sign = new THREE.Group();
  sign.position.set(0, 10.2, -25.6);
  hall.add(sign);
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.3, roughness: 0.5, transparent: true }));
  sign.add(signMesh);
  // lâmpadas em volta
  const bulbsN = 46;
  const bulbGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const bulbs = new THREE.InstancedMesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), bulbsN);
  const perim = 2 * (signW + signH);
  for (let i = 0; i < bulbsN; i++) {
    let d = (i / bulbsN) * perim, x, y;
    if (d < signW) { x = -signW / 2 + d; y = signH / 2 + 0.15; }
    else if ((d -= signW) < signH) { x = signW / 2 + 0.15; y = signH / 2 - d; }
    else if ((d -= signH) < signW) { x = signW / 2 - d; y = -signH / 2 - 0.15; }
    else { d -= signW; x = -signW / 2 - 0.15; y = -signH / 2 + d; }
    bulbs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y, 0.08));
  }
  sign.add(bulbs);
  const bulbCol = new THREE.Color();
  updaters.push((t) => {
    for (let i = 0; i < bulbsN; i++) {
      const on = ((i + Math.floor(t * 6)) % 3) === 0;
      bulbCol.setRGB(on ? 3 : 0.9, on ? 2.4 : 0.6, on ? 1.2 : 0.3);
      bulbs.setColorAt(i, bulbCol);
    }
    bulbs.instanceColor.needsUpdate = true;
  });
  // corações dos lados da placa
  const heartShape = heart2D(0.9);
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 });
  heartGeo.center();
  const heartMat = new THREE.MeshPhysicalMaterial({ color: 0xff3d77, roughness: 0.2, clearcoat: 1, emissive: 0xff1050, emissiveIntensity: 0.35 });
  const hearts3 = [];
  for (const s of [1, -1]) {
    const h = new THREE.Mesh(heartGeo, heartMat);
    h.position.set(s * 7.6, 10.2, -25.4); h.rotation.z = Math.PI;
    hall.add(h); hearts3.push(h);
  }
  updaters.push((t, beat) => { const k = 1 + Math.pow(1 - (beat % 1), 4) * 0.12; for (const h of hearts3) h.scale.setScalar(k); });

  // ---------------------------------------------------------------
  // Mesas redondas, cadeiras, pratos, taças e arranjos
  const tables = [];
  for (const s of [1, -1]) for (let i = 0; i < 5; i++) tables.push(new THREE.Vector3(s * (i % 2 ? 22.5 : 18.5), 0, -17 + i * 6.3));
  for (const s of [1, -1]) tables.push(new THREE.Vector3(s * 14, 0, -22));
  {
    const clothGeo = new THREE.LatheGeometry([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      if (i < 4) return new THREE.Vector2(i / 3 * 1.3, 1.05);
      return new THREE.Vector2(1.3 + (i - 4) * 0.035 + Math.sin(i) * 0.01, 1.05 - (i - 3) * 0.2);
    }).concat([new THREE.Vector2(1.45, 0.02)]), 40);
    const cloth = new THREE.InstancedMesh(clothGeo, new THREE.MeshPhysicalMaterial({ color: 0xfffaf5, roughness: 0.7, sheen: 1, sheenColor: new THREE.Color(0xffe8f0) }), tables.length);
    const runner = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.33, 1.33, 0.012, 40), new THREE.MeshStandardMaterial({ color: 0xf2b6c8, roughness: 0.6 }), tables.length);
    // cadeira dourada (chiavari) — peças juntas numa só geometria
    const chairParts = [];
    const seat = new THREE.BoxGeometry(0.46, 0.06, 0.46); seat.translate(0, 0.48, 0); chairParts.push(seat);
    const cushion = new THREE.BoxGeometry(0.42, 0.06, 0.42); cushion.translate(0, 0.53, 0); chairParts.push(paint(cushion, 0xfff5f8));
    for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      const l = new THREE.CylinderGeometry(0.022, 0.018, 0.48, 6); l.translate(x, 0.24, z); chairParts.push(l);
    }
    for (const x of [-0.2, 0.2]) { const p = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6); p.translate(x, 0.8, -0.21); chairParts.push(p); }
    for (let k = 0; k < 4; k++) { const b = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6); b.rotateZ(Math.PI / 2); b.translate(0, 0.62 + k * 0.15, -0.21); chairParts.push(b); }
    // laço rosa no encosto
    const bow = new THREE.TorusGeometry(0.06, 0.02, 6, 12); bow.translate(0, 0.95, -0.25); chairParts.push(paint(bow, 0xff8fb1));
    const chairGeo = merge(chairParts.map((g) => g.attributes.color ? g : paint(g, 0xe7b84f)), true);
    const perTable = 8;
    const chairs = new THREE.InstancedMesh(chairGeo, new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.35 }), tables.length * perTable);
    const plate = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.13, 0.03, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), tables.length * perTable);
    const glassGeo = new THREE.LatheGeometry([[0, 0], [0.06, 0.005], [0.01, 0.02], [0.01, 0.16], [0.05, 0.2], [0.055, 0.3], [0.05, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
    const glass = new THREE.InstancedMesh(glassGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 }), tables.length * perTable);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    let k = 0;
    tables.forEach((p, ti) => {
      cloth.setMatrixAt(ti, m.makeTranslation(p.x, 0, p.z));
      runner.setMatrixAt(ti, m.makeTranslation(p.x, 1.06, p.z));
      for (let c = 0; c < perTable; c++, k++) {
        const a = (c / perTable) * Math.PI * 2 + ti;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a - Math.PI / 2);
        chairs.setMatrixAt(k, m.compose(new THREE.Vector3(p.x + Math.cos(a) * 1.75, 0, p.z + Math.sin(a) * 1.75), q, one));
        plate.setMatrixAt(k, m.makeTranslation(p.x + Math.cos(a) * 1.0, 1.08, p.z + Math.sin(a) * 1.0));
        glass.setMatrixAt(k, m.makeTranslation(p.x + Math.cos(a + 0.3) * 0.95, 1.07, p.z + Math.sin(a + 0.3) * 0.95));
      }
    });
    cloth.castShadow = chairs.castShadow = true;
    cloth.receiveShadow = true;
    hall.add(cloth, runner, chairs, plate, glass);
    // arranjo central de cada mesa: vaso + bola de rosas + velas
    centerpieces(hall, tables, updaters);
  }

  // ---------------------------------------------------------------
  // Arranjos florais altos (pedestais) em volta da pista e do altar
  {
    const spots = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * 0.62 + (i / 9) * Math.PI * 1.76 + Math.PI / 2;
      spots.push(new THREE.Vector3(Math.cos(a) * (FLOOR_R + 0.9), 0, Math.sin(a) * (FLOOR_R + 0.9)));
    }
    spots.push(new THREE.Vector3(-5.6, 0.66, ALTAR_Z - 1.2), new THREE.Vector3(5.6, 0.66, ALTAR_Z - 1.2));
    spots.push(new THREE.Vector3(-1.9, 0, -FLOOR_R - 1.6), new THREE.Vector3(1.9, 0, -FLOOR_R - 1.6));
    flowerPedestals(hall, spots, hi);
  }

  // ---------------------------------------------------------------
  // Lustres de cristal
  const chandeliers = [];
  const chPos = [[-6.5, 11, 0, 1.0], [6.5, 11, 0, 1.0], [-11, 10.5, -12, 0.85], [11, 10.5, -12, 0.85], [-13, 10.5, 9, 0.8], [13, 10.5, 9, 0.8]];
  for (const [x, y, z, s] of chPos) {
    const ch = chandelier(hi);
    ch.position.set(x, y, z); ch.scale.setScalar(s);
    hall.add(ch); chandeliers.push(ch);
  }
  updaters.push((t) => { chandeliers.forEach((c, i) => { c.rotation.y = t * 0.06 + i; c.rotation.z = Math.sin(t * 0.5 + i) * 0.008; }); });

  // ---------------------------------------------------------------
  // Balões (cachos) que flutuam
  balloons(hall, updaters, hi);

  // ---------------------------------------------------------------
  // Varais de luzinhas (do centro para as paredes)
  fairyLights(hall, updaters, hi);

  // ---------------------------------------------------------------
  // Luzes
  const amb = new THREE.HemisphereLight(0xffe6f2, 0x2a1530, 0.42);
  scene.add(amb);
  const key = new THREE.DirectionalLight(0xfff0dd, 1.9);
  key.position.set(6, 16, 10);
  key.target.position.set(0, 0, -1);
  key.castShadow = true;
  key.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
  const sc = key.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 4; sc.far = 40;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0xb6a0ff, 1.4);
  rimL.position.set(-8, 8, -14); scene.add(rimL);
  const fill = new THREE.PointLight(0xffb3d1, 14, 30, 2);
  fill.position.set(0, 6, 8); scene.add(fill);
  const altarLight = new THREE.PointLight(0xfff0c0, 40, 22, 2);
  altarLight.position.set(0, 7, ALTAR_Z + 4); scene.add(altarLight);
  const chLight = new THREE.PointLight(0xffd9a0, 22, 25, 2);
  chLight.position.set(0, 8.5, -1); scene.add(chLight);

  // Holofotes coloridos que varrem a pista (luz + feixe visível)
  const spots = [];
  const beamMat = (col) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(col) }, uI: { value: 0.35 } },
    vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uI; varying float vY; void main(){ gl_FragColor = vec4(uColor * uI * pow(vY, 1.6), 1.0); }',
  });
  const spotCols = [0xff3da5, 0x3dd5ff, 0xffd13d, 0x9b5bff];
  const spotPos = [[-13, 13.5, -6], [13, 13.5, -6], [-11, 13.5, 9], [11, 13.5, 9]];
  for (let i = 0; i < 4; i++) {
    const sl = new THREE.SpotLight(spotCols[i], i < 2 || hi ? 120 : 0, 40, 0.22, 0.5, 1.6);
    sl.position.set(...spotPos[i]);
    scene.add(sl, sl.target);
    const coneGeo = new THREE.ConeGeometry(2.2, 16, 24, 1, true);
    coneGeo.translate(0, -8, 0);
    const beam = new THREE.Mesh(coneGeo, beamMat(spotCols[i]));
    beam.position.copy(sl.position);
    if (!new URLSearchParams(location.search).has('nobeams')) scene.add(beam);
    // corpo do refletor
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.8, roughness: 0.4 }));
    can.position.copy(sl.position); scene.add(can);
    spots.push({ sl, beam, can, i });
  }
  const tmpV = new THREE.Vector3(), up = new THREE.Vector3(0, -1, 0);
  updaters.push((t, beat) => {
    for (const s of spots) {
      const a = t * (0.35 + s.i * 0.07) + s.i * 1.7;
      const r = 3 + Math.sin(t * 0.4 + s.i) * 4;
      s.sl.target.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 1);
      tmpV.copy(s.sl.target.position).sub(s.sl.position).normalize();
      s.beam.quaternion.setFromUnitVectors(up, tmpV);
      s.can.quaternion.copy(s.beam.quaternion);
      const hue = (t * 0.05 + s.i * 0.25) % 1;
      s.sl.color.setHSL(hue, 0.9, 0.6);
      s.beam.material.uniforms.uColor.value.setHSL(hue, 0.9, 0.55);
      s.beam.material.uniforms.uI.value = 0.18 + Math.pow(1 - (beat % 1), 3) * 0.12;
    }
  });

  scene.fog = new THREE.Fog(0x2a1530, 38, 78);
  scene.background = new THREE.Color(0x1d0f22);

  return {
    group: hall,
    keyLight: key,
    setDancePower(v) { danceUniforms.uPower.value = v; },
    update(t, beat) { for (const u of updaters) u(t, beat); },
  };
}

// ===================================================================
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

export function heart2D(s = 1) {
  const h = new THREE.Shape();
  h.moveTo(0, -0.35 * s);
  h.bezierCurveTo(0.1 * s, -0.25 * s, 0.5 * s, 0.0, 0.5 * s, 0.25 * s);
  h.bezierCurveTo(0.5 * s, 0.5 * s, 0.25 * s, 0.6 * s, 0, 0.38 * s);
  h.bezierCurveTo(-0.25 * s, 0.6 * s, -0.5 * s, 0.5 * s, -0.5 * s, 0.25 * s);
  h.bezierCurveTo(-0.5 * s, 0.0, -0.1 * s, -0.25 * s, 0, -0.35 * s);
  return h;
}

function centerpieces(hall, tables, updaters) {
  const vaseGeo = new THREE.LatheGeometry([[0, 0], [0.12, 0], [0.1, 0.05], [0.05, 0.25], [0.06, 0.45], [0.14, 0.55], [0.13, 0.56]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
  const vases = new THREE.InstancedMesh(vaseGeo, new THREE.MeshStandardMaterial({ color: 0xf0c35a, metalness: 1, roughness: 0.2 }), tables.length);
  const rose = roseGeo(0.09, 0);
  const per = 22;
  const roses = new THREE.InstancedMesh(rose, new THREE.MeshPhysicalMaterial({ roughness: 0.5, sheen: 1 }), tables.length * per);
  const candleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10);
  const candles = new THREE.InstancedMesh(candleGeo, new THREE.MeshStandardMaterial({ color: 0xfff8ec, roughness: 0.6 }), tables.length * 3);
  const flames = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 1.8, 1), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false }), tables.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  const cols = [0xffffff, 0xffc2d4, 0xff7aa2, 0xfff0d8, 0xd92d5c];
  let k = 0, c = 0;
  tables.forEach((p, ti) => {
    vases.setMatrixAt(ti, m.makeTranslation(p.x, 1.06, p.z));
    for (let i = 0; i < per; i++, k++) {
      const u = Math.random(), v = Math.random();
      const th = u * Math.PI * 2, ph = Math.acos(1 - v * 1.1);
      const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const pos = dir.clone().multiplyScalar(0.22).add(new THREE.Vector3(p.x, 1.66, p.z));
      roses.setMatrixAt(k, m.compose(pos, q, sv.set(1, 1, 1)));
      roses.setColorAt(k, new THREE.Color(cols[(Math.random() * cols.length) | 0]));
    }
    for (let j = 0; j < 3; j++, c++) {
      const a = (j / 3) * Math.PI * 2 + 0.5;
      const x = p.x + Math.cos(a) * 0.45, z = p.z + Math.sin(a) * 0.45;
      candles.setMatrixAt(c, m.makeTranslation(x, 1.17, z));
      flames.setMatrixAt(c, m.makeTranslation(x, 1.32, z));
    }
  });
  roses.castShadow = true;
  hall.add(vases, roses, candles, flames);
  const col = new THREE.Color();
  updaters.push((t) => {
    for (let i = 0; i < flames.count; i++) {
      const f = 2.2 + Math.sin(t * 13 + i * 1.7) * 0.4 + Math.sin(t * 23 + i) * 0.3;
      flames.setColorAt(i, col.setRGB(f, f * 0.7, f * 0.3));
    }
    flames.instanceColor.needsUpdate = true;
  });
}

function flowerPedestals(hall, spots, hi) {
  const colGeo = new THREE.LatheGeometry([[0, 0], [0.32, 0], [0.32, 0.12], [0.18, 0.2], [0.13, 0.3], [0.13, 1.25], [0.2, 1.35], [0.32, 1.45], [0.3, 1.5], [0, 1.5]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  const cols = new THREE.InstancedMesh(colGeo, new THREE.MeshPhysicalMaterial({ color: 0xfbf7f2, roughness: 0.3, clearcoat: 0.5 }), spots.length);
  const per = hi ? 70 : 36;
  const roses = new THREE.InstancedMesh(roseGeo(0.12, 1), new THREE.MeshPhysicalMaterial({ roughness: 0.5, sheen: 1 }), spots.length * per);
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 6, 4).scale(0.35, 0.06, 1).translate(0, 0, 0.18), new THREE.MeshStandardMaterial({ color: 0x3a7a2c, roughness: 0.6 }), spots.length * 16);
  const palette = [0xffffff, 0xffd1df, 0xff8fb1, 0xfff0d0, 0xe23a68, 0xf9b8cc, 0xc9a7ff];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(1, 1, 1);
  let k = 0, l = 0;
  spots.forEach((p, i) => {
    cols.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z));
    const c = new THREE.Vector3(p.x, p.y + 1.95, p.z);
    for (let j = 0; j < per; j++, k++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(1 - Math.random() * 1.6);
      const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      roses.setMatrixAt(k, m.compose(dir.clone().multiplyScalar(0.48).add(c), q, sv));
      roses.setColorAt(k, new THREE.Color(palette[(Math.random() * palette.length) | 0]));
    }
    for (let j = 0; j < 16; j++, l++) {
      const a = (j / 16) * Math.PI * 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.6));
      leaves.setMatrixAt(l, m.compose(new THREE.Vector3(p.x + Math.cos(a) * 0.4, p.y + 1.62, p.z + Math.sin(a) * 0.4), q, new THREE.Vector3(1.6, 1, 1.6)));
    }
  });
  cols.castShadow = roses.castShadow = true;
  hall.add(cols, roses, leaves);
}

function chandelier(hi) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c55c, metalness: 1, roughness: 0.22 });
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5, 6), gold);
  chain.position.y = 2.6; g.add(chain);
  const body = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.8], [0.15, -0.7], [0.1, -0.4], [0.25, 0], [0.12, 0.3], [0.05, 0.4], [0, 0.4]].map(([x, y]) => new THREE.Vector2(x, y)), 20), gold);
  g.add(body);
  for (const [r, y] of [[1.4, -0.1], [0.9, 0.35]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 48), gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
  }
  // braços curvos com velas
  const arms = 10;
  const bulbGeo = new THREE.SphereGeometry(0.07, 10, 8).scale(1, 1.5, 1);
  const bulbs = new THREE.InstancedMesh(bulbGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.3), toneMapped: false }), arms + 6);
  const m = new THREE.Matrix4();
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(Math.cos(a) * 0.8, -0.8, Math.sin(a) * 0.8), new THREE.Vector3(Math.cos(a) * 1.4, -0.1, Math.sin(a) * 1.4));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.03, 6), gold));
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 10), gold);
    cup.position.set(Math.cos(a) * 1.4, -0.06, Math.sin(a) * 1.4); g.add(cup);
    bulbs.setMatrixAt(i, m.makeTranslation(Math.cos(a) * 1.4, 0.08, Math.sin(a) * 1.4));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    bulbs.setMatrixAt(arms + i, m.makeTranslation(Math.cos(a) * 0.9, 0.5, Math.sin(a) * 0.9));
  }
  g.add(bulbs);
  // cristais pendurados
  const nC = hi ? 140 : 60;
  const crystals = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.06, 0).scale(1, 2.2, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0.1, clearcoat: 1, iridescence: 1, transparent: true, opacity: 0.85, emissive: 0x332222 }), nC);
  for (let i = 0; i < nC; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.15;
    crystals.setMatrixAt(i, m.makeTranslation(Math.cos(a) * r, -0.3 - Math.random() * 0.9 * (1.5 - r * 0.6), Math.sin(a) * r));
  }
  g.add(crystals);
  return g;
}

function balloons(hall, updaters, hi) {
  const clusters = [
    [-4.2, ALTAR_Z + 2.5, 3.6], [4.2, ALTAR_Z + 2.5, 3.6],
    [-13.5, -9, 2.6], [13.5, -9, 2.6], [-14, 4, 2.6], [14, 4, 2.6],
    [-8, -24, 4.5], [8, -24, 4.5], [-24, -20, 4], [24, -20, 4],
  ];
  const per = hi ? 11 : 7;
  const N = clusters.length * per;
  const geo = new THREE.SphereGeometry(0.42, 24, 18);
  { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) p.setXYZ(i, p.getX(i) * (1 + y * 0.35), y * 1.15, p.getZ(i) * (1 + y * 0.35)); } geo.computeVertexNormals(); }
  const knot = new THREE.ConeGeometry(0.06, 0.1, 8); knot.translate(0, -0.52, 0);
  const bgeo = merge([geo, knot]);
  const mesh = new THREE.InstancedMesh(bgeo, new THREE.MeshPhysicalMaterial({ roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.5 }), N);
  const palette = [0xff8fb1, 0xffffff, 0xf2c55c, 0xffc9de, 0xb9f08a, 0xd7b8ff, 0xff4d7d];
  const data = [];
  const strings = [];
  clusters.forEach(([x, z, h]) => {
    const base = new THREE.Vector3(x, 0.6, z);
    for (let i = 0; i < per; i++) {
      const a = (i / per) * Math.PI * 2, r = 0.25 + (i % 3) * 0.25;
      const p = new THREE.Vector3(x + Math.cos(a) * r, h + (i % 4) * 0.45 + Math.random() * 0.3, z + Math.sin(a) * r);
      data.push({ p, base, ph: Math.random() * 6, s: 0.85 + Math.random() * 0.35 });
    }
    // peso do cacho
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xf2c55c, metalness: 0.9, roughness: 0.2 }));
    w.position.copy(base).setY(0.2); w.scale.y = 0.7; hall.add(w);
  });
  data.forEach((d, i) => mesh.setColorAt(i, new THREE.Color(palette[i % palette.length])));
  const lineGeo = new THREE.BufferGeometry();
  const lp = new Float32Array(N * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  hall.add(mesh, lines);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pos = new THREE.Vector3();
  updaters.push((t) => {
    data.forEach((d, i) => {
      pos.copy(d.p);
      pos.x += Math.sin(t * 0.8 + d.ph) * 0.08;
      pos.y += Math.sin(t * 1.1 + d.ph) * 0.1;
      pos.z += Math.cos(t * 0.7 + d.ph) * 0.08;
      q.setFromEuler(e.set(Math.sin(t + d.ph) * 0.1, 0, Math.cos(t * 0.9 + d.ph) * 0.1));
      mesh.setMatrixAt(i, m.compose(pos, q, sv.setScalar(d.s)));
      lp.set([pos.x, pos.y - 0.55 * d.s, pos.z, d.base.x, d.base.y, d.base.z], i * 6);
    });
    mesh.instanceMatrix.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
  });
}

function fairyLights(hall, updaters, hi) {
  const strands = 14, per = hi ? 46 : 26;
  const N = strands * per;
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  const wire = [];
  const m = new THREE.Matrix4();
  const top = new THREE.Vector3(0, 13.8, -2);
  let k = 0;
  const base = [];
  for (let s = 0; s < strands; s++) {
    const a = (s / strands) * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(a) * 28, 11.5, Math.sin(a) * 26 - 2);
    end.x = Math.max(-29.5, Math.min(29.5, end.x)); end.z = Math.max(-26.5, Math.min(30, end.z));
    for (let i = 0; i < per; i++, k++) {
      const u = i / (per - 1);
      const p = top.clone().lerp(end, u);
      p.y -= Math.sin(u * Math.PI) * 2.6;
      m.makeTranslation(p.x, p.y, p.z);
      mesh.setMatrixAt(k, m);
      wire.push(p.x, p.y, p.z);
      if (i > 0 && i < per - 1) wire.push(p.x, p.y, p.z);
      base.push(Math.random());
    }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  hall.add(mesh, new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x3a2a20, transparent: true, opacity: 0.5 })));
  const col = new THREE.Color();
  updaters.push((t) => {
    for (let i = 0; i < N; i++) {
      const tw = 0.6 + 0.4 * Math.sin(t * 2.5 + base[i] * 30);
      col.setRGB(2.6 * tw, 2.0 * tw, 1.1 * tw);
      mesh.setColorAt(i, col);
    }
    mesh.instanceColor.needsUpdate = true;
  });
}
