// =============================================================
//  PAINEL ADMINISTRATIVO — abre/fecha com a tecla P
//  (ou o botão ⚙ quase invisível no canto inferior direito)
// =============================================================
import { ACTIONS, DEFAULT_CONFIG, saveConfig } from '../config.js';
import { ANIMS } from '../mantis/anims.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ANIM_NAMES = {
  piseiro: 'Passinho de piseiro', passinho: 'Passinho cruzado', arrasta: 'Arrasta-pé', tremidinha: 'Tremidinha', sapateado: 'Sapateado', pulapula: 'Pula-pula',
  idle: 'Parado', walk: 'Caminhada', sway: 'Dança balanço', armsUp: 'Bracinhos pra cima', disco: 'Disco', wiggle: 'Requebrado',
  bounce: 'Pulinhos', robot: 'Robô', wave: 'Onda', special: 'Dança especial', celebrate: 'Comemoração', surprise: 'Surpresa',
  romantic: 'Romântica', kiss: 'Beijo', hello: 'Acenar', clap: 'Palmas', dizzy: 'Tonto', fly: 'Voando', bow: 'Reverência', highfive: 'Toca aqui',
};

export function buildPanel(el, game) {
  const cfg = game.cfg;
  const actOpts = (sel) => Object.entries(ACTIONS).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${v}</option>`).join('');
  el.innerHTML = `
  <div class="row" style="justify-content:space-between"><h2>⚙ Painel da Festa</h2><button class="dng" id="p-close">✕ Fechar</button></div>
  <div class="hint">Abre/fecha no botão ⚙ (canto de baixo) ou na tecla <b>P</b>. Feche o painel antes de transmitir.</div>

  <h3>Live do TikTok</h3>
  <div class="row"><input type="text" id="p-user" placeholder="seu @usuario" value="${esc(cfg.username)}" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="pri" id="p-conn">Conectar</button></div>
  <div class="row" id="p-srv-row">Servidor: <input type="text" id="p-srv" value="${esc(cfg.server)}" placeholder="https://seu-servidor.onrender.com" autocapitalize="off" autocomplete="off" spellcheck="false"></div>
  <div class="status" id="p-status">—</div>
  <div class="hint">Só presentes contam: rosa entra na festa, 10 moedas vira músico, 30 moedas vira noivo/noiva.</div>

  <h3>Convidados</h3>
  <div class="row"><input type="text" id="p-name" placeholder="nome"><input type="text" id="p-pic" placeholder="link da foto (opcional)"></div>
  <div class="row"><button class="pri" id="p-add">Adicionar</button><button id="p-add10">+10 teste</button><button id="p-add50">+50 teste</button><button id="p-fill">Encher até o limite</button></div>
  <div class="row">Limite: <input type="number" id="p-limit" min="10" max="200" value="${cfg.limit}"><button id="p-limit-ok">Aplicar</button>
    Parentes: <input type="number" id="p-bots" min="0" max="20" value="${cfg.bots}"></div>
  <div class="hint">Parentes = personagens de enfeite que animam a festa vazia; saem primeiro quando lota.</div>
  <div class="list" id="p-list"></div>
  <div class="row"><button class="dng" id="p-clear">Limpar participantes</button><button class="dng" id="p-reset">Reiniciar festa</button></div>

  <h3>Testar eventos</h3>
  <div class="row">Quem: <select id="p-who" style="flex:1"></select></div>
  <div class="row"><input type="text" id="g-name" placeholder="nome do presente" value="Rose" style="flex:1"><input type="number" id="g-dia" value="1" title="diamantes"><input type="number" id="g-cnt" value="1" title="quantidade"></div>
  <div class="row"><button class="pri" id="g-send">Simular presente</button></div>
  <div class="row"><button data-g="Rose,1">🌹 Rosa</button><button data-g="Tiny Diny,10">🦖 Tiny Dino (músico)</button><button data-g="Doughnut,30">🍩 Rosquinha (noivo/a)</button><button data-g="Capybara,30">🦫 Capivara (noivo/a)</button></div>

  <h3>Ações dos presentes</h3>
  <div class="hint">Palavras = parte do nome do presente (em inglês ou português). Sem palavras, vale o valor mínimo em diamantes (o maior que couber).</div>
  <div class="rule" style="font-weight:700"><span>Palavras</span><span>Mín. 💎</span><span>Ação</span><span></span></div>
  <div id="p-rules"></div>
  <div class="row"><button id="r-add">+ Regra</button><button id="r-def">Restaurar padrão</button></div>

  <h3>Noivos</h3>
  <div class="row"><input type="text" id="n-groom" value="${esc(cfg.groomName)}" placeholder="nome do noivo"><input type="text" id="n-bride" value="${esc(cfg.brideName)}" placeholder="nome da noiva"></div>
  <div class="row"><button data-c="dance">💃 Dançar</button><button data-c="kiss">💋 Beijo</button><button data-c="celebrate">🎉 Comemorar</button><button data-c="surprise">😮 Surpresa</button></div>

  <h3>Todos os convidados</h3>
  <div class="row"><button id="t-group">Dança em grupo</button><button id="t-cele">Comemorar</button><button id="t-surp">Surpresa</button><button id="t-clap">Palmas</button><button id="t-conf">Confete</button></div>
  <div class="row">Testar animação: <select id="t-anim">${Object.keys(ANIMS).map((k) => `<option value="${k}">${ANIM_NAMES[k] || k}</option>`).join('')}</select><button id="t-anim-go">Todos</button></div>

  <h3>Música</h3>
  <div class="status" id="m-now">—</div>
  <div class="row"><button class="pri" id="m-play">▶ Tocar</button><button id="m-stop">⏸ Parar</button><button id="m-next">⏭ Próxima</button><button id="m-march">💒 Marcha</button></div>
  <div class="row">Música <input type="range" id="m-vol" min="0" max="1" step="0.05" value="${cfg.musicVolume}"> Efeitos <input type="range" id="s-vol" min="0" max="1" step="0.05" value="${cfg.sfxVolume}"></div>
  <div class="row"><label>Suas músicas (MP3): <input type="file" id="m-files" accept="audio/*" multiple></label></div>
  <div class="row"><button id="m-synth">Voltar às músicas do jogo</button></div>

  <h3>Câmera e imagem</h3>
  <div class="row">Câmera: <select id="c-mode"><option value="">Automática</option><option value="wide">Geral</option><option value="medium">Média</option><option value="couple">Noivos</option><option value="sweep">Passeio</option><option value="high">De cima</option><option value="altar">Altar</option></select></div>
  <div class="row">Qualidade: <select id="q-mode"><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa (PC fraco)</option></select>
    <label><input type="checkbox" id="q-fps" ${cfg.showFps ? 'checked' : ''}> FPS</label></div>
  <div class="hint">Atalhos: P painel · M música · Espaço beijo · G dança em grupo · F tela cheia</div>
  `;

  const $ = (id) => el.querySelector('#' + id);
  const save = () => saveConfig(cfg);
  $('q-mode').value = cfg.quality;

  // --- TikTok ---
  $('p-close').onclick = () => el.classList.add('hidden');
  if (!game.remote) $('p-srv-row').style.display = 'none';
  $('p-conn').onclick = () => {
    cfg.username = $('p-user').value.replace(/^@/, '').trim();
    cfg.server = game.cleanServer($('p-srv').value); $('p-srv').value = cfg.server;
    save(); game.connect(cfg.username);
  };
  game.onStatus = (state, msg) => { const s = $('p-status'); s.textContent = msg; s.className = 'status ' + (state === 'live' ? 'ok' : state === 'error' ? 'err' : ''); };

  // --- convidados ---
  $('p-add').onclick = () => {
    const name = $('p-name').value.trim(); if (!name) return;
    game.event({ type: 'chat', user: { id: 'manual_' + name.toLowerCase().replace(/\s+/g, '_'), name, pic: $('p-pic').value.trim() } });
    $('p-name').value = ''; $('p-pic').value = '';
  };
  $('p-add10').onclick = () => game.addTest(10, false);
  $('p-add50').onclick = () => game.addTest(50, true);
  $('p-fill').onclick = () => game.addTest(Math.max(0, cfg.limit - game.crowd.count), true);
  $('p-limit-ok').onclick = () => { cfg.limit = Math.max(10, Math.min(200, Number($('p-limit').value) || 100)); $('p-limit').value = cfg.limit; save(); game.crowd.setLimit(cfg.limit); };
  $('p-bots').onchange = (e) => { cfg.bots = Math.max(0, Math.min(20, Number(e.target.value) || 0)); save(); game.syncBots(); };
  $('p-clear').onclick = () => { game.crowd.clear(); refreshList(); };
  $('p-reset').onclick = () => game.reset();

  const refreshList = () => {
    const list = game.crowd.list;
    $('p-list').innerHTML = list.length ? list.map((g) => `<div><span>${esc(g.name)}${g.role !== 'guest' ? ' <i>(' + g.role + ')</i>' : ''}</span><button data-rm="${esc(g.id)}">✕</button></div>`).join('') : '<div><i>ninguém ainda</i></div>';
    const who = $('p-who'), cur = who.value;
    who.innerHTML = `<option value="">Novo convidado de teste</option>` + list.map((g) => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
    who.value = list.some((g) => g.id === cur) ? cur : '';
  };
  $('p-list').onclick = (e) => { const id = e.target.dataset.rm; if (id) { game.crowd.remove(id); refreshList(); } };
  setInterval(() => { if (!el.classList.contains('hidden') && document.activeElement?.id !== 'p-who') refreshList(); }, 1500);
  refreshList();

  // --- eventos de teste ---
  const who = () => {
    const id = $('p-who').value;
    const g = id && game.crowd.guests.get(id);
    return g ? { id: g.id, name: g.name, pic: g.pic } : game.testUser();
  };
  $('g-send').onclick = () => game.event({ type: 'gift', user: who(), giftName: $('g-name').value || 'Rose', diamonds: Number($('g-dia').value) || 1, count: Number($('g-cnt').value) || 1 });
  el.querySelectorAll('[data-g]').forEach((b) => {
    b.onclick = () => { const [name, d] = b.dataset.g.split(','); game.event({ type: 'gift', user: who(), giftName: name, diamonds: Number(d), count: 1 }); };
  });

  // --- regras ---
  const drawRules = () => {
    $('p-rules').innerHTML = cfg.rules.map((r, i) => `<div class="rule">
      <input type="text" data-i="${i}" data-k="words" value="${esc(r.words)}" placeholder="(qualquer)">
      <input type="number" data-i="${i}" data-k="min" value="${Number(r.min) || 0}">
      <select data-i="${i}" data-k="action">${actOpts(r.action)}</select>
      <button data-del="${i}">✕</button></div>`).join('');
  };
  $('p-rules').oninput = $('p-rules').onchange = (e) => {
    const i = e.target.dataset.i, k = e.target.dataset.k;
    if (i === undefined) return;
    cfg.rules[i][k] = k === 'min' ? Number(e.target.value) || 0 : e.target.value;
    save();
  };
  $('p-rules').onclick = (e) => { const d = e.target.dataset.del; if (d !== undefined) { cfg.rules.splice(Number(d), 1); save(); drawRules(); } };
  $('r-add').onclick = () => { cfg.rules.push({ words: '', min: 100, action: 'couple' }); save(); drawRules(); };
  $('r-def').onclick = () => { cfg.rules = structuredClone(DEFAULT_CONFIG.rules); save(); drawRules(); };
  drawRules();

  // --- noivos ---
  $('n-groom').oninput = (e) => { cfg.groomName = e.target.value; save(); game.updateCoupleLabels(); };
  $('n-bride').oninput = (e) => { cfg.brideName = e.target.value; save(); game.updateCoupleLabels(); };
  el.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => game.wedding.trigger(b.dataset.c); });

  // --- todos ---
  $('t-group').onclick = () => game.crowd.groupDance();
  $('t-cele').onclick = () => { game.crowd.react('celebrate'); game.audio.sfx('cheer'); };
  $('t-surp').onclick = () => { game.crowd.react('surprise'); game.audio.sfx('boing'); };
  $('t-clap').onclick = () => game.crowd.react('clap');
  $('t-conf').onclick = () => { if (game.crowd.list[0]) game.crowd.act(game.crowd.list[0], 'confetti'); };
  $('t-anim-go').onclick = () => {
    const a = $('t-anim').value;
    for (const g of game.crowd.list) if (!g.special) { g.anim.play(a, { dur: 6, next: 'piseiro' }); g.busy = 6; }
  };

  // --- música ---
  game.audio.onSong = (name) => { $('m-now').textContent = '♪ ' + name; };
  $('m-play').onclick = () => { game.audio.unlock(); game.audio.play(); };
  $('m-stop').onclick = () => game.audio.stop();
  $('m-next').onclick = () => { game.audio.unlock(); game.audio.next(); };
  $('m-march').onclick = () => { game.audio.unlock(); game.audio.playMarch(); };
  $('m-vol').oninput = (e) => { cfg.musicVolume = Number(e.target.value); save(); game.audio.setMusicVolume(cfg.musicVolume); };
  $('s-vol').oninput = (e) => { cfg.sfxVolume = Number(e.target.value); save(); game.audio.setSfxVolume(cfg.sfxVolume); };
  $('m-files').onchange = (e) => { game.audio.unlock(); game.audio.setFiles(e.target.files); };
  $('m-synth').onclick = () => { game.audio.unlock(); game.audio.useSynth(); };

  // --- câmera / qualidade ---
  $('c-mode').onchange = (e) => { game.camDir.locked = e.target.value || null; game.camDir.shotT = 0; };
  $('q-mode').onchange = (e) => { cfg.quality = e.target.value; save(); game.setQuality(cfg.quality); };
  $('q-fps').onchange = (e) => { cfg.showFps = e.target.checked; save(); game.hud.showFps(cfg.showFps); };

  return { refresh: refreshList };
}
