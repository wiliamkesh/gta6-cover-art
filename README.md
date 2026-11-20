# Leonida Press — GTA-style Cover Art Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/wiliamkesh/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/wiliamkesh/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

Leonida Press turns a photo and a caption into a multi-panel poster in the
Vice City mould: thick black panel gutters, a chrome-gradient title, a neon
script subtitle, role tags, a quote bar, a billing strip, a gold seal and a
barcode. It runs entirely offline in desktop Chrome. Photos are read on your
own machine and never uploaded anywhere.

## What makes this one different

Most cover makers paste one photo into a frame. This one treats the cover
like a print-shop job. The headline feature is the **Break-the-Frame pop-out**:
a hero cut-out — a convertible cruiser, a palm duo, or a dusk skyline — drawn
as layered vector art with clean alpha edges, then dropped a little off-register
with a halftone dot shadow so it looks like it is bursting out of its panel
instead of sitting inside it. No photo is ever cut out roughly; the art is
vector from the first line, so the edge stays crisp at any export size.

Around that, the press does the ordinary work properly:

- **Four asymmetric layouts** — Vice Nine, Hero Split, Sunset Strips and
  Tilted Stack — each with five or six panels and its own title placement.
- **Four grades** — Vice Sunset, Neon Nights, Golden Hour, and a 1986 Vice
  Screenprint mode that re-inks the whole cover in four flat inks with a
  halftone dot screen.
- **Photo handling per panel** — drag a photo onto a panel, pan it with the
  mouse, zoom with the scroll wheel, or let Smart Crop find the face. One
  photo can fill every panel, each with its own crop.
- **Lettering you can edit** — title, script subtitle, tagline, quote, quoted
  publication and billing line, all live on the canvas as you type.
- **Export in one step** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, singly
  or all three at once, as PNG. The export timer in the panel tells you how
  long the render took.
- **Game-case preview** — a CSS 3D steelbook that wears the live cover, so
  you can see the art the way a collector would hold it.

## Try it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Open the page, load the samples, pick a layout and a grade, type a title,
export. No build step, no network requests: every script, font and sample
photo is a file under `app/`.

## How it is built

- `app/index.html` — the editor shell: photo tray, layout and grade pickers,
  lettering fields, export panel, game-case view.
- `app/src/app.js` — editor state and wiring: tray, drag-and-drop, panel
  pan/zoom, export.
- `app/src/cover.js` — the cover engine: layouts, gradient-map grades,
  chrome lettering, barcode, seal, grain and vignette.
- `app/src/vector.js` — the vector hero art: retro sun, palms, cruiser,
  skyline, and the halftone shadow that sells the pop-out.
- `app/src/smartcrop.js` — the face-aware focus finder (skin-tone and detail
  scoring, no model, no network).
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
  (`OFL.txt` beside them).
- `app/samples/` — the two starter sample photos, made for make.fun and free
  to use, plus a third sample drawn by the vector module itself.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Credits

Type: Anton and Pacifico, both under the SIL Open Font License. Sample
photos `boulevard.jpg` and `pier.jpg` were made for make.fun and are free to
use. All cover art, lettering and vector illustration in this entry are
original — no Rockstar Games logo, artwork or font anywhere in it.
