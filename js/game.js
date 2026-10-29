(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var FOODS = window.FOODS;

  var $ = function (sel) { return document.querySelector(sel); };
  var stage = $('#stage');
  var screens = { select: $('#select'), game: $('#game'), video: $('#video') };

  var GAME_FOODS = FOODS.filter(function (f) { return f.slot && f.fill > 0; });

  var startBtn = $('#startBtn');
  var gameFoods = $('#gameFoods');
  var milk = $('#milk');
  var glassSvg = $('#glassSvg');
  var glassWrap = document.querySelector('.glass-wrap');
  var glassPanel = document.querySelector('.glass-panel');
  var meterFill = $('#meterFill');
  var meterPct = $('#meterPct');
  var overOverlay = $('#overOverlay');
  var fullOverlay = $('#fullOverlay');
  var summaryList = $('#summaryList');
  var summaryTaps = $('#summaryTaps');
  var video = $('#hmbVideo');
  var placeholder = $('#videoPlaceholder');
  var vpCount = $('#vpCount');

  var state = {
    screen: 'select',
    phase: 'play',  // play → over (overfilled, resetting) | win (exactly 100%)
    total: 0,       // % filled; can pass 100 on the overflowing tap
    taps: {},       // food id → number of taps this round
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
  function sndFail() {
    [392, 330, 262].forEach(function (f, i) { tone(f, f * 0.9, 0.3, i * 0.16, 0.25); });
  }
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

  /* ---------------- SCREEN 1: intro (food facts, not tappable) ---------------- */
  FOODS.forEach(function (f) {
    var card = document.createElement('div');
    card.className = 'food-btn';
    card.innerHTML =
      '<div class="food-icon"><img src="' + f.icon + '" alt=""></div>' +
      '<div class="food-num">~' + fmt(f.target) + '</div>' +
      '<div class="food-name">' + f.name + '</div>';
    document.querySelector('.food-grid[data-group="' + f.group + '"]').appendChild(card);
    new Image().src = f.icon;  // preload
  });

  startBtn.addEventListener('click', startGame);

  /* ---------------- SCREEN 2: fill the glass to exactly 100% ---------------- */
  GAME_FOODS.forEach(function (f) {
    var btn = document.createElement('button');
    btn.className = 'gfood slot-' + f.slot;
    btn.setAttribute('aria-label', f.name + ', adds ' + f.fill + '%');
    btn.innerHTML =
      '<div class="gfood-circle"><img src="' + f.icon + '" alt=""></div>' +
      '<div class="gfood-pct">+' + f.fill + '%</div>' +
      '<div class="gfood-name">' + f.label + '</div>';
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      onFoodTap(f, btn);
    });
    btn.addEventListener('animationend', function (e) {
      if (e.animationName === 'hit') btn.classList.remove('is-hit');
    });
    gameFoods.appendChild(btn);
  });

  function startGame() {
    clearTimers();
    resetRound();
    show('game');
  }

  function resetRound() {
    state.phase = 'play';
    state.total = 0;
    state.taps = {};
    gameFoods.classList.remove('is-locked');
    glassPanel.classList.remove('is-over', 'is-perfect');
    glassSvg.classList.remove('is-overflow');
    overOverlay.classList.remove('is-shown');
    fullOverlay.classList.remove('is-shown');
    document.querySelectorAll('.confetti, .fly-food').forEach(function (c) { c.remove(); });
    setLevel(0, true);
  }

  function setLevel(pct, instant) {
    var p = Math.min(pct, 100) / 100;
    // milk group: y=420 → empty (below the glass floor), y=6 → brim
    var y = 420 - p * 414;
    if (instant) { milk.style.transition = 'none'; meterFill.style.transition = 'none'; }
    milk.style.transform = 'translate(0px, ' + y.toFixed(1) + 'px)';
    meterFill.style.height = (p * 100) + '%';
    meterPct.textContent = pct + '%';
    if (instant) {
      void milk.getBoundingClientRect();
      milk.style.transition = '';
      meterFill.style.transition = '';
    }
  }

  function onFoodTap(f, btn) {
    if (state.screen !== 'game' || state.phase !== 'play') return;
    var now = performance.now();
    if (now - state.lastTap < 80) return;  // ignore double-fires from one touch
    state.lastTap = now;
    bumpIdle();

    state.total += f.fill;
    state.taps[f.id] = (state.taps[f.id] || 0) + 1;
    setLevel(state.total);
    slosh();
    sndPop(Math.min(state.total, 100) / 100);
    if (btn) {
      btn.classList.remove('is-hit');
      void btn.offsetWidth;
      btn.classList.add('is-hit');
      flyFood(f, btn);
    }

    if (state.total === 100) win();
    else if (state.total > 100) overflow();
  }

  function flyFood(f, btn) {
    var from = stageCenter(btn.querySelector('.gfood-circle'));
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
    plus.textContent = '+' + f.fill + '%';
    glassWrap.querySelector('.fly-layer').appendChild(plus);
    setTimeout(function () { plus.remove(); }, 950);
  }

  var sloshTimer = null;
  function slosh() {
    glassSvg.classList.add('is-sloshing');
    clearTimeout(sloshTimer);
    sloshTimer = setTimeout(function () { glassSvg.classList.remove('is-sloshing'); }, 500);
  }

  function overflow() {
    state.phase = 'over';
    gameFoods.classList.add('is-locked');
    glassPanel.classList.add('is-over');
    glassSvg.classList.add('is-overflow');
    glassWrap.classList.remove('is-shaking');
    void glassWrap.offsetWidth;
    glassWrap.classList.add('is-shaking');
    later(sndFail, 250);
    later(function () { overOverlay.classList.add('is-shown'); }, 900);
    later(resetRound, 900 + CFG.overflowMs);
  }

  function win() {
    state.phase = 'win';
    gameFoods.classList.add('is-locked');
    glassPanel.classList.add('is-perfect');
    sndWin();
    later(showSummary, CFG.perfectMs);
  }

  function showSummary() {
    var totalTaps = 0;
    summaryList.innerHTML = GAME_FOODS.map(function (f) {
      var n = state.taps[f.id] || 0;
      totalTaps += n;
      return '<div class="summary-row' + (n ? '' : ' is-zero') + '">' +
        '<img src="' + f.icon + '" alt="">' +
        '<div><div class="s-count">&times;' + n + '<span class="s-pct">' + (n * f.fill) + '%</span></div>' +
        '<div class="s-name">' + f.label + '</div></div></div>';
    }).join('');
    summaryTaps.textContent = totalTaps;
    fullOverlay.classList.add('is-shown');
    confetti();
    later(playVideo, CFG.summaryMs);
  }

  $('#summaryNext').addEventListener('click', function () {
    if (state.screen === 'game' && state.phase === 'win') playVideo();
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

  $('#backBtn').addEventListener('click', goHome);

  /* ---------------- SCREEN 3: HMB video ---------------- */
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
    show('select');
  }

  var idleTimer = null;
  function bumpIdle() {
    clearTimeout(idleTimer);
    if (state.screen !== 'game') return;  // intro waits; video screen returns home on its own
    idleTimer = setTimeout(function () {
      if (state.screen === 'game' && state.phase === 'play') goHome();
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
  ['assets/bg-farm.svg', 'assets/ensure-gold-logo.png'].forEach(function (src) { new Image().src = src; });

  // debug helper for testing in a browser console: GAME.go('game'|'video'|'home'), GAME.tap('avocado')
  window.GAME = {
    state: state,
    bgm: bgm,
    go: function (name) {
      if (name === 'game') startGame();
      else if (name === 'video') playVideo();
      else goHome();
    },
    tap: function (id) {
      var f = GAME_FOODS.filter(function (x) { return x.id === id; })[0];
      state.lastTap = -1e9;
      if (f) onFoodTap(f);
    }
  };

  show('select');
})();
