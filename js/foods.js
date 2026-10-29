/*
 * Game content + tuning. Edit this file to change foods, numbers or copy.
 * Food figures come from the booth "Right Wall" panel (HMB Booth.pdf).
 */
window.GAME_CONFIG = {
  idleResetMs: 60000,      // no touch for this long mid-game → back to the main page
  fullMs: 1800,            // pause on the full glass before the summary
  summaryMs: 9000,         // summary auto-continues to the video after this long
  videoSrc: 'assets/video/hmb.mp4',
  placeholderMs: 6000,     // shown while the client video is not yet in place
  sound: true,             // tap / win sound effects
  bgmSrc: 'assets/audio/bgm.mp3',
  bgmStartAt: 9,           // seconds into the track where the BGM starts (and each loop restarts)
  bgmVolume: 0.6,          // 0–1
  bgmFadeMs: 800           // fade when muting for the video / unmuting after
};

/*
 * fill: % of the glass one tap adds (not shown to players). The glass stops at
 *       100%; lower values = more taps to fill (current mix ≈ 30 taps).
 * slot: position around the glass on the game screen (left-1..3 / right-1..3),
 *       null = main info page only.
 */
window.FOODS = [
  // Foods high in Leucine
  { id: 'eggs',        group: 'leucine', target: 50,   name: 'Eggs',                           label: 'Eggs',      fill: 4, slot: 'left-1',  icon: 'assets/icons/eggs.png' },
  { id: 'steak',       group: 'leucine', target: 11,   name: 'Beef Steaks',                    label: 'Beef Steak', fill: 5, slot: 'right-1', icon: 'assets/icons/steak.png' },
  { id: 'chicken',     group: 'leucine', target: 7,    name: 'Chicken Breasts',                label: 'Chicken',   fill: 6, slot: 'right-2', icon: 'assets/icons/chicken.png' },
  { id: 'soybeans',    group: 'leucine', target: 10,   name: 'Cups of Soybeans',               fill: 0,  slot: null,      icon: 'assets/icons/soybeans.svg' },
  // Foods with HMB
  { id: 'avocado',     group: 'hmb',     target: 3000, name: 'Avocados',                       label: 'Avocado',   fill: 1,  slot: 'left-2',  icon: 'assets/icons/avocado.png' },
  { id: 'asparagus',   group: 'hmb',     target: 3000, name: 'Servings of Cooked Asparagus',   label: 'Asparagus', fill: 2, slot: 'left-3',  icon: 'assets/icons/asparagus.png' },
  { id: 'cauliflower', group: 'hmb',     target: 6500, name: 'Servings of Cooked Cauliflower', fill: 0,  slot: null,      icon: 'assets/icons/cauliflower.svg' },
  { id: 'catfish',     group: 'hmb',     target: 750,  name: 'Catfish Fillets',                label: 'Catfish',   fill: 3, slot: 'right-3', icon: 'assets/icons/catfish.png' }
];
