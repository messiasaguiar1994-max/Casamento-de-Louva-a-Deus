// =============================================================
//  CENÁRIO: CASAMENTO NO CEMITÉRIO (Halloween "assustador divertido")
//  Mesma planta do salão antigo (pista no centro, portão por onde
//  os convidados chegam, banda atrás dos noivos), agora com:
//  lápides, árvores secas, portão de ferro, mausoléu, abóboras,
//  neblina, lua cheia, morcegos, lanternas e o Zombot de enfeite.
// =============================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { merge, paint } from '../mantis/geometry.js';
import urlZombot from '../assets/chars/zombot.glb?url';

export const FLOOR_R = 10.5;
export const ALTAR_Z = -21;
export const ENTRY = new THREE.Vector3(0, 0, -18.6);

const rnd = (a, b) => a + Math.random() * (b - a);
let seed = 7;
const srnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildHall(scene, { quality = 'high' } = {}) {
  const hall = new THREE.Group();
  scene.add(hall);
  const updaters = [];
  const hi = quality !== 'low';
  seed = 7;

  // ---------------- céu noturno + lua ----------------
  const skyTex = canvasTex(1024, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#05030c'); grd.addColorStop(0.45, '#160a2a'); grd.addColorStop(0.75, '#2c1440'); grd.addColorStop(1, '#3d1f3a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,240,${Math.random() * 0.9})`; const r = Math.random() * 1.4; g.beginPath(); g.arc(Math.random() * w, Math.random() * h * 0.7, r, 0, 7); g.fill(); }
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false, color: 0xbbbbbb }));
  hall.add(sky);
  const moonTex = canvasTex(256, 256, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, w * 0.18, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,250,220,1)'); grd.addColorStop(0.32, 'rgba(255,240,200,1)'); grd.addColorStop(0.36, 'rgba(255,230,170,0.35)'); grd.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(200,190,160,0.35)';
    for (const [x, y, r] of [[110, 100, 14], [150, 140, 10], [120, 150, 7], [140, 95, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  });
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, toneMapped: false, depthWrite: false }));
  moon.position.set(-14, 26, -60); moon.scale.setScalar(26);
  hall.add(moon);

  // ---------------- chão: terra e grama seca ----------------
  const soil = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#1d1a16'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const c = Math.random(); g.fillStyle = c < 0.5 ? `rgba(60,52,38,${Math.random() * 0.5})` : c < 0.8 ? `rgba(45,60,30,${Math.random() * 0.5})` : `rgba(10,8,6,${Math.random() * 0.5})`;
      g.fillRect(Math.random() * w, Math.random() * h, Math.random() * 6 + 1, Math.random() * 3 + 1);
    }
    g.strokeStyle = 'rgba(90,100,50,0.35)';
    for (let i = 0; i < 2500; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-3, 3), y - rnd(4, 10)); g.stroke(); }
  }, { repeat: [10, 10] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ map: soil, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  hall.add(ground);

  // ---------------- pista de dança assombrada (LED) ----------------
  const danceUniforms = { uTime: { value: 0 }, uBeat: { value: 0 }, uPower: { value: 1 } };
  const danceMat = new THREE.MeshPhysicalMaterial({ color: 0x120a18, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
  danceMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, danceUniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP; uniform float uTime; uniform float uBeat; uniform float uPower;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      vec3 pal(float t){ t = fract(t); return t < 0.33 ? vec3(0.55,0.15,0.95) : t < 0.66 ? vec3(0.25,1.0,0.35) : vec3(1.0,0.45,0.05); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float r = length(vWP.xz); float a = atan(vWP.z, vWP.x);
        float ring = floor(r / 1.05); float n = 6.0 + ring * 6.0;
        float sec = floor((a + 3.14159) / 6.28318 * n); vec2 cell = vec2(ring, sec);
        float fr = fract(r / 1.05), fa = fract((a + 3.14159) / 6.28318 * n);
        float edge = smoothstep(0.0, 0.07, fr) * smoothstep(1.0, 0.93, fr) * smoothstep(0.0, 0.06, fa) * smoothstep(1.0, 0.94, fa);
        float wave = 0.5 + 0.5 * sin(r * 0.9 - uTime * 2.2 + h21(cell) * 1.5);
        float flash = pow(fract(-uBeat), 3.0) * step(0.8, h21(cell + floor(uBeat)));
        vec3 col = pal(h21(cell) * 0.5 + uTime * 0.03);
        float lum = (0.08 + wave * 0.42 + flash * 1.1) * edge;
        float rim = smoothstep(${(FLOOR_R - 0.25).toFixed(2)}, ${(FLOOR_R - 0.05).toFixed(2)}, r);
        totalEmissiveRadiance += (col * lum * uPower + vec3(0.4,1.0,0.3) * rim * 1.6) * step(r, ${FLOOR_R.toFixed(2)});
      }`);
  };
  const dance = new THREE.Mesh(new THREE.CircleGeometry(FLOOR_R, 96), danceMat);
  dance.rotation.x = -Math.PI / 2; dance.position.y = 0.012; dance.receiveShadow = true;
  hall.add(dance);
  const stone = new THREE.MeshStandardMaterial({ color: 0x6e6a72, roughness: 0.95 });
  const rimStones = new THREE.Mesh(new THREE.TorusGeometry(FLOOR_R + 0.05, 0.16, 6, 64), stone);
  rimStones.rotation.x = Math.PI / 2; rimStones.position.y = 0.04; hall.add(rimStones);
  updaters.push((t, beat) => { danceUniforms.uTime.value = t; danceUniforms.uBeat.value = beat; });

  // caminho de pedras do portão até a pista
  {
    const n = 26, geo = new THREE.CylinderGeometry(0.5, 0.55, 0.06, 7);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x55505a, roughness: 1 }), n);
    const mx = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const z = -FLOOR_R - 0.4 - i * 0.62, x = (i % 2 ? 0.45 : -0.45) + srnd(-0.15, 0.15);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), srnd(0, 6));
      m.setMatrixAt(i, mx.compose(new THREE.Vector3(x, 0.03, z), q, new THREE.Vector3(srnd(0.8, 1.1), 1, srnd(0.7, 1))));
    }
    m.receiveShadow = true; hall.add(m);
  }

  // ---------------- lápides (instancing, 3 formatos) ----------------
  const graveMat = new THREE.MeshStandardMaterial({ color: 0x8a8690, roughness: 0.9 });
  const mossTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9a96a0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { g.fillStyle = Math.random() < 0.6 ? `rgba(40,60,30,${Math.random() * 0.35})` : `rgba(30,28,35,${Math.random() * 0.3})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 4, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(40,36,48,0.55)'; g.fillRect(w * 0.3, h * 0.35, w * 0.4, 6); g.fillRect(w * 0.35, h * 0.45, w * 0.3, 5); g.fillRect(w * 0.38, h * 0.55, w * 0.24, 5);
  });
  graveMat.map = mossTex;
  const slab = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.9); s.absarc(0, 0.9, 0.5, 0, Math.PI, false); s.lineTo(-0.5, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -0.09);
    const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + 0.5, p.getY(i) / 1.4); return g; })();
  const cross = merge([new THREE.BoxGeometry(0.18, 1.5, 0.16).translate(0, 0.75, 0), new THREE.BoxGeometry(0.75, 0.16, 0.16).translate(0, 1.05, 0)]);
  const obelisk = merge([new THREE.BoxGeometry(0.6, 0.25, 0.6).translate(0, 0.125, 0), new THREE.CylinderGeometry(0.16, 0.24, 1.6, 4).rotateY(Math.PI / 4).translate(0, 1.05, 0), new THREE.ConeGeometry(0.16, 0.3, 4).rotateY(Math.PI / 4).translate(0, 2.0, 0)]);
  const shapes = [slab, slab, cross, obelisk];
  const spots = [];
  for (let i = 0; i < (hi ? 110 : 60); i++) {
    const a = srnd(0, Math.PI * 2), r = srnd(12.5, 30);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 3 && z < -10 && z > -27) continue;      // caminho do portão
    if (z > 9 && Math.abs(x) < 9) continue;                      // frente da câmera
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 1.6)) continue;
    spots.push({ x, z, k: (srnd(0, 4)) | 0 });
  }
  shapes.forEach((geo, k) => {
    const list = spots.filter((s) => s.k === k);
    if (!list.length) return;
    const m = new THREE.InstancedMesh(geo, graveMat, list.length);
    const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach((s, i) => {
      q.setFromEuler(e.set(srnd(-0.15, 0.15), Math.atan2(-s.x, -s.z) + srnd(-0.4, 0.4), srnd(-0.15, 0.15)));
      const sc = srnd(0.8, 1.25);
      m.setMatrixAt(i, mx.compose(new THREE.Vector3(s.x, -0.05, s.z), q, new THREE.Vector3(sc, sc, sc)));
    });
    m.castShadow = true; m.receiveShadow = true; hall.add(m);
  });
  // montinhos de terra na frente das lápides
  {
    const geo = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); geo.scale(0.55, 0.18, 1.0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 1 }), spots.length);
    const mx = new THREE.Matrix4(), q = new THREE.Quaternion();
    spots.forEach((s, i) => {
      const yaw = Math.atan2(-s.x, -s.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const off = new THREE.Vector3(0, 0, 1.1).applyQuaternion(q);
      m.setMatrixAt(i, mx.compose(new THREE.Vector3(s.x + off.x, 0, s.z + off.z), q, new THREE.Vector3(1, 1, 1)));
    });
    m.receiveShadow = true; hall.add(m);
  }

  // ---------------- árvores secas ----------------
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 1 });
  const treeGeo = (() => {
    const parts = [];
    const branch = (p, dir, len, r, depth) => {
      const end = p.clone().addScaledVector(dir, len);
      const g = new THREE.CylinderGeometry(r * 0.65, r, len, 6);
      g.translate(0, len / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
      g.translate(p.x, p.y, p.z);
      parts.push(g);
      if (depth <= 0) return;
      const n = depth > 2 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const d = dir.clone().add(new THREE.Vector3(srnd(-0.9, 0.9), srnd(-0.15, 0.5), srnd(-0.9, 0.9))).normalize();
        branch(end, d, len * srnd(0.55, 0.75), r * 0.62, depth - 1);
      }
    };
    branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 3.2, 0.32, 4);
    return merge(parts);
  })();
  for (const [x, z, s, ry] of [[-15, -14, 1.5, 0.3], [16, -12, 1.6, 2], [-21, 2, 1.4, 1], [20, 5, 1.7, 4], [-12, -24, 1.3, 5], [13, -25, 1.2, 1.5], [-24, -10, 1.6, 2.5], [25, -6, 1.4, 0.8]]) {
    const t = new THREE.Mesh(treeGeo, barkMat);
    t.position.set(x, 0, z); t.scale.setScalar(s); t.rotation.y = ry; t.castShadow = true;
    hall.add(t);
  }

  // ---------------- portão de ferro (por onde os convidados chegam) + cerca ----------------
  const iron = new THREE.MeshStandardMaterial({ color: 0x1b1a20, roughness: 0.5, metalness: 0.8 });
  const gate = new THREE.Group(); gate.position.set(0, 0, ALTAR_Z + 2.2); hall.add(gate);
  for (const s of [1, -1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x5c5862, roughness: 0.95, map: mossTex }));
    pillar.position.set(s * 2.9, 2.2, 0); pillar.castShadow = true; gate.add(pillar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 1.15), stone); cap.position.set(s * 2.9, 4.5, 0); gate.add(cap);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), stone); ball.position.set(s * 2.9, 4.9, 0); gate.add(ball);
  }
  {
    const bars = [];
    for (let i = 0; i < 13; i++) {
      const x = -2.3 + i * (4.6 / 12), h = 3.3 + Math.sin((i / 12) * Math.PI) * 1.0;
      bars.push(new THREE.CylinderGeometry(0.035, 0.035, h, 6).translate(x, h / 2, 0));
      bars.push(new THREE.ConeGeometry(0.08, 0.25, 6).translate(x, h + 0.1, 0));
    }
    for (const y of [0.4, 2.0]) bars.push(new THREE.BoxGeometry(4.7, 0.08, 0.08).translate(0, y, 0));
    const arc = new THREE.TorusGeometry(2.35, 0.05, 6, 32, Math.PI); arc.scale(1, 0.45, 1); arc.translate(0, 3.25, 0); bars.push(arc);
    // portão aberto: duas folhas giradas
    const leaf = merge(bars);
    for (const s of [1, -1]) {
      const l = new THREE.Mesh(leaf, iron); l.scale.set(0.5, 1, 1); l.position.set(s * 2.4, 0, 0); l.rotation.y = s * 1.15;
      l.position.x -= s * 0; gate.add(l);
    }
    // cerca dos dois lados
    const fence = [];
    for (let i = 0; i < 20; i++) fence.push(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5).translate(i * 0.45, 1.1, 0), new THREE.ConeGeometry(0.06, 0.2, 5).translate(i * 0.45, 2.3, 0));
    fence.push(new THREE.BoxGeometry(9, 0.07, 0.07).translate(4.3, 1.8, 0), new THREE.BoxGeometry(9, 0.07, 0.07).translate(4.3, 0.4, 0));
    const fg = merge(fence);
    for (let k = 0; k < 4; k++) for (const s of [1, -1]) {
      const f = new THREE.Mesh(fg, iron);
      f.position.set(s * (3.4 + k * 9.0), 0, ALTAR_Z + 2.2 - k * 0.2);
      if (s < 0) f.rotation.y = Math.PI;
      hall.add(f);
    }
  }
  // placa CASAMENTO ZUMBI em cima do portão
  const signTex = canvasTex(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 180px Impact, "Arial Black", sans-serif';
    g.lineJoin = 'round';
    g.strokeStyle = '#0b1a06'; g.lineWidth = 26; g.strokeText('CASAMENTO ZUMBI', w / 2, h * 0.52);
    const grd = g.createLinearGradient(0, h * 0.25, 0, h * 0.8);
    grd.addColorStop(0, '#d8ff7a'); grd.addColorStop(0.6, '#62d424'); grd.addColorStop(1, '#2b7a10');
    g.fillStyle = grd; g.fillText('CASAMENTO ZUMBI', w / 2, h * 0.52);
    // pingos "gosmentos"
    g.fillStyle = '#62d424';
    for (let i = 0; i < 26; i++) { const x = w * 0.1 + Math.random() * w * 0.8, y = h * 0.66 + Math.random() * 20, l = 20 + Math.random() * 70; g.fillRect(x, y, 10, l); g.beginPath(); g.arc(x + 5, y + l, 8, 0, 7); g.fill(); }
  });
  signTex.wrapS = signTex.wrapT = THREE.ClampToEdgeWrapping;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.65), new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
  sign.position.set(0, 6.4, ALTAR_Z + 2.4); hall.add(sign);
  updaters.push((t) => { sign.material.emissiveIntensity = 0.55 + Math.sin(t * 3.1) * 0.1 + (Math.random() < 0.01 ? -0.4 : 0); sign.position.y = 6.4 + Math.sin(t * 0.8) * 0.05; });

  // ---------------- mausoléu / capela ao fundo ----------------
  {
    const m = new THREE.Group(); m.position.set(0, 0, ALTAR_Z - 6.5); hall.add(m);
    const wallM = new THREE.MeshStandardMaterial({ color: 0x77727e, roughness: 0.95, map: mossTex });
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 5.5, 4.5), wallM); body.position.y = 2.75; body.castShadow = true; body.receiveShadow = true; m.add(body);
    const roofShape = new THREE.Shape(); roofShape.moveTo(-4, 0); roofShape.lineTo(4, 0); roofShape.lineTo(0, 2.4); roofShape.lineTo(-4, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x3a3440, roughness: 0.9 }));
    roof.position.set(0, 5.5, -2.5); roof.castShadow = true; m.add(roof);
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5.2, 12), wallM); c.position.set(-2.7 + i * 1.8, 2.6, 2.6); c.castShadow = true; m.add(c);
    }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.6, 0.5), toneMapped: false }));
    door.position.set(0, 1.6, 2.27); m.add(door);
    const doorL = new THREE.PointLight(0x7dff5a, 14, 12, 2); doorL.position.set(0, 2, 3.5); m.add(doorL);
    updaters.push((t) => { const f = 0.75 + Math.sin(t * 2.3) * 0.15 + Math.sin(t * 7.1) * 0.07; door.material.color.setRGB(0.5 * f, 1.5 * f, 0.45 * f); doorL.intensity = 12 * f; });
    const cross = new THREE.Mesh(merge([new THREE.BoxGeometry(0.2, 1.2, 0.2).translate(0, 0.6, 0), new THREE.BoxGeometry(0.7, 0.2, 0.2).translate(0, 0.8, 0)]), stone);
    cross.position.set(0, 7.85, 0); m.add(cross);
    // degraus
    for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(5 - i * 0.6, 0.2, 1.2 - i * 0.3), stone); st.position.set(0, 0.1 + i * 0.2, 3.0 - i * 0.2); st.receiveShadow = true; m.add(st); }
  }

  // ---------------- abóboras (jack-o-lanterns) ----------------
  const faceTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ff7a12'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(160,60,0,0.35)'; g.fillRect((i / 9) * w, 0, 5, h); }
    g.fillStyle = '#ffe36a';
    const tri = (x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y + s * 0.6); g.lineTo(x - s, y + s * 0.6); g.fill(); };
    tri(w * 0.40, h * 0.42, 16); tri(w * 0.60, h * 0.42, 16); tri(w * 0.5, h * 0.52, 9);
    g.beginPath(); g.moveTo(w * 0.33, h * 0.6); for (let i = 0; i <= 8; i++) g.lineTo(w * (0.33 + i * 0.0425), h * (i % 2 ? 0.68 : 0.62)); g.lineTo(w * 0.67, h * 0.66); g.quadraticCurveTo(w * 0.5, h * 0.8, w * 0.33, h * 0.66); g.fill();
  });
  faceTex.wrapS = THREE.RepeatWrapping;
  const pumpGeo = (() => {
    const g = new THREE.SphereGeometry(0.5, 24, 16); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + 0.07 * Math.cos(a * 9); p.setXYZ(i, x * k, y * 0.78, z * k); }
    g.computeVertexNormals(); g.rotateY(-Math.PI / 2); return g;
  })();
  const pumpMat = new THREE.MeshStandardMaterial({ map: faceTex, emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: 0.35, roughness: 0.6 });
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6).translate(0, 0.46, 0);
  const pumps = [];
  const pumpSpots = [];
  for (let i = 0; i < 14; i++) { const a = Math.PI * 0.6 + (i / 13) * Math.PI * 1.8 + Math.PI / 2; pumpSpots.push([Math.cos(a) * (FLOOR_R + 1.0), Math.sin(a) * (FLOOR_R + 1.0), 1]); }
  pumpSpots.push([-1.6, -FLOOR_R - 4, 1.2], [1.6, -FLOOR_R - 4, 1.2], [-1.7, -FLOOR_R - 7.5, 1], [1.7, -FLOOR_R - 7.5, 1], [-3.6, ALTAR_Z + 1.6, 1.6], [3.6, ALTAR_Z + 1.6, 1.6]);
  for (const [x, z, s] of pumpSpots) {
    const p = new THREE.Mesh(pumpGeo, pumpMat); p.position.set(x, 0.38 * s, z); p.scale.setScalar(s);
    p.lookAt(0, 0.38 * s, 0.3); p.castShadow = true;
    const st = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x3d5a1a })); p.add(st);
    hall.add(p); pumps.push(p);
  }
  updaters.push((t) => { pumpMat.emissiveIntensity = 0.32 + Math.sin(t * 9) * 0.03 + Math.sin(t * 13.7) * 0.03; });
  // velas e luz quente perto do portão
  const warm = new THREE.PointLight(0xff8a2a, 22, 14, 2); warm.position.set(0, 2.5, ALTAR_Z + 4); scene.add(warm);

  // ---------------- lanternas penduradas (laranja/roxo) ----------------
  {
    const strands = 7, per = hi ? 30 : 18, N = strands * per;
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
    const wire = [], m4 = new THREE.Matrix4(), cols = [];
    const poles = [];
    for (let s = 0; s < strands; s++) {
      const a = Math.PI * 1.08 + (s / (strands - 1)) * Math.PI * 0.84; // só para os lados e o fundo (não cruza a câmera)
      const end = new THREE.Vector3(Math.cos(a) * 14, 5.5, Math.sin(a) * 14 + 0.3);
      poles.push(end);
      const top = new THREE.Vector3(0, 8.5, -4);
      for (let i = 0; i < per; i++) {
        const u = i / (per - 1); const p = top.clone().lerp(end, u); p.y -= Math.sin(u * Math.PI) * 1.6;
        mesh.setMatrixAt(s * per + i, m4.makeTranslation(p.x, p.y, p.z)); wire.push(p.x, p.y, p.z); if (i > 0 && i < per - 1) wire.push(p.x, p.y, p.z);
        cols.push(Math.random() < 0.6 ? 0 : 1);
      }
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
    hall.add(mesh, new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x111111 })));
    // postes tortos de madeira
    for (const p of poles) { const po = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.6, 6), barkMat); po.position.set(p.x, 2.8, p.z); po.rotation.z = srnd(-0.08, 0.08); hall.add(po); }
    const c = new THREE.Color();
    updaters.push((t) => {
      for (let i = 0; i < N; i++) { const f = 0.7 + 0.3 * Math.sin(t * 2.5 + i * 1.7); if (cols[i]) c.setRGB(1.6 * f, 0.5 * f, 2.4 * f); else c.setRGB(2.6 * f, 1.1 * f, 0.15 * f); mesh.setColorAt(i, c); }
      mesh.instanceColor.needsUpdate = true;
    });
  }

  // ---------------- balões pretos, roxos e verdes ----------------
  {
    const clusters = [[-4.2, ALTAR_Z + 2.5, 3.6], [4.2, ALTAR_Z + 2.5, 3.6], [-13.5, -8, 2.6], [13.5, -8, 2.6], [-13.5, 5, 2.6], [13.5, 5, 2.6]];
    const per = hi ? 9 : 6, N = clusters.length * per;
    const geo = new THREE.SphereGeometry(0.42, 20, 14);
    const bm = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }), N);
    const pal = [0x1a1a1f, 0x6b2fb3, 0x3bbf3b, 0xff7a12, 0x1a1a1f, 0x9b5bff];
    const data = [];
    clusters.forEach(([x, z, h]) => { for (let i = 0; i < per; i++) { const a = (i / per) * Math.PI * 2, r = 0.25 + (i % 3) * 0.25; data.push({ p: new THREE.Vector3(x + Math.cos(a) * r, h + (i % 4) * 0.45, z + Math.sin(a) * r), base: new THREE.Vector3(x, 0.4, z), ph: Math.random() * 6 }); } });
    data.forEach((d, i) => bm.setColorAt(i, new THREE.Color(pal[i % pal.length])));
    const lp = new Float32Array(N * 6), lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    hall.add(bm, new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.5 })));
    const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1.15, 1);
    updaters.push((t) => {
      data.forEach((d, i) => { pos.copy(d.p); pos.x += Math.sin(t * 0.8 + d.ph) * 0.08; pos.y += Math.sin(t * 1.1 + d.ph) * 0.1;
        bm.setMatrixAt(i, m4.compose(pos, q, sc)); lp.set([pos.x, pos.y - 0.48, pos.z, d.base.x, d.base.y, d.base.z], i * 6); });
      bm.instanceMatrix.needsUpdate = true; lg.attributes.position.needsUpdate = true;
    });
  }

  // ---------------- neblina rasteira ----------------
  {
    const fogTex = canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 60;
        const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(200,210,230,0.25)'); grd.addColorStop(1, 'rgba(200,210,230,0)'); g.fillStyle = grd; g.fillRect(0, 0, w, h); }
    });
    const layers = [];
    for (let i = 0; i < (hi ? 3 : 2); i++) {
      const t = fogTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.28, depthWrite: false, color: 0x8a7aa8 }));
      f.rotation.x = -Math.PI / 2; f.position.y = 0.25 + i * 0.25; f.renderOrder = 2;
      hall.add(f); layers.push({ f, t, sp: 0.004 + i * 0.003 });
    }
    updaters.push((time) => { for (const L of layers) { L.t.offset.x = time * L.sp; L.t.offset.y = time * L.sp * 0.6; } });
  }

  // ---------------- morcegos voando ----------------
  {
    const N = 14;
    const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.quadraticCurveTo(0.35, 0.25, 0.75, 0.05); wing.lineTo(0.6, -0.05); wing.lineTo(0.5, 0.02); wing.lineTo(0.35, -0.08); wing.lineTo(0.2, 0); wing.lineTo(0, -0.06);
    const wg = new THREE.ShapeGeometry(wing);
    const bmat = new THREE.MeshBasicMaterial({ color: 0x0a0a0e, side: THREE.DoubleSide });
    const bats = [];
    for (let i = 0; i < N; i++) {
      const b = new THREE.Group();
      const L = new THREE.Mesh(wg, bmat), R = new THREE.Mesh(wg, bmat); R.scale.x = -1;
      b.add(L, R, new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), bmat));
      b.scale.setScalar(rnd(0.9, 1.6));
      hall.add(b); bats.push({ b, L, R, r: rnd(10, 22), h: rnd(9, 16), sp: rnd(0.15, 0.35) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, 6), cz: rnd(-25, -5) });
    }
    updaters.push((t) => {
      for (const o of bats) {
        const a = t * o.sp + o.ph;
        o.b.position.set(Math.cos(a) * o.r, o.h + Math.sin(t * 1.3 + o.ph) * 1.2, o.cz + Math.sin(a) * o.r * 0.5);
        o.b.rotation.y = -a + (o.sp > 0 ? 0 : Math.PI);
        const fl = Math.sin(t * 18 + o.ph) * 0.9;
        o.L.rotation.y = fl; o.R.rotation.y = -fl;
      }
    });
  }

  // ---------------- Zombot de enfeite (ao fundo, à direita) ----------------
  new GLTFLoader().load(urlZombot, (g) => {
    const z = g.scene;
    const box = new THREE.Box3().setFromObject(z), size = box.getSize(new THREE.Vector3());
    const s = 6.5 / size.y;
    z.scale.setScalar(s);
    z.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
    const holder = new THREE.Group(); holder.add(z);
    holder.position.set(9.5, 0, -21); holder.rotation.y = -0.45;
    z.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    hall.add(holder);
    const eye = new THREE.PointLight(0xff3020, 10, 12, 2); eye.position.set(9, 5.2, -18.5); hall.add(eye);
    updaters.push((t) => { holder.position.y = Math.sin(t * 1.2) * 0.12; holder.rotation.z = Math.sin(t * 0.6) * 0.02; eye.intensity = 8 + Math.sin(t * 4) * 3; });
  });

  // ---------------- luzes ----------------
  scene.add(new THREE.HemisphereLight(0x8a7ab8, 0x1a1020, 0.65));
  const key = new THREE.DirectionalLight(0xbcc8ff, 1.6); // luar
  key.position.set(-6, 16, 8); key.target.position.set(0, 0, -1);
  key.castShadow = true; key.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
  const sc = key.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 4; sc.far = 40;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0x9b5bff, 1.3); rimL.position.set(8, 6, -14); scene.add(rimL);
  const front = new THREE.PointLight(0xc9a0ff, 16, 30, 2); front.position.set(0, 6, 9); scene.add(front);
  const green = new THREE.PointLight(0x5aff5a, 10, 22, 2); green.position.set(0, 3, 0.3); scene.add(green);
  updaters.push((t, beat) => { green.intensity = 6 + Math.pow(1 - (beat % 1), 3) * 8; });

  // holofotes coloridos varrendo a pista (roxo, verde, laranja)
  const spots2 = [];
  const beamMat = (col) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(col) }, uI: { value: 0.3 } },
    vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uI; varying float vY; void main(){ gl_FragColor = vec4(uColor * uI * pow(vY, 1.6), 1.0); }',
  });
  const spotCols = [0x9b5bff, 0x5aff5a, 0xff7a12, 0x9b5bff];
  [[-13, 12, -6], [13, 12, -6], [-11, 12, 9], [11, 12, 9]].forEach((p, i) => {
    const sl = new THREE.SpotLight(spotCols[i], i < 2 || hi ? 110 : 0, 40, 0.22, 0.5, 1.6);
    sl.position.set(...p); scene.add(sl, sl.target);
    const cone = new THREE.ConeGeometry(2.2, 15, 24, 1, true); cone.translate(0, -7.5, 0);
    const beam = new THREE.Mesh(cone, beamMat(spotCols[i])); beam.position.copy(sl.position); scene.add(beam);
    spots2.push({ sl, beam, i });
  });
  const tmpV = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);
  updaters.push((t, beat) => {
    for (const s of spots2) {
      const a = t * (0.35 + s.i * 0.07) + s.i * 1.7, r = 3 + Math.sin(t * 0.4 + s.i) * 4;
      s.sl.target.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 1);
      tmpV.copy(s.sl.target.position).sub(s.sl.position).normalize();
      s.beam.quaternion.setFromUnitVectors(down, tmpV);
      s.beam.material.uniforms.uI.value = 0.14 + Math.pow(1 - (beat % 1), 3) * 0.1;
    }
  });

  scene.fog = new THREE.Fog(0x1a0f26, 26, 70);
  scene.background = new THREE.Color(0x0c0714);

  return {
    group: hall, keyLight: key,
    setDancePower(v) { danceUniforms.uPower.value = v; },
    update(t, beat) { for (const u of updaters) u(t, beat); },
  };
}
