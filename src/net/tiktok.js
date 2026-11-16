// =============================================================
//  Ligação com a live do TikTok.
//  O servidor (pasta "servidor") lê a live e repassa os eventos
//  para o jogo por WebSocket. Ele pode estar:
//   - no PC (INICIAR.bat)          -> mesmo endereço da página
//   - na internet (Render)          -> usado pelo aplicativo .APK
// =============================================================

export const IS_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  || (location.protocol === 'https:' && location.hostname === 'localhost' && !location.port);

export function cleanServer(s) {
  s = String(s || '').trim().replace(/\/+$/, '');
  if (s && !/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

export class TikTokLink {
  constructor(onEvent, onStatus) {
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.ws = null;
    this.username = '';
    this.retry = null;
    this.server = '';
    this.fails = 0;
  }
  /** endereço do servidor na internet (usado no app e quando abre o arquivo direto) */
  setServer(s) { this.server = cleanServer(s); }
  get remote() { return IS_APP || location.protocol === 'file:'; }
  get wsUrl() {
    if (this.remote) return this.server ? this.server.replace(/^http/i, 'ws') + '/ws' : '';
    if (location.port === '5173') return 'ws://localhost:8787/ws'; // modo desenvolvimento
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  }
  /** fotos do TikTok passam pelo servidor (o celular às vezes bloqueia) */
  photo(url) {
    if (!url || !this.remote || !this.server) return url;
    return this.server + '/foto?u=' + encodeURIComponent(url);
  }
  connect(username) {
    this.username = (username || '').replace(/^@/, '').trim();
    this.fails = 0;
    if (this.remote && this.server) fetch(this.server + '/status', { cache: 'no-store' }).catch(() => {}); // acorda o servidor grátis
    this._open();
  }
  _open() {
    clearTimeout(this.retry);
    try { if (this.ws) { this.ws.onclose = null; this.ws.close(); } } catch { /* */ }
    const url = this.wsUrl;
    if (!url) { this.onStatus('offline', 'Coloque o endereço do servidor no painel'); return; }
    let ws;
    try { ws = new WebSocket(url); } catch { this._later(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.fails = 0;
      this.onStatus('server', 'Servidor ligado');
      if (this.username) ws.send(JSON.stringify({ type: 'connect', username: this.username }));
    };
    ws.onmessage = (e) => {
      let d; try { d = JSON.parse(e.data); } catch { return; }
      if (d.type === 'status') { this.onStatus(d.state, d.msg); return; }
      if (d.user && d.user.pic) d.user.pic = this.photo(d.user.pic);
      this.onEvent(d);
    };
    ws.onclose = () => {
      this.fails++;
      this.onStatus('offline', this.remote
        ? (this.fails < 15 ? 'Acordando o servidor... (pode levar até 1 minuto)' : 'Servidor fora do ar. Confira o endereço no painel.')
        : 'Servidor desligado (modo teste)');
      this._later();
    };
    ws.onerror = () => {};
  }
  _later() { clearTimeout(this.retry); this.retry = setTimeout(() => this._open(), 4000); }
}
