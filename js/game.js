(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var FOODS = window.FOODS;

  var $ = function (sel) { return document.querySelector(sel); };
  var stage = $('#stage');
  // flow: info (main page) → select (choose a food) → game → (glass full) result → video → info
  var screens = { info: $('#info'), select: $('#select'), game: $('#game'), video: $('#video') };

  var startBtn = $('#startBtn');
  var goBtn = $('#goBtn');
  var foodCards = document.querySelector('.food-cards');
  var gameWord = $('#gameWord');
  var tapTarget = $('#tapTarget');
  var tapIcon = $('#tapIcon');
  var milk = $('#milk');
  var glassSvg = $('#glassSvg');
  var glassWrap = document.querySelector('.glass-wrap');
  var glassPanel = document.querySelector('.glass-panel');
  var meterFill = $('#meterFill');
  var meterPct = $('#meterPct');
  var fullOverlay = $('#fullOverlay');
  var video = $('#hmbVideo');
  var placeholder = $('#videoPlaceholder');
  var vpCount = $('#vpCount');

  var state = {
    screen: 'info',
    food: null,     // the food chosen on the select screen
    phase: 'play',  // play → full (glass reached 100%)
    total: 0,       // % filled, capped at 100
    taps: 0,
    pos: null,      // tap target centre {x, y} in stage coordinates
    lastTap: 0,
    timers: []
  };

  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };

  /* ---------------- stage scaling ---------------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--scale', s);
  }
  window.addEventListener('resize', fit);
  fit();

  function stageScale() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
  }
  // centre of an element in stage (1920x1080) coordinates
  function stageCenter(el) {
    var s = stageScale();
    var sr = stage.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - sr.left) / s, y: (r.top + r.height / 2 - sr.top) / s, w: r.width / s, h: r.height / s };
  }

  /* ---------------- timers ---------------- */
  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }
  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  /* ---------------- sound (synthesised, no files) ---------------- */
  var audio = null;
  function ac() {
    if (!CFG.sound) return null;
    if (!audio) {
      try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tone(freq, endFreq, dur, when, vol) {
    var a = ac();
    if (!a) return;
    var t = a.currentTime + (when || 0);
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function sndPop(progress) { tone(420 + progress * 500, 900 + progress * 600, 0.14, 0, 0.22); }
  function sndSelect() { tone(660, 990, 0.12, 0, 0.18); }
  function sndWin() {
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f * 1.01, 0.35, i * 0.12, 0.25); });
  }

  /* ---------------- background music ---------------- */
  var bgm = new Audio(CFG.bgmSrc);
  bgm.preload = 'auto';
  bgm.volume = CFG.bgmVolume;
  var bgmStarted = false;
  var bgmTargetVol = CFG.bgmVolume;
  var bgmFade = null;

  // loop back to bgmStartAt rather than 0 (native `loop` always restarts at 0)
  bgm.addEventListener('ended', function () {
    bgm.currentTime = CFG.bgmStartAt;
    bgm.play().catch(function () {});
  });

  function startBgm() {
    if (bgmStarted) return;
    bgm.currentTime = CFG.bgmStartAt;
    var p = bgm.play();
    if (p && p.then) {
      // blocked until the first touch unless Chrome runs with --autoplay-policy=no-user-gesture-required
      p.then(function () { bgmStarted = true; }).catch(function () {});
    } else {
      bgmStarted = true;
    }
  }
  startBgm();
  document.addEventListener('pointerdown', startBgm, true);

  function fadeBgm(to) {
    bgmTargetVol = to;
    clearInterval(bgmFade);
    if (to > 0) bgm.muted = false;
    var from = bgm.volume;
    var t0 = performance.now();
    bgmFade = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / CFG.bgmFadeMs);
      bgm.volume = from + (to - from) * k;
      if (k >= 1) {
        clearInterval(bgmFade);
        if (to === 0) bgm.muted = true;
      }
    }, 30);
  }
  function muteBgm() { if (bgmTargetVol !== 0) fadeBgm(0); }
  function unmuteBgm() { if (bgmTargetVol !== CFG.bgmVolume) fadeBgm(CFG.bgmVolume); }

  /* ---------------- screens ---------------- */
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('is-active', k === name); });
    state.screen = name;
    if (name === 'video') muteBgm(); else unmuteBgm();
    bumpIdle();
  }

  /* ---------------- MAIN PAGE ---------------- */
  startBtn.addEventListener('click', showSelect);

  /* ---------------- CHOOSE A FOOD (amounts hidden) ---------------- */
  FOODS.forEach(function (f) {
    var btn = document.createElement('button');
    btn.className = 'food-btn';
    btn.dataset.id = f.id;
    btn.innerHTML =
      '<div class="food-icon"><img src="' + f.icon + '" alt=""></div>' +
      '<div class="food-name">' + f.name + '</div>';
    btn.addEventListener('pointerdown', function () { selectFood(f); });
    document.querySelector('.food-grid[data-group="' + f.group + '"]').appendChild(btn);
    new Image().src = f.icon;  // preload
  });

  function showSelect() {
    clearTimers();
    resetSelect();
    show('select');
  }

  function selectFood(f) {
    if (state.screen !== 'select') return;
    state.food = f;
    document.querySelectorAll('.food-btn').forEach(function (b) {
      b.classList.toggle('is-selected', b.dataset.id === f.id);
    });
    foodCards.classList.add('has-selection');
    goBtn.disabled = false;
    goBtn.querySelector('.start-text').textContent = 'Start';
    sndSelect();
  }

  function resetSelect() {
    state.food = null;
    document.querySelectorAll('.food-btn').forEach(function (b) { b.classList.remove('is-selected'); });
    foodCards.classList.remove('has-selection');
    goBtn.disabled = true;
    goBtn.querySelector('.start-text').textContent = 'Tap a food above';
  }

  goBtn.addEventListener('click', function () {
    if (state.food) startGame(state.food);
  });

  /* ---------------- GAME: tap the jumping target until the glass is full ---------------- */
  // areas (target centres, stage coords) left and right of the glass panel, below the title
  var ZONES = [
    { x1: 150, x2: 450, y1: 370, y2: 900 },
    { x1: 1470, x2: 1770, y1: 370, y2: 900 }
  ];

  function startGame(f) {
    clearTimers();
    state.food = f;
    resetRound();
    gameWord.textContent = f.word;
    tapIcon.src = f.icon;
    state.pos = null;
    moveTarget();
    show('game');
  }

  function resetRound() {
    state.phase = 'play';
    state.total = 0;
    state.taps = 0;
    tapTarget.classList.remove('is-locked');
    tapTarget.style.visibility = '';
    glassPanel.classList.remove('is-perfect');
    fullOverlay.classList.remove('is-shown');
    document.querySelectorAll('.confetti, .fly-food, .tap-burst').forEach(function (c) { c.remove(); });
    setLevel(0, true);
  }

  // jump to a random spot on either side of the glass, well away from the last one
  function moveTarget() {
    var p, tries = 0;
    do {
      var z = ZONES[Math.floor(Math.random() * ZONES.length)];
      p = { x: z.x1 + Math.random() * (z.x2 - z.x1), y: z.y1 + Math.random() * (z.y2 - z.y1) };
      tries++;
    } while (state.pos && Math.hypot(p.x - state.pos.x, p.y - state.pos.y) < 300 && tries < 30);
    state.pos = p;
    tapTarget.style.left = p.x.toFixed(0) + 'px';
    tapTarget.style.top = p.y.toFixed(0) + 'px';
    tapTarget.classList.remove('is-popping');
    void tapTarget.offsetWidth;
    tapTarget.classList.add('is-popping');
  }

  function setLevel(pct, instant) {
    var p = Math.min(pct, 100) / 100;
    // milk group: y=420 → empty (below the glass floor), y=6 → brim
    var y = 420 - p * 414;
    if (instant) { milk.style.transition = 'none'; meterFill.style.transition = 'none'; }
    milk.style.transform = 'translate(0px, ' + y.toFixed(1) + 'px)';
    meterFill.style.height = (p * 100) + '%';
    meterPct.textContent = Math.round(pct) + '%';
    if (instant) {
      void milk.getBoundingClientRect();
      milk.style.transition = '';
      meterFill.style.transition = '';
    }
  }

  tapTarget.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    onTap();
  });

  function onTap() {
    if (state.screen !== 'game' || state.phase !== 'play') return;
    var now = performance.now();
    if (now - state.lastTap < 80) return;  // ignore double-fires from one touch
    state.lastTap = now;
    bumpIdle();

    var add = CFG.tapFillMin + Math.random() * (CFG.tapFillMax - CFG.tapFillMin);
    state.total = Math.min(100, state.total + add);
    state.taps++;
    setLevel(state.total);
    slosh();
    sndPop(state.total / 100);
    burstAt(state.pos);
    flyFood(state.food, state.pos);

    if (state.total >= 100) glassFull();
    else moveTarget();
  }

  function burstAt(p) {
    var b = document.createElement('div');
    b.className = 'tap-burst';
    b.style.left = p.x + 'px';
    b.style.top = p.y + 'px';
    screens.game.appendChild(b);
    setTimeout(function () { b.remove(); }, 500);
  }

  function flyFood(f, from) {
    var to = stageCenter(glassWrap);
    var el = document.createElement('div');
    el.className = 'fly-food';
    el.innerHTML = '<img src="' + f.icon + '" alt="">';
    el.style.left = (from.x - 55) + 'px';
    el.style.top = (from.y - 55) + 'px';
    screens.game.appendChild(el);

    var dx = to.x - from.x + (Math.random() * 80 - 40);
    var dy = (to.y - to.h * 0.42) - from.y;
    var anim = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy - 160) + 'px) scale(.85) rotate(160deg)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + (dy + 60) + 'px) scale(.35) rotate(320deg)', opacity: 0 }
    ], { duration: 600, easing: 'cubic-bezier(.3,.6,.6,1)' });
    anim.onfinish = function () { el.remove(); };

    var plus = document.createElement('div');
    plus.className = 'plus';
    plus.textContent = '+1 ' + f.label;
    glassWrap.querySelector('.fly-layer').appendChild(plus);
    setTimeout(function () { plus.remove(); }, 950);
  }

  var sloshTimer = null;
  function slosh() {
    glassSvg.classList.add('is-sloshing');
    clearTimeout(sloshTimer);
    sloshTimer = setTimeout(function () { glassSvg.classList.remove('is-sloshing'); }, 500);
  }

  function glassFull() {
    state.phase = 'full';
    tapTarget.classList.add('is-locked');
    tapTarget.style.visibility = 'hidden';
    glassPanel.classList.add('is-perfect');
    sndWin();
    later(showResult, CFG.fullMs);
  }

  // only the chosen food, with its fact from the booth's right-wall panel
  function showResult() {
    var f = state.food;
    $('#resultIcon').src = f.icon;
    $('#resultNum').textContent = '~' + fmt(f.target);
    $('#resultName').textContent = f.name;
    $('#resultFact').innerHTML = f.group === 'hmb'
      ? 'You would need to eat <b>~' + fmt(f.target) + ' ' + f.name + '</b><br>to get <b>~1.5g of HMB</b>.'
      : 'You would need to eat <b>~' + fmt(f.target) + ' ' + f.name + '</b> to get <b>~30g of leucine</b> &mdash;<br>and only 5% of it is converted to <b>~1.5g of HMB</b>.';
    fullOverlay.classList.add('is-shown');
    confetti();
    later(playVideo, CFG.summaryMs);
  }

  $('#summaryNext').addEventListener('click', function () {
    if (state.screen === 'game' && state.phase === 'full') playVideo();
  });

  function confetti() {
    var colors = ['#f3d68a', '#d4a84b', '#ffffff', '#2f8ff0', '#e2672f'];
    for (var i = 0; i < 70; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = (Math.random() * 1920) + 'px';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 2) + 's';
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      screens.game.appendChild(c);
    }
  }

  /* ---------------- HMB video ---------------- */
  var videoWatch = null;
  function playVideo() {
    clearTimers();
    show('video');
    placeholder.classList.remove('is-shown');
    video.style.display = '';
    video.muted = false;
    video.src = CFG.videoSrc;
    video.currentTime = 0;

    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err && err.name === 'NotAllowedError') {  // autoplay with sound blocked → retry muted
          video.muted = true;
          video.play().catch(showPlaceholder);
        } else {
          showPlaceholder();
        }
      });
    }
    // if nothing starts playing (e.g. file missing), fall back
    videoWatch = later(function () { if (video.paused) showPlaceholder(); }, 3000);
  }

  function showPlaceholder() {
    if (state.screen !== 'video' || placeholder.classList.contains('is-shown')) return;
    clearTimeout(videoWatch);
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.style.display = 'none';
    placeholder.classList.add('is-shown');
    var left = Math.round(CFG.placeholderMs / 1000);
    vpCount.textContent = left;
    (function tick() {
      if (left <= 0) { goHome(); return; }
      vpCount.textContent = left;
      left--;
      later(tick, 1000);
    })();
  }

  video.addEventListener('error', showPlaceholder);
  video.addEventListener('playing', function () { clearTimeout(videoWatch); });
  video.addEventListener('ended', goHome);

  /* ---------------- reset / idle ---------------- */
  function goHome() {
    clearTimers();
    video.pause();
    video.removeAttribute('src');
    video.load();
    resetRound();
    resetSelect();
    show('info');
  }

  // a food choice or game abandoned mid-way goes back to the main page for the next player
  var idleTimer = null;
  function bumpIdle() {
    clearTimeout(idleTimer);
    if (state.screen !== 'select' && state.screen !== 'game') return;  // main page waits; video moves on by itself
    idleTimer = setTimeout(function () {
      if (state.screen === 'select' || (state.screen === 'game' && state.phase === 'play')) goHome();
    }, CFG.idleResetMs);
  }
  document.addEventListener('pointerdown', bumpIdle, true);

  /* ---------------- kiosk hardening ---------------- */
  ['contextmenu', 'dragstart', 'selectstart', 'gesturestart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); });
  });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  // long-press the top-right corner for 3s → full reload
  var adminHold = null;
  var corner = $('#adminCorner');
  corner.addEventListener('pointerdown', function () {
    adminHold = setTimeout(function () { location.reload(); }, 3000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
    corner.addEventListener(ev, function () { clearTimeout(adminHold); });
  });

  // preload remaining art
  ['assets/bg-farm.svg', 'assets/ensure-gold-logo.png', 'assets/ensure-gold-logo-hd.webp'].forEach(function (src) { new Image().src = src; });

  // debug helper for testing in a browser console:
  // GAME.go('home'|'select'|'video'), GAME.play('avocado'), GAME.tap()
  window.GAME = {
    state: state,
    bgm: bgm,
    go: function (name) {
      if (name === 'video') playVideo();
      else if (name === 'select') showSelect();
      else goHome();
    },
    play: function (id) {
      startGame(FOODS.filter(function (x) { return x.id === id; })[0] || FOODS[0]);
    },
    tap: function () {
      state.lastTap = -1e9;
      onTap();
    }
  };

  goHome();
})();
