/* ============================================================
   TATTOO PORTFOLIO — main.js
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CANVAS FRAME SCRUB
     192 WebP frames in /frames/frame_0001.webp … frame_0192.webp
     Drawing to canvas is instant — no seek latency at all.
  ---------------------------------------------------------- */

  var TOTAL_FRAMES = 192;
  var frames       = new Array(TOTAL_FRAMES);
  var loadedCount  = 0;
  var currentIdx   = 0;

  var hero      = document.querySelector('.hero');
  var canvasEl  = document.querySelector('.hero__canvas');
  var content   = document.querySelector('.hero__content');
  var indicator = document.querySelector('.hero__scroll-indicator');
  var ctx       = canvasEl ? canvasEl.getContext('2d') : null;

  /* Size canvas to match the hero's pixel dimensions */
  function resizeCanvas() {
    if (!canvasEl || !hero) return;
    canvasEl.width  = hero.offsetWidth;
    canvasEl.height = hero.offsetHeight;
  }

  /* Draw a frame with cover behaviour (mirrors object-fit: cover) */
  function drawFrame(idx) {
    if (!ctx) return;
    var img = frames[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    var cw = canvasEl.width;
    var ch = canvasEl.height;
    var ia = img.naturalWidth / img.naturalHeight;
    var ca = cw / ch;
    var dw, dh, ox, oy;

    if (ia > ca) {
      /* Image wider than canvas — letterbox left/right */
      dh = ch;
      dw = dh * ia;
      ox = (cw - dw) / 2;
      oy = 0;
    } else {
      /* Image taller than canvas — letterbox top/bottom */
      dw = cw;
      dh = dw / ia;
      ox = 0;
      oy = (ch - dh) / 2;
    }

    ctx.drawImage(img, ox, oy, dw, dh);
  }

  /* Preload every frame; draw the first as soon as it arrives */
  function preloadFrames() {
    resizeCanvas();

    for (var i = 0; i < TOTAL_FRAMES; i++) {
      /* IIFE to capture loop index */
      (function (idx) {
        var img    = new Image();
        img.onload = function () {
          loadedCount++;
          if (idx === 0) drawFrame(0);      /* first frame → paint immediately */
        };
        img.src    = 'frames/frame_' + pad4(idx + 1) + '.webp';
        frames[idx] = img;
      }(i));
    }
  }

  function pad4(n) {
    return ('000' + n).slice(-4);
  }

  window.addEventListener('resize', function () {
    resizeCanvas();
    drawFrame(currentIdx);
  });

  preloadFrames();

  /* ----------------------------------------------------------
     GSAP ScrollTrigger — pin + frame scrub + content fade
  ---------------------------------------------------------- */

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      pin: true,
      anticipatePin: 1,
      onRefresh: initReveal,
      onUpdate: function (self) {
        var p = self.progress;

        /* Map scroll progress to frame index */
        currentIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(p * TOTAL_FRAMES));
        drawFrame(currentIdx);

        /* Text fades out over first 30 % of scroll */
        if (content)   content.style.opacity   = Math.max(0, 1 - p / 0.30);
        if (indicator) indicator.style.opacity  = Math.max(0, 1 - p / 0.15);
      }
    });

  } else {
    initReveal();
  }

  /* ----------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver
     Called from ScrollTrigger onRefresh so pin spacer is
     already in the DOM when we measure positions.
  ---------------------------------------------------------- */

  var revealReady = false;

  function initReveal() {
    if (revealReady) return;
    revealReady = true;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    /* Stagger siblings that share the same parent */
    var groups = new Map();
    document.querySelectorAll('.reveal').forEach(function (el) {
      var p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });

    groups.forEach(function (siblings) {
      siblings.forEach(function (el, i) {
        if (siblings.length > 1) el.style.transitionDelay = (i * 0.1) + 's';
        observer.observe(el);
      });
    });
  }

  /* ----------------------------------------------------------
     MOBILE MENU
  ---------------------------------------------------------- */

  var hamburger     = document.querySelector('.nav__hamburger');
  var mobileMenu    = document.querySelector('.mobile-menu');
  var mobileOverlay = document.querySelector('.mobile-menu__overlay');
  var mobileClose   = document.querySelector('.mobile-menu__close');

  function openMenu() {
    mobileMenu.classList.add('is-open');
    mobileOverlay.classList.add('is-active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    mobileClose.focus();
  }

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    mobileOverlay.classList.remove('is-active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  if (hamburger)     hamburger.addEventListener('click', openMenu);
  if (mobileClose)   mobileClose.addEventListener('click', closeMenu);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);

  document.querySelectorAll('.mobile-menu a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });

  /* ----------------------------------------------------------
     SMOOTH SCROLL
  ---------------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

}());
