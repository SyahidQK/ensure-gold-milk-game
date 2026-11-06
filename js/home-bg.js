/*
 * Animated background for the main page and the choose-a-food page (decoration only — no game
 * logic here), ported from ensure_gold_dynamic_ui_redesign.html: deep-blue moving grid with a gold
 * light sweep, rising gold/blue energy lights, floating golden soybeans, and a gold ripple + sparks
 * on touch. One shared animation draws on whichever of those pages is showing (so the soybeans carry
 * on across the page change), at the fixed 1920x1080 stage size, and pauses on every other screen.
 */
(function () {
  'use strict';

  var surfaces = ['info', 'select'].map(function (id) {
    var screen = document.getElementById(id);
    var canvas = screen && screen.querySelector('.home-canvas');
    return canvas ? { screen: screen, canvas: canvas, ctx: canvas.getContext('2d') } : null;
  }).filter(Boolean);
  if (!surfaces.length) return;
  var ctx = surfaces[0].ctx;   // the canvas being drawn this frame
  var W = 1920;
  var H = 1080;

  // ---- static backdrop (radial gradient), drawn once ----
  var base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  (function () {
    var b = base.getContext('2d');
    var g = b.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#0c285e');
    g.addColorStop(0.5, '#051438');
    g.addColorStop(1, '#020817');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
  })();

  // ---- glowing light dots as ready-made sprites (much cheaper than shadowBlur every frame) ----
  function glowSprite(hue) {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'hsla(' + hue + ',100%,85%,1)');
    g.addColorStop(0.25, 'hsla(' + hue + ',100%,70%,.9)');
    g.addColorStop(0.6, 'hsla(' + hue + ',100%,50%,.25)');
    g.addColorStop(1, 'hsla(' + hue + ',100%,50%,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return c;
  }
  var GOLD_DOT = glowSprite(45);
  var BLUE_DOT = glowSprite(200);

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ---- golden soybeans floating up ----
  function Bean() { this.reset(); this.y = Math.random() * H; }
  Bean.prototype.reset = function () {
    this.x = Math.random() * W;
    this.y = H + 40;
    this.size = rnd(14, 34);
    this.speedY = rnd(0.5, 1.4);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.02;
    this.opacity = rnd(0.3, 0.8);
    this.pulse = Math.random() * Math.PI;
  };
  Bean.prototype.update = function () {
    this.y -= this.speedY;
    this.x += Math.sin(this.y * 0.01) * 0.6;
    this.rotation += this.rotSpeed;
    this.pulse += 0.03;
    if (this.speedY > 1.4) this.speedY *= 0.985;  // settle back after a touch boost
    if (this.y < -60) this.reset();
  };
  Bean.prototype.draw = function () {
    var s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity + Math.sin(this.pulse) * 0.15));
    // glow
    var glow = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 1.5);
    glow.addColorStop(0, 'rgba(255,215,0,.6)');
    glow.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // bean
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.8, s * 0.6, -s * 0.8, s * 0.7, 0);
    ctx.bezierCurveTo(s * 0.8, s * 0.7, -s * 0.4, s * 0.9, -s * 0.6, 0);
    var g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, '#FFF5B2');
    g.addColorStop(0.4, '#FFD700');
    g.addColorStop(0.8, '#D49A00');
    g.addColorStop(1, '#8B5A00');
    ctx.fillStyle = g;
    ctx.fill();
    // highlight
    ctx.beginPath();
    ctx.arc(s * 0.1, 0, s * 0.3, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  // ---- rising energy lights ----
  function Light() { this.reset(); this.y = Math.random() * H; }
  Light.prototype.reset = function () {
    this.x = Math.random() * W;
    this.y = H + 20;
    this.r = rnd(1.5, 5);
    this.speedY = rnd(0.4, 1.8);
    this.opacity = rnd(0.2, 0.9);
    this.sprite = Math.random() > 0.3 ? GOLD_DOT : BLUE_DOT;
  };
  Light.prototype.update = function () {
    this.y -= this.speedY;
    if (this.y < -20) this.reset();
  };
  Light.prototype.draw = function () {
    var d = this.r * 6;
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this.sprite, this.x - d / 2, this.y - d / 2, d, d);
  };

  // ---- gold ripple + sparks where the screen is touched ----
  function Ripple(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.speed = rnd(4, 7);
    this.opacity = 1;
    this.sparks = [];
    for (var i = 0; i < 10; i++) {
      this.sparks.push({ x: x, y: y, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, size: rnd(1.5, 4.5) });
    }
  }
  Ripple.prototype.update = function () {
    this.radius += this.speed;
    this.opacity -= 0.025;
    this.sparks.forEach(function (s) { s.x += s.vx; s.y += s.vy; });
  };
  Ripple.prototype.draw = function () {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FFA500';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF5B2';
    this.sparks.forEach(function (s) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  var beans = [], lights = [], ripples = [];
  for (var i = 0; i < 20; i++) beans.push(new Bean());
  for (var j = 0; j < 60; j++) lights.push(new Light());

  // ---- moving grid + gold light sweep ----
  var gridOffset = 0;
  var GRID = 80;
  function drawGrid(now) {
    ctx.globalAlpha = 1;
    ctx.drawImage(base, 0, 0);
    gridOffset = (gridOffset + 0.4) % GRID;
    ctx.strokeStyle = 'rgba(28,90,180,.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var x = 0; x <= W; x += GRID) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (var y = gridOffset; y < H; y += GRID) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    var waveY = (now * 0.08) % (H + 200) - 100;
    var wg = ctx.createLinearGradient(0, waveY - 60, 0, waveY + 60);
    wg.addColorStop(0, 'rgba(0,150,255,0)');
    wg.addColorStop(0.5, 'rgba(255,215,0,.15)');
    wg.addColorStop(1, 'rgba(0,150,255,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, waveY - 60, W, 120);
  }

  // ---- loop runs only while the main page or the choose-a-food page is the active screen ----
  var running = false;
  function activeSurface() {
    for (var i = 0; i < surfaces.length; i++) {
      if (surfaces[i].screen.classList.contains('is-active')) return surfaces[i];
    }
    return null;
  }
  function frame(now) {
    if (!running) return;
    var s = activeSurface();
    if (!s) { running = false; return; }
    ctx = s.ctx;
    drawGrid(now);
    lights.forEach(function (l) { l.update(); l.draw(); });
    ctx.globalAlpha = 1;
    beans.forEach(function (b) { b.update(); b.draw(); });
    for (var k = ripples.length - 1; k >= 0; k--) {
      ripples[k].update();
      ripples[k].draw();
      if (ripples[k].opacity <= 0) ripples.splice(k, 1);
    }
    requestAnimationFrame(frame);
  }
  function sync() {
    var shouldRun = !!activeSurface() && !document.hidden;
    if (shouldRun && !running) { running = true; requestAnimationFrame(frame); }
    else if (!shouldRun) running = false;
  }
  var watcher = new MutationObserver(sync);
  surfaces.forEach(function (s) { watcher.observe(s.screen, { attributes: true, attributeFilter: ['class'] }); });
  document.addEventListener('visibilitychange', sync);
  sync();

  // ---- touch: ripple where touched, nearby beans get a boost ----
  function burstAt(clientX, clientY) {
    var s = activeSurface() || surfaces[0];
    var r = s.canvas.getBoundingClientRect();
    var x = (clientX - r.left) / r.width * W;
    var y = (clientY - r.top) / r.height * H;
    ripples.push(new Ripple(x, y));
    beans.forEach(function (b) {
      if (Math.hypot(b.x - x, b.y - y) < 200) b.speedY += 2;
    });
  }
  surfaces.forEach(function (s) {
    s.screen.addEventListener('pointerdown', function (e) {
      if (s.screen.classList.contains('is-active')) burstAt(e.clientX, e.clientY);
    });
  });

  // debug helper for testing in a browser console
  window.HOME_BG = {
    isRunning: function () { return running; },
    drawingOn: function () { var s = activeSurface(); return s ? s.screen.id : null; },
    burst: burstAt
  };
})();
