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

## Run at the booth (fully offline)
The game needs **no internet and no server**: the font, images, music and video are all in this folder.

**Double-click `Start Fill It Gold.bat`.** It opens the game full-screen in Chrome straight from this folder, in its
own clean Chrome profile (`.kiosk-profile/`, so no extensions, sign-in or sync run alongside), with sound allowed
to start by itself and Chrome's background slow-downs switched off. If Chrome isn't installed it uses Edge.
It works wherever the folder is copied (e.g. to the booth laptop's desktop).

Exit: `Alt+F4`. Hidden reset: press and hold the **top-left corner** for 3 seconds.

### If the launcher doesn't start on another PC
1. **Copy or extract the whole folder first.** Don't run the launcher from inside a ZIP: right-click the ZIP →
   **Extract All…**, then open the extracted folder. The folder must contain `index.html`, `css`, `js` and `assets`.
2. **"Windows protected your PC"** (blue box): click **More info → Run anyway**. Files copied from the internet or
   another PC can be blocked by Windows; you can also right-click the .bat → Properties → tick **Unblock** → OK.
3. **Read the message.** If something is wrong the launcher window stays open and says why, and writes the details
   to `launcher-log.txt` in the game folder (send that file for help).
4. **No Chrome?** The launcher finds Chrome or Edge automatically (including unusual install locations). If neither
   is installed it says so: install Google Chrome.
5. **Fallback:** double-clicking `index.html` in the folder also runs the game offline in any modern browser
   (press F11 for full screen).

### Laptop setup for smooth video (do once on the booth laptop)
- Windows **Settings → System → Display → Graphics** → add / pick **Google Chrome** → **High performance**
  (so Chrome uses the NVIDIA graphics card, not the built-in one). Restart Chrome afterwards.
- Keep the laptop **plugged in**, and set **Settings → System → Power → Power mode → Best performance**.
- **Screen and sleep → Never** (on power), so the TV never goes dark.
- Turn on **Do not disturb** / turn off notifications, and close other apps (Teams, OneDrive syncing, updates).

### Check smoothness on the booth laptop
Double-click **`Run Smoothness Check.bat`**. The game plays itself in a loop (main page → food → fill → video →
main page) and a small readout in the bottom-left shows how many video frames were shown and dropped, per video and
in total. Let it run for a few cycles: 0–0.5% dropped is smooth. Exit with `Alt+F4`.
(Same as opening `index.html?check`.)

### How the game keeps the video smooth
- The video is loaded once when the game starts and stays loaded (rewound after each play), so it is ready instantly.
- Screens that aren't showing are switched off once they fade out: their animations pause and they stop using
  graphics memory, so nothing else competes with the video.
- The background music is paused (not just muted) while the video plays, and carries on afterwards.

### Optional: local server
For development you can also serve the folder with `node tools/serve.js 8080` and open `http://localhost:8080`.

## CaHMB video
`assets/video/hmb.mp4` is the client's game video "ensure gold game video.mp4" (1:03, 1920×1080, 30 fps, H.264 + AAC,
75 MB). It was already under GitHub's 100 MB limit, so it was only remuxed with `faststart` (no re-encode, no quality
change) so playback begins instantly. The source copy in the project root is ignored by Git. If a future export is
over 100 MB, re-encode it with the commands below.

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
- `assets/meadow/` – game-screen background: the summer meadow from the "Spring and Summer – Green Earth" Premiere
  template (Envato). Its Photoshop layers were exported to WebP at stage scale (2000×1125 → 1920×1080) and placed at
  their original positions in `.meadow` (`index.html`): sky, rainbow, ten clouds that drift gently, rolling hills,
  three bands of grass that sway at different speeds, five red flowers that sway from their stems, and four butterflies
  built from the template's wing art that flap across the sky now and then. All motion is transform-only (GPU-composited)
  and the layer ignores touches. The game UI sits on top and is unchanged.
- `assets/source/` – original images extracted from `HMB Booth.pdf` (`tools/extract-pdf-images.js`)

To swap in final artwork, replace the files and keep the same names.
