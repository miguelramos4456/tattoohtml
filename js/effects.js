/* ============================================================
   EFFECTS — effects.js
   #1 Ink splatter on click
   #3 Needle cursor jab + ink dot
   Requires GSAP (loaded before this file).
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Splatter image paths (black ink on white → inverted) ─── */
  var SPLATTERS = [
    './modern-black-grunge-brush-stroke-white-background (1)/ad62c243-9fa4-4882-ad47-ee601afd5609.jpg'
  ];

  /* Pre-load so there's no delay on first click */
  SPLATTERS.forEach(function (src) { var i = new Image(); i.src = src; });

  /* ── #1 Ink splatter ─────────────────────────────────────── */
  function spawnSplatter(x, y) {
    var src  = SPLATTERS[Math.floor(Math.random() * SPLATTERS.length)];
    var size = 140 + Math.random() * 100;
    var rot  = Math.random() * 360;

    var img = document.createElement('img');
    img.setAttribute('aria-hidden', 'true');
    img.style.cssText = [
      'position:fixed',
      'left:'   + (x - size / 2) + 'px',
      'top:'    + (y - size / 2) + 'px',
      'width:'  + size + 'px',
      'height:' + size + 'px',
      'pointer-events:none',
      'z-index:9999',
      'filter:invert(1)',
      'mix-blend-mode:screen',
      'object-fit:contain',
      'user-select:none',
      'transform-origin:center center'
    ].join(';');
    img.src = src;
    document.body.appendChild(img);

    gsap.fromTo(img,
      { scale: 0.1, opacity: 0.85, rotation: rot },
      {
        scale: 1.7,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        onComplete: function () { if (img.parentNode) img.parentNode.removeChild(img); }
      }
    );
  }

  /* ── #1b Ambient gallery splatters — left/right, one by one ── */
  function initGallerySplatters() {
    var section = document.querySelector('.work');
    if (!section) return;

    var side  = 0;   /* 0 = left, 1 = right — alternates */
    var timer = null;
    var active = false;

    function spawnNext() {
      if (!active) return;

      var rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        timer = setTimeout(spawnNext, 800);
        return;
      }

      var size = 160 + Math.random() * 80;
      var rot  = Math.random() * 360;
      var x, y;

      var visTop    = Math.max(rect.top,    0);
      var visBottom = Math.min(rect.bottom, window.innerHeight);
      var visH      = visBottom - visTop;

      /* Slot 0 = upper-right, Slot 1 = lower-left */
      if (side === 0) {
        x = window.innerWidth * 0.78;
        y = visTop + visH * 0.28;
      } else {
        x = window.innerWidth * 0.22;
        y = visTop + visH * 0.68;
      }
      side = 1 - side;

      var img = document.createElement('img');
      img.setAttribute('aria-hidden', 'true');
      img.style.cssText = [
        'position:fixed',
        'left:'   + (x - size / 2) + 'px',
        'top:'    + (y - size / 2) + 'px',
        'width:'  + size + 'px',
        'height:' + size + 'px',
        'pointer-events:none',
        'z-index:9999',
        'filter:invert(1)',
        'mix-blend-mode:screen',
        'object-fit:contain',
        'user-select:none',
        'transform-origin:center center'
      ].join(';');
      img.src = SPLATTERS[0];
      document.body.appendChild(img);

      gsap.fromTo(img,
        { scale: 0.08, opacity: 0.28, rotation: rot },
        {
          scale: 2.0,
          opacity: 0,
          duration: 1.3,
          ease: 'power2.out',
          onComplete: function () { if (img.parentNode) img.parentNode.removeChild(img); }
        }
      );

      timer = setTimeout(spawnNext, 1800 + Math.random() * 1400);
    }

    var observer = new IntersectionObserver(function (entries) {
      active = entries[0].isIntersecting;
      if (active && !timer) {
        timer = setTimeout(spawnNext, 600);
      } else if (!active && timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: 0.15 });

    observer.observe(section);
  }

  initGallerySplatters();

  document.addEventListener('mousedown', function (e) {
    if (e.target.closest('a, button, .work__card')) spawnSplatter(e.clientX, e.clientY);
  });

  document.addEventListener('touchstart', function (e) {
    if (!e.touches.length) return;
    if (e.target.closest('a, button, .work__card')) {
      spawnSplatter(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  /* ── #3 Needle cursor jab + ink dot ─────────────────────── */
  var cursorDot = null;
  function getDot() {
    if (!cursorDot) cursorDot = document.getElementById('cursor-dot');
    return cursorDot;
  }

  document.addEventListener('mousedown', function (e) {
    /* Jab the needle tip down and spring back */
    var d = getDot();
    if (d) {
      gsap.to(d, {
        y: 7,
        duration: 0.07,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: function () {
          gsap.to(d, { y: 0, duration: 0.22, ease: 'elastic.out(1.2, 0.4)' });
        }
      });
    }

    /* Accent ink dot blooms at click position */
    var dot = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = [
      'position:fixed',
      'left:' + e.clientX + 'px',
      'top:'  + e.clientY + 'px',
      'width:5px',
      'height:5px',
      'border-radius:50%',
      'background:rgba(191,155,90,0.92)',
      'pointer-events:none',
      'z-index:9998',
      'transform:translate(-50%,-50%)'
    ].join(';');
    document.body.appendChild(dot);

    gsap.fromTo(dot,
      { scale: 1, opacity: 0.92 },
      {
        scale: 5,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }
      }
    );
  });

}());
