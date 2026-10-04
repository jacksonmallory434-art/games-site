#!/usr/bin/env python3
"""Builds the search-friendly parts of MathAdvice from games.json.

Run this after adding, removing, or renaming a game:
    python3 build.py

It writes:
  - play/<slug>/index.html   one real page per game, with its own title and description
  - the game list inside index.html (so search engines can see every game link)
  - sitemap.xml
"""
import html, json, os, re, datetime

SITE = "https://mathadvice.org"
ROOT = os.path.dirname(os.path.abspath(__file__))
games = json.load(open(os.path.join(ROOT, "games.json"), encoding="utf-8"))
games.sort(key=lambda g: g["title"].lower())
template = open(os.path.join(ROOT, "game.html"), encoding="utf-8").read()
# game.html sends old links (game.html?slug=...) to the new page; drop that from the generated copies.
template = re.sub(r"\s*<script>/\* redirect-old-links \*/.*?</script>", "", template, flags=re.S)
esc = lambda s: html.escape(s, quote=True)


def short(text, n=155):
    """Trim a description to a search-result-sized snippet."""
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(" ", 1)[0].rstrip(",.;:")
    return cut + "…"


def game_page(g):
    url = f"{SITE}/play/{g['slug']}/"
    title = f"{g['title']}: free {g['category'].lower()} game – MathAdvice"
    desc = short(f"{g['description']}")
    data = {
        "@context": "https://schema.org",
        "@type": ["VideoGame", "LearningResource"],
        "name": g["title"],
        "description": g["description"],
        "url": url,
        "image": f"{SITE}/{g['thumb']}",
        "genre": "Educational",
        "educationalUse": "practice",
        "learningResourceType": "Game",
        "about": g["category"],
        "isAccessibleForFree": True,
        "playMode": "SinglePlayer",
        "applicationCategory": "Game",
        "operatingSystem": "Any (web browser)",
        "publisher": {"@type": "Organization", "name": "MathAdvice", "url": SITE + "/"},
    }
    head_extra = (
        f'  <link rel="canonical" href="{url}">\n'
        f'  <meta property="og:type" content="website">\n'
        f'  <meta property="og:site_name" content="MathAdvice">\n'
        f'  <meta property="og:title" content="{esc(g["title"])} – MathAdvice">\n'
        f'  <meta property="og:description" content="{esc(desc)}">\n'
        f'  <meta property="og:url" content="{url}">\n'
        f'  <meta property="og:image" content="{SITE}/{g["thumb"]}">\n'
        f'  <script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>\n'
    )
    s = template
    s = s.replace("<title>Play – MathAdvice</title>", f"<title>{esc(title)}</title>")
    s = s.replace('<meta name="description" content="Play a free math game on MathAdvice.">',
                  f'<meta name="description" content="{esc(desc)}">\n' + head_extra.rstrip("\n"))
    s = s.replace('<h1 id="title">Loading…</h1>', f'<h1 id="title">{esc(g["title"])}</h1>')
    s = s.replace('<span class="topic" id="topic"></span>', f'<span class="topic" id="topic">{esc(g["category"])}</span>')
    s = s.replace('<p id="desc"></p>', f'<p id="desc">{esc(g["description"])}</p>')
    s = s.replace('<p id="howto"></p>', f'<p id="howto">{esc(g["howto"])}</p>')
    s = s.replace('<span id="source"></span>', f'<span id="source">{esc(g["source"])}</span>')
    s = s.replace('<script src="/js/game.js"></script>',
                  f'<script>window.GAME_SLUG = {json.dumps(g["slug"])};</script>\n  <script src="/js/game.js"></script>')
    return s


# 1) One page per game
for g in games:
    d = os.path.join(ROOT, "play", g["slug"])
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(game_page(g))

# 2) Static game list on the homepage (JavaScript replaces it with the interactive grid)
index_path = os.path.join(ROOT, "index.html")
index = open(index_path, encoding="utf-8").read()
cards = "\n".join(
    f'      <a class="card" href="/play/{g["slug"]}/"><img class="thumb" src="/{g["thumb"]}" alt="" loading="lazy" width="512" height="384">'
    f'<span class="name">{esc(g["title"])}</span><span class="topic">{esc(g["category"])}</span></a>'
    for g in games)
index = re.sub(r'<div id="grid" class="grid">.*?</div><!-- /grid -->|<div id="grid" class="grid"></div>',
               f'<div id="grid" class="grid">\n{cards}\n    </div><!-- /grid -->', index, flags=re.S)
index = re.sub(r'<span id="count">\d+</span>', f'<span id="count">{len(games)}</span>', index)
open(index_path, "w", encoding="utf-8").write(index)

# 3) Sitemap
today = datetime.date.today().isoformat()
urls = [(f"{SITE}/", "1.0"), (f"{SITE}/about.html", "0.6"), (f"{SITE}/privacy.html", "0.3")]
urls += [(f"{SITE}/play/{g['slug']}/", "0.8") for g in games]
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
sitemap += [f"  <url><loc>{u}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>" for u, p in urls]
sitemap.append("</urlset>")
open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sitemap) + "\n")

print(f"Built {len(games)} game pages and a sitemap with {len(urls)} URLs.")
