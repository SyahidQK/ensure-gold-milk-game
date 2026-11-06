# Fill It Gold – Ensure Gold CaHMB booth touch-TV game

Offline HTML/CSS/JS game for a 1920×1080 landscape touch TV. No build step, no internet needed.

## Flow
1. **Main page** – Ensure Gold logo, the gold-gradient game name "Fill It Gold", the line "CaHMB is found in small
   amounts in some foods…" in a frosted box, and a metallic gold **Press to start** button with a pulsing glow.
   Animated background (`js/home-bg.js`, a canvas): moving blue grid with a gold light sweep, rising lights, floating
   golden soybeans, and a gold ripple wherever the screen is touched. The choose-a-food page shares the same
   background; it only runs while one of those two pages is showing.
   The game only starts from the button.
2. **Choose a food to start** – the CaHMB intro line and the 8 foods in two cards (Foods high in Leucine / Foods with CaHMB).
   Amounts are hidden here. Tap a food, then **Start**.
3. **Fill the glass** – the glass is full when the player reaches the chosen food's amount (e.g. ~7 chicken breasts,
   ~3,000 avocados). A counter under the title shows it live, e.g. "1,137 / ~3,000 Servings of Cooked Asparagus".
   One "TAP!" target shows the food; every tap adds a random 4–8% of the amount (0.3–0.6 chicken breasts,
   120–240 avocados…) and the target jumps to a new random spot beside the glass. Every food takes 15–20 taps.
4. **Glass full!** – the glass shakes hard (~1 s), then glows gold with a flash and a particle burst; then a card with only the chosen food with its fact, e.g. "~3,000 Avocados — you would need to eat ~3,000 Avocados
   to get ~1.5g of CaHMB" (auto-continues after 10 s, or tap "Watch the video").
5. **CaHMB video** (background music muted; **Skip** button top-right) → back to the main page.

A food choice or game left untouched for 60 s goes back to the main page for the next player.

## Run at the booth
Recommended (local server, so the video can seek):

```bash
node tools/serve.js 8080
```

Then open Chrome in kiosk mode:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 http://localhost:8080
```

Opening `index.html` straight from disk also works in Chrome.

Exit kiosk: `Alt+F4`. Hidden reset: press and hold the **top-left corner** for 3 seconds.

## CaHMB video
`assets/video/hmb.mp4` is the client's "Ensure Armour (HMB & YBG) MOA Video" (2:06, 1920×1080, 25 fps).
The original export was 293 MB (19.4 Mbps), over GitHub's 100 MB file limit, so it was re-encoded to 78 MB
(H.264 High, two-pass ~4.8 Mbps, AAC 128 kbps, `faststart` so playback begins instantly). SSIM vs the original: 0.994.

To replace it, drop a new file at the same path. To re-encode a large export the same way
(ffmpeg ships with Shutter Encoder at `C:\Program Files\Shutter Encoder\app\Library\ffmpeg.exe`):

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -b:v 4800k -pass 1 -an -f mp4 NUL
```

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -b:v 4800k -maxrate 7000k -bufsize 9600k -pass 2 -profile:v high -level 4.1 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart assets/video/hmb.mp4
```

If the file is ever missing, a "CaHMB Video – Coming soon" screen shows for 6 seconds instead.

## Background music
`assets/audio/bgm.mp3` plays from 0:09 and loops back to 0:09 when it ends. It fades out while the video screen is showing and fades back in afterwards.
Chrome only plays sound on its own when launched with `--autoplay-policy=no-user-gesture-required` (included in the kiosk command above); otherwise the music starts on the first touch.

## Changing content / tuning
Everything is in `js/foods.js`:
- `FOODS` – names, `target` (the amount that fills one glass; hidden while choosing, counted up during play), icons, `word` (used in the game title).
- `GAME_CONFIG` – amount per tap (`tapMinPct`/`tapMaxPct`, % of the food's amount), idle reset (60 s), result card time, video path, sound on/off, BGM start point / volume / fade

## Font
All text uses **Chewy** (`assets/fonts/Chewy-Regular.ttf`), bundled with the game, so nothing needs installing on the booth PC.

## Assets
- `assets/ensure-gold-logo-hd.webp` – official Ensure Gold logo (transparent), used on the main page, food screen and video screen
- `assets/icons/*.png` – cropped from the PDF game mockup (`tools/crop-assets.js`; needs `npm i jpeg-js pngjs` to re-run)
- `assets/icons/soybeans.svg`, `cauliflower.svg` – drawn to match (not in the mockup)
- `assets/ensure-gold-logo.png` – cropped from the mockup glass; still used for the logo printed on the glass in the game
- `assets/bg-farm.svg` – game-screen background, Malaysian dairy farm: sky and sun, misty Cameron Highlands ridges with tea
  terraces, hazy city skyline, white fences, hay bales and a kampung house on stilts (static)
- `assets/bg/` – animated layers drawn on top of it, behind all game UI (`.farm-bg` in `index.html`, styles in
  `css/style.css`): drifting clouds, swaying banana trees and grass, hibiscus bushes, and two butterflies that cross
  now and then. All motion is transform-only (GPU-composited) and the layer ignores touches.
- `js/farm-cows.js` – four dairy cows that each graze in one spot for ~50–70 s (head down, nibbling, tail swishing),
  then lift their head, turn and walk to a new spot in their own patch of field, and graze again, forever. Patches stay
  clear of the glass panel and the house, and cows keep a gap from each other. Decoration only — no game logic.
  In a browser console, `FARM_COWS.walkAll()` sends every cow walking right away.
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
