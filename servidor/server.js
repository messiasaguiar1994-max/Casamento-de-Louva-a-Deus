// =============================================================
//  SERVIDOR DO JOGO — Casamento dos Louva-a-Deus
//  - Mostra o jogo em http://localhost:8787
//  - Lê a sua live do TikTok (entradas, comentários, curtidas,
//    presentes, seguidores, compartilhamentos) e envia para o jogo.
//  Funciona no PC (INICIAR.bat) e na internet (Render), junto com
//  o aplicativo Android.
//  Uso:  node server.js            (o @ é digitado no painel do jogo)
//        node server.js seu_usuario
//  Endereços: /  (jogo)   /ws  (eventos)   /status   /foto?u=URL
// =============================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const DIST = path.join(__dirname, '..', 'dist');
const EULER = process.env.EULER_API_KEY || ''; // opcional: chave do eulerstream.com
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };

// ---------- site ----------
const fotos = new Map();
async function foto(res, u) {
  try {
    if (!/^https:\/\/[^/]*(tiktokcdn|ttwstatic|tiktok|byteimg|ibyteimg)[^/]*\//i.test(u)) throw new Error('url');
    let c = fotos.get(u);
    if (!c) {
      const r = await fetch(u);
      if (!r.ok) throw new Error('foto');
      c = { tipo: r.headers.get('content-type') || 'image/jpeg', buf: Buffer.from(await r.arrayBuffer()) };
      if (fotos.size > 400) fotos.clear();
      fotos.set(u, c);
    }
    res.writeHead(200, { 'Content-Type': c.tipo, 'Cache-Control': 'max-age=86400', ...CORS });
    res.end(c.buf);
  } catch { res.writeHead(404, CORS); res.end(); }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (p === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS });
    return res.end(JSON.stringify({ ok: true, jogo: 'casamento', usuario: current, estado: lastStatus.state }));
  }
  if (p === '/foto') return foto(res, url.searchParams.get('u') || '');
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(DIST, p));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('não encontrado'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------- WebSocket para o jogo ----------
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();
let lastStatus = { type: 'status', state: 'idle', msg: 'Digite seu @ e clique em Conectar' };
const send = (ws, obj) => { try { ws.send(JSON.stringify(obj)); } catch { /* */ } };
const broadcast = (obj) => { for (const c of clients) send(c, obj); };
const status = (state, msg) => { lastStatus = { type: 'status', state, msg }; broadcast(lastStatus); console.log(`[${state}] ${msg}`); };

wss.on('connection', (ws) => {
  clients.add(ws);
  send(ws, lastStatus);
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'connect' && m.username) startLive(String(m.username));
  });
  ws.on('close', () => clients.delete(ws));
});

// ---------- TikTok LIVE ----------
let conn = null;
let current = '';
let retryTimer = null;

const img = (i) => (i && ((i.urlList && i.urlList[0]) || (i.url_list && i.url_list[0]) || (Array.isArray(i.url) ? i.url[0] : i.url) || (i.urls && i.urls[0]))) || '';
const user = (u = {}) => ({
  id: String(u.uniqueId || u.displayId || u.userId || u.nickname || ''),
  name: u.nickname || u.uniqueId || u.displayId || 'convidado',
  pic: u.profilePictureUrl || img(u.profilePicture) || img(u.avatarThumb) || img(u.avatarMedium) || img(u.avatarLarge) || img(u.profilePictureMedium) || '',
});

async function startLive(username) {
  username = username.replace(/^@/, '').trim();
  if (!username) return;
  if (username === current && conn?.isConnected) { broadcast(lastStatus); return; }
  clearTimeout(retryTimer);
  if (conn) { try { await conn.disconnect(); } catch { /* */ } conn = null; }
  current = username;
  status('connecting', `Conectando à live de @${username}...`);
  const c = new TikTokLiveConnection(username, { processInitialData: false, ...(EULER ? { signApiKey: EULER } : {}) }); // igual à Pescaria: sem a lista de presentes (exige plano pago)
  conn = c;

  c.on(WebcastEvent.MEMBER, (d) => broadcast({ type: 'join', user: user(d.user) }));
  c.on(WebcastEvent.CHAT, (d) => broadcast({ type: 'chat', user: user(d.user), comment: d.comment }));
  c.on(WebcastEvent.LIKE, (d) => broadcast({ type: 'like', user: user(d.user), likeCount: d.likeCount }));
  c.on(WebcastEvent.FOLLOW, (d) => broadcast({ type: 'follow', user: user(d.user) }));
  c.on(WebcastEvent.SHARE, (d) => broadcast({ type: 'share', user: user(d.user) }));
  c.on(WebcastEvent.GIFT, (d) => {
    const det = d.giftDetails || {};
    // presentes em sequência (combo): só conta quando a sequência termina
    if (det.giftType === 1 && !d.repeatEnd) return;
    const ext = d.extendedGiftInfo || {};
    broadcast({
      type: 'gift', user: user(d.user),
      giftName: det.giftName || ext.name || 'Presente',
      diamonds: det.diamondCount || ext.diamond_count || d.diamondCount || 0,
      count: d.repeatCount || 1,
    });
  });
  c.on(WebcastEvent.STREAM_END, () => { status('offline', 'A live terminou'); retry(username, 30000); });
  c.on('error', (e) => console.log('[aviso]', String(e?.message || e?.info || e).slice(0, 160)));
  c.on('disconnected', () => { if (conn === c) { status('connecting', 'Conexão caiu — tentando de novo...'); retry(username, 8000); } });

  try {
    const st = await c.connect();
    if (conn !== c) return;
    status('live', `Ao vivo! Conectado à live de @${username} (sala ${st.roomId})`);
  } catch (e) {
    if (conn !== c) return;
    const msg = String(e?.message || e);
    status('error', /offline|not live|UserOffline|Room ID/i.test(msg)
      ? `@${username} não está ao vivo agora (ou o TikTok não respondeu). Tento de novo sozinho a cada 20 s.`
      : `Não consegui conectar: ${msg.slice(0, 140)}`);
    retry(username, 20000);
  }
}
function retry(username, ms) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => { if (current === username) { current = ''; startLive(username); } }, ms);
}

server.listen(PORT, () => {
  console.log('');
  console.log('  💍 CASAMENTO DOS LOUVA-A-DEUS — servidor ligado');
  console.log(`  Abra no navegador:  http://localhost:${PORT}`);
  console.log('  Painel do jogo: tecla P   |   Para fechar: feche esta janela');
  console.log('');
  if (process.argv[2]) startLive(process.argv[2]);
});
