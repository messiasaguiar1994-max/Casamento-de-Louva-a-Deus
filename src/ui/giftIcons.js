// =============================================================
//  Figurinhas dos presentes (desenhos próprios, sem texto):
//  rosa, Tiny Dino, rosquinha e capivara. Aparecem discretamente
//  a cada 1 minuto de jogo, em lugares diferentes, e somem.
// =============================================================
function cv(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round';
  draw(g); return c.toDataURL('image/png');
}
const circle = (g, x, y, r, f) => { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const ell = (g, x, y, rx, ry, f, rot = 0) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };

function rose() {
  return cv((g) => {
    g.strokeStyle = '#2e8b3a'; g.lineWidth = 9; g.beginPath(); g.moveTo(80, 150); g.quadraticCurveTo(74, 115, 80, 82); g.stroke();
    ell(g, 58, 118, 18, 8, '#3fae4a', -0.6); ell(g, 102, 108, 18, 8, '#3fae4a', 0.6);
    const pet = ['#b0102a', '#d61f3c', '#ee3b55', '#ff5f74'];
    ell(g, 80, 62, 40, 34, pet[0]);
    ell(g, 62, 58, 22, 26, pet[1], -0.4); ell(g, 98, 58, 22, 26, pet[1], 0.4);
    ell(g, 80, 50, 24, 20, pet[2]);
    g.strokeStyle = '#8a0a1e'; g.lineWidth = 3; g.beginPath(); g.arc(80, 50, 11, 0.3, 4.6); g.stroke();
    ell(g, 70, 42, 8, 5, 'rgba(255,255,255,.35)', -0.5);
  });
}
function dino() {
  return cv((g) => {
    const G = '#4cc35a', D = '#2f8f3c';
    g.fillStyle = G; g.beginPath(); g.moveTo(30, 120); g.quadraticCurveTo(10, 100, 22, 92); g.quadraticCurveTo(40, 104, 52, 108); g.fill(); // cauda
    ell(g, 78, 108, 36, 30, G);                       // corpo
    ell(g, 80, 116, 22, 18, '#bdf0a4');               // barriga
    ell(g, 104, 62, 30, 26, G);                       // cabeça
    for (const [x, y] of [[62, 80], [74, 72], [88, 66]]) { g.fillStyle = D; g.beginPath(); g.moveTo(x - 7, y + 6); g.lineTo(x, y - 8); g.lineTo(x + 7, y + 6); g.fill(); }
    ell(g, 64, 138, 10, 8, D); ell(g, 94, 138, 10, 8, D); // pés
    circle(g, 112, 56, 11, '#fff'); circle(g, 115, 57, 6, '#111'); circle(g, 117, 54, 2, '#fff');
    g.strokeStyle = '#1d5e26'; g.lineWidth = 3; g.beginPath(); g.arc(116, 72, 9, 0.2, 2.2); g.stroke();
    ell(g, 92, 66, 5, 3, '#ff8fb1');
  });
}
function donut() {
  return cv((g) => {
    circle(g, 80, 84, 56, '#d9954a');
    g.fillStyle = '#ff7fb5'; g.beginPath();
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, r = 48 + (i % 2 ? 5 : -2); g.lineTo(80 + Math.cos(a) * r, 80 + Math.sin(a) * r); }
    g.fill();
    const cols = ['#fff', '#ffd34d', '#5ad1ff', '#7cc244', '#c39bf2'];
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 18;
      g.save(); g.translate(80 + Math.cos(a) * r, 80 + Math.sin(a) * r); g.rotate(Math.random() * 3);
      g.fillStyle = cols[i % cols.length]; g.fillRect(-6, -2, 12, 4); g.restore();
    }
    circle(g, 80, 82, 18, '#5a1f4a');
    ell(g, 58, 52, 14, 6, 'rgba(255,255,255,.45)', -0.6);
  });
}
function capybara() {
  return cv((g) => {
    const B = '#a8743f', L = '#c99460';
    ell(g, 80, 104, 60, 42, B);                       // corpo
    ell(g, 104, 74, 40, 32, L);                       // cabeça
    ell(g, 132, 82, 16, 18, '#8a5a2e');               // focinho
    circle(g, 136, 76, 3.5, '#2a1a0a'); circle(g, 128, 78, 3.5, '#2a1a0a');
    circle(g, 104, 62, 6, '#2a1a0a'); circle(g, 106, 60, 2, '#fff');
    ell(g, 82, 46, 9, 7, '#8a5a2e');                  // orelha
    ell(g, 50, 142, 12, 8, '#7a4a22'); ell(g, 104, 142, 12, 8, '#7a4a22');
    // laranjinha na cabeça
    circle(g, 96, 38, 13, '#ff9a2e'); ell(g, 98, 24, 6, 3, '#3fae4a', 0.4);
  });
}

export function startGiftHints(hudRoot, { every = 60, show = 6 } = {}) {
  const icons = [rose(), dino(), donut(), capybara()];
  const css = document.createElement('style');
  css.textContent = `
  .gh { position:absolute; display:flex; gap:.5em; pointer-events:none; opacity:0; transition:opacity 1.2s ease; z-index:3 }
  .gh.on { opacity:.82 }
  .gh img { width:4.2em; height:4.2em; filter:drop-shadow(0 .1em .25em rgba(0,0,0,.45)); animation:ghf 2.4s ease-in-out infinite }
  .gh img:nth-child(2){animation-delay:.3s}.gh img:nth-child(3){animation-delay:.6s}.gh img:nth-child(4){animation-delay:.9s}
  .gh.col { flex-direction:column }
  @keyframes ghf { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-.35em) rotate(4deg)} }`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.className = 'gh';
  el.innerHTML = icons.map((src) => `<img src="${src}" alt="">`).join('');
  hudRoot.appendChild(el);
  // lugares discretos que vão variando (cantos e laterais)
  const SPOTS = [
    { left: '3%', bottom: '9%', col: false }, { right: '3%', bottom: '9%', col: false },
    { left: '2.5%', top: '36%', col: true }, { right: '2.5%', top: '36%', col: true },
    { left: '50%', bottom: '5%', col: false, center: true },
  ];
  let i = 0;
  const tick = () => {
    const s = SPOTS[i++ % SPOTS.length];
    el.style.left = el.style.right = el.style.top = el.style.bottom = '';
    for (const k of ['left', 'right', 'top', 'bottom']) if (s[k]) el.style[k] = s[k];
    el.style.transform = s.center ? 'translateX(-50%)' : '';
    el.classList.toggle('col', !!s.col);
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), show * 1000);
  };
  setTimeout(tick, 20000);                  // primeira vez: 20 s depois de abrir
  setInterval(tick, every * 1000);          // depois, a cada 1 minuto
  return { showNow: tick, el };
}
