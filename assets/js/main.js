/* ===================================================================
   页面交互：配置注入 / 复制 / 导航 / Tab / 滚动动效
   无依赖，原生 JS
   =================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- 1. 配置注入 ---------------- */
  function applyConfig() {
    $$("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      var val = SITE[key];
      if (val) el.textContent = val;
    });

    $$("[data-cfg-href]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-href");
      var val = SITE[key];
      if (!val) { return; }
      el.setAttribute("href", val);
    });

    // 服务器地址没填：不显示空框，改成"进群获取"
    var box = $("#ipBox");
    if (box) {
      var pending = !SITE.serverIp;
      box.classList.toggle("pending", pending);
      var pendingLink = $("#ipPending");
      if (pendingLink) pendingLink.hidden = !pending;
      var copyBtn = box.querySelector("[data-copy='ip']");
      if (copyBtn) copyBtn.hidden = pending;
    }
  }

  /* ---------------- 2. 复制 + 提示 ---------------- */
  var toastEl = $("#toast");
  var toastTimer = null;

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1900);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // file:// 或无 https 时的兜底
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function bindCopy() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-copy");
        var text = SITE[key] || "";
        if (!text) { toast("还没有填写内容"); return; }

        copyText(text).then(function () {
          toast(key === "ip" ? "服务器地址已复制" : "群号已复制，去 QQ 粘贴吧");
          var label = btn.querySelector("span");
          if (label) {
            var old = label.textContent;
            label.textContent = "已复制";
            btn.classList.add("done");
            setTimeout(function () {
              label.textContent = old;
              btn.classList.remove("done");
            }, 1600);
          }
        }).catch(function () {
          toast("复制失败，手动选中吧：" + text);
        });
      });
    });
  }

  /* ---------------- 3. 导航 ---------------- */
  function bindNav() {
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var links = $("#navLinks");

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    if (links) {
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          nav.classList.remove("open");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target)) {
        nav.classList.remove("open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });

    var toTop = $("#toTop");
    var sections = $$("section[id]");
    var navLinks = $$("#navLinks a");

    function onScroll() {
      var y = window.pageYOffset;

      nav.classList.toggle("scrolled", y > 20);
      if (toTop) toTop.classList.toggle("show", y > 620);

      var current = sections[0] ? sections[0].id : "";
      sections.forEach(function (sec) {
        if (sec.offsetTop - 140 <= y) current = sec.id;
      });
      navLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ---------------- 4. 教程 Tab ---------------- */
  function bindTabs() {
    var tabs = $$(".tab");
    var panels = $$(".panel");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
        panels.forEach(function (p) { p.classList.toggle("active", p.id === id); });
      });
    });
  }

  /* ---------------- 5. 滚动出现 ---------------- */
  function bindReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 6. QQ 二维码：没有图片就显示占位 ---------------- */
  function bindQr() {
    var img = $("#qqQr");
    if (!img) return;
    img.addEventListener("load", function () {
      if (img.naturalWidth > 2) img.classList.add("ok");
    });
    img.addEventListener("error", function () {
      img.classList.remove("ok");
    });
    if (img.complete && img.naturalWidth > 2) img.classList.add("ok");
  }

  /* ---------------- 7. 首屏方块随鼠标轻微偏移 ---------------- */
  function bindParallax() {
    var stage = $(".av-turn");
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 960px)").matches) return;

    var BASE_X = -7, BASE_Y = -26;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stage.style.transform =
        "rotateX(" + (BASE_X + cy).toFixed(2) + "deg) " +
        "rotateY(" + (BASE_Y + cx).toFixed(2) + "deg) scale(1.72)";
      raf = Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(loop) : null;
    }

    window.addEventListener("mousemove", function (e) {
      var w = window.innerWidth, h = window.innerHeight;
      tx = ((e.clientX / w) - 0.5) * 16;
      ty = ((e.clientY / h) - 0.5) * -12;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    // 截图/打印模式：?shot=1 时直接显示所有内容，不做入场动画
    if (/[?&]shot=1/.test(location.search)) {
      document.documentElement.classList.add("shot");
    }
    applyConfig();
    bindCopy();
    bindNav();
    bindTabs();
    bindReveal();
    bindQr();
    bindParallax();

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();