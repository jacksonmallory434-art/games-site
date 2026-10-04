/* MathAdvice game kit: shared look and feel for the canvas games.
   Gives every game a scaled crisp canvas, a glowing animated background, particles,
   floating score text, screen shake, synth sound effects, glassy menus and best scores.

   const K = MA.game({ slug, w, h, accent, accent2, bg: [top, bottom], start, update(dt), draw(ctx, t),
                       down(x, y), move(x, y), up(x, y), key(k, e) });
*/
(function () {
  'use strict';
  const MA = (window.MA = window.MA || {});

  // ---------- color helpers ----------
  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // amt > 0 mixes toward white, amt < 0 toward black
  function shade(hex, amt) {
    const [r, g, b] = rgb(hex), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const f = c => Math.round(c + (t - c) * p);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function alpha(hex, a) {
    const [r, g, b] = rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ---------- sound (tiny synth, no files) ----------
  let ac = null;
  let muted = false;
  try { muted = localStorage.getItem('ma-mute') === '1'; } catch (e) {}
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol = 0.15, from = 1800, to = 200) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, a.currentTime);
    f.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur);
    g.gain.value = vol;
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }
  const sfx = {
    click: () => tone(640, 0.06, 'triangle', 0.08),
    tick: () => tone(1300, 0.03, 'square', 0.025),
    good: () => { tone(660, 0.1, 'triangle', 0.12); tone(990, 0.16, 'triangle', 0.12, 0, 0.07); },
    bad: () => tone(200, 0.28, 'sawtooth', 0.07, -110),
    pop: () => tone(380, 0.12, 'sine', 0.16, 520),
    coin: () => { tone(988, 0.07, 'square', 0.05); tone(1319, 0.2, 'square', 0.05, 0, 0.06); },
    whoosh: () => noise(0.25, 0.12, 600, 3000),
    boom: () => { noise(0.45, 0.25, 900, 80); tone(90, 0.35, 'sine', 0.2, -50); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, 0, i * 0.09)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, 0, i * 0.14)),
    note: (f, d = 0.15) => tone(f, d, 'triangle', 0.1),
  };

  // ---------- math helpers ----------
  const U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    shuffle: arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    ease: t => 1 - Math.pow(1 - t, 3),
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  };

  // ---------- page styles ----------
  const css = `
  @font-face { font-family: "Lexend"; src: url("../../fonts/lexend.woff") format("woff"); font-weight: 100 900; font-display: swap; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #070a14; overflow: hidden; font-family: Lexend, system-ui, sans-serif; color: #eef1fb; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
  body { display: flex; align-items: center; justify-content: center; }
  .ma-stage { position: relative; overflow: hidden; }
  .ma-stage canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: default; }
  .ma-mute { position: absolute; right: .7em; bottom: .7em; width: 2.2em; height: 2.2em; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); background: rgba(10,14,30,.55); color: #fff; cursor: pointer; display: grid; place-items: center; z-index: 5; padding: 0; backdrop-filter: blur(4px); }
  .ma-mute svg { width: 1.1em; height: 1.1em; }
  .ma-ov { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, rgba(8,10,24,.55), rgba(4,5,12,.85)); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 4; opacity: 0; transition: opacity .25s; pointer-events: none; }
  .ma-ov.on { opacity: 1; pointer-events: auto; }
  .ma-card { position: relative; width: min(30em, 88%); max-height: 92%; overflow: auto; padding: 1.6em 1.6em 1.4em; border-radius: 1.3em; text-align: center;
    background: linear-gradient(160deg, rgba(36,42,78,.92), rgba(14,17,36,.94)); border: 1px solid rgba(255,255,255,.12);
    box-shadow: 0 1.4em 3em rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 4em var(--glow); transform: translateY(14px) scale(.96); transition: transform .35s cubic-bezier(.2,1.4,.4,1); }
  .ma-ov.on .ma-card { transform: none; }
  .ma-card::before { content: ""; position: absolute; left: 12%; right: 12%; top: -1px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, transparent, var(--a1), var(--a2), transparent); }
  .ma-kicker { font-size: .72em; letter-spacing: .28em; text-transform: uppercase; color: var(--a1); font-weight: 700; opacity: .9; }
  .ma-card h1 { margin: .15em 0 .2em; font-size: 2.5em; line-height: 1.05; font-weight: 800; letter-spacing: -.01em;
    background: linear-gradient(100deg, #fff 10%, var(--a1) 55%, var(--a2)); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 .08em .5em var(--glow)); }
  .ma-sub { color: #b8c0dc; margin: .2em 0 .8em; line-height: 1.45; font-size: .98em; }
  .ma-how { text-align: left; margin: .6em auto 0; padding: 0; list-style: none; max-width: 24em; }
  .ma-how li { position: relative; padding: .28em 0 .28em 1.6em; color: #d6dcf0; font-size: .9em; line-height: 1.4; }
  .ma-how li::before { content: ""; position: absolute; left: .3em; top: .78em; width: .5em; height: .5em; border-radius: 2px; transform: rotate(45deg); background: linear-gradient(135deg, var(--a1), var(--a2)); box-shadow: 0 0 .6em var(--a1); }
  .ma-score { font-size: 3.6em; font-weight: 800; line-height: 1; margin: .1em 0; color: #fff; text-shadow: 0 0 .4em var(--glow); font-variant-numeric: tabular-nums; }
  .ma-best { color: #9aa3c4; font-size: .95em; }
  .ma-badge { display: inline-block; margin: .5em 0 0; padding: .3em .8em; border-radius: 99em; font-size: .78em; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #160f00; background: linear-gradient(90deg, #ffd34d, #ff9f43); box-shadow: 0 0 1.2em rgba(255,190,60,.6); animation: ma-pulse 1.2s ease-in-out infinite; }
  @keyframes ma-pulse { 50% { transform: scale(1.07); } }
  .ma-row { display: flex; gap: .7em; justify-content: center; flex-wrap: wrap; margin-top: 1.2em; }
  .ma-btn { font: inherit; font-weight: 800; font-size: 1.1em; padding: .75em 1.9em; border-radius: .8em; border: 0; cursor: pointer; color: #0b0e1c;
    background: linear-gradient(180deg, var(--a1), var(--a2)); box-shadow: 0 .35em 0 rgba(0,0,0,.35), 0 0 1.6em var(--glow), inset 0 1px 0 rgba(255,255,255,.5); transition: transform .12s, filter .12s; }
  .ma-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
  .ma-btn:active { transform: translateY(2px); box-shadow: 0 .1em 0 rgba(0,0,0,.35), 0 0 1em var(--glow); }
  .ma-btn.ghost { background: rgba(255,255,255,.06); color: #dfe4f6; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); }
  .ma-lv { display: grid; grid-template-columns: repeat(5, 1fr); gap: .55em; margin: 1em auto .2em; max-width: 22em; }
  .ma-lv button { font: inherit; font-weight: 800; font-size: 1.05em; aspect-ratio: 1; border-radius: .7em; cursor: pointer; color: #fff; border: 1px solid rgba(255,255,255,.14);
    background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.03)); transition: transform .12s, border-color .12s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1em; padding: 0; }
  .ma-lv button:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--a1); box-shadow: 0 0 1em var(--glow); }
  .ma-lv button:disabled { opacity: .3; cursor: default; }
  .ma-lv button small { font-size: .55em; color: #ffd34d; letter-spacing: .1em; min-height: 1em; }
  .ma-lv button.done { border-color: rgba(255,211,77,.5); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/>';
  const ICON_ON = SPEAKER + '<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  const ICON_OFF = SPEAKER + '<path d="m22 9-6 6M16 9l6 6"/></svg>';

  MA.game = function (opt) {
    const W = opt.w || 800, H = opt.h || 600;
    const a1 = opt.accent || '#4fd1ff', a2 = opt.accent2 || '#a66bff';
    const bgc = opt.bg || ['#0d1330', '#160b2e'];

    const stage = document.createElement('div');
    stage.className = 'ma-stage';
    stage.style.setProperty('--a1', a1);
    stage.style.setProperty('--a2', a2);
    stage.style.setProperty('--glow', alpha(a1, 0.35));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const ov = document.createElement('div');
    ov.className = 'ma-ov';
    const mute = document.createElement('button');
    mute.className = 'ma-mute';
    mute.setAttribute('aria-label', 'Sound on or off');
    const setMuteIcon = () => { mute.innerHTML = muted ? ICON_OFF : ICON_ON; };
    setMuteIcon();
    mute.addEventListener('click', e => {
      e.stopPropagation();
      muted = !muted;
      try { localStorage.setItem('ma-mute', muted ? '1' : '0'); } catch (err) {}
      setMuteIcon();
      if (!muted) sfx.click();
    });
    stage.append(canvas, ov, mute);
    document.body.appendChild(stage);

    const K = Object.assign({ W, H, ctx, canvas, stage, t: 0, state: 'menu', accent: a1, accent2: a2, sfx, shade, alpha }, U);
    K.ptr = { x: W / 2, y: H / 2, down: false, active: false };
    K.keys = {};

    // ---------- sizing ----------
    let scale = 1, dpr = 1;
    function fit() {
      scale = Math.min(innerWidth / W, innerHeight / H);
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      stage.style.width = W * scale + 'px';
      stage.style.height = H * scale + 'px';
      stage.style.fontSize = Math.max(9, 16 * scale * (W / 800) ** 0.15) + 'px';
      canvas.width = Math.round(W * scale * dpr);
      canvas.height = Math.round(H * scale * dpr);
    }
    addEventListener('resize', fit);
    fit();

    // ---------- background ----------
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = W; bgCanvas.height = H;
    (function () {
      const g = bgCanvas.getContext('2d');
      const lg = g.createLinearGradient(0, 0, W * 0.3, H);
      lg.addColorStop(0, bgc[0]); lg.addColorStop(1, bgc[1]);
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      // graph paper
      for (let x = 0; x <= W; x += 32) { g.fillStyle = x % 160 === 0 ? 'rgba(255,255,255,.055)' : 'rgba(255,255,255,.025)'; g.fillRect(x, 0, 1, H); }
      for (let y = 0; y <= H; y += 32) { g.fillStyle = y % 160 === 0 ? 'rgba(255,255,255,.055)' : 'rgba(255,255,255,.025)'; g.fillRect(0, y, W, 1); }
      const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    })();
    const orbs = [[0.2, 0.25, a1, 0.9], [0.82, 0.7, a2, 1.2], [0.6, 0.15, a2, 0.7]];
    K.drawBg = function (c = ctx) {
      c.drawImage(bgCanvas, 0, 0);
      for (const [ox, oy, col, sp] of orbs) {
        const x = W * ox + Math.sin(K.t * 0.21 * sp) * W * 0.08, y = H * oy + Math.cos(K.t * 0.17 * sp) * H * 0.08;
        const r = Math.max(W, H) * 0.42;
        const rg = c.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, alpha(col, 0.13)); rg.addColorStop(1, alpha(col, 0));
        c.fillStyle = rg; c.fillRect(0, 0, W, H);
      }
    };

    // ---------- effects ----------
    const parts = [], floats = [], rings = [];
    let shakeAmt = 0, flashCol = null, flashT = 0;
    K.burst = function (x, y, color = a1, n = 18, speed = 240, size = 4, ring = true) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.75);
        const life = 0.45 + Math.random() * 0.5;
        parts.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life, max: life, color, s: size * (0.6 + Math.random() * 0.8) });
      }
      if (ring) rings.push({ x, y, r: 4, life: 0.45, max: 0.45, color });
    };
    K.float = function (x, y, text, color = '#fff', size = 26) { floats.push({ x, y, text, color, size, life: 1, max: 1 }); };
    K.shake = function (a = 8) { shakeAmt = Math.max(shakeAmt, a); };
    K.flash = function (color = '#fff', t = 0.25) { flashCol = color; flashT = t; };
    function updateFx(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + 260 * dt;
      }
      for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt * 0.9; f.y -= 46 * dt; if (f.life <= 0) floats.splice(i, 1); }
      for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.life -= dt; r.r += 260 * dt; if (r.life <= 0) rings.splice(i, 1); }
      shakeAmt *= Math.pow(0.0015, dt);
      if (shakeAmt < 0.3) shakeAmt = 0;
      if (flashT > 0) flashT -= dt;
    }
    function drawFx(c) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const r of rings) {
        c.globalAlpha = (r.life / r.max) * 0.7;
        c.strokeStyle = r.color; c.lineWidth = 3;
        c.beginPath(); c.arc(r.x, r.y, r.r, 0, Math.PI * 2); c.stroke();
      }
      for (const p of parts) {
        c.globalAlpha = Math.min(1, (p.life / p.max) * 1.4);
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.s * (p.life / p.max) + 0.5, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      for (const f of floats) {
        const k = f.life / f.max, pop = k > 0.85 ? U.back((1 - k) / 0.15) : 1;
        c.globalAlpha = Math.min(1, k * 2);
        K.text(f.text, f.x, f.y, f.size * pop, f.color, { glow: 14, weight: 800, c });
      }
      c.globalAlpha = 1;
    }

    // ---------- drawing helpers ----------
    K.rr = function (c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };
    // Font + text with optional glow. size in canvas px.
    K.font = (size, weight = 700) => `${weight} ${size}px Lexend, system-ui, sans-serif`;
    K.text = function (s, x, y, size = 20, color = '#fff', o = {}) {
      const c = o.c || ctx;
      c.save();
      c.font = K.font(size, o.weight || 700);
      c.textAlign = o.align || 'center';
      c.textBaseline = o.base || 'middle';
      if (o.glow) { c.shadowColor = o.glowColor || color; c.shadowBlur = o.glow; }
      if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = o.strokeColor || 'rgba(0,0,0,.6)'; c.lineJoin = 'round'; c.strokeText(s, x, y); }
      c.fillStyle = color;
      c.fillText(s, x, y);
      c.restore();
    };
    // A chunky glossy tile in a given base color.
    K.tile = function (c, x, y, w, h, color, o = {}) {
      const r = o.r ?? 12, depth = o.depth ?? 5;
      c.save();
      if (o.alpha != null) c.globalAlpha = o.alpha;
      if (o.glow) { c.shadowColor = color; c.shadowBlur = o.glow; }
      c.fillStyle = shade(color, -0.45);
      K.rr(c, x, y + depth, w, h, r); c.fill();
      c.shadowBlur = 0;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, shade(color, 0.28)); g.addColorStop(1, color);
      c.fillStyle = g;
      K.rr(c, x, y, w, h, r); c.fill();
      c.fillStyle = 'rgba(255,255,255,.2)';
      K.rr(c, x + 3, y + 3, w - 6, Math.max(4, h * 0.42), Math.max(2, r - 3)); c.fill();
      c.restore();
    };
    // A dark glass panel.
    K.panel = function (c, x, y, w, h, o = {}) {
      c.save();
      K.rr(c, x, y, w, h, o.r ?? 14);
      c.fillStyle = o.fill || 'rgba(10,14,32,.62)';
      if (o.glow) { c.shadowColor = o.glowColor || a1; c.shadowBlur = o.glow; }
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = o.stroke || 'rgba(255,255,255,.12)';
      c.lineWidth = o.lw || 1;
      c.stroke();
      c.restore();
    };
    // HUD chip: small label over a big value.
    K.chip = function (x, y, label, value, color = '#fff', o = {}) {
      const c = o.c || ctx, w = o.w || 120, h = o.h || 50;
      const left = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
      K.panel(c, left, y, w, h, { r: 12 });
      K.text(label.toUpperCase(), left + w / 2, y + 14, 10, 'rgba(210,218,245,.65)', { weight: 700, c });
      K.text(String(value), left + w / 2, y + 33, o.size || 20, color, { weight: 800, glow: 10, c });
    };
    K.hit = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    // Canvas button {x,y,w,h,label,sub,color,disabled}
    K.button = function (b, c = ctx) {
      const hov = !b.disabled && K.ptr.active && K.hit(b, K.ptr.x, K.ptr.y);
      const press = hov && K.ptr.down;
      const dy = press ? 3 : hov ? -2 : 0;
      K.tile(c, b.x, b.y + dy, b.w, b.h, b.disabled ? '#39405a' : (b.color || a1), { r: b.r ?? 12, glow: hov ? 22 : b.glow || 0, depth: press ? 2 : 5, alpha: b.disabled ? 0.55 : 1 });
      const col = b.textColor || (b.disabled ? '#9aa0b8' : '#0b0e1c');
      if (b.sub) {
        K.text(b.label, b.x + b.w / 2, b.y + dy + b.h * 0.4, b.size || 22, col, { weight: 800, c });
        K.text(b.sub, b.x + b.w / 2, b.y + dy + b.h * 0.76, 11, col, { weight: 600, c });
      } else {
        K.text(b.label, b.x + b.w / 2, b.y + dy + b.h / 2 + 1, b.size || 22, col, { weight: 800, c });
      }
    };
    K.glowLine = function (c, pts, color, width = 3, glow = 16) {
      c.save();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = color; c.shadowColor = color; c.shadowBlur = glow; c.lineWidth = width;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
      c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, width * 0.35);
      c.stroke();
      c.restore();
    };
    K.orb = function (c, x, y, r, color, o = {}) {
      c.save();
      if (o.glow !== 0) { c.shadowColor = color; c.shadowBlur = o.glow ?? r * 1.2; }
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, shade(color, 0.65)); g.addColorStop(0.45, color); g.addColorStop(1, shade(color, -0.35));
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.restore();
    };

    // ---------- storage ----------
    const slug = opt.slug || 'game';
    K.load = (k, d) => { try { const v = localStorage.getItem(`ma-${slug}-${k}`); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
    K.save = (k, v) => { try { localStorage.setItem(`ma-${slug}-${k}`, JSON.stringify(v)); } catch (e) {} };
    K.best = () => K.load('best', 0);

    // ---------- overlays ----------
    const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    K.overlay = function (o) {
      let h = '<div class="ma-card">';
      if (o.kicker) h += `<div class="ma-kicker">${esc(o.kicker)}</div>`;
      if (o.title) h += `<h1>${esc(o.title)}</h1>`;
      if (o.score != null) h += `<div class="ma-score">${esc(o.score)}</div>`;
      if (o.sub) h += `<p class="ma-sub">${o.sub}</p>`;
      if (o.how) h += '<ul class="ma-how">' + o.how.map(x => `<li>${x}</li>`).join('') + '</ul>';
      if (o.html) h += o.html;
      if (o.levels) {
        h += '<div class="ma-lv">';
        for (let i = 0; i < o.levels.n; i++) {
          const st = (o.levels.stars && o.levels.stars[i]) || 0;
          h += `<button data-lv="${i}" class="${st ? 'done' : ''}" ${i > o.levels.unlocked ? 'disabled' : ''}>${i + 1}<small>${'★'.repeat(st)}</small></button>`;
        }
        h += '</div>';
      }
      h += '<div class="ma-row">' + (o.buttons || []).map((b, i) => `<button class="ma-btn ${b.ghost ? 'ghost' : ''}" data-b="${i}">${esc(b.label)}</button>`).join('') + '</div></div>';
      ov.innerHTML = h;
      ov.querySelectorAll('[data-b]').forEach(el => el.addEventListener('click', () => { audio(); sfx.click(); K.hideOverlay(); o.buttons[+el.dataset.b].on(); }));
      ov.querySelectorAll('[data-lv]').forEach(el => el.addEventListener('click', () => { audio(); sfx.click(); K.hideOverlay(); o.levels.on(+el.dataset.lv); }));
      ov.classList.add('on');
      const first = ov.querySelector('.ma-btn');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
    };
    K.hideOverlay = () => ov.classList.remove('on');
    K.play = function () { K.state = 'play'; K.hideOverlay(); opt.start && opt.start(); };
    K.menu = function (o = {}) {
      K.state = 'menu';
      const best = K.best();
      K.overlay(Object.assign({
        kicker: opt.kicker || 'MathAdvice',
        title: opt.title,
        sub: opt.tagline,
        how: opt.how,
        html: best ? `<p class="ma-best">Best: <b>${best}</b></p>` : '',
        buttons: [{ label: 'Play', on: K.play }],
      }, o));
    };
    K.gameOver = function (score, o = {}) {
      K.state = 'over';
      const prev = K.best();
      const isBest = score > prev;
      if (isBest) K.save('best', score);
      setTimeout(() => {
        isBest ? sfx.win() : sfx.lose();
        K.overlay({
          kicker: o.kicker || 'Final score',
          title: o.title || 'Game over',
          score,
          sub: o.msg || '',
          html: isBest ? '<div class="ma-badge">New best!</div>' : `<p class="ma-best">Best: <b>${Math.max(prev, score)}</b></p>`,
          buttons: [{ label: 'Play again', on: K.play }],
        });
      }, o.delay ?? 600);
    };

    // ---------- input ----------
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
    }
    canvas.addEventListener('pointerdown', e => {
      audio();
      const [x, y] = pos(e);
      Object.assign(K.ptr, { x, y, down: true, active: true });
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      if (opt.down) opt.down(x, y, e);
    });
    canvas.addEventListener('pointermove', e => {
      const [x, y] = pos(e);
      Object.assign(K.ptr, { x, y, active: true });
      if (opt.move) opt.move(x, y, e);
    });
    const up = e => {
      if (!K.ptr.down) return;
      const [x, y] = pos(e);
      Object.assign(K.ptr, { x, y, down: false });
      if (e.pointerType !== 'mouse') K.ptr.active = false;
      if (opt.up) opt.up(x, y, e);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !K.ptr.down) K.ptr.active = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('keydown', e => {
      audio();
      if (K.state === 'play' && [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.repeat && K.keys[e.key]) { if (opt.key && opt.repeat) opt.key(e.key, e); return; }
      K.keys[e.key] = true;
      if (opt.key) opt.key(e.key, e);
    });
    addEventListener('keyup', e => { K.keys[e.key] = false; });
    addEventListener('blur', () => { K.keys = {}; });

    // ---------- loop ----------
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      K.t += dt;
      if (K.state === 'play' && opt.update) opt.update(dt);
      else if (opt.idle) opt.idle(dt);
      updateFx(dt);
      const s = scale * dpr;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.save();
      if (shakeAmt) ctx.translate(U.rand(-shakeAmt, shakeAmt), U.rand(-shakeAmt, shakeAmt));
      if (opt.bg !== false) K.drawBg(ctx);
      opt.draw(ctx, K.t);
      drawFx(ctx);
      ctx.restore();
      if (flashT > 0) {
        ctx.globalAlpha = Math.min(1, flashT * 2.5) * 0.35;
        ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Show the menu once the font is ready so text is crisp from the first frame.
    const ready = () => (opt.noMenu ? null : K.menu());
    if (document.fonts && document.fonts.load) document.fonts.load('700 16px Lexend').then(ready, ready);
    else ready();

    return K;
  };
})();
