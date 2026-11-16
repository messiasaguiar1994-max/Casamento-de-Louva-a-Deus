// =============================================================
//  ÁUDIO 100% gerado pelo jogo (sem arquivos, sem direitos):
//  - "Marcha dos Noivos": arranjo divertido do Coro Nupcial de
//    Wagner (1850, domínio público) + final original
//  - "Festa dos Louvas" (dance/pop original)
//  - "Forró do Louva" (forró/baião original)
//  - efeitos: chegada, presentes, foguete, beijo, comemoração...
//  Também toca músicas MP3 do seu computador (escolhidas no painel).
//  O relógio usa um Worker para não falhar quando a janela perde foco.
// =============================================================

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, Ab: 8, A: 9, Bb: 10, B: 11 };
const n = (s) => { const m = s.match(/^([A-G][#b]?)(-?\d)$/); return 12 * (Number(m[2]) + 1) + NOTE[m[1]]; };
const CH = { // acordes (notas MIDI na 3ª/4ª oitava)
  F: ['F3', 'A3', 'C4'], C: ['C3', 'E3', 'G3'], C7: ['C3', 'E3', 'Bb3'], Bb: ['Bb2', 'D3', 'F3'], G: ['G2', 'B2', 'D3'],
  Am: ['A2', 'C3', 'E3'], Dm: ['D3', 'F3', 'A3'], D: ['D3', 'F#3', 'A3'], Em: ['E3', 'G3', 'B3'], D7: ['D3', 'F#3', 'C4'],
};
const root = (c) => n(CH[c][0]);

// ---------------- músicas ----------------
function marchSong() {
  // melodia: [nota, duração em batidas]
  const mel = [
    ['C4', 1], ['F4', 0.75], ['F4', 0.25], ['F4', 2],
    ['C4', 1], ['G4', 0.75], ['E4', 0.25], ['F4', 2],
    ['C4', 1], ['F4', 0.75], ['Bb4', 0.25], ['Bb4', 1], ['A4', 0.75], ['G4', 0.25], ['F4', 1], ['E4', 0.75], ['F4', 0.25], ['G4', 2],
    ['C4', 1], ['F4', 0.75], ['F4', 0.25], ['F4', 2],
    ['C4', 1], ['G4', 0.75], ['E4', 0.25], ['F4', 2],
    // final original (festa!)
    ['A4', 0.5], ['Bb4', 0.5], ['C5', 1], ['A4', 0.5], ['F4', 0.5], ['G4', 1], ['E4', 0.5], ['C4', 0.5], ['F4', 2], ['R', 2],
  ];
  const chords = ['F', 'F', 'C', 'F', 'F', 'Bb', 'F', 'C', 'F', 'F', 'C', 'F', 'F', 'C7', 'F', 'F'];
  return { name: 'Marcha dos Noivos', bpm: 96, beatsPerBar: 4, mel, chords, style: 'march' };
}
function danceSong() {
  const chords = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];
  const motifA = [[0, 'E5', 1], [1.5, 'G5', 0.5], [2, 'A5', 1], [3, 'G5', 0.5], [3.5, 'E5', 0.5]];
  const motifB = [[0, 'D5', 1], [1.5, 'E5', 0.5], [2, 'G5', 1.5], [3.5, 'D5', 0.5]];
  const motifC = [[0, 'C5', 0.5], [0.5, 'E5', 0.5], [1, 'A5', 1], [2, 'G5', 0.5], [2.5, 'E5', 0.5], [3, 'C5', 1]];
  const motifD = [[0, 'D5', 0.5], [0.5, 'B4', 0.5], [1, 'G4', 1], [2.5, 'A4', 0.5], [3, 'B4', 1]];
  const bars = [motifA, motifB, motifC, motifD, motifA, motifB, motifC, [[0, 'D5', 1], [1, 'G5', 1], [2, 'C6', 2]]];
  return { name: 'Festa dos Louvas', bpm: 132, beatsPerBar: 4, chords, bars, style: 'dance' };
}
function forroSong() {
  const chords = ['G', 'G', 'C', 'D7', 'G', 'Em', 'C', 'D7'];
  const bars = [
    [[0, 'B4', 0.5], [0.5, 'D5', 0.5], [1, 'G5', 1], [2, 'F#5', 0.5], [2.5, 'E5', 0.5], [3, 'D5', 1]],
    [[0, 'B4', 0.5], [0.5, 'C5', 0.5], [1, 'D5', 1.5], [2.5, 'B4', 0.5], [3, 'G4', 1]],
    [[0, 'C5', 0.5], [0.5, 'E5', 0.5], [1, 'G5', 1], [2, 'E5', 0.5], [2.5, 'C5', 0.5], [3, 'E5', 1]],
    [[0, 'D5', 0.5], [0.5, 'F#5', 0.5], [1, 'A5', 1], [2, 'F#5', 0.5], [2.5, 'D5', 0.5], [3, 'C5', 1]],
    [[0, 'B4', 0.5], [0.5, 'D5', 0.5], [1, 'G5', 1], [2, 'A5', 0.5], [2.5, 'G5', 0.5], [3, 'D5', 1]],
    [[0, 'E5', 0.5], [0.5, 'G5', 0.5], [1, 'B5', 1], [2, 'A5', 0.5], [2.5, 'G5', 0.5], [3, 'E5', 1]],
    [[0, 'E5', 0.5], [0.5, 'D5', 0.5], [1, 'C5', 0.5], [1.5, 'E5', 0.5], [2, 'G5', 1], [3, 'E5', 1]],
    [[0, 'F#5', 0.5], [0.5, 'A5', 0.5], [1, 'D6', 1], [2, 'C6', 0.5], [2.5, 'A5', 0.5], [3, 'F#5', 1]],
  ];
  return { name: 'Piseiro do Louva', bpm: 152, beatsPerBar: 4, chords, bars, style: 'forro' };
}
export const SONGS = [forroSong(), danceSong(), marchSong()]; // 0 e 1 tocam em rodízio; a marcha só quando pedir

// ---------------- relógio (Worker) ----------------
function makeTicker(cb) {
  try {
    const src = 'let id; onmessage = (e) => { clearInterval(id); if (e.data > 0) id = setInterval(() => postMessage(0), e.data); };';
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    w.onmessage = cb;
    return { start: (ms) => w.postMessage(ms), stop: () => w.postMessage(0) };
  } catch {
    let id;
    return { start: (ms) => { clearInterval(id); id = setInterval(cb, ms); }, stop: () => clearInterval(id) };
  }
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicVol = 0.55;
    this.sfxVol = 0.8;
    this.songIdx = 0;
    this.playing = false;
    this.beatOffset = 0;
    this.bpm = SONGS[0].bpm;
    this.files = [];         // músicas MP3 do usuário
    this.fileBpm = 150;      // ritmo das danças com MP3
    this.fileIdx = 0;
    this.mode = 'synth';     // 'synth' | 'files'
    this.onSong = () => {};
    this.audioEl = null;
    this._lastBeatTime = 0;
  }

  /** precisa ser chamado após um clique/tecla (regra dos navegadores) */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = this.musicVol; this.music.connect(this.master);
    this.fx = ctx.createGain(); this.fx.gain.value = this.sfxVol; this.fx.connect(this.master);
    // reverb simples
    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.rev = ctx.createConvolver(); this.rev.buffer = ir;
    const rg = ctx.createGain(); rg.gain.value = 0.18; this.rev.connect(rg).connect(this.master);
    // ruído
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    this.ticker = makeTicker(() => this._schedule());
  }

  get ready() { return !!this.ctx; }
  setMusicVolume(v) { this.musicVol = v; if (this.music) this.music.gain.value = v; if (this.audioEl) this.audioEl.volume = Math.min(1, v * 1.4); }
  setSfxVolume(v) { this.sfxVol = v; if (this.fx) this.fx.gain.value = v; }

  /** batida atual (para as danças acompanharem a música) */
  beat(fallbackTime) {
    if (this.playing && this.mode === 'synth' && this.ctx) {
      return (this.ctx.currentTime - this.songStart) * (this.song.bpm / 60);
    }
    return fallbackTime * (this.bpm / 60);
  }

  // ---------------- músicas ----------------
  play(idx = this.songIdx) {
    if (!this.ctx) return;
    this.stop();
    if (this.mode === 'files' && this.files.length) return this._playFile();
    this.songIdx = (idx + SONGS.length) % SONGS.length;
    this.song = SONGS[this.songIdx];
    this.bpm = this.song.bpm;
    this.playing = true;
    this.songStart = this.ctx.currentTime + 0.1;
    this.nextStep = 0;      // em semicolcheias (1/4 de batida)
    this.repeats = 0;
    this.ticker.start(25);
    this.onSong(this.song.name);
  }
  stop() {
    this.playing = false;
    if (this.ticker) this.ticker.stop();
    if (this.audioEl) { this.audioEl.pause(); }
  }
  next() { if (this.mode === 'files' && this.files.length) { this.fileIdx = (this.fileIdx + 1) % this.files.length; this.play(); } else this.play((this.songIdx + 1) % 2); }
  playMarch() { this.mode = 'synth'; this.play(2); }

  setFiles(fileList) {
    for (const u of this.files) URL.revokeObjectURL(u.url);
    this.files = [...fileList].map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    this.fileIdx = 0;
    if (this.files.length) { this.mode = 'files'; this.play(); }
  }
  useSynth() { this.mode = 'synth'; this.play(0); }
  _playFile() {
    const f = this.files[this.fileIdx];
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.addEventListener('ended', () => { this.fileIdx = (this.fileIdx + 1) % this.files.length; this._playFile(); });
    }
    this.audioEl.src = f.url;
    this.audioEl.volume = Math.min(1, this.musicVol * 1.4);
    this.audioEl.play().catch(() => {});
    this.playing = true;
    this.bpm = this.fileBpm || 150;
    this.onSong(f.name.replace(/\.[^.]+$/, ''));
  }

  _schedule() {
    if (!this.playing || !this.ctx) return;
    const s = this.song, spb = 60 / s.bpm, stepDur = spb / 4;
    const ahead = document.hidden ? 1.5 : 0.25;
    const totalSteps = (s.style === 'march' ? s.chords.length : s.bars.length) * s.beatsPerBar * 4;
    while (this.songStart + this.nextStep * stepDur < this.ctx.currentTime + ahead) {
      const step = this.nextStep % totalSteps;
      const t = this.songStart + this.nextStep * stepDur;
      this._step(s, step, t, stepDur);
      this.nextStep++;
      if (step === totalSteps - 1) {
        this.repeats++;
        if (this.repeats >= (s.style === 'march' ? 1 : 4)) { // troca de música depois de algumas voltas
          const after = this.songStart + this.nextStep * stepDur;
          const ms = Math.max(0, (after - this.ctx.currentTime) * 1000);
          setTimeout(() => this.playing && this.song === s && this.play(s.style === 'march' ? 0 : (this.songIdx + 1) % 2), ms);
          this.ticker.stop();
          return;
        }
      }
    }
  }

  _step(s, step, t, sd) {
    const beatInBar = (step / 4) % s.beatsPerBar;
    const bar = Math.floor(step / (4 * s.beatsPerBar));
    const sixteenth = step % 4;
    const chord = s.chords[bar % s.chords.length];
    const out = this.music;
    if (s.style === 'march') {
      // melodia
      if (!s._melSteps) { s._melSteps = []; let acc = 0; for (const [nn, d] of s.mel) { s._melSteps.push([Math.round(acc * 4), nn, d]); acc += d; } }
      for (const [st, nn, d] of s._melSteps) if (st === step && nn !== 'R') {
        this.kazoo(n(nn), t, d * sd * 4 * 0.95, out, 0.16);
        this.bell(n(nn) + 12, t, 0.07, out);
      }
      if (sixteenth === 0) {
        const b = Math.floor(beatInBar);
        if (b % 2 === 0) { this.bass(root(chord) - 12, t, sd * 3, out, 0.5); this.kick(t, out, 0.5); }
        else { for (const nn of CH[chord]) this.pluck(n(nn) + 12, t, out, 0.07); this.snare(t, out, 0.18); }
      }
      if (step % 16 === 0) this.pad(CH[chord].map((x) => n(x) + 12), t, sd * 16, out, 0.05);
      return;
    }
    // ---- dance / forró ----
    const notes = s.bars[bar % s.bars.length];
    for (const [b, nn, d] of notes) if (Math.round(b * 4) === step % 16) {
      if (s.style === 'forro') { this.accordion(n(nn), t, d * sd * 4 * 0.9, out, 0.11); }
      else { this.lead(n(nn), t, d * sd * 4 * 0.9, out, 0.1); this.bell(n(nn) + 12, t, 0.035, out); }
    }
    if (s.style === 'dance') {
      if (sixteenth === 0) this.kick(t, out, 0.85);
      if (sixteenth === 2) this.hat(t, out, 0.14, 0.05);
      if (sixteenth === 0 && (beatInBar === 1 || beatInBar === 3)) this.clap(t, out, 0.3);
      if (step % 2 === 0) this.hat(t, out, 0.04, 0.02);
      const bassPat = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1];
      if (bassPat[step % 16]) this.bass(root(chord) - 12 + (step % 8 === 6 ? 12 : 0), t, sd * 0.9, out, 0.42);
      if (step % 16 === 0) this.pad(CH[chord].map((x) => n(x) + 12), t, sd * 16, out, 0.05);
      if (sixteenth === 2 && beatInBar % 1 === 0) for (const x of CH[chord]) this.pluck(n(x) + 12, t, out, 0.035);
    } else {
      // baião: zabumba (1, 1.75? ) + triângulo
      const zab = { 0: 0.9, 3: 0.6, 8: 0.8, 11: 0.5 };
      if (zab[step % 16] !== undefined) this.kick(t, out, zab[step % 16] * 0.8);
      if (step % 16 === 4 || step % 16 === 12) this.snare(t, out, 0.12);
      this.triangle(t, out, sixteenth === 0 ? 0.05 : sixteenth === 2 ? 0.08 : 0.025, sixteenth === 2 ? 0.25 : 0.06);
      const bassPat = { 0: 0, 3: 7, 6: 12, 8: 0, 11: 7, 14: 5 };
      if (bassPat[step % 16] !== undefined) this.bass(root(chord) - 12 + bassPat[step % 16], t, sd * 1.6, out, 0.45);
      if (step % 8 === 4) for (const x of CH[chord]) this.accordion(n(x) + 12, t, sd * 1.5, out, 0.035);
    }
  }

  // ---------------- instrumentos ----------------
  _env(g, t, a, peak, d, sus, rel, end) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sus, t + a, d);
    g.gain.setTargetAtTime(0, end, rel);
  }
  _osc(type, f, t, end) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + 0.6); return o; }
  lead(m, t, dur, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(1800, t + dur); f.Q.value = 3;
    for (const [type, det] of [['sawtooth', -7], ['square', 6]]) { const o = this._osc(type, mtof(m), t, t + dur); o.detune.value = det; o.connect(f); }
    this._env(g, t, 0.01, vol, 0.12, 0.6, 0.06, t + dur);
    f.connect(g); g.connect(out); g.connect(this.rev);
  }
  kazoo(m, t, dur, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
    f2.type = 'peaking'; f2.frequency.value = 600; f2.gain.value = 8;
    const o = this._osc('sawtooth', mtof(m), t, t + dur);
    const lfo = this._osc('sine', 5.5, t, t + dur), lg = c.createGain(); lg.gain.value = 9; lfo.connect(lg).connect(o.detune);
    o.connect(f2).connect(f);
    this._env(g, t, 0.03, vol, 0.2, 0.8, 0.05, t + dur);
    f.connect(g); g.connect(out); g.connect(this.rev);
  }
  accordion(m, t, dur, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2600;
    for (const det of [-9, 0, 9]) { const o = this._osc(det ? 'sawtooth' : 'square', mtof(m), t, t + dur); o.detune.value = det; o.connect(f); }
    const trem = this._osc('sine', 6, t, t + dur), tg = c.createGain(); tg.gain.value = vol * 0.25; trem.connect(tg).connect(g.gain);
    this._env(g, t, 0.02, vol, 0.1, 0.85, 0.05, t + dur);
    f.connect(g); g.connect(out); g.connect(this.rev);
  }
  bell(m, t, vol, out) {
    const c = this.ctx, g = c.createGain();
    for (const [mul, v] of [[1, 1], [2.76, 0.4], [5.4, 0.2]]) { const o = this._osc('sine', mtof(m) * mul, t, t + 1.2); const og = c.createGain(); og.gain.value = v; o.connect(og).connect(g); }
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    g.connect(out); g.connect(this.rev);
  }
  pluck(m, t, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.25);
    this._osc('triangle', mtof(m), t, t + 0.4).connect(f);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    f.connect(g).connect(out);
  }
  pad(ms, t, dur, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400;
    for (const m of ms) for (const det of [-10, 10]) { const o = this._osc('sawtooth', mtof(m), t, t + dur); o.detune.value = det; o.connect(f); }
    this._env(g, t, 0.4, vol, 1, 0.8, 0.4, t + dur - 0.2);
    f.connect(g); g.connect(out); g.connect(this.rev);
  }
  bass(m, t, dur, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + dur);
    this._osc('triangle', mtof(m), t, t + dur).connect(f);
    const o2 = this._osc('square', mtof(m), t, t + dur); const g2 = c.createGain(); g2.gain.value = 0.3; o2.connect(g2).connect(f);
    this._env(g, t, 0.005, vol, 0.08, 0.7, 0.03, t + dur);
    f.connect(g).connect(out);
  }
  _noise(t, dur) { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
  kick(t, out, vol) {
    const c = this.ctx, g = c.createGain(), o = this._osc('sine', 150, t, t + 0.4);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(out);
  }
  snare(t, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    this._noise(t, 0.25).connect(f).connect(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    g.connect(out); g.connect(this.rev);
  }
  clap(t, out, vol) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
    this._noise(t, 0.3).connect(f).connect(g);
    g.gain.setValueAtTime(0, t);
    for (const d of [0, 0.012, 0.024]) { g.gain.setValueAtTime(vol, t + d); g.gain.exponentialRampToValueAtTime(vol * 0.2, t + d + 0.01); }
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    g.connect(out); g.connect(this.rev);
  }
  hat(t, out, vol, dur) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    this._noise(t, dur + 0.05).connect(f).connect(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out);
  }
  triangle(t, out, vol, dur) {
    const c = this.ctx, g = c.createGain();
    for (const f of [3520, 5280, 7040]) this._osc('sine', f, t, t + dur).connect(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out);
  }

  // ---------------- efeitos sonoros ----------------
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01, o = this.fx;
    const arp = (ms, step, type = 'bell', vol = 0.12) => ms.forEach((m, i) => type === 'bell' ? this.bell(m, t + i * step, vol, o) : this.pluck(m, t + i * step, o, vol));
    const glide = (f0, f1, dur, type = 'sine', vol = 0.2, at = t) => {
      const g = this.ctx.createGain(), s = this._osc(type, f0, at, at + dur);
      s.frequency.exponentialRampToValueAtTime(f1, at + dur);
      g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      s.connect(g).connect(o);
    };
    switch (name) {
      case 'arrive': arp([84, 88, 91, 96], 0.06, 'bell', 0.09); glide(300, 900, 0.12, 'sine', 0.15); break;
      case 'hearts': for (let i = 0; i < 3; i++) glide(500 + i * 150, 1100 + i * 200, 0.18, 'sine', 0.15, t + i * 0.12); arp([79, 83, 86], 0.1, 'bell', 0.06); break;
      case 'special': arp([72, 76, 79, 84, 88, 91, 96, 100], 0.045, 'pluck', 0.12); glide(800, 2400, 0.5, 'triangle', 0.06, t + 0.3); break;
      case 'padrinho': [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]].forEach((ch, i) => ch.forEach((m) => this.lead(m, t + i * 0.16, i === 3 ? 0.7 : 0.13, o, 0.06))); break;
      case 'vip': [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [72, 76, 79, 84]].forEach((ch, i) => ch.forEach((m) => this.lead(m, t + i * 0.2, i === 3 ? 1.4 : 0.17, o, 0.06))); this._cymbal(t + 0.6, 0.25); this.sfxCheer(t + 0.4, 1.5); break;
      case 'rocketPrep': glide(200, 700, 0.7, 'sawtooth', 0.05); break;
      case 'rocket': this._whoosh(t, 1.5, 0.35, true); break;
      case 'boom': this._boom(t); arp([72, 79, 84], 0.08, 'bell', 0.08); break;
      case 'land': glide(700, 200, 0.18, 'sine', 0.25); glide(200, 600, 0.25, 'sine', 0.2, t + 0.18); this._cartoonStars(t + 0.4); break;
      case 'cheer': this.sfxCheer(t, 1.6); break;
      case 'kiss': this._smack(t); this._aww(t + 0.35); break;
      case 'chirp': { const f = 1200 + Math.random() * 900; glide(f, f * (Math.random() < 0.5 ? 1.6 : 0.6), 0.09, 'square', 0.025); glide(f * 1.2, f * 1.9, 0.07, 'square', 0.02, t + 0.11); break; }
      case 'boing': glide(180, 520, 0.3, 'sine', 0.22); break;
      case 'click': glide(1200, 800, 0.04, 'square', 0.04); break;
      default: break;
    }
  }
  sfxCheer(t, dur) {
    // multidão de louva-a-deus comemorando: ruído "aaa" + assobios + chilreios
    const c = this.ctx, g = c.createGain();
    for (const [fq, q] of [[800, 3], [1200, 4], [2500, 5]]) {
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = q;
      this._noise(t, dur).connect(f).connect(g);
    }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.fx); g.connect(this.rev);
    for (let i = 0; i < 6; i++) {
      const at = t + Math.random() * dur * 0.6, f0 = 1300 + Math.random() * 1200;
      const gg = c.createGain(), s = this._osc('sine', f0, at, at + 0.35);
      s.frequency.linearRampToValueAtTime(f0 * 1.5, at + 0.15); s.frequency.linearRampToValueAtTime(f0 * 1.1, at + 0.3);
      gg.gain.setValueAtTime(0.05, at); gg.gain.exponentialRampToValueAtTime(0.0001, at + 0.33);
      s.connect(gg).connect(this.fx);
    }
  }
  _cymbal(t, vol) { const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000; this._noise(t, 1.6).connect(f).connect(g); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); g.connect(this.fx); g.connect(this.rev); }
  _whoosh(t, dur, vol, rising) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(rising ? 300 : 2000, t); f.frequency.exponentialRampToValueAtTime(rising ? 3000 : 200, t + dur);
    this._noise(t, dur).connect(f).connect(g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.fx);
  }
  _boom(t) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 600;
    this._noise(t, 1.2).connect(f).connect(g);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    g.connect(this.fx); g.connect(this.rev);
    this.kick(t, this.fx, 0.6);
  }
  _smack(t) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 1;
    this._noise(t, 0.05).connect(f).connect(g);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    g.connect(this.fx);
    const o = this._osc('sine', 900, t, t + 0.08), og = c.createGain();
    o.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    og.gain.setValueAtTime(0.2, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(og).connect(this.fx);
  }
  _aww(t) {
    // "óóóun" da plateia (vogal sintetizada)
    const c = this.ctx, g = c.createGain();
    for (let v = 0; v < 5; v++) {
      const f0 = 230 + v * 37;
      const o = this._osc('sawtooth', f0 * 1.15, t, t + 1.4);
      o.frequency.linearRampToValueAtTime(f0 * 0.85, t + 1.3);
      for (const [fq, gain] of [[600, 1], [1000, 0.5], [2600, 0.15]]) {
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = 6;
        const fg = c.createGain(); fg.gain.value = gain; o.connect(f).connect(fg).connect(g);
      }
    }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    g.connect(this.fx); g.connect(this.rev);
  }
  _cartoonStars(t) { [96, 100, 103, 100, 96].forEach((m, i) => this.bell(m, t + i * 0.09, 0.05, this.fx)); }
}
