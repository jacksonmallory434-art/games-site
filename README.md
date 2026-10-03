# Starter games site

Plain HTML/CSS/JS. No build step.

## Files
- `games.json` – your game list. One entry per game.
- `index.html` + `js/app.js` – homepage grid, search, categories.
- `game.html` + `js/game.js` – game page (`game.html?slug=...`).
- `about.html`, `privacy.html` – needed for ad network approval. Replace every ALL-CAPS placeholder.
- `css/style.css` – colors are at the top under `:root`.

## Adding a game
Copy an entry in `games.json` and fill in:
- `slug` – short id in lowercase with dashes, e.g. `bubble-shooter`
- `embed` – path to the game's page on this site, e.g. `games/2048/index.html`
- `width` / `height` – from their iframe code
- `thumb` – the thumbnail image URL they provide (or leave `""` for a colored placeholder)
- `description` / `howto` – write these yourself; original text helps with AdSense approval
- `mobile` – `true` if it works on touch screens

## Preview on your computer
The pages load `games.json`, which doesn't work by double-clicking the file.
Run `npx serve .` in this folder (needs Node.js) and open the address it prints.

## Deploy
1. Create a GitHub repository and upload everything in this folder.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   Framework preset: None. Build command: leave empty. Output directory: `/`.
3. After it deploys: your Pages project → Custom domains → add your domain.
4. Every time you edit a file on GitHub, Cloudflare redeploys automatically.

## ads.txt
When your network or AdSense gives you `ads.txt` lines, create a file named `ads.txt`
in this folder with those lines.
