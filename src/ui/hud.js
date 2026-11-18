// =============================================================
//  HUD: título, número de convidados, avisos de chegada e de
//  presentes, nomes dos noivos. Pouca coisa na tela de propósito.
//  (Nenhum texto pede presente nem promete prêmio em troca.)
// =============================================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bg = (pic) => (pic ? `background-image:url('${encodeURI(pic).replace(/'/g, '%27')}')` : '');

export class HUD {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="hud-top"><div class="hud-title">🧟 Casamento Zumbi 💍</div><div class="hud-count">💚 <b id="hud-n">0</b> convidados na festa</div></div>
      <div class="toasts" id="hud-toasts"></div>
      <div id="hud-gift"></div>
      <div class="fps" id="hud-fps" style="display:none"></div>
      <div class="connect-pill" id="hud-conn"></div>`;
    this.nEl = root.querySelector('#hud-n');
    this.toastsEl = root.querySelector('#hud-toasts');
    this.giftEl = root.querySelector('#hud-gift');
    this.fpsEl = root.querySelector('#hud-fps');
    this.connEl = root.querySelector('#hud-conn');
    this.giftQueue = [];
    this.giftBusy = false;
    this.toastQ = [];
    this.lastToast = 0;
  }
  setCount(n) { this.nEl.textContent = n; }
  setConn(txt) { this.connEl.textContent = txt; }
  showFps(on) { this.fpsEl.style.display = on ? '' : 'none'; }
  fps(v) { this.fpsEl.textContent = v.toFixed(0) + ' fps'; }

  /** aviso pequeno (entrada) — no máximo 3 na tela */
  toast(user, text) {
    this.toastQ.push({ user, text });
    if (this.toastQ.length > 6) this.toastQ.splice(0, this.toastQ.length - 6);
    this._drain();
  }
  _drain() {
    if (!this.toastQ.length) return;
    const now = performance.now();
    if (now - this.lastToast < 450) { clearTimeout(this._dt); this._dt = setTimeout(() => this._drain(), 460); return; }
    this.lastToast = now;
    const { user, text } = this.toastQ.shift();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="ti" style="${bg(user.pic)}"></div><span><b>${esc(user.name)}</b> ${esc(text)}</span>`;
    this.toastsEl.prepend(el);
    while (this.toastsEl.children.length > 3) this.toastsEl.lastElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 3200);
    if (this.toastQ.length) setTimeout(() => this._drain(), 460);
  }

  /** faixa de presente (uma por vez) */
  gift(user, giftName, count) {
    this.giftQueue.push({ user, giftName, count });
    if (this.giftQueue.length > 5) this.giftQueue.shift();
    this._nextGift();
  }
  _nextGift() {
    if (this.giftBusy || !this.giftQueue.length) return;
    this.giftBusy = true;
    const { user, giftName, count } = this.giftQueue.shift();
    const el = document.createElement('div');
    el.className = 'gift-banner';
    el.innerHTML = `<div class="ti" style="${bg(user.pic)}"></div><div>${esc(user.name)}<small>enviou ${esc(giftName)}${count > 1 ? ' ×' + count : ''} 💝</small></div>`;
    this.giftEl.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { el.remove(); this.giftBusy = false; this._nextGift(); }, 500);
    }, 3000);
  }
}
