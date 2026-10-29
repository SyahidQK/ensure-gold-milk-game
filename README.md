# Ensure Gold – Fill Up the Glass (HMB Booth touch-TV game)

Offline HTML/CSS/JS game for a 1920×1080 landscape touch TV. No build step, no internet needed.

## Flow
1. **Intro** – right-wall HMB info + 8 foods (leucine: eggs, steak, chicken, soybeans; HMB: avocado, asparagus, cauliflower, catfish). Tap **Start**.
2. **Fill the glass** – 6 foods around the glass, each adding a fixed amount shown on its button:
   Avocado +5%, Asparagus +10%, Catfish +15%, Eggs +20%, Beef Steak +25%, Chicken +30%.
   Players mix any foods to reach **exactly 100%**. Going over overflows the glass ("Oops! Too much!") and the round restarts from 0%. No timer.
3. **Perfect fill!** – summary of how many times each food was tapped → **HMB video** → back to start.

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
- `FOODS` – names, target numbers, icons, `fill` (% per tap), `slot` (position around the glass), `label` (short game name).
  Keep every `fill` a multiple of the smallest one (currently 5%) so exactly 100% is always reachable.
- `GAME_CONFIG` – idle reset (60 s), overflow message time, summary time, video path, sound on/off, BGM start point / volume / fade

## Assets
- `assets/icons/*.png` – cropped from the PDF game mockup (`tools/crop-assets.js`; needs `npm i jpeg-js pngjs` to re-run)
- `assets/icons/soybeans.svg`, `cauliflower.svg` – drawn to match (not in the mockup)
- `assets/ensure-gold-logo.png` – cropped from the mockup glass; **replace with the client's official logo PNG when available**
- `assets/bg-farm.svg` – farm background
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
