/* ===================================================================
   首屏 3D 粒子：等距小方块在空间里漂浮，带透视、视差与景深
   —— 纯 Canvas 2D 手写透视投影，无依赖
   =================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("fxCanvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, DPR = 1;
  var parts = [];
  var mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  var raf = null, running = false;
  var focal = 900;

  /* 暖金配色：贴合白金主题 */
  var PALETTE = [
    { top: "rgba(233,199,124,.95)", side: "rgba(201,159,77,.9)",  face: "rgba(220,185,110,.92)" },
    { top: "rgba(247,230,187,.95)", side: "rgba(214,176,96,.85)", face: "rgba(230,198,133,.9)"  },
    { top: "rgba(255,247,229,.92)", side: "rgba(228,204,158,.8)", face: "rgba(243,226,190,.85)" },
    { top: "rgba(150,120,58,.55)",  side: "rgba(120,94,42,.5)",   face: "rgba(136,108,50,.5)"   }
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(i) {
    var depth = rand(0.35, 1);          // 0 近 1 远
    return {
      x: rand(-1.25, 1.25),             // 归一化 [-1,1]，渲染时乘视口尺寸
      y: rand(-0.62, 0.62),
      z: 180 + depth * 980,             // 深度，越大越远
      size: rand(9, 20) * (1 - depth * 0.35),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.0035, 0.0035),
      vx: rand(-0.00022, 0.00022),
      vy: rand(-0.00034, -0.00006),
      ph: rand(0, Math.PI * 2),
      amp: rand(0.004, 0.013),
      c: PALETTE[i % PALETTE.length],
      alpha: rand(0.35, 0.85) * (1 - depth * 0.45)
    };
  }

  function build() {
    var n = window.innerWidth < 760 ? 18 : (window.innerWidth < 1180 ? 34 : 52);
    parts = [];
    for (var i = 0; i < n; i++) parts.push(makeParticle(i));
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    focal = Math.max(700, W * 0.72);
    build();
    if (reduce) draw();
  }

  /* 画一个等距小方块：顶面 + 左侧面 + 右侧面 */
  function cube(cx, cy, s, rot, col, alpha) {
    var c = Math.cos(rot), n = Math.sin(rot);
    function pt(dx, dy) {
      return [cx + dx * c - dy * n, cy + dx * n + dy * c];
    }
    var P = {
      t: [pt(0, -s * 0.5), pt(s * 0.87, 0), pt(0, s * 0.5), pt(-s * 0.87, 0)],
      l: [pt(-s * 0.87, 0), pt(0, s * 0.5), pt(0, s * 1.34), pt(-s * 0.87, s * 0.84)],
      r: [pt(s * 0.87, 0), pt(0, s * 0.5), pt(0, s * 1.34), pt(s * 0.87, s * 0.84)]
    };
    ctx.globalAlpha = alpha;
    fill(P.l, col.side);
    fill(P.r, col.face);
    fill(P.t, col.top);
    ctx.globalAlpha = 1;
  }

  function fill(P, color) {
    ctx.beginPath();
    ctx.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var t = performance.now() * 0.001;
    var px = curX * 26, py = curY * 18;

    /* 远的先画，近的后画 */
    var list = parts.slice().sort(function (a, b) { return b.z - a.z; });

    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var k = focal / (focal + p.z);
      var sx = (p.x + Math.sin(t * 0.25 + p.ph) * p.amp) * W * 0.5 * 0.92 + W * 0.5 + px * k;
      var sy = (p.y + Math.cos(t * 0.2 + p.ph) * p.amp * 0.8) * H * 0.5 + H * 0.48 + py * k;
      var s = p.size * k * 1.75;
      if (s < 1.2) continue;
      cube(sx, sy, s, p.rot, p.c, p.alpha * Math.min(1, k * 1.6));
    }
  }

  function step() {
    var t = performance.now() * 0.001;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.rot += p.spin;
      p.x += p.vx;
      p.y += p.vy;
      /* 缓慢上浮，飘出顶部后从底部回来 */
      if (p.y < -0.72) { p.y = 0.72; p.x = rand(-1.25, 1.25); }
      if (p.x > 1.35) p.x = -1.35;
      if (p.x < -1.35) p.x = 1.35;
    }
    curX += (mouseX - curX) * 0.05;
    curY += (mouseY - curY) * 0.05;
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (running || reduce) return;
    running = true;
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  /* 只在首屏可见时跑，滚下去就停，省电 */
  function watchVisibility() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) start(); else stop();
      });
    }, { threshold: 0 });
    io.observe(canvas);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if (reduce) {
    resize();
  } else {
    resize();
    start();
    watchVisibility();
  }
})();