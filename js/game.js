// Game page: reads window.GAME_SLUG (or ?slug=), builds the iframe, fullscreen button, "more games".

async function init() {
  const slug = window.GAME_SLUG || new URLSearchParams(location.search).get('slug');
  const games = await fetch('/games.json').then(r => r.json());
  const g = games.find(x => x.slug === slug);

  if (!g) {
    document.getElementById('title').textContent = 'Game not found';
    return;
  }

  if (!window.GAME_SLUG) document.title = `${g.title} – MathAdvice`;
  document.getElementById('title').textContent = g.title;
  document.getElementById('topic').textContent = g.category;
  document.getElementById('desc').textContent = g.description;
  document.getElementById('howto').textContent = g.howto;
  document.getElementById('source').textContent = g.source;
  if (g.license) {
    const lic = document.getElementById('lic');
    lic.append(' License: ' + g.license + '. ');
    if (g.url) {
      const link = document.createElement('a');
      link.href = g.url; link.target = '_blank'; link.rel = 'noopener';
      link.textContent = 'Original project';
      lic.append(link);
    }
  }
  document.getElementById('mobile').textContent = g.mobile ? 'Works on phones and tablets' : 'Best with a keyboard';

  // Keep the game's shape on any screen size.
  const frame = document.getElementById('frame');
  frame.style.aspectRatio = `${g.width} / ${g.height}`;
  // Keep tall (phone-shaped) games from being taller than the screen.
  frame.style.maxWidth = `calc(80vh * ${g.width / g.height})`;
  frame.style.marginInline = 'auto';
  const iframe = document.createElement('iframe');
  iframe.src = '/' + g.embed;
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
  document.getElementById('more').innerHTML = more.map(x =>
    `<a class="card" href="/play/${encodeURIComponent(x.slug)}/"><img class="thumb" src="/${x.thumb}" alt="" loading="lazy" width="512" height="384">` +
    `<span class="name">${x.title}</span><span class="topic">${x.category}</span></a>`).join('');
}

init();
