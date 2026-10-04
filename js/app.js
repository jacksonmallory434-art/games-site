// Homepage: loads games.json, draws the grid, handles search + topic filters.

function cardHTML(g) {
  return `<a class="card" href="/play/${encodeURIComponent(g.slug)}/">` +
    `<img class="thumb" src="/${g.thumb}" alt="" loading="lazy" width="512" height="384">` +
    `<span class="name">${g.title}</span><span class="topic">${g.category}</span></a>`;
}

async function init() {
  const games = await fetch('/games.json').then(r => r.json());
  games.sort((a, b) => a.title.localeCompare(b.title));

  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const search = document.getElementById('search');
  const cats = document.getElementById('cats');
  document.getElementById('count').textContent = games.length;
  let activeCat = 'All';

  // Show topics from basic to advanced; any new topic goes at the end.
  const ORDER = ['Arithmetic', 'Number Sense', 'Algebra', 'Geometry', 'Statistics', 'Calculus'];
  const found = [...new Set(games.map(g => g.category))];
  const categories = ['All', ...ORDER.filter(c => found.includes(c)), ...found.filter(c => !ORDER.includes(c))];
  const count = c => c === 'All' ? games.length : games.filter(g => g.category === c).length;
  cats.innerHTML = categories.map(c => `<button type="button" data-cat="${c}">${c}<span class="n">${count(c)}</span></button>`).join('');

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = games.filter(g =>
      (activeCat === 'All' || g.category === activeCat) &&
      (!q || (g.title + ' ' + g.category + ' ' + g.description).toLowerCase().includes(q)));
    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    cats.querySelectorAll('button').forEach(b => {
      const on = b.dataset.cat === activeCat;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
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
