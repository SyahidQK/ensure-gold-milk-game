/*
 * Background dairy cows on the game screen (decoration only — no game logic here).
 * Each cow grazes in one spot for about a minute, then lifts its head, turns and walks
 * to another spot in its own patch of field, and grazes again. Repeats forever.
 */
(function () {
  'use strict';

  var layer = document.querySelector('#game .farm-cows');
  if (!layer) return;

  var GRAZE_MIN_MS = 50000;   // ~1 minute of grazing in one place
  var GRAZE_MAX_MS = 70000;
  var WALK_SPEED = 38;        // px per second (stage pixels) — a slow amble
  var COW_WIDTH = 200;        // px at scale 1

  // patches of field each cow keeps to (feet position, stage coords). The glass panel spans x 590–1330;
  // patches end well short of it so a cow (≈200 px wide) never crosses toward the centre.
  var COWS = [
    { x1: 130,  x2: 400,  y1: 795, y2: 830 },
    { x1: 150,  x2: 410,  y1: 880, y2: 935 },
    { x1: 1520, x2: 1780, y1: 828, y2: 862 },
    { x1: 1510, x2: 1780, y1: 915, y2: 960 }
  ];
  var MIN_GAP = 170;          // keep cows from standing on top of each other

  // cartoon dairy cow (big shiny eyes, pink snout, little horns, red collar with a gold bell), drawn facing
  // right with feet on y = 0. Parts are grouped so CSS can move the head, legs and tail.
  var INK = '#2b2b2b';
  var COW_SVG =
    '<svg class="cow-svg" viewBox="-112 -128 260 134" aria-hidden="true">' +
      '<g class="cow-bob">' +
        '<g class="cow-tail">' +
          '<path d="M-86 -82 C-104 -70 -106 -48 -100 -32" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<path d="M-100 -36 C-110 -30 -108 -16 -100 -14 C-92 -16 -90 -30 -100 -36Z" fill="' + INK + '"/>' +
        '</g>' +
        leg('cow-leg leg-b1', -70, '#ffffff') + leg('cow-leg leg-b2', -48, '#ececec') +
        leg('cow-leg leg-f1', 30, '#ffffff') + leg('cow-leg leg-f2', 52, '#ececec') +
        // body with black patches
        '<path d="M-90 -78 C-92 -108 -60 -118 0 -116 C56 -116 92 -106 92 -76 C92 -46 66 -30 0 -30 C-66 -30 -90 -46 -90 -78Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3.5"/>' +
        '<path d="M-74 -104 C-50 -116 -26 -104 -32 -86 C-38 -70 -66 -70 -76 -84 C-80 -92 -80 -100 -74 -104Z" fill="' + INK + '"/>' +
        '<path d="M8 -116 C40 -118 58 -104 48 -90 C38 -76 12 -82 6 -96 C2 -104 2 -112 8 -116Z" fill="' + INK + '"/>' +
        '<path d="M-26 -60 C-10 -68 12 -60 8 -46 C4 -36 -20 -34 -28 -44 C-32 -50 -32 -56 -26 -60Z" fill="' + INK + '"/>' +
        '<path d="M60 -66 C72 -72 86 -66 86 -56 C80 -46 66 -46 60 -54Z" fill="' + INK + '"/>' +
        // udder
        '<path d="M-30 -32 C-30 -18 0 -18 0 -32Z" fill="#f7a8b8" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-22 -22 V-14 M-15 -21 V-13 M-8 -22 V-14" stroke="#e07a92" stroke-width="3.5" stroke-linecap="round"/>' +
        '<g class="cow-head-lift"><g class="cow-head-chew">' +
          // neck
          '<path d="M66 -90 C88 -80 98 -60 104 -42" stroke="' + INK + '" stroke-width="34" fill="none" stroke-linecap="round"/>' +
          '<path d="M66 -90 C88 -80 98 -60 104 -42" stroke="#ffffff" stroke-width="27" fill="none" stroke-linecap="round"/>' +
          // blend the neck into the body so no outline shows across the join when the head lifts
          '<circle cx="64" cy="-90" r="17" fill="#ffffff"/>' +
          // red collar with a gold bell
          '<path d="M74 -64 C82 -72 96 -76 104 -72" stroke="#c62828" stroke-width="7" fill="none" stroke-linecap="round"/>' +
          '<circle cx="92" cy="-62" r="6.5" fill="#f2c94c" stroke="#a87a22" stroke-width="2"/>' +
          '<path d="M90 -58 H94" stroke="#7a5a16" stroke-width="2" stroke-linecap="round"/>' +
          // ears (behind the head) with pink insides
          '<path d="M86 -50 C72 -58 64 -52 70 -44 C76 -40 84 -42 92 -44Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3"/>' +
          '<path d="M84 -48 C76 -52 72 -50 74 -46 C78 -44 82 -44 88 -45Z" fill="#f7a8b8"/>' +
          '<path d="M128 -48 C142 -58 152 -52 146 -44 C140 -40 132 -42 124 -44Z" fill="' + INK + '"/>' +
          '<path d="M130 -47 C138 -52 144 -50 142 -46 C138 -44 134 -44 128 -45Z" fill="#f7a8b8"/>' +
          // little cream horns
          '<path d="M98 -56 C94 -62 92 -70 96 -74 C100 -70 102 -64 104 -58Z" fill="#f4e6c0" stroke="' + INK + '" stroke-width="2.5"/>' +
          '<path d="M118 -58 C122 -64 126 -70 124 -76 C118 -72 114 -66 112 -60Z" fill="#f4e6c0" stroke="' + INK + '" stroke-width="2.5"/>' +
          // head
          '<path d="M86 -42 C84 -60 96 -64 108 -64 C122 -64 132 -58 130 -40 C128 -26 122 -16 108 -16 C94 -16 88 -26 86 -42Z" fill="#ffffff" stroke="' + INK + '" stroke-width="3.5"/>' +
          '<path d="M112 -64 C124 -64 132 -56 130 -44 C126 -40 118 -42 114 -48 C110 -54 108 -60 112 -64Z" fill="' + INK + '"/>' +
          // big shiny eyes
          '<ellipse cx="100" cy="-42" rx="7.5" ry="8.5" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/>' +
          '<ellipse cx="120" cy="-43" rx="7.5" ry="8.5" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/>' +
          '<circle cx="101.5" cy="-41" r="5" fill="' + INK + '"/>' +
          '<circle cx="121.5" cy="-42" r="5" fill="' + INK + '"/>' +
          '<circle cx="103" cy="-43" r="1.8" fill="#ffffff"/>' +
          '<circle cx="123" cy="-44" r="1.8" fill="#ffffff"/>' +
          // pink snout
          '<ellipse cx="110" cy="-18" rx="22" ry="14" fill="#f7a8b8" stroke="' + INK + '" stroke-width="3"/>' +
          '<ellipse cx="102" cy="-19" rx="3.2" ry="4.2" fill="#b4566c"/>' +
          '<ellipse cx="118" cy="-19" rx="3.2" ry="4.2" fill="#b4566c"/>' +
          '<path d="M104 -10 C108 -7 112 -7 116 -10" stroke="#b4566c" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          '<path class="cow-grass" d="M108 -4 L100 6 M112 -4 L112 8 M116 -4 L124 6" stroke="#3f9327" stroke-width="3.5" stroke-linecap="round"/>' +
        '</g></g>' +
      '</g>' +
    '</svg>';

  function leg(cls, x, fill) {
    return '<g class="' + cls + '">' +
      '<rect x="' + x + '" y="-44" width="16" height="44" rx="6" fill="' + fill + '" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<rect x="' + x + '" y="-9" width="16" height="9" rx="3" fill="#4a3b33" stroke="' + INK + '" stroke-width="2"/>' +
    '</g>';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  // further back in the field = smaller and drawn behind
  function scaleFor(y) { return 0.72 + (y - 790) / (960 - 790) * 0.3; }

  function place(cow) {
    var s = scaleFor(cow.y);
    cow.el.style.transform = 'translate(' + cow.x.toFixed(1) + 'px,' + cow.y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    cow.el.style.zIndex = String(Math.round(cow.y));
  }

  function crowded(cow, x, y) {
    return herd.some(function (o) {
      return o !== cow && Math.abs(o.x - x) < MIN_GAP && Math.abs(o.y - y) < 70;
    });
  }

  function graze(cow, ms) {
    cow.el.classList.remove('is-walking');
    cow.timer = setTimeout(function () { walk(cow); }, ms);
  }

  function walk(cow) {
    var z = cow.zone;
    var nx, ny, tries = 0;
    do {  // a new spot a fair distance away within its own patch, not on top of another cow
      nx = rand(z.x1, z.x2);
      ny = rand(z.y1, z.y2);
      tries++;
    } while ((Math.abs(nx - cow.x) < 120 || crowded(cow, nx, ny)) && tries < 40);

    var dist = Math.hypot(nx - cow.x, ny - cow.y);
    var ms = Math.max(2500, dist / WALK_SPEED * 1000);
    var from = cow.el.style.transform;

    cow.flip.classList.toggle('is-left', nx < cow.x);  // turn to face the way it walks
    cow.el.classList.add('is-walking');
    cow.x = nx;
    cow.y = ny;

    // let the head come up and the turn finish, then amble over
    cow.timer = setTimeout(function () {
      place(cow);
      var anim = cow.el.animate([{ transform: from }, { transform: cow.el.style.transform }],
        { duration: ms, easing: 'ease-in-out' });
      anim.onfinish = function () { graze(cow, rand(GRAZE_MIN_MS, GRAZE_MAX_MS)); };
    }, 700);
  }

  var herd = [];
  // debug helper for testing in a browser console: FARM_COWS.walkAll() sends every cow walking now
  window.FARM_COWS = {
    herd: herd,
    walkAll: function () {
      herd.forEach(function (cow) {
        if (cow.el.classList.contains('is-walking')) return;
        clearTimeout(cow.timer);
        walk(cow);
      });
    }
  };

  COWS.forEach(function (zone, i) {
    var el = document.createElement('div');
    el.className = 'farm-cow';
    el.style.width = COW_WIDTH + 'px';
    el.innerHTML = '<div class="cow-flip">' + COW_SVG + '</div>';
    layer.appendChild(el);

    var cow = { el: el, flip: el.firstChild, zone: zone, x: 0, y: 0 };
    var tries = 0;
    do {
      cow.x = rand(zone.x1, zone.x2);
      cow.y = rand(zone.y1, zone.y2);
      tries++;
    } while (crowded(cow, cow.x, cow.y) && tries < 40);
    herd.push(cow);
    cow.flip.classList.toggle('is-left', i % 2 === 1);
    // stagger the chewing so they don't nod in unison
    el.style.setProperty('--chew-delay', (-Math.random() * 2).toFixed(2) + 's');
    place(cow);
    // first move comes at a random time so the herd never moves all together
    graze(cow, rand(8000, GRAZE_MAX_MS));
  });
})();
