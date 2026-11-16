// =============================================================
//  Materiais e texturas procedurais (geradas em canvas, sem
//  arquivos externos). Tudo é original e livre de direitos.
// =============================================================
import * as THREE from 'three';

function canvasTex(size, draw, repeat = 1, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let _chitin, _chitinBump, _wing, _lace, _wool, _satin;

/** Textura clara (multiplicada pela cor) com estrias e pintinhas de casca de inseto. */
export function chitinTex() {
  if (_chitin) return _chitin;
  _chitin = canvasTex(512, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    // faixas longitudinais suaves
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * s;
      const grd = g.createLinearGradient(x - 14, 0, x + 14, 0);
      grd.addColorStop(0, 'rgba(0,40,0,0)');
      grd.addColorStop(0.5, `rgba(0,40,0,${0.03 + Math.random() * 0.05})`);
      grd.addColorStop(1, 'rgba(0,40,0,0)');
      g.fillStyle = grd; g.fillRect(x - 14, 0, 28, s);
    }
    // pintinhas
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = Math.random() * 1.6 + 0.3;
      g.fillStyle = Math.random() < 0.75 ? `rgba(40,70,0,${Math.random() * 0.12})` : `rgba(255,255,200,${Math.random() * 0.25})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // anéis claros (segmentos)
    for (let y = 0; y < s; y += s / 14) {
      g.fillStyle = 'rgba(255,255,210,0.12)'; g.fillRect(0, y, s, 3);
      g.fillStyle = 'rgba(0,50,0,0.06)'; g.fillRect(0, y + 3, s, 5);
    }
  });
  return _chitin;
}

export function chitinBump() {
  if (_chitinBump) return _chitinBump;
  _chitinBump = canvasTex(256, (g, s) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 1600; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.15})`;
      g.beginPath(); g.arc(x, y, Math.random() * 2 + 0.5, 0, Math.PI * 2); g.fill();
    }
  }, 1, false);
  return _chitinBump;
}

export function wingTex() {
  if (_wing) return _wing;
  _wing = canvasTex(512, (g, s) => {
    const grd = g.createLinearGradient(0, 0, s, 0);
    grd.addColorStop(0, '#d9f2a0'); grd.addColorStop(0.7, '#b8e07a'); grd.addColorStop(1, '#a7c96a');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(70,110,30,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, s * 0.5); g.bezierCurveTo(s * 0.3, s * 0.45, s * 0.6, s * 0.48, s, s * 0.5); g.stroke();
    g.lineWidth = 1.4;
    for (let i = 1; i < 16; i++) {
      const x = (i / 16) * s;
      g.beginPath(); g.moveTo(x, s * 0.49); g.quadraticCurveTo(x + 40, s * 0.3, x + 70, 0); g.stroke();
      g.beginPath(); g.moveTo(x, s * 0.51); g.quadraticCurveTo(x + 40, s * 0.7, x + 70, s); g.stroke();
    }
  });
  _wing.wrapS = _wing.wrapT = THREE.ClampToEdgeWrapping;
  _wing.repeat.set(1.1, 4);
  return _wing;
}

export function laceTex() {
  if (_lace) return _lace;
  _lace = canvasTex(512, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(190,180,200,0.55)'; g.lineWidth = 2;
    for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) {
      const ox = (y / 64) % 2 ? 32 : 0;
      g.beginPath(); g.arc(x + ox, y, 18, 0, Math.PI * 2); g.stroke();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        g.beginPath(); g.ellipse(x + ox + Math.cos(a) * 26, y + Math.sin(a) * 26, 7, 3.5, a, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = 'rgba(200,190,210,0.5)'; g.beginPath(); g.arc(x + ox, y, 4, 0, Math.PI * 2); g.fill();
    }
  }, 3);
  return _lace;
}

export function woolTex() {
  if (_wool) return _wool;
  _wool = canvasTex(256, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      g.fillRect(Math.random() * s, Math.random() * s, 2, 1);
    }
    for (let y = 0; y < s; y += 4) { g.fillStyle = 'rgba(0,0,0,0.04)'; g.fillRect(0, y, s, 1); }
  }, 4);
  return _wool;
}

export function satinTex() {
  if (_satin) return _satin;
  _satin = canvasTex(256, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * s;
      g.fillStyle = `rgba(0,0,20,${Math.random() * 0.05})`; g.fillRect(x, 0, 6 + Math.random() * 10, s);
    }
  }, 2);
  return _satin;
}

/** Materiais de um louva-a-deus "herói" (noivos). */
export function heroMaterials({ body = 0x7cc244, iris = 0x23a59b, belly = null } = {}) {
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: body, map: chitinTex(), bumpMap: chitinBump(), bumpScale: 0.6,
    roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.32,
    sheen: 0.6, sheenColor: new THREE.Color(0xe8ff9a), sheenRoughness: 0.5,
  });
  return {
    body: bodyMat,
    sclera: new THREE.MeshPhysicalMaterial({ color: 0xfbfcf6, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    iris: new THREE.MeshPhysicalMaterial({ color: iris, roughness: 0.2, clearcoat: 1, emissive: iris, emissiveIntensity: 0.18 }),
    pupil: new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.1, clearcoat: 1 }),
    shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x23400f, roughness: 0.6 }),
    lips: new THREE.MeshPhysicalMaterial({ color: 0xff5f8f, roughness: 0.3, clearcoat: 0.8 }),
    mouthIn: new THREE.MeshStandardMaterial({ color: 0x5a1020, roughness: 0.7 }),
    wing: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, map: wingTex(), side: THREE.DoubleSide, roughness: 0.35,
      transparent: true, opacity: 0.92, clearcoat: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0xffffcc),
    }),
  };
}
