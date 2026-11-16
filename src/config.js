// =============================================================
//  CONFIGURAÇÕES (salvas automaticamente no navegador)
//  As regras de presentes podem ser editadas no painel (tecla P)
//  sem mexer em nenhum código.
// =============================================================

/** Ações especiais disponíveis para os presentes */
export const ACTIONS = {
  special: 'Dança especial',
  hearts: 'Corações em volta',
  padrinho: 'Vira padrinho/madrinha',
  rocket: 'Foguete',
  vip: 'Destaque lendário (convidado de honra)',
  kiss: 'Noivos se beijam',
  confetti: 'Chuva de confete',
  groupdance: 'Dança em grupo',
  celebrate: 'Comemoração',
  hello: 'Acena',
  none: 'Nada',
};

export const DEFAULT_CONFIG = {
  username: '',
  // endereço do servidor na internet (Render), usado pelo aplicativo .APK
  server: 'https://tiktok-casamento.onrender.com',
  limit: 100,
  joinOnEnter: true,       // entra na festa quando entra na live
  groomName: 'Noivo',
  brideName: 'Noiva',
  bots: 8,                 // parentes dos noivos (enfeite) quando a festa está vazia
  quality: 'high',
  showFps: false,
  musicVolume: 0.55,
  sfxVolume: 0.8,
  commentAction: 'hello',
  followAction: 'celebrate',
  shareAction: 'celebrate',
  // Regras: primeiro as que têm palavras (nome do presente);
  // depois, pelo valor em diamantes (vale a maior que couber).
  rules: [
    { words: 'rose, rosa', min: 0, action: 'special' },
    { words: 'heart, coração, coracao, finger heart, i love you', min: 0, action: 'hearts' },
    { words: 'rocket, foguete, fireworks', min: 0, action: 'rocket' },
    { words: 'perfume, kiss, beijo', min: 0, action: 'kiss' },
    { words: '', min: 1, action: 'hearts' },
    { words: '', min: 10, action: 'confetti' },
    { words: '', min: 99, action: 'padrinho' },
    { words: '', min: 500, action: 'vip' },
  ],
};

const KEY = 'casamento-louva-config-v1';

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
  return best ? best.action : 'hearts';
}
