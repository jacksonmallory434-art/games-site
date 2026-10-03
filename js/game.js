// Game page: reads ?slug=, builds the iframe, fullscreen button, "more games".

function placeholderColor(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 50) % 360} 60% 30%))`;
}

async function init() {
  const slug = new URLSearchParams(location.search).get('slug');
  const games = await fetch('games.json').then(r => r.json());
  const g = games.find(x => x.slug === slug);

  if (!g) {
    document.getElementById('title').textContent = 'Game not found';
    return;
  }

  document.title = `${g.title} – MathAdvice`;
  document.getElementById('title').textContent = g.title;
  document.getElementById('desc').textContent = g.description;
  document.getElementById('howto').textContent = g.howto;
  document.getElementById('source').textContent = g.source;
  document.getElementById('mobile').textContent = g.mobile ? '📱 Works on phones' : '⌨️ Needs a keyboard';

  // Keep the game's shape on any screen size.
  const frame = document.getElementById('frame');
  frame.style.paddingTop = `${(g.height / g.width) * 100}%`;
  // Keep tall (phone-shaped) games from being taller than the screen.
  frame.style.maxWidth = `calc(80vh * ${g.width / g.height})`;
  frame.style.marginInline = 'auto';
  const iframe = document.createElement('iframe');
  iframe.src = g.embed;
  iframe.title = g.title;
  iframe.allow = 'fullscreen; autoplay; gamepad';
  iframe.setAttribute('scrolling', 'no');
  frame.appendChild(iframe);

  // Fullscreen, with a fallback for iPhones that don't support it.
  document.getElementById('fs').addEventListener('click', () => {
    if (frame.requestFullscreen) {
      frame.requestFullscreen();
    } else {
      frame.classList.toggle('fake-fs');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') frame.classList.remove('fake-fs');
  });

  // Up to 8 other games from the same category first.
  const more = games
    .filter(x => x.slug !== g.slug)
    .sort((a, b) => (b.category === g.category) - (a.category === g.category))
    .slice(0, 8);
  document.getElementById('more').innerHTML = more.map(x => {
    const thumb = x.thumb
      ? `<img class="thumb" src="${x.thumb}" alt="" loading="lazy">`
      : `<div class="thumb ph" style="background:${placeholderColor(x.title)}">${x.title[0]}</div>`;
    return `<a class="card" href="game.html?slug=${encodeURIComponent(x.slug)}">${thumb}<div class="name">${x.title}</div></a>`;
  }).join('');
}

init();
