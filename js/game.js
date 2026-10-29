(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var FOODS = window.FOODS;

  var $ = function (sel) { return document.querySelector(sel); };
  var stage = $('#stage');
  var screens = { select: $('#select'), game: $('#game'), video: $('#video') };

  var startBtn = $('#startBtn');
  var tapBtn = $('#tapBtn');
  var tapIcon = $('#tapIcon');
  var milk = $('#milk');
  var glassSvg = $('#glassSvg');
  var glassWrap = document.querySelector('.glass-wrap');
  var meterFill = $('#meterFill');
  var meterPct = $('#meterPct');
  var countNow = $('#countNow');
  var countTarget = $('#countTarget');
  var countUnit = $('#countUnit');
  var gameFoodWord = $('#gameFoodWord');
  var fullOverlay = $('#fullOverlay');
  var fullMsg = $('#fullMsg');
  var video = $('#hmbVideo');
  var placeholder = $('#videoPlaceholder');
  var vpCount = $('#vpCount');

  var state = {
    screen: 'select',
    food: null,
    value: 0,       // exact running total
    shown: 0,       // value currently rendered by the count-up tween
    done: false,
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

  /* ---------------- screens ---------------- */
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('is-active', k === name); });
    state.screen = name;
    bumpIdle();
  }

  /* ---------------- SCREEN 1: build food buttons ---------------- */
  FOODS.forEach(function (f) {
    var btn = document.createElement('button');
    btn.className = 'food-btn';
    btn.dataset.id = f.id;
    btn.innerHTML =
      '<div class="food-icon"><img src="' + f.icon + '" alt=""></div>' +
      '<div class="food-num">~' + fmt(f.target) + '</div>' +
      '<div class="food-name">' + f.name + '</div>';
    btn.addEventListener('pointerdown', function () { selectFood(f); });
    document.querySelector('.food-grid[data-group="' + f.group + '"]').appendChild(btn);

    var pre = new Image();  // preload
    pre.src = f.icon;
  });

  function selectFood(f) {
    state.food = f;
    document.querySelectorAll('.food-btn').forEach(function (b) {
      b.classList.toggle('is-selected', b.dataset.id === f.id);
    });
    document.querySelectorAll('.food-grid').forEach(function (g) { g.classList.add('has-selection'); });
    startBtn.disabled = false;
    startBtn.querySelector('.start-text').textContent = 'Start';
    sndSelect();
  }

  function resetSelect() {
    state.food = null;
    document.querySelectorAll('.food-btn').forEach(function (b) { b.classList.remove('is-selected'); });
    document.querySelectorAll('.food-grid').forEach(function (g) { g.classList.remove('has-selection'); });
    startBtn.disabled = true;
    startBtn.querySelector('.start-text').textContent = 'Tap a food above';
  }

  startBtn.addEventListener('click', function () {
    if (!state.food) return;
    startGame(state.food);
  });

  /* ---------------- SCREEN 2: fill the glass ---------------- */
  function startGame(f) {
    clearTimers();
    state.food = f;
    state.value = 0;
    state.shown = 0;
    state.done = false;
    tapIcon.src = f.icon;
    gameFoodWord.textContent = f.word;
    countTarget.textContent = '~' + fmt(f.target);
    countUnit.textContent = f.name;
    countNow.textContent = '0';
    tapBtn.disabled = false;
    fullOverlay.classList.remove('is-shown');
    document.querySelectorAll('.confetti').forEach(function (c) { c.remove(); });
    setLevel(0, true);
    show('game');
  }

  function setLevel(p, instant) {
    // milk group: y=420 → empty (below the glass floor), y=6 → brim
    var y = 420 - p * 414;
    if (instant) { milk.style.transition = 'none'; meterFill.style.transition = 'none'; }
    milk.setAttribute('transform', 'translate(0 ' + y.toFixed(1) + ')');
    milk.style.transform = 'translate(0px, ' + y.toFixed(1) + 'px)';
    meterFill.style.height = (p * 100) + '%';
    meterPct.textContent = Math.floor(p * 100) + '%';
    if (instant) {
      void milk.getBoundingClientRect();
      milk.style.transition = '';
      meterFill.style.transition = '';
    }
  }

  var tween = null;
  function countTo(target) {
    var from = state.shown;
    var t0 = performance.now();
    var dur = 350;
    cancelAnimationFrame(tween);
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      state.shown = from + (target - from) * e;
      countNow.textContent = fmt(Math.floor(state.shown));
      if (k < 1) tween = requestAnimationFrame(step);
      else { state.shown = target; countNow.textContent = fmt(target >= state.food.target ? state.food.target : Math.floor(target)); }
    })(t0);
    countNow.classList.remove('bump');
    void countNow.offsetWidth;
    countNow.classList.add('bump');
  }

  function onTap(e) {
    e.preventDefault();
    if (state.screen !== 'game' || state.done || !state.food) return;
    var now = performance.now();
    if (now - state.lastTap < 60) return;
    state.lastTap = now;
    bumpIdle();

    var f = state.food;
    var base = f.target / CFG.tapsToFill;
    var inc = base * (CFG.tapRandomMin + Math.random() * (CFG.tapRandomMax - CFG.tapRandomMin));
    var before = state.value;
    state.value = Math.min(f.target, state.value + inc);
    var p = state.value / f.target;

    setLevel(p);
    countTo(state.value);
    flyFood(Math.round(state.value) - Math.round(before));
    slosh();
    sndPop(p);

    tapBtn.classList.remove('is-hit');
    void tapBtn.offsetWidth;
    tapBtn.classList.add('is-hit');

    if (state.value >= f.target) complete();
  }
  tapBtn.addEventListener('pointerdown', onTap);
  tapBtn.addEventListener('animationend', function (e) {
    if (e.animationName === 'hit') tapBtn.classList.remove('is-hit');
  });

  function flyFood(added) {
    var from = stageCenter(tapBtn);
    var to = stageCenter(glassWrap);
    var el = document.createElement('div');
    el.className = 'fly-food';
    el.innerHTML = '<img src="' + state.food.icon + '" alt="">';
    el.style.left = (from.x - 55) + 'px';
    el.style.top = (from.y - 55) + 'px';
    screens.game.appendChild(el);

    var dx = to.x - from.x + (Math.random() * 80 - 40);
    var dy = (to.y - to.h * 0.42) - from.y;
    var anim = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy - 220) + 'px) scale(.85) rotate(160deg)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + (dy + 60) + 'px) scale(.35) rotate(320deg)', opacity: 0 }
    ], { duration: 600, easing: 'cubic-bezier(.3,.6,.6,1)' });
    anim.onfinish = function () { el.remove(); };

    if (added > 0) {
      var plus = document.createElement('div');
      plus.className = 'plus';
      plus.textContent = '+' + fmt(added);
      glassWrap.querySelector('.fly-layer').appendChild(plus);
      setTimeout(function () { plus.remove(); }, 950);
    }
  }

  var sloshTimer = null;
  function slosh() {
    glassSvg.classList.add('is-sloshing');
    clearTimeout(sloshTimer);
    sloshTimer = setTimeout(function () { glassSvg.classList.remove('is-sloshing'); }, 500);
  }

  function complete() {
    state.done = true;
    tapBtn.disabled = true;
    setLevel(1);
    var f = state.food;
    fullMsg.innerHTML = 'You need <b>~' + fmt(f.target) + ' ' + f.name + '</b><br>to match just <b>1 glass of Ensure Gold!</b>';
    // let the full glass be seen for a moment before the celebration card covers it
    later(function () {
      fullOverlay.classList.add('is-shown');
      confetti();
      sndWin();
    }, 1200);
    later(playVideo, 1200 + CFG.celebrateMs);
  }

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
    cancelAnimationFrame(tween);
    video.pause();
    video.removeAttribute('src');
    video.load();
    fullOverlay.classList.remove('is-shown');
    document.querySelectorAll('.confetti, .fly-food').forEach(function (c) { c.remove(); });
    resetSelect();
    show('select');
  }

  var idleTimer = null;
  function bumpIdle() {
    clearTimeout(idleTimer);
    if (state.screen === 'video') return;  // video screen returns home on its own
    idleTimer = setTimeout(function () {
      if (state.screen === 'game' && !state.done) goHome();
      else if (state.screen === 'select' && state.food) resetSelect();
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

  // debug helper for testing in a browser console: GAME.go('game'|'video')
  window.GAME = {
    state: state,
    go: function (name) {
      if (name === 'game') startGame(state.food || FOODS[0]);
      else if (name === 'video') playVideo();
      else goHome();
    }
  };

  show('select');
})();
