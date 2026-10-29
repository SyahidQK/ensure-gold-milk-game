# Ensure Gold – Fill Up the Glass (HMB Booth touch-TV game)

Offline HTML/CSS/JS game for a 1920×1080 landscape touch TV. No build step, no internet needed.

## Flow
1. **Choose a food to start** – right-wall HMB info + 8 foods (leucine: eggs, steak, chicken, soybeans; HMB: avocado, asparagus, cauliflower, catfish). Tap a food, then **Start**.
2. **Fill the glass** – tap the food button. Each tap adds a random amount (≈ target ÷ 20, ±40%), so the glass fills in about 20 taps and the counter ends exactly on the target (e.g. 3,000 avocados).
3. **Glass full!** celebration → **HMB video** → back to start.

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

## Changing content / tuning
Everything is in `js/foods.js`:
- `FOODS` – names, target numbers, icons
- `GAME_CONFIG` – taps per glass, randomness, idle reset (60 s), celebration length, video path, sound on/off

## Assets
- `assets/icons/*.png` – cropped from the PDF game mockup (`tools/crop-assets.js`; needs `npm i jpeg-js pngjs` to re-run)
- `assets/icons/soybeans.svg`, `cauliflower.svg` – drawn to match (not in the mockup)
- `assets/ensure-gold-logo.png` – cropped from the mockup glass; **replace with the client's official logo PNG when available**
- `assets/bg-farm.svg` – farm background
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
