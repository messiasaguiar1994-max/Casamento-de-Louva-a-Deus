// =============================================================
//  TELA INICIAL DO APLICATIVO (igual aos outros apps da live):
//  @ do TikTok, Conectar, ENTRAR NA FESTA, configurações,
//  música, testes sem live e o que está chegando da live.
//  Durante a festa: toque na tela -> aparece o botão ⚙ Menu.
// =============================================================
import { saveConfig } from '../config.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function buildMenu(game, { onPlay }) {
  const cfg = game.cfg;
  const css = document.createElement('style');
  css.textContent = `
  #menu{position:fixed;inset:0;z-index:9999;overflow:auto;background:linear-gradient(180deg,#5a1f4a,#24102c);color:#fff;
    font-family:system-ui,-apple-system,Roboto,sans-serif;padding:max(22px,env(safe-area-inset-top)) 20px 30px;box-sizing:border-box;user-select:none}
  #menu.fora{display:none}
  #menu h1{font-size:26px;margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #menu .pill{font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:#5b3a6b;color:#f3dcff}
  #menu .pill.ok{background:#1f6f45;color:#c9ffd9}#menu .pill.ruim{background:#7a2b2b;color:#ffd6d6}
  #menu label{display:block;margin:18px 0 6px;color:#f0cbe0;font-size:15px}
  #menu input[type=text],#menu select{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border-radius:14px;border:1px solid #8a4f7c;background:#3a1838;color:#fff;user-select:text}
  #menu .lin{display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap}
  #menu button{font-size:17px;font-weight:700;border:0;border-radius:14px;padding:12px 16px;background:#7a3a6e;color:#fff}
  #menu .bola{width:14px;height:14px;border-radius:50%;background:#777;flex:none}
  #menu .bola.ok{background:#3ddc84;box-shadow:0 0 8px #3ddc84}#menu .bola.esp{background:#ffcc33}#menu .bola.ruim{background:#ff5b5b}
  #menu #jogar{width:100%;margin-top:18px;font-size:28px;padding:18px;background:linear-gradient(90deg,#ff5fa0,#ffb36b);color:#3a0a24}
  #menu .cx{margin-top:22px;background:#3c1a3e;border:1px solid #6e3a66;border-radius:16px;padding:12px 14px}
  #menu summary{font-size:16px;font-weight:700}
  #menu .dica{color:#e8bfd8;font-size:14px;line-height:1.45;margin-top:8px}
  #menu #m-log{margin-top:10px;font-size:13px;color:#ffe3f2;max-height:150px;overflow:auto;white-space:pre-wrap}
  #menu-btn{position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:9000;font-size:18px;font-weight:800;border:0;border-radius:99px;
    padding:10px 16px;background:rgba(40,10,40,.85);color:#fff;border:2px solid #ffb3cf;display:none}
  `;
  document.head.appendChild(css);

  const m = document.createElement('div');
  m.id = 'menu';
  m.innerHTML = `
    <h1>🧟 Casamento Zumbi <span id="m-sv" class="pill">servidor ?</span></h1>
    <label for="m-usu">Usuário do TikTok da live</label>
    <input type="text" id="m-usu" placeholder="@seu_usuario" autocomplete="off" autocapitalize="off" spellcheck="false" value="${cfg.username ? '@' + esc(cfg.username) : ''}">
    <div class="lin"><button id="m-con">Conectar</button><span id="m-bola" class="bola"></span><span id="m-est">desconectado</span></div>
    <button id="jogar">▶ ENTRAR NA FESTA</button>
    <div class="dica">Pode jogar sem live também. Durante a festa, <b>toque na tela</b>: aparece o botão <b>⚙ Menu</b> no canto de cima para voltar aqui.</div>

    <details class="cx"><summary>⚙️ Configurações</summary>
      <label for="m-srv">Endereço do servidor</label>
      <input type="text" id="m-srv" placeholder="https://seu-servidor.onrender.com" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(cfg.server)}">
      <div class="lin"><button id="m-salva">Salvar e testar</button></div>
      <label for="m-q">Qualidade da imagem</label>
      <select id="m-q"><option value="high">Alta</option><option value="medium">Média (recomendada)</option><option value="low">Baixa (celular travando)</option></select>
      <label for="m-lim">Máximo de convidados na festa</label>
      <select id="m-lim">${[30, 50, 70, 100, 150, 200].map((n) => `<option value="${n}">${n}</option>`).join('')}</select>
      <label for="m-noivo">Nome do noivo</label><input type="text" id="m-noivo" value="${esc(cfg.groomName)}">
      <label for="m-noiva">Nome da noiva</label><input type="text" id="m-noiva" value="${esc(cfg.brideName)}">
      <div class="lin"><button id="m-painel">Painel completo (presentes, testes...)</button></div>
    </details>

    <details class="cx"><summary>🎵 Música de fundo</summary>
      <div class="dica">O jogo já tem músicas próprias. Se quiser, escolha músicas do seu celular: elas tocam em sequência, sem parar.</div>
      <div class="lin"><button id="m-mus">➕ Escolher músicas</button><button id="m-musx">Músicas do jogo</button></div>
      <input id="m-musf" type="file" accept="audio/*" multiple style="display:none">
      <div class="dica" id="m-musl">tocando as músicas do jogo</div>
      <label for="m-bpm">Ritmo da dança (para as suas músicas)</label>
      <select id="m-bpm"><option value="130">Piseiro mais calmo</option><option value="150">Piseiro normal</option><option value="165">Piseiro acelerado</option><option value="180">Muito rápido</option></select>
      <label for="m-musv">Volume da música</label>
      <input id="m-musv" type="range" min="0" max="1" step="0.05" value="${cfg.musicVolume}" style="width:100%">
    </details>

    <details class="cx"><summary>🧪 Testar sem live</summary>
      <div class="dica">Coloca espectadores de mentira na festa para ver se está tudo funcionando.</div>
      <div class="lin"><button data-g="Rose,1">🌹 Rosa (entra)</button><button data-t="dez">+10 com rosa</button></div>
      <div class="lin"><button data-g="Tiny Diny,10">🦖 Tiny Dino (músico)</button></div>
      <div class="lin"><button data-g="Doughnut,30">🍩 Rosquinha (noivo/a)</button><button data-g="Capybara,30">🦫 Capivara (noivo/a)</button></div>
    </details>

    <details class="cx"><summary>📋 O que está chegando da live</summary><div id="m-log">nada ainda</div></details>
  `;
  document.body.appendChild(m);
  const $ = (id) => document.getElementById(id);
  const save = () => saveConfig(cfg);
  $('m-q').value = cfg.quality;
  $('m-bpm').value = String(cfg.danceBpm || 150);
  $('m-lim').value = String([30, 50, 70, 100, 150, 200].reduce((a, b) => (Math.abs(b - cfg.limit) < Math.abs(a - cfg.limit) ? b : a)));

  // botão flutuante para voltar ao menu
  const back = document.createElement('button');
  back.id = 'menu-btn'; back.textContent = '⚙ Menu';
  document.body.appendChild(back);
  let hideT = null;
  const showBack = () => {
    if (!m.classList.contains('fora')) return;
    back.style.display = 'block';
    clearTimeout(hideT); hideT = setTimeout(() => { back.style.display = 'none'; }, 3500);
  };
  window.addEventListener('pointerdown', (e) => { if (!(e.target instanceof Node) || (e.target !== back && !document.getElementById('panel').contains(e.target))) showBack(); });
  back.onclick = () => { back.style.display = 'none'; m.classList.remove('fora'); };

  // ---------- estado da conexão ----------
  const estado = (cls, txt) => { $('m-bola').className = 'bola ' + cls; $('m-est').textContent = txt; };
  game.onMenuStatus = (state, msg) => {
    estado(state === 'live' ? 'ok' : state === 'error' ? 'ruim' : state === 'idle' ? '' : 'esp', msg);
    if (state === 'server' || state === 'live' || state === 'connecting' || state === 'error') { $('m-sv').className = 'pill ok'; $('m-sv').textContent = 'servidor ok'; }
  };
  const linhas = [];
  game.onLog = (t) => {
    linhas.unshift(new Date().toLocaleTimeString().slice(0, 5) + '  ' + t);
    linhas.length = Math.min(linhas.length, 30);
    $('m-log').textContent = linhas.join('\n');
  };

  async function testaServidor() {
    const p = $('m-sv');
    if (!cfg.server) { p.className = 'pill ruim'; p.textContent = 'sem servidor'; return false; }
    p.className = 'pill'; p.textContent = 'acordando servidor...';
    for (let i = 0; i < 8; i++) { // servidor grátis pode estar "dormindo": até ~1 minuto para acordar
      try {
        const c = new AbortController(), t = setTimeout(() => c.abort(), 15000);
        const r = await fetch(cfg.server + '/status', { signal: c.signal, cache: 'no-store' }); clearTimeout(t);
        const j = await r.json();
        if (j.ok) { p.className = 'pill ok'; p.textContent = 'servidor ok'; return true; }
      } catch { /* tenta de novo */ }
      await new Promise((r) => setTimeout(r, 3000));
    }
    p.className = 'pill ruim'; p.textContent = 'servidor fora do ar'; return false;
  }

  $('m-con').onclick = () => {
    const u = $('m-usu').value.trim().replace(/^@/, '').replace(/\s+/g, '');
    if (!u) { estado('ruim', 'digite o usuário da live'); return; }
    if (!cfg.server) { estado('ruim', 'coloque o endereço do servidor em Configurações'); return; }
    cfg.username = u; save();
    $('m-usu').value = '@' + u;
    estado('esp', 'conectando... (o servidor pode levar até 1 minuto para acordar)');
    game.connect(u);
  };
  $('jogar').onclick = () => { m.classList.add('fora'); onPlay(); };
  $('m-salva').onclick = () => {
    cfg.server = game.cleanServer($('m-srv').value); $('m-srv').value = cfg.server; save();
    testaServidor();
    if (cfg.username) game.connect(cfg.username);
  };
  $('m-q').onchange = (e) => { cfg.quality = e.target.value; save(); game.setQuality(cfg.quality); };
  $('m-lim').onchange = (e) => { cfg.limit = Number(e.target.value); save(); game.crowd.setLimit(cfg.limit); };
  $('m-noivo').oninput = (e) => { cfg.groomName = e.target.value; save(); game.updateCoupleLabels(); };
  $('m-noiva').oninput = (e) => { cfg.brideName = e.target.value; save(); game.updateCoupleLabels(); };
  $('m-painel').onclick = () => { m.classList.add('fora'); onPlay(); document.getElementById('panel').classList.remove('hidden'); };

  // música
  $('m-mus').onclick = () => $('m-musf').click();
  $('m-musf').onchange = (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    game.audio.unlock(); game.audio.setFiles(files);
    $('m-musl').textContent = files.map((f) => '♪ ' + f.name.replace(/\.[^.]+$/, '')).join('\n');
  };
  $('m-musx').onclick = () => { game.audio.unlock(); game.audio.useSynth(); $('m-musl').textContent = 'tocando as músicas do jogo'; };
  $('m-bpm').onchange = (e) => { cfg.danceBpm = Number(e.target.value); save(); game.audio.fileBpm = cfg.danceBpm; if (game.audio.mode === 'files') game.audio.bpm = cfg.danceBpm; };
  $('m-musv').oninput = (e) => { cfg.musicVolume = Number(e.target.value); save(); game.audio.setMusicVolume(cfg.musicVolume); };

  // testes (fecham o menu para você ver o que acontece)
  const playAnd = (fn) => { m.classList.add('fora'); onPlay(); setTimeout(fn, 300); };
  m.querySelectorAll('[data-g]').forEach((b) => {
    b.onclick = () => playAnd(() => { const [name, d] = b.dataset.g.split(','); game.event({ type: 'gift', user: game.testUser(), giftName: name, diamonds: Number(d), count: 1 }); });
  });
  m.querySelector('[data-t="dez"]').onclick = () => playAnd(() => game.addTest(10, false));

  if (cfg.server) testaServidor();
  return { el: m };
}
