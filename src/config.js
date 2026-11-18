// =============================================================
//  CONFIGURAÇÕES (salvas automaticamente no navegador)
//  As regras de presentes podem ser editadas no painel (tecla P)
//  sem mexer em nenhum código.
// =============================================================

/** Ações especiais disponíveis para os presentes */
export const ACTIONS = {
  enter: 'Entra na festa (dança)',
  musician: 'Vira músico da banda',
  couple: 'Vira noivo ou noiva',
  none: 'Nada',
};

export const DEFAULT_CONFIG = {
  username: '',
  // endereço do servidor na internet (Render), usado pelo aplicativo .APK
  server: 'https://tiktok-casamento.onrender.com',
  limit: 100,
  groomName: 'Noivo',
  brideName: 'Noiva',
  bots: 8,                 // parentes dos noivos (enfeite) quando a festa está vazia
  quality: 'high',
  showFps: false,
  musicVolume: 0.55,
  danceBpm: 150,           // ritmo das danças quando toca música MP3 (piseiro ~150)
  sfxVolume: 0.8,
  // Regras: primeiro as que têm palavras (nome do presente);
  // depois, pelo valor em moedas (vale a maior que couber).
  rules: [
    { words: 'rose, rosa', min: 0, action: 'enter' },
    { words: 'tiny dino, tiny diny, dino', min: 0, action: 'musician' },
    { words: 'doughnut, donut, rosquinha, capybara, capivara', min: 0, action: 'couple' },
    { words: '', min: 1, action: 'enter' },
    { words: '', min: 10, action: 'musician' },
    { words: '', min: 30, action: 'couple' },
  ],
};

const KEY = 'casamento-louva-config-v2'; // v2: só presentes contam (rosa, músico, noivos)

export function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) return { ...structuredClone(DEFAULT_CONFIG), ...saved };
  } catch { /* sem armazenamento */ }
  const c = structuredClone(DEFAULT_CONFIG);
  // celular: começa com qualidade média e menos convidados
  if (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) { c.quality = 'medium'; c.limit = 70; }
  return c;
}
export function saveConfig(cfg) {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

/** Decide a ação de um presente. */
export function resolveGift(cfg, giftName = '', diamonds = 0, count = 1) {
  const name = String(giftName).toLowerCase();
  for (const r of cfg.rules) {
    const words = String(r.words || '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    if (words.length && words.some((w) => name === w || name.includes(w))) return r.action;
  }
  const total = (Number(diamonds) || 0) * Math.max(1, Number(count) || 1);
  let best = null;
  for (const r of cfg.rules) {
    if (String(r.words || '').trim()) continue;
    const min = Number(r.min) || 0;
    if (total >= min && (!best || min >= (Number(best.min) || 0))) best = r;
  }
  return best ? best.action : 'enter';
}
