// MathAdvice skin for the classic quiz-style games.
// Loaded at the end of each game page. It swaps in the Lexend font and a glassy look,
// paints a background that fits the game's theme, skips the start screen, and adds
// sound and sparkle on right and wrong answers. Games don't need to know it exists.
(function () {
  const slug = (location.pathname.match(/games\/([^/]+)\//) || [])[1] || '';

  // bg: [top, bottom] gradient, a/b: accent colors, g: floating symbols, p: background pattern
  const T = {
    // Arithmetic
    'quick-maths':        { bg: ['#2a1606', '#120a22'], a: '#ffd34d', b: '#ff8a3d', g: ['+', '−', '×', '÷', '=', '7', '3'], p: 'rays' },
    'decimal-dash':       { bg: ['#03202b', '#0b1033'], a: '#4fd1ff', b: '#2ee6c5', g: ['0.5', '.25', '1.75', '3.2', '.'], p: 'speed' },
    'integer-clash':      { bg: ['#2a0a14', '#0a1430'], a: '#ff5d73', b: '#4fa8ff', g: ['+', '−', '−3', '+5', '−8', '0'], p: 'split' },
    'order-up':           { bg: ['#2b0d0d', '#1a0f06'], a: '#ff6b5d', b: '#ffd34d', g: ['( )', '²', '×', '÷', '+', 'PEMDAS'], p: 'checker' },
    'equation-match':     { bg: ['#14082a', '#071a2a'], a: '#a66bff', b: '#4fd1ff', g: ['=', '?', '8 + 4', '3 × 4', '12'], p: 'dots' },
    'make-the-number':    { bg: ['#06200f', '#0b1430'], a: '#7ee36b', b: '#2ee6c5', g: ['24', '+', '×', '−', '÷', '6', '4'], p: 'grid' },
    // Number Sense
    'fraction-pizza':     { bg: ['#2d1206', '#1a0710'], a: '#ff9f43', b: '#ff5d5d', g: ['½', '¼', '⅓', '¾', '⅛', '⅔'], p: 'pizza' },
    'exponent-express':   { bg: ['#1a0a2e', '#0a1a2e'], a: '#c38bff', b: '#ff6bd6', g: ['x²', '2³', '√', '∛', '10⁰', 'aⁿ'], p: 'rails' },
    'prime-time':         { bg: ['#05222a', '#0b0f2e'], a: '#2ee6c5', b: '#4fd1ff', g: ['2', '3', '5', '7', '11', '13', '17'], p: 'rings' },
    'factor-frenzy':      { bg: ['#2a0a24', '#100a2a'], a: '#ff6bd6', b: '#ffd34d', g: ['GCF', 'LCM', '×', '12', '18', '6'], p: 'dots' },
    'percent-shop':       { bg: ['#062016', '#0b1a2a'], a: '#5be38a', b: '#ffd34d', g: ['%', '$', '¢', '50%', 'SALE', '25%'], p: 'stripes' },
    'metric-mania':       { bg: ['#061a2e', '#0b0f26'], a: '#4fa8ff', b: '#7ee36b', g: ['km', 'm', 'cm', 'mm', 'kg', 'mL', 'L'], p: 'ruler' },
    'number-line-ninja':  { bg: ['#260808', '#0e0a1e'], a: '#ff5d5d', b: '#ffd34d', g: ['←', '→', '✦', '−2', '0', '¾'], p: 'line' },
    // Algebra
    'balance-the-equation': { bg: ['#04201f', '#0b1230'], a: '#2ee6c5', b: '#ffd34d', g: ['x', '=', '2x + 3', '⚖', '−3', '÷2'], p: 'grid' },
    'function-machine':   { bg: ['#241405', '#0e0f1e'], a: '#ffa63d', b: '#ffd34d', g: ['f(x)', '⚙', 'in', 'out', '→', '×2'], p: 'gears' },
    'slope-spotter':      { bg: ['#07200a', '#0b1530'], a: '#7ee36b', b: '#4fd1ff', g: ['m', 'Δy', 'Δx', 'rise', 'run', '⁄'], p: 'slopes' },
    'coordinate-catch':   { bg: ['#061633', '#0b0a26'], a: '#4fd1ff', b: '#ffd34d', g: ['(x, y)', '(3, 2)', '(−1, 4)', '•'], p: 'axes' },
    'quadratic-quest':    { bg: ['#1a0a30', '#0a1a2a'], a: '#a66bff', b: '#ffd34d', g: ['x²', '( )( )', '= 0', '±', 'b² − 4ac'], p: 'parabolas' },
    // Geometry
    'shape-solver':       { bg: ['#0a1a33', '#160a2a'], a: '#4fd1ff', b: '#ff6bd6', g: ['△', '□', '○', 'πr²', 'a² + b²', '°'], p: 'shapes' },
    'angle-guesser':      { bg: ['#1c0f2e', '#06182a'], a: '#ffd34d', b: '#ff6bd6', g: ['∠', '45°', '90°', '180°', '°'], p: 'angles' },
    'soh-cah-toa':        { bg: ['#2a1205', '#0f0a26'], a: '#ff9f43', b: '#ffd34d', g: ['sin', 'cos', 'tan', 'θ', '△', 'opp/hyp'], p: 'triangles' },
    // Statistics
    'data-detective':     { bg: ['#141a24', '#0a0f1e'], a: '#ffd34d', b: '#4fd1ff', g: ['mean', 'median', 'mode', 'range', '🔍', 'x̄'], p: 'bars' },
    'marble-odds':        { bg: ['#140a2e', '#071a2a'], a: '#ff6bd6', b: '#4fd1ff', g: ['P(A)', '½', '⅓', '●', '◐'], p: 'marbles' },
    // Calculus
    'derivative-match':   { bg: ['#0a0f30', '#1a0a2a'], a: '#4fd1ff', b: '#a66bff', g: ['d/dx', 'f′', 'f′(x)', 'Δ', '∫', 'lim'], p: 'curves' },
    // Precalculus
    'end-behavior':       { bg: ['#0a1430', '#1e0a26'], a: '#4fd1ff', b: '#ff6bd6', g: ['∞', '−∞', '→', 'xⁿ', '↗', '↘'], p: 'curves' },
    'asymptote-alley':    { bg: ['#1e0a1e', '#0a1430'], a: '#ff6bd6', b: '#4fd1ff', g: ['1/x', '∞', 'x = 2', 'y = 0', '⇢'], p: 'dashes' },
    'shift-and-stretch':  { bg: ['#06202a', '#14082a'], a: '#2ee6c5', b: '#a66bff', g: ['f(x − h)', '+k', 'a·f(x)', '↔', '↕'], p: 'curves' },
    'sequence-sleuth':    { bg: ['#141a24', '#0a0f26'], a: '#ffd34d', b: '#7ee36b', g: ['aₙ', '2, 4, 8…', '+d', '×r', '…', '🔍'], p: 'dots' },
    'function-stack':     { bg: ['#1a0a2a', '#06182a'], a: '#a66bff', b: '#4fd1ff', g: ['f(g(x))', '∘', 'g(x)', 'f⁻¹', '( )'], p: 'stack' },
    'log-lab':            { bg: ['#062018', '#0a0f26'], a: '#7ee36b', b: '#2ee6c5', g: ['log', 'ln', 'eˣ', '10ˣ', '⚗', 'log₂'], p: 'bubbles' },
    'unit-circle':        { bg: ['#0a0f30', '#20081e'], a: '#ff6bd6', b: '#ffd34d', g: ['π/6', 'π/4', 'π/3', '√3/2', 'sin', 'cos'], p: 'rings' },
    'wave-rider':         { bg: ['#041a2e', '#0a0a26'], a: '#4fd1ff', b: '#2ee6c5', g: ['sin', 'cos', '∿', '2π', 'A', 'period'], p: 'waves' },
    'polar-points':       { bg: ['#14082a', '#06182a'], a: '#a66bff', b: '#ffd34d', g: ['r', 'θ', '(r, θ)', 'π/2', '•'], p: 'polar' },
    'matrix-mixer':       { bg: ['#061a1a', '#0a0a26'], a: '#2ee6c5', b: '#ff6bd6', g: ['[ ]', 'det', 'A⁻¹', 'AB', '2×2'], p: 'brackets' },
  };
  const th = T[slug] || { bg: ['#0d1330', '#160b2e'], a: '#4fd1ff', b: '#a66bff', g: ['+', '×', '='], p: 'grid' };
  const hexA = (h, al) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${al})`; };

  // ---------- background pattern (SVG, drawn once) ----------
  function pattern(p) {
    const s = 'stroke="#fff" fill="none" stroke-width="2"';
    const P = {
      grid: `<path d="M0 40H160M0 80H160M0 120H160M40 0V160M80 0V160M120 0V160" ${s} stroke-width="1"/>`,
      axes: `<path d="M0 80H160M80 0V160" ${s}/><path d="M0 40H160M0 120H160M40 0V160M120 0V160" ${s} stroke-width=".6"/>`,
      dots: `<circle cx="20" cy="20" r="3" fill="#fff"/><circle cx="100" cy="60" r="2" fill="#fff"/><circle cx="60" cy="120" r="3" fill="#fff"/><circle cx="140" cy="140" r="2" fill="#fff"/>`,
      rays: `<path d="M80 80L0 0M80 80L160 0M80 80L0 160M80 80L160 160M80 80L80 0M80 80L0 80" ${s} stroke-width="1"/>`,
      speed: `<path d="M10 30H70M40 70H150M0 110H90M60 140H130" ${s} stroke-linecap="round"/>`,
      split: `<path d="M0 160L160 0" ${s} stroke-width="3"/><text x="30" y="60" fill="#fff" font-size="28">−</text><text x="110" y="130" fill="#fff" font-size="28">+</text>`,
      checker: `<rect width="40" height="40" fill="#fff"/><rect x="80" width="40" height="40" fill="#fff"/><rect x="40" y="40" width="40" height="40" fill="#fff"/><rect x="120" y="40" width="40" height="40" fill="#fff"/><rect y="80" width="40" height="40" fill="#fff"/><rect x="80" y="80" width="40" height="40" fill="#fff"/><rect x="40" y="120" width="40" height="40" fill="#fff"/><rect x="120" y="120" width="40" height="40" fill="#fff"/>`,
      pizza: `<circle cx="80" cy="80" r="56" ${s}/><path d="M80 24V136M24 80H136M40 40L120 120M120 40L40 120" ${s} stroke-width="1.2"/><circle cx="60" cy="58" r="6" fill="#fff"/><circle cx="104" cy="96" r="6" fill="#fff"/>`,
      rails: `<path d="M0 60H160M0 100H160" ${s}/><path d="M10 52V108M40 52V108M70 52V108M100 52V108M130 52V108" ${s} stroke-width="3"/>`,
      rings: `<circle cx="80" cy="80" r="30" ${s}/><circle cx="80" cy="80" r="60" ${s}/>`,
      stripes: `<path d="M0 0L160 160M-80 0L80 160M80 0L240 160" ${s} stroke-width="10"/>`,
      ruler: `<path d="M0 80H160" ${s}/><path d="M0 80V60M16 80V70M32 80V70M48 80V70M64 80V70M80 80V56M96 80V70M112 80V70M128 80V70M144 80V70" ${s}/>`,
      line: `<path d="M0 80H160" ${s}/><path d="M20 72V88M60 72V88M100 72V88M140 72V88" ${s}/>`,
      gears: `<circle cx="60" cy="60" r="26" ${s}/><circle cx="60" cy="60" r="8" ${s}/><path d="M60 26V18M60 94V102M26 60H18M94 60H102M36 36L30 30M84 84L90 90M84 36L90 30M36 84L30 90" ${s} stroke-width="5"/><circle cx="122" cy="122" r="16" ${s}/>`,
      slopes: `<path d="M0 140L60 20M50 160L130 40M110 150L160 60" ${s}/>`,
      parabolas: `<path d="M20 20Q80 200 140 20" ${s}/>`,
      shapes: `<path d="M30 60L60 10L90 60Z" ${s}/><rect x="100" y="90" width="40" height="40" ${s}/><circle cx="40" cy="120" r="20" ${s}/>`,
      angles: `<path d="M20 140H120M20 140L100 60" ${s}/><path d="M60 140A40 40 0 0 0 48 112" ${s}/>`,
      triangles: `<path d="M20 140H120V60Z" ${s}/><path d="M108 140V128H120" ${s}/>`,
      bars: `<path d="M20 140V100M50 140V60M80 140V80M110 140V30M140 140V110" ${s} stroke-width="14"/>`,
      marbles: `<circle cx="40" cy="40" r="16" ${s}/><circle cx="120" cy="60" r="12" ${s}/><circle cx="70" cy="120" r="18" ${s}/>`,
      curves: `<path d="M0 120C40 120 40 30 80 30S120 140 160 100" ${s}/>`,
      dashes: `<path d="M80 0V160M0 120H160" ${s} stroke-dasharray="8 8"/><path d="M90 0Q100 100 160 110M70 160Q60 60 0 50" ${s}/>`,
      stack: `<rect x="20" y="20" width="120" height="120" rx="10" ${s}/><rect x="45" y="45" width="70" height="70" rx="8" ${s}/><rect x="68" y="68" width="24" height="24" rx="5" ${s}/>`,
      bubbles: `<circle cx="40" cy="120" r="10" ${s}/><circle cx="60" cy="70" r="6" ${s}/><circle cx="120" cy="40" r="14" ${s}/><circle cx="110" cy="130" r="5" ${s}/>`,
      waves: `<path d="M0 80Q20 40 40 80T80 80T120 80T160 80" ${s}/><path d="M0 130Q20 110 40 130T80 130T120 130T160 130" ${s} stroke-width="1"/>`,
      polar: `<circle cx="80" cy="80" r="25" ${s} stroke-width="1"/><circle cx="80" cy="80" r="50" ${s} stroke-width="1"/><circle cx="80" cy="80" r="75" ${s} stroke-width="1"/><path d="M80 0V160M0 80H160M23 23L137 137M137 23L23 137" ${s} stroke-width="1"/>`,
      brackets: `<path d="M30 30H20V130H30M130 30H140V130H130" ${s} stroke-width="3"/><text x="45" y="70" fill="#fff" font-size="22">2  1</text><text x="45" y="110" fill="#fff" font-size="22">0  3</text>`,
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" opacity=".07">${P[p] || P.grid}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // ---------- styles ----------
  const css = `
  @font-face { font-family: "Lexend"; src: url("../../fonts/lexend.woff") format("woff"); font-weight: 100 900; font-display: swap; }
  :root { --bg: transparent; --panel: rgba(16,20,42,.72); --line: rgba(255,255,255,.14); --text: #eef1fb; --muted: #aab3d4; --accent: ${th.a}; --good: #5be38a; --bad: #ff5d73; }
  html, body { background: transparent !important; font-family: Lexend, system-ui, sans-serif !important; }
  button, input, select { font-family: inherit !important; }
  .ma-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none;
    background: radial-gradient(ellipse at 20% 15%, ${hexA(th.a, .22)}, transparent 55%), radial-gradient(ellipse at 85% 90%, ${hexA(th.b, .2)}, transparent 55%), ${pattern(th.p)}, linear-gradient(160deg, ${th.bg[0]}, ${th.bg[1]}); }
  .ma-bg::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.55)); }
  .ma-bg span { position: absolute; font-weight: 800; color: #fff; opacity: .07; white-space: nowrap; animation: ma-float linear infinite; }
  @keyframes ma-float { from { transform: translateY(0) rotate(var(--r)); } to { transform: translateY(-120vh) rotate(calc(var(--r) + 40deg)); } }

  /* headings and buttons */
  .screen h1, .mq-screen h1, .win h1 { font-weight: 800 !important; letter-spacing: -.01em; background: linear-gradient(100deg, #fff 10%, ${th.a} 55%, ${th.b}); -webkit-background-clip: text; background-clip: text; color: transparent !important; filter: drop-shadow(0 .06em .4em ${hexA(th.a, .45)}); }
  .go, .mq-go, .next, .serve { font-weight: 800 !important; color: #0b0e1c !important; border: 0 !important; border-radius: 14px !important;
    background: linear-gradient(180deg, ${th.a}, ${th.b}) !important; box-shadow: 0 5px 0 rgba(0,0,0,.35), 0 0 22px ${hexA(th.a, .45)}, inset 0 1px 0 rgba(255,255,255,.5) !important; transition: transform .12s, filter .12s; }
  .go:hover, .mq-go:hover, .next:hover, .serve:hover { transform: translateY(-2px); filter: brightness(1.08); }
  .go:active, .mq-go:active, .next:active, .serve:active { transform: translateY(2px); }

  /* HUD + timer bar */
  .hud, .mq-hud { gap: 8px; }
  .hud > span, .mq-hud > span { background: rgba(10,14,32,.6); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 6px 12px; font-size: .9rem; backdrop-filter: blur(6px); }
  .hud b, .mq-hud b { color: ${th.a} !important; font-size: 1.1em; text-shadow: 0 0 10px ${hexA(th.a, .5)}; }
  .bar, .mq-bar { background: rgba(255,255,255,.08) !important; height: 10px !important; }
  .bar i, .mq-bar i { background: linear-gradient(90deg, ${th.b}, ${th.a}) !important; box-shadow: 0 0 12px ${hexA(th.a, .7)}; border-radius: 999px; }

  /* the question card stays paper-white so every drawing stays readable */
  .problem, .board, .mq-board, .formula, .ticket { border-radius: 20px !important; box-shadow: 0 14px 34px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.4) inset, 0 0 40px ${hexA(th.a, .18)} !important; transition: box-shadow .2s, transform .2s; }
  .problem.good, .board.good, .mq-board.good { box-shadow: 0 0 0 4px var(--good), 0 0 40px rgba(91,227,138,.6) !important; transform: scale(1.02); }
  .problem.bad, .board.bad, .mq-board.bad { box-shadow: 0 0 0 4px var(--bad), 0 0 40px rgba(255,93,115,.55) !important; }

  /* answer buttons: glossy tiles */
  .answers button, .mq-answers button, .grid .card, .ops button, .tiles button {
    background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.04)) , rgba(16,20,42,.78) !important;
    border: 1px solid rgba(255,255,255,.16) !important; color: #fff !important; border-radius: 16px !important;
    box-shadow: 0 4px 0 rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.18) !important; transition: transform .1s, border-color .1s, box-shadow .1s; backdrop-filter: blur(6px); }
  .answers button:hover, .mq-answers button:hover, .grid .card:hover, .ops button:hover, .tiles button:hover { transform: translateY(-2px); border-color: ${th.a} !important; box-shadow: 0 6px 0 rgba(0,0,0,.35), 0 0 18px ${hexA(th.a, .45)} !important; }
  .answers button:active, .mq-answers button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.35) !important; }
  .answers button small, .mq-answers button small { color: ${th.a} !important; opacity: .8; }
  .mq-q, .q { text-shadow: 0 2px 12px rgba(0,0,0,.4); }
  .mq-q em, .q em { color: ${th.a} !important; }
  .hint, .mq-hint, .msg { color: #c9d1ee !important; }

  /* pill shown until the player's first answer */
  .ma-tip { position: fixed; left: 50%; top: 10px; transform: translateX(-50%); z-index: 20; max-width: 92vw; white-space: nowrap; padding: 5px 12px; border-radius: 999px; font-size: .82rem; font-weight: 600; text-align: center;
    background: rgba(10,14,32,.85); border: 1px solid ${hexA(th.a, .5)}; color: #eef1fb; box-shadow: 0 0 18px ${hexA(th.a, .35)}; transition: opacity .4s, transform .4s; }
  .ma-tip b, .ma-clock { color: ${th.a}; font-weight: 700; }
  .ma-tip.gone { opacity: 0; transform: translate(-50%, -10px); pointer-events: none; }

  .ma-mute { position: fixed; right: 10px; bottom: 10px; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); background: rgba(10,14,30,.6); color: #fff; cursor: pointer; display: grid; place-items: center; padding: 0; z-index: 20; }
  .ma-mute svg { width: 17px; height: 17px; }
  .ma-spark { position: fixed; width: 7px; height: 7px; border-radius: 50%; pointer-events: none; z-index: 30; }
  .ma-pop { position: fixed; pointer-events: none; z-index: 30; font-weight: 800; font-size: 1.4rem; transform: translate(-50%, -50%); text-shadow: 0 0 14px currentColor; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- floating symbols ----------
  const bg = document.createElement('div');
  bg.className = 'ma-bg';
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.textContent = th.g[i % th.g.length];
    const dur = 24 + Math.random() * 22;
    s.style.cssText = `left:${(i * 61) % 100}%;top:${100 + Math.random() * 20}%;font-size:${18 + Math.random() * 30}px;--r:${Math.round(Math.random() * 60 - 30)}deg;animation-duration:${dur}s;animation-delay:${-Math.random() * dur}s`;
    bg.appendChild(s);
  }
  document.body.prepend(bg);

  // ---------- sound ----------
  let ac = null, muted = false;
  try { muted = localStorage.getItem('ma-mute') === '1'; } catch (e) {}
  function tone(f, d, type = 'triangle', v = 0.1, delay = 0) {
    if (muted) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { return; }
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/>';
  const mute = document.createElement('button');
  mute.className = 'ma-mute'; mute.setAttribute('aria-label', 'Sound on or off');
  const icon = () => { mute.innerHTML = SPK + (muted ? '<path d="m22 9-6 6M16 9l6 6"/></svg>' : '<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>'); };
  icon();
  mute.onclick = e => { e.stopPropagation(); muted = !muted; try { localStorage.setItem('ma-mute', muted ? '1' : '0'); } catch (err) {} icon(); };
  document.body.appendChild(mute);

  // ---------- sparkle on right / wrong ----------
  let streak = 0;
  function sparkle(el, good) {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cols = good ? [th.a, th.b, '#fff', '#5be38a'] : ['#ff5d73', '#ff9f9f'];
    for (let i = 0; i < (good ? 22 : 8); i++) {
      const s = document.createElement('div');
      s.className = 'ma-spark';
      s.style.background = cols[i % cols.length]; s.style.boxShadow = `0 0 8px ${cols[i % cols.length]}`;
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = (good ? 90 : 50) + Math.random() * 90;
      s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 40}px) scale(.2)`, opacity: 0 }], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
    }
    if (good) {
      streak++;
      const p = document.createElement('div');
      p.className = 'ma-pop'; p.style.color = streak >= 5 ? '#ffd34d' : '#5be38a';
      p.textContent = streak >= 5 ? `🔥 ${streak} in a row!` : ['Nice!', 'Yes!', 'Correct!', 'Great!'][streak % 4];
      p.style.left = cx + 'px'; p.style.top = r.top + 'px';
      document.body.appendChild(p);
      p.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.1)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-180%) scale(1)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => p.remove();
      tone(660 + Math.min(streak, 8) * 40, 0.1); tone(990 + Math.min(streak, 8) * 40, 0.16, 'triangle', 0.1, 0.07);
    } else { streak = 0; tone(200, 0.28, 'sawtooth', 0.06); }
  }
  // Every game flashes "good" or "bad" on its question card, so watch for that.
  new MutationObserver(muts => {
    for (const m of muts) {
      const el = m.target;
      if (!el.classList) continue;
      const was = m.oldValue || '';
      if (el.classList.contains('good') && !/\bgood\b/.test(was)) sparkle(el, true);
      else if (el.classList.contains('bad') && !/\bbad\b/.test(was)) sparkle(el, false);
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });

  // ---------- skip the start screen ----------
  // Games with a start screen begin right away. Timed games hold the clock until the
  // first answer (they check window.MA_WAIT), so nobody loses seconds while reading.
  const tip = document.createElement('div');
  tip.className = 'ma-tip gone';
  document.body.appendChild(tip);
  function showTip(text, timed) {
    const html = text + (timed ? ' <b class="ma-clock">⏱ The clock starts on your first answer.</b>' : '');
    // Use the game's own hint line when it has one (it sits under the answers, out of the way).
    const hint = document.querySelector('#mq-hint, .hint, .msg');
    if (hint && hint.offsetParent) { hint.innerHTML = html; }
    else if (timed) { tip.innerHTML = '⏱ The clock starts on your first answer'; tip.classList.remove('gone'); }
    const hide = () => { tip.classList.add('gone'); window.MA_WAIT = false; removeEventListener('pointerdown', hideLater, true); removeEventListener('keydown', hideLater, true); };
    const hideLater = e => { if (e.target.closest && e.target.closest('.ma-mute')) return; setTimeout(hide, 0); };
    addEventListener('pointerdown', hideLater, true); addEventListener('keydown', hideLater, true);
    if (!timed) setTimeout(hide, 6000);
  }
  window.MASkin = { showTip, theme: th };

  const startScreen = document.getElementById('start'), play = document.getElementById('play');
  if (startScreen && play) {
    const first = startScreen.querySelector('p');
    const timed = /function tick/.test(document.body.innerHTML + [...document.scripts].map(s => s.textContent).join(''));
    window.MA_WAIT = timed;
    play.click();
    if (first) showTip(first.innerHTML, timed);
  }
  else if (window.MA_TIP) showTip(window.MA_TIP.text, window.MA_TIP.timed);
})();
