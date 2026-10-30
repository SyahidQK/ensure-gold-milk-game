# Fill It Gold – Ensure Gold HMB booth touch-TV game

Offline HTML/CSS/JS game for a 1920×1080 landscape touch TV. No build step, no internet needed.

## Flow
1. **Main page** – Ensure Gold logo, the game name "Fill It Gold", the line "HMB is found in small amounts
   in some foods…", and **Press to start**. The game only starts from that button.
2. **Choose a food to start** – the HMB info pills and the 8 foods in two cards (Foods high in Leucine / Foods with HMB).
   Amounts are hidden here. Tap a food, then **Start**.
3. **Fill the glass** – one "TAP!" target showing the chosen food. Every tap fills 3–6% of the glass and the target
   jumps to a new random spot on either side of the glass (at least 300 px away). About 21–25 taps to fill.
4. **Glass full!** – only the chosen food with its fact, e.g. "~3,000 Avocados — you would need to eat ~3,000 Avocados
   to get ~1.5g of HMB" (auto-continues after 10 s, or tap "Watch the video").
5. **HMB video** (background music muted) → back to the main page.

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

Exit kiosk: `Alt+F4`. Hidden reset: press and hold the **top-right corner** for 3 seconds.

## Adding the client HMB video
Drop the file at `assets/video/hmb.mp4` (H.264 MP4, 1920×1080). Nothing else to change.
Until it exists, a "HMB Video – Coming soon" screen shows for 6 seconds instead.

## Background music
`assets/audio/bgm.mp3` plays from 0:09 and loops back to 0:09 when it ends. It fades out while the video screen is showing and fades back in afterwards.
Chrome only plays sound on its own when launched with `--autoplay-policy=no-user-gesture-required` (included in the kiosk command above); otherwise the music starts on the first touch.

## Changing content / tuning
Everything is in `js/foods.js`:
- `FOODS` – names, amounts (shown only on the result card), icons, `word` (used in the game title), `label` (the "+1 ___" pop-up).
- `GAME_CONFIG` – fill per tap (`tapFillMin`/`tapFillMax`), idle reset (60 s), result card time, video path, sound on/off, BGM start point / volume / fade

## Font
All text uses **Chewy** (`assets/fonts/Chewy-Regular.ttf`), bundled with the game, so nothing needs installing on the booth PC.

## Assets
- `assets/ensure-gold-logo-hd.webp` – official Ensure Gold logo (transparent), used on the main page, food screen and video screen
- `assets/icons/*.png` – cropped from the PDF game mockup (`tools/crop-assets.js`; needs `npm i jpeg-js pngjs` to re-run)
- `assets/icons/soybeans.svg`, `cauliflower.svg` – drawn to match (not in the mockup)
- `assets/ensure-gold-logo.png` – cropped from the mockup glass; still used for the logo printed on the glass in the game
- `assets/bg-farm.svg` – farm background
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
