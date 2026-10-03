// Homepage: loads games.json, draws the grid, handles search + category filters.

function placeholderColor(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 50) % 360} 60% 30%))`;
}

function cardHTML(g) {
  const thumb = g.thumb
    ? `<img class="thumb" src="${g.thumb}" alt="" loading="lazy">`
    : `<div class="thumb ph" style="background:${placeholderColor(g.title)}">${g.title[0]}</div>`;
  return `<a class="card" href="game.html?slug=${encodeURIComponent(g.slug)}">${thumb}<div class="name">${g.title}</div></a>`;
}

async function init() {
  const games = await fetch('games.json').then(r => r.json());
  games.sort((a, b) => a.title.localeCompare(b.title));

  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const search = document.getElementById('search');
  const cats = document.getElementById('cats');
  let activeCat = 'All';

  const categories = ['All', ...new Set(games.map(g => g.category))];
  cats.innerHTML = categories.map(c => `<button type="button" data-cat="${c}">${c}</button>`).join('');

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = games.filter(g =>
      (activeCat === 'All' || g.category === activeCat) &&
      g.title.toLowerCase().includes(q));
    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    cats.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.cat === activeCat));
  }

  cats.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    activeCat = b.dataset.cat;
    render();
  });
  search.addEventListener('input', render);
  render();
}

init();
