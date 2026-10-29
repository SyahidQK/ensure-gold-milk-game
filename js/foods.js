/*
 * Game content + tuning. Edit this file to change foods, numbers or copy.
 * Food figures come from the booth "Right Wall" panel (HMB Booth.pdf).
 */
window.GAME_CONFIG = {
  tapsToFill: 20,          // average taps needed to fill the glass
  tapRandomMin: 0.6,       // each tap adds target/tapsToFill × random(min..max)
  tapRandomMax: 1.4,
  idleResetMs: 60000,      // no touch for this long on screens 1–2 → back to start
  celebrateMs: 3500,       // how long the "Glass full!" card shows before the video
  videoSrc: 'assets/video/hmb.mp4',
  placeholderMs: 6000,     // shown while the client video is not yet in place
  sound: true,             // tap / win sound effects
  bgmSrc: 'assets/audio/bgm.mp3',
  bgmStartAt: 9,           // seconds into the track where the BGM starts (and each loop restarts)
  bgmVolume: 0.6,          // 0–1
  bgmFadeMs: 800           // fade when muting for the video / unmuting after

};

window.FOODS = [
  // Foods high in Leucine
  { id: 'eggs',        group: 'leucine', target: 50,   name: 'Eggs',                         word: 'eggs',           icon: 'assets/icons/eggs.png' },
  { id: 'steak',       group: 'leucine', target: 11,   name: 'Beef Steaks',                  word: 'beef steak',     icon: 'assets/icons/steak.png' },
  { id: 'chicken',     group: 'leucine', target: 7,    name: 'Chicken Breasts',              word: 'chicken breast', icon: 'assets/icons/chicken.png' },
  { id: 'soybeans',    group: 'leucine', target: 10,   name: 'Cups of Soybeans',             word: 'soybeans',       icon: 'assets/icons/soybeans.svg' },
  // Foods with HMB
  { id: 'avocado',     group: 'hmb',     target: 3000, name: 'Avocados',                     word: 'avocado',        icon: 'assets/icons/avocado.png' },
  { id: 'asparagus',   group: 'hmb',     target: 3000, name: 'Servings of Cooked Asparagus', word: 'asparagus',      icon: 'assets/icons/asparagus.png' },
  { id: 'cauliflower', group: 'hmb',     target: 6500, name: 'Servings of Cooked Cauliflower', word: 'cauliflower',  icon: 'assets/icons/cauliflower.svg' },
  { id: 'catfish',     group: 'hmb',     target: 750,  name: 'Catfish Fillets',              word: 'catfish',        icon: 'assets/icons/catfish.png' }
];
