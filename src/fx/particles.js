// =============================================================
//  Partículas: corações, brilhos, confetes, fogos, fumaça e
//  notas musicais. Quantidade máxima controlada (pool fixo) para
//  não pesar em lives longas.
// =============================================================
import * as THREE from 'three';

const CELL = { heart: 0, star: 1, glow: 2, note: 3 };

function atlas() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s * 2;
  const g = c.getContext('2d');
  // coração
  g.save(); g.translate(s * 0.5, s * 0.55); g.scale(s / 110, s / 110);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, 35); g.bezierCurveTo(-60, -5, -35, -55, 0, -22); g.bezierCurveTo(35, -55, 60, -5, 0, 35); g.fill();
  g.restore();
  // estrela
  g.save(); g.translate(s * 1.5, s * 0.5);
  const grd = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.2, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? s * 0.12 : s * 0.48; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.fill(); g.restore();
  // brilho redondo
  const gg = g.createRadialGradient(s * 0.5, s * 1.5, 0, s * 0.5, s * 1.5, s * 0.5);
  gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.35, 'rgba(255,255,255,0.5)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gg; g.fillRect(0, s, s, s);
  // nota musical
  g.fillStyle = '#fff'; g.font = `bold ${s * 0.85}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('♪', s * 1.5, s * 1.52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

class SpriteSystem {
  constructor(scene, max, tex, additive) {
    this.max = max;
    this.n = 0;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.cell = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.alpha0 = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCell', new THREE.BufferAttribute(this.cell, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: tex }, uScale: { value: 600 } },
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `attribute vec4 aColor; attribute float aSize; attribute float aCell; uniform float uScale;
        varying vec4 vC; varying float vCell;
        void main(){ vC = aColor; vCell = aCell; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D uTex; varying vec4 vC; varying float vCell;
        void main(){ vec2 uv = gl_PointCoord; uv.y = 1.0 - uv.y;
          vec2 o = vec2(mod(vCell, 2.0), 1.0 - floor(vCell / 2.0)) * 0.5;
          vec4 t = texture2D(uTex, o + uv * 0.5);
          gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); if (gl_FragColor.a < 0.01) discard; }`,
    });
    this.mat = mat;
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, { color = [1, 1, 1], alpha = 1, size = 0.5, cell = 0, life = 1.5, grav = 0, drag = 0.5 } = {}) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.p.set([x, y, z], i * 3); this.v.set([vx, vy, vz], i * 3);
    this.col.set([color[0], color[1], color[2], alpha], i * 4);
    this.size[i] = size; this.cell[i] = cell; this.life[i] = life; this.maxLife[i] = life;
    this.grav[i] = grav; this.drag[i] = drag; this.alpha0[i] = alpha;
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this._kill(i); continue; }
      const k = i * 3, d = Math.max(0, 1 - this.drag[i] * dt);
      this.v[k + 1] -= this.grav[i] * dt;
      this.v[k] *= d; this.v[k + 1] *= d; this.v[k + 2] *= d;
      this.p[k] += this.v[k] * dt; this.p[k + 1] += this.v[k + 1] * dt; this.p[k + 2] += this.v[k + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.col[i * 4 + 3] = this.alpha0[i] * Math.min(1, f * 3) * Math.min(1, (1 - f) * 12 + 0.2);
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    for (const a of ['position', 'aColor', 'aSize', 'aCell']) this.geo.attributes[a].needsUpdate = true;
  }
  _kill(i) {
    const j = --this.n;
    if (i === j) return;
    this.p.copyWithin(i * 3, j * 3, j * 3 + 3); this.v.copyWithin(i * 3, j * 3, j * 3 + 3);
    this.col.copyWithin(i * 4, j * 4, j * 4 + 4);
    for (const a of [this.size, this.cell, this.life, this.maxLife, this.grav, this.drag, this.alpha0]) a[i] = a[j];
  }
  clear() { this.n = 0; }
}

class Confetti {
  constructor(scene, max) {
    this.max = max; this.n = 0;
    const g = new THREE.PlaneGeometry(0.09, 0.16);
    this.mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3 }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.d = [];
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.s = new THREE.Vector3(1, 1, 1); this.c = new THREE.Color();
    scene.add(this.mesh);
    this.mesh.setColorAt(0, this.c.set(0xffffff));
  }
  emit(pos, vel, color) {
    if (this.d.length >= this.max) this.d.shift();
    this.d.push({ p: pos.clone(), v: vel.clone(), r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: new THREE.Vector3(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4), life: 6 + Math.random() * 3, col: color });
  }
  update(dt) {
    const out = [];
    let k = 0;
    for (const c of this.d) {
      c.life -= dt;
      if (c.life <= 0) continue;
      out.push(c);
      if (c.p.y > 0.03) {
        c.v.y = Math.max(-1.6, c.v.y - 6 * dt);
        c.v.x *= 1 - 1.5 * dt; c.v.z *= 1 - 1.5 * dt;
        c.p.addScaledVector(c.v, dt);
        c.p.x += Math.sin(c.life * 4 + c.r.x) * dt * 0.4;
        c.r.addScaledVector(c.w, dt);
      } else { c.p.y = 0.03; c.r.x = Math.PI / 2; c.r.z = 0; }
      this.q.setFromEuler(this.e.set(c.r.x, c.r.y, c.r.z));
      const s = Math.min(1, c.life);
      this.mesh.setMatrixAt(k, this.m.compose(c.p, this.q, this.s.setScalar(s)));
      this.mesh.setColorAt(k, this.c.set(c.col));
      k++;
    }
    this.d = out;
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

const rnd = (a, b) => a + Math.random() * (b - a);
const CONF_COLS = [0xff5f9e, 0xffd34d, 0x7cc244, 0x3dd5ff, 0xffffff, 0xc9a7ff, 0xff8a3d];

export class FX {
  constructor(scene, { max = 3500 } = {}) {
    const tex = atlas();
    this.soft = new SpriteSystem(scene, max, tex, false);
    this.glow = new SpriteSystem(scene, max, tex, true);
    this.conf = new Confetti(scene, 1400);
    this.tmp = new THREE.Vector3();
  }
  setViewport(h) { this.soft.mat.uniforms.uScale.value = h * 0.6; this.glow.mat.uniforms.uScale.value = h * 0.6; }
  update(dt) { this.soft.update(dt); this.glow.update(dt); this.conf.update(dt); }
  clear() { this.soft.clear(); this.glow.clear(); this.conf.d = []; }

  hearts(p, n = 14, spread = 0.9) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const pink = Math.random() < 0.7;
      this.soft.emit(p.x + Math.cos(a) * spread * Math.random(), p.y + rnd(-0.3, 0.6), p.z + Math.sin(a) * spread * Math.random(),
        Math.cos(a) * rnd(0.2, 0.8), rnd(0.8, 2.0), Math.sin(a) * rnd(0.2, 0.8),
        { color: pink ? [1, 0.25, 0.5] : [1, 0.55, 0.75], size: rnd(0.25, 0.55), cell: 0, life: rnd(1.6, 2.8), grav: -0.15, drag: 0.6 });
    }
  }
  heartRing(p, n = 18, r = 1.2) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.soft.emit(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r, -Math.sin(a) * 1.2, rnd(0.4, 0.9), Math.cos(a) * 1.2,
        { color: [1, 0.2 + Math.random() * 0.3, 0.45], size: 0.42, cell: 0, life: 2.6, drag: 0.4 });
    }
  }
  sparkles(p, n = 20, color = [1, 0.9, 0.5], spread = 1, up = 1.5) {
    for (let i = 0; i < n; i++) {
      this.glow.emit(p.x + rnd(-spread, spread), p.y + rnd(-0.2, spread * 1.5), p.z + rnd(-spread, spread),
        rnd(-0.6, 0.6), rnd(0.2, up), rnd(-0.6, 0.6),
        { color, size: rnd(0.15, 0.45), cell: 1, life: rnd(0.7, 1.6), drag: 1.2 });
    }
  }
  poof(p, color = [1, 1, 1]) {
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(1, 3);
      this.glow.emit(p.x, p.y + 0.8, p.z, Math.cos(a) * r, rnd(0, 2.5), Math.sin(a) * r,
        { color, size: rnd(0.3, 0.7), cell: 2, life: rnd(0.4, 0.9), drag: 3 });
    }
    this.sparkles(p.clone().setY(p.y + 1), 18, [1, 0.95, 0.7], 0.8, 2.5);
  }
  notes(p, n = 6) {
    for (let i = 0; i < n; i++) {
      const c = [[1, 0.5, 0.8], [0.6, 0.9, 1], [1, 0.9, 0.4]][i % 3];
      this.soft.emit(p.x + rnd(-0.5, 0.5), p.y + rnd(0, 0.5), p.z + rnd(-0.5, 0.5), rnd(-0.3, 0.3), rnd(0.7, 1.3), rnd(-0.3, 0.3),
        { color: c, size: rnd(0.35, 0.5), cell: 3, life: rnd(1.5, 2.2), drag: 0.3 });
    }
  }
  confetti(p, n = 120, spread = 2, power = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
      this.conf.emit(this.tmp.set(p.x + Math.cos(a) * r * 0.3, p.y, p.z + Math.sin(a) * r * 0.3),
        new THREE.Vector3(Math.cos(a) * r, rnd(power * 0.5, power), Math.sin(a) * r), CONF_COLS[i % CONF_COLS.length]);
    }
  }
  confettiRain(center, radius = 12, n = 300) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius;
      this.conf.emit(this.tmp.set(center.x + Math.cos(a) * r, rnd(9, 13), center.z + Math.sin(a) * r),
        new THREE.Vector3(rnd(-0.5, 0.5), rnd(-1, 0), rnd(-0.5, 0.5)), CONF_COLS[i % CONF_COLS.length]);
    }
  }
  firework(p, color) {
    const col = color || [[1, 0.4, 0.7], [0.5, 0.9, 1], [1, 0.85, 0.3], [0.7, 1, 0.5]][(Math.random() * 4) | 0];
    for (let i = 0; i < 90; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), sp = rnd(4, 7);
      this.glow.emit(p.x, p.y, p.z, Math.cos(th) * s * sp, u * sp, Math.sin(th) * s * sp,
        { color: col, size: rnd(0.25, 0.5), cell: i % 3 ? 1 : 2, life: rnd(1.0, 1.8), grav: 3, drag: 1.4 });
    }
  }
  flame(p) {
    for (let i = 0; i < 4; i++) {
      this.glow.emit(p.x + rnd(-0.1, 0.1), p.y, p.z + rnd(-0.1, 0.1), rnd(-0.4, 0.4), rnd(-6, -3), rnd(-0.4, 0.4),
        { color: [1, rnd(0.4, 0.8), 0.15], size: rnd(0.4, 0.8), cell: 2, life: rnd(0.25, 0.45), drag: 2 });
    }
    this.soft.emit(p.x, p.y - 0.3, p.z, rnd(-0.5, 0.5), rnd(-1.5, -0.5), rnd(-0.5, 0.5),
      { color: [0.85, 0.85, 0.9], alpha: 0.5, size: rnd(0.6, 1.1), cell: 2, life: rnd(0.8, 1.4), drag: 1.5 });
  }
  aura(p, color = [1, 0.85, 0.3]) {
    const a = Math.random() * Math.PI * 2;
    this.glow.emit(p.x + Math.cos(a) * 0.8, p.y + rnd(0, 0.5), p.z + Math.sin(a) * 0.8, 0, rnd(0.6, 1.4), 0,
      { color, size: rnd(0.15, 0.35), cell: 1, life: rnd(0.8, 1.4), drag: 0.5 });
  }
}
