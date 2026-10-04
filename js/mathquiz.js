// MathAdvice quiz engine — shared by the timed multiple-choice math games.
// Each game calls MathQuiz({...}) with a generator that makes one question at a time.
(function () {
  const CSS = `
  :root { --bg:#12131a; --panel:#1c1e29; --line:#2c2f3e; --text:#ecedf3; --muted:#9a9db0; --accent:#ffcc33; --good:#3ecf8e; --bad:#ff6b6b; --ink:#2b2d3a; --blue:#2f6fd6; --red:#e8505b; }
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,"Segoe UI",sans-serif; overflow:hidden; touch-action:manipulation; }
  body { display:flex; align-items:center; justify-content:center; padding:12px; user-select:none; -webkit-user-select:none; }
  .mq { width:100%; max-width:460px; text-align:center; }
  .mq-hud { display:flex; justify-content:space-between; font-weight:700; color:var(--muted); }
  .mq-hud b { color:var(--text); }
  .mq-bar { height:8px; background:var(--panel); border-radius:999px; overflow:hidden; margin:8px 0 10px; }
  .mq-bar i { display:block; height:100%; width:100%; background:var(--accent); }
  .mq-board { background:#f7f5ee; color:var(--ink); border-radius:16px; padding:14px 10px; min-height:90px; display:flex; flex-direction:column; align-items:center; justify-content:center;
    background-image:linear-gradient(#d6e4f0 1px,transparent 1px),linear-gradient(90deg,#d6e4f0 1px,transparent 1px); background-size:22px 22px; }
  .mq-board.good { box-shadow:0 0 0 4px var(--good); } .mq-board.bad { box-shadow:0 0 0 4px var(--bad); animation:mq-shake .3s; }
  @keyframes mq-shake { 25% { transform:translateX(-7px); } 75% { transform:translateX(7px); } }
  .mq-board .big { font-size:clamp(1.8rem,9vw,2.6rem); font-weight:800; line-height:1.2; }
  .mq-board .mid { font-size:clamp(1.2rem,5.5vw,1.6rem); font-weight:800; line-height:1.3; }
  .mq-board svg { width:100%; height:auto; display:block; }
  .mq-q { font-weight:800; font-size:clamp(1.05rem,4.6vw,1.3rem); margin:12px 0; min-height:1.3em; }
  .mq-q em { color:var(--accent); font-style:normal; }
  .mq-answers { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .mq-answers button { font:inherit; font-size:1.35rem; font-weight:800; padding:13px 4px; border-radius:12px; cursor:pointer; background:var(--panel); color:var(--text); border:2px solid var(--line); position:relative; }
  .mq-answers button:hover { border-color:var(--accent); }
  .mq-answers button small { position:absolute; top:4px; left:9px; font-size:.7rem; color:var(--muted); }
  .mq-hint { color:var(--muted); font-size:.88rem; margin:10px 0 0; min-height:1.2em; }
  .mq-screen h1 { color:var(--accent); font-size:2.2rem; margin:0 0 8px; }
  .mq-screen p { color:var(--muted); margin:6px 0; }
  .mq-screen .final { font-size:3rem; font-weight:800; color:var(--text); }
  .mq-go { margin-top:16px; font:inherit; font-weight:800; font-size:1.2rem; padding:14px 34px; border:0; border-radius:12px; background:var(--accent); color:#111; cursor:pointer; }
  .frac { display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; line-height:1; margin:0 2px; }
  .frac span:first-child { border-bottom:2px solid currentColor; padding:0 4px 2px; } .frac span:last-child { padding-top:2px; }
  [hidden] { display:none !important; }`;

  // Helpers games can use.
  const H = {
    rnd: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: a => a[Math.floor(Math.random() * a.length)],
    shuffle: a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    neg: v => String(v).replace(/-/g, '−'),
    frac: (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`,
    // An angle of n/d · π, simplified, as HTML (for example 5π/6).
    pi(n, d) {
      if (n === 0) return '0';
      const g = H.gcd(n, d); n /= g; d /= g;
      const s = n < 0 ? '−' : '', top = (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'π';
      return d === 1 ? s + top : s + H.frac(top, d);
    },
    // Build 4 unique choices: the right one, the given distractors, then nearby numbers as filler.
    choices(correct, distractors = [], filler) {
      const key = v => String(v);
      const out = [correct], seen = new Set([key(correct)]);
      for (const d of distractors) { if (out.length >= 4) break; if (d === undefined || d === null || seen.has(key(d))) continue; seen.add(key(d)); out.push(d); }
      // Numbers with no filler: use nearby numbers (kept positive when the answer is positive).
      if (!filler && typeof correct === 'number' && Number.isInteger(correct)) filler = () => { let v; do v = correct + H.rnd(-5, 5); while (v === correct || (correct > 0 && v <= 0)); return v; };
      let guard = 0;
      while (out.length < 4 && filler && guard++ < 200) { const d = filler(); if (!seen.has(key(d))) { seen.add(key(d)); out.push(d); } }
      return H.shuffle(out);
    }
  };
  window.MQ = H;

  window.MathQuiz = function (cfg) {
    const TOTAL = cfg.time || 90, PENALTY = cfg.penalty ?? 5, KEY = 'ma-' + cfg.key + '-best';
    const getBest = () => { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
    const setBest = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
    const style = document.createElement('style'); style.textContent = CSS + (cfg.css || ''); document.head.appendChild(style);
    document.body.innerHTML = `
      <div class="mq">
        <section id="mq-game">
          <div class="mq-hud"><span>Score <b id="mq-score">0</b></span><span>Streak <b id="mq-streak">0</b></span><span><b id="mq-time">${TOTAL}</b>s</span></div>
          <div class="mq-bar"><i id="mq-bar"></i></div>
          <div class="mq-board" id="mq-board"></div>
          <p class="mq-q" id="mq-q"></p>
          <div class="mq-answers" id="mq-answers"></div>
          <p class="mq-hint" id="mq-hint"></p>
        </section>
        <section class="mq-screen" id="mq-end" hidden>
          <h1>Time's up!</h1>
          <p>Your score</p>
          <div class="final" id="mq-final">0</div>
          <p id="mq-bestend"></p>
          <button class="mq-go" id="mq-again">Play again</button>
        </section>
      </div>`;
    const $ = id => document.getElementById(id);
    let score = 0, streak = 0, right = 0, timeLeft = TOTAL, running = false, last = 0, cur = null, locked = false;

    function next() {
      cur = cfg.gen(Math.floor(right / 5), right);
      $('mq-board').innerHTML = cur.board || '';
      $('mq-board').hidden = !cur.board;
      $('mq-q').innerHTML = cur.q || '';
      cur.labels = cur.options.map(o => typeof o === 'object' ? o.label : H.neg(o));
      cur.keys = cur.options.map(o => typeof o === 'object' ? String(o.value) : String(o));
      $('mq-answers').style.gridTemplateColumns = cur.options.length === 2 ? '1fr 1fr' : '';
      $('mq-answers').innerHTML = cur.labels.map((l, i) => `<button data-i="${i}"><small>${i + 1}</small>${l}</button>`).join('');
      $('mq-hint').textContent = '';
    }
    function choose(i) {
      if (!running || locked || !cur || i >= cur.keys.length) return;
      const b = $('mq-board'); b.classList.remove('good', 'bad'); void b.offsetWidth;
      if (cur.keys[i] === String(cur.answer)) {
        right++; streak++; score += 10 + Math.min(streak - 1, 10) * 2;
        b.classList.add('good'); next();
      } else {
        streak = 0; timeLeft -= PENALTY; b.classList.add('bad');
        if (cur.hint) $('mq-hint').innerHTML = cur.hint;
        locked = true; setTimeout(() => locked = false, 300);
      }
      $('mq-score').textContent = score; $('mq-streak').textContent = streak;
    }
    $('mq-answers').addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(+b.dataset.i); });
    addEventListener('keydown', e => {
      if (running && /^[1-9]$/.test(e.key)) choose(+e.key - 1);
      else if (!running && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); start(); }
    });
    function start() {
      score = 0; streak = 0; right = 0; timeLeft = TOTAL; running = true; last = performance.now();
      $('mq-score').textContent = 0; $('mq-streak').textContent = 0;
      $('mq-end').hidden = true; $('mq-game').hidden = false;
      next(); requestAnimationFrame(tick);
    }
    function tick(t) {
      if (!running) return;
      if (window.MA_WAIT) { last = t; requestAnimationFrame(tick); return; } // clock waits for the first answer
      timeLeft -= (t - last) / 1000; last = t;
      if (timeLeft <= 0) return end();
      $('mq-time').textContent = Math.ceil(timeLeft); $('mq-bar').style.width = (timeLeft / TOTAL * 100) + '%';
      requestAnimationFrame(tick);
    }
    function end() {
      running = false;
      const best = Math.max(getBest(), score); setBest(best);
      $('mq-final').textContent = score;
      $('mq-bestend').textContent = `${right} correct. ` + (score >= best && score > 0 ? 'New best!' : 'Best: ' + best);
      $('mq-game').hidden = true; $('mq-end').hidden = false;
    }
    $('mq-again').onclick = start;
    // No start screen: the first question is ready right away, and the clock waits for the first answer.
    window.MA_WAIT = true;
    window.MA_TIP = { text: (cfg.intro || [])[0] || cfg.title, timed: true };
    start();
    // For automated testing.
    window.__mq = { get cur() { return cur; }, set right(v) { right = v; }, choose, start, next };
  };
})();
