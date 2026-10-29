# Ensure Gold – Fill Up the Glass (HMB Booth touch-TV game)

Offline HTML/CSS/JS game for a 1920×1080 landscape touch TV. No build step, no internet needed.

## Flow
1. **Main page** – the right-wall HMB panel: intro line, "One would need to eat", the whey → leucine → HMB pills,
   and the 8 foods (leucine: ~50 eggs, ~11 beef steaks, ~7 chicken breasts, ~10 cups of soybeans;
   HMB: ~3,000 avocados, ~3,000 asparagus, ~6,500 cauliflower, ~750 catfish). The game only starts on **Press to start**.
2. **Fill the glass** – 6 foods around the glass. Each tap adds a hidden amount:
   Avocado 1%, Asparagus 2%, Catfish 3%, Eggs 4%, Beef Steak 5%, Chicken 6%.
   Mixing foods takes about 23–35 taps. The glass stops at 100% and the round ends — no overflow, no timer.
3. **Glass full!** – summary of how many times each food was tapped (auto-continues after 9 s, or tap "Watch the video").
4. **HMB video** (background music muted) → back to the main page.

A game left untouched for 60 s goes back to the main page for the next player.

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
- `FOODS` – names, target numbers, icons, `fill` (% per tap — lower = slower to fill), `slot` (position around the glass), `label` (short game name).
- `GAME_CONFIG` – idle reset (60 s), summary time, info page time, video path, sound on/off, BGM start point / volume / fade

## Assets
- `assets/icons/*.png` – cropped from the PDF game mockup (`tools/crop-assets.js`; needs `npm i jpeg-js pngjs` to re-run)
- `assets/icons/soybeans.svg`, `cauliflower.svg` – drawn to match (not in the mockup)
- `assets/ensure-gold-logo.png` – cropped from the mockup glass; **replace with the client's official logo PNG when available**
- `assets/bg-farm.svg` – farm background
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
