/*
 * Game content + tuning. Edit this file to change foods, numbers or copy.
 * Food figures come from the booth "Right Wall" panel (HMB Booth.pdf).
 */
window.GAME_CONFIG = {
  // each tap adds a random 4–8% of the chosen food's amount (e.g. 120–240 avocados, 0.3–0.6 chicken
  // breasts), so every food takes about 15–20 taps; the last tap lands exactly on the amount
  tapMinPct: 4,
  tapMaxPct: 8,
  idleResetMs: 60000,      // no touch for this long on the food choice or game → back to the main page
  fullMs: 1800,            // pause on the full glass before the result card
  summaryMs: 10000,        // result card auto-continues to the video after this long
  videoSrc: 'assets/video/hmb.mp4',
  placeholderMs: 6000,     // shown while the client video is not yet in place
  sound: true,             // tap / win sound effects
  bgmSrc: 'assets/audio/bgm.mp3',
  bgmStartAt: 9,           // seconds into the track where the BGM starts (and each loop restarts)
  bgmVolume: 0.6,          // 0–1
  bgmFadeMs: 800           // fade when muting for the video / unmuting after
};

/*
 * target: how much of this food fills the glass (counted up during play; hidden while choosing)
 * group:  'leucine' → amount to get ~30g leucine (5% → ~1.5g HMB); 'hmb' → amount to get ~1.5g HMB
 * word:   used in "Tap the ___ to fill up the glass"
 * label:  short name for the "+1 ___" pop-up
 */
window.FOODS = [
  // Foods high in Leucine
  { id: 'eggs',        group: 'leucine', target: 50,   name: 'Eggs',                           word: 'eggs',           label: 'Egg',         icon: 'assets/icons/eggs.png' },
  { id: 'steak',       group: 'leucine', target: 11,   name: 'Beef Steaks',                    word: 'beef steak',     label: 'Beef Steak',  icon: 'assets/icons/steak.png' },
  { id: 'chicken',     group: 'leucine', target: 7,    name: 'Chicken Breasts',                word: 'chicken breast', label: 'Chicken',     icon: 'assets/icons/chicken.png' },
  { id: 'soybeans',    group: 'leucine', target: 10,   name: 'Cups of Soybeans',               word: 'soybeans',       label: 'Soybeans',    icon: 'assets/icons/soybeans.svg' },
  // Foods with HMB
  { id: 'avocado',     group: 'hmb',     target: 3000, name: 'Avocados',                       word: 'avocado',        label: 'Avocado',     icon: 'assets/icons/avocado.png' },
  { id: 'asparagus',   group: 'hmb',     target: 3000, name: 'Servings of Cooked Asparagus',   word: 'asparagus',      label: 'Asparagus',   icon: 'assets/icons/asparagus.png' },
  { id: 'cauliflower', group: 'hmb',     target: 6500, name: 'Servings of Cooked Cauliflower', word: 'cauliflower',    label: 'Cauliflower', icon: 'assets/icons/cauliflower.svg' },
  { id: 'catfish',     group: 'hmb',     target: 750,  name: 'Catfish Fillets',                word: 'catfish',        label: 'Catfish',     icon: 'assets/icons/catfish.png' }
];
