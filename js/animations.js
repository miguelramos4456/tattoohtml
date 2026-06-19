/* ============================================================
   TATTOO PORTFOLIO — animations.js
   GSAP + ScrollTrigger animation & interaction layer.
   Layered on top of main.js — does NOT restructure HTML.
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;
  var REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     HELPERS
  ============================================================ */

  /* Split each character in el's direct text nodes into
     .char-wrap > .char spans. Preserves element children (e.g. <br>, <em>).
     Returns array of .char inner spans. */
  function splitChars(el) {
    var nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    var chars = [];
    nodes.forEach(function (node) {
      if (node.nodeType === 3 /* TEXT_NODE */) {
        node.textContent.split('').forEach(function (ch) {
          var wrap  = document.createElement('span');
          wrap.className = 'char-wrap';
          var inner = document.createElement('span');
          inner.className = 'char';
          inner.textContent = (ch === ' ') ? ' ' : ch;
          wrap.appendChild(inner);
          el.appendChild(wrap);
          chars.push(inner);
        });
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
    return chars;
  }

  /* Split element text into .word-wrap > .word spans.
     Returns array of .word inner spans. */
  function splitWords(el) {
    var text  = el.textContent.trim();
    el.innerHTML = '';
    var words = [];
    var parts = text.split(/\s+/);
    parts.forEach(function (w, i) {
      var wrap  = document.createElement('span');
      wrap.className = 'word-wrap';
      var inner = document.createElement('span');
      inner.className = 'word';
      inner.textContent = w;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      words.push(inner);
      if (i < parts.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
    return words;
  }

  /* ============================================================
     PRE-EMPT CSS REVEAL
     Remove .reveal and freeze opacity:0 on every element that
     GSAP will animate — prevents IntersectionObserver from
     flashing them visible before GSAP takes over.
  ============================================================ */

  var GSAP_SELECTORS = [
    '.statement__quote',
    '.statement__author',
    '.work__card',
    '.about__portrait-wrap',
    '.about__text',
    '.section-label',
    '.contact__inner',
    '.process__step',
    '.about__stat-pill'
  ];

  GSAP_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.remove('reveal');
      gsap.set(el, { opacity: 0 });
    });
  });

  /* ============================================================
     DOM INJECTION
  ============================================================ */

  function injectDOM() {
    /* Custom cursor (desktop only) */
    if (!IS_MOBILE) {
      var dot  = document.createElement('div'); dot.id  = 'cursor-dot';
      var ring = document.createElement('div'); ring.id = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);
      document.body.classList.add('cursor-active');
    }

    /* Scroll progress bar */
    var bar  = document.createElement('div'); bar.id  = 'scroll-progress-bar';
    var fill = document.createElement('div'); fill.id = 'scroll-progress-fill';
    bar.appendChild(fill);
    document.body.appendChild(bar);

    /* Page overlay for entrance transition */
    var overlay = document.createElement('div'); overlay.id = 'page-overlay';
    document.body.appendChild(overlay);
  }

  /* ============================================================
     A1 — CUSTOM MAGNETIC CURSOR
  ============================================================ */

  function initCursor() {
    if (IS_MOBILE) return;

    var dot  = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx, ry = my;

    gsap.set([dot, ring], { opacity: 0 });

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    /* Dot: instant. Ring: lag via ticker lerp. */
    gsap.ticker.add(function () {
      gsap.set(dot, { x: mx, y: my });
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      gsap.set(ring, { x: rx, y: ry });
    });

    /* Fade in on first move */
    var firstMove = true;
    window.addEventListener('mousemove', function () {
      if (!firstMove) return;
      firstMove = false;
      gsap.to([dot, ring], { opacity: 1, duration: 0.5 });
    }, { once: true });

    /* Expand ring on interactive elements */
    document.querySelectorAll('a, button, .work__card, .specialty-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('cursor--hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('cursor--hover'); });
    });
  }

  /* ============================================================
     A2 — NAV: SHRINK ON SCROLL + ACTIVE SECTION INDICATOR
  ============================================================ */

  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    /* Shrink nav after 80px scroll */
    ScrollTrigger.create({
      start: 'top -80',
      onEnter:     function () { nav.classList.add('nav--scrolled'); },
      onLeaveBack: function () { nav.classList.remove('nav--scrolled'); }
    });

    /* Active link underline via section IntersectionObserver */
    var links   = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
    var anchors = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);

    if (!anchors.length) return;

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

    anchors.forEach(function (el) { sectionObserver.observe(el); });
  }

  /* ============================================================
     A3 — HERO ENTRANCE: CHAR SPLIT + WORD REVEAL + RULE + CHEVRON
  ============================================================ */

  function initHeroEntrance() {
    var nameEl  = document.querySelector('.hero__name');
    var tagEl   = document.querySelector('.hero__tagline');
    var ruleEl  = document.querySelector('.hero__rule');
    var chevron = document.querySelector('.hero__chevron');

    if (!nameEl) return;

    /* Char-split the h1 (preserves the <br> element) */
    var chars = splitChars(nameEl);
    gsap.set(chars, { opacity: 0, rotateX: -40, y: 22, transformPerspective: 600 });

    /* Word-split the tagline */
    var words = tagEl ? splitWords(tagEl) : [];
    if (words.length) gsap.set(words, { opacity: 0, y: 16 });

    if (ruleEl)  gsap.set(ruleEl,  { opacity: 0, scaleX: 0 });
    if (chevron) gsap.set(chevron, { opacity: 0, y: -8, rotation: 45 });

    var tl = gsap.timeline({ delay: 0.25, defaults: { ease: 'power3.out' } });

    /* Name chars cascade in */
    tl.to(chars, {
      opacity: 1, rotateX: 0, y: 0,
      duration: 0.9,
      stagger: { amount: 0.55 }
    });

    /* Tagline words */
    if (words.length) {
      tl.to(words, {
        opacity: 1, y: 0,
        duration: 0.65,
        stagger: 0.055
      }, '-=0.45');
    }

    /* Rule expands from centre */
    if (ruleEl) {
      tl.to(ruleEl, {
        opacity: 1, scaleX: 1,
        transformOrigin: 'center center',
        duration: 0.6
      }, '-=0.35');
    }

    /* Chevron fades in then bounces */
    if (chevron) {
      tl.to(chevron, { opacity: 1, y: 0, duration: 0.45 }, '-=0.25');
      tl.call(function () {
        /* y oscillation; rotation: 45 is already set above */
        gsap.to(chevron, {
          y: 7,
          duration: 0.9,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      });
    }
  }

  /* ============================================================
     A4 — HERO PARTICLE DUST (subtle floating specks)
  ============================================================ */

  function initParticles() {
    if (IS_MOBILE) return;

    var hero = document.querySelector('.hero');
    if (!hero) return;

    var canvas   = document.createElement('canvas');
    canvas.id    = 'hero-particles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:1'
    ].join(';');
    hero.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var W, H, pts;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }

    function makePoint() {
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.4 + 0.2,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(Math.random() * 0.38 + 0.08),
        a:  Math.random() * 0.45 + 0.04
      };
    }

    function init() {
      resize();
      pts = Array.from({ length: 55 }, makePoint);
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + p.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    init();
    tick();

    window.addEventListener('resize', function () {
      resize();
      pts = Array.from({ length: 55 }, makePoint);
    });
  }

  /* ============================================================
     A5 — STATEMENT: SCROLL-SCRUBBED WORD HIGHLIGHT
  ============================================================ */

  function initStatement() {
    var quote  = document.querySelector('.statement__quote');
    var author = document.querySelector('.statement__author');
    if (!quote) return;

    /* GSAP owns these — opacity was pre-frozen above */
    var words = splitWords(quote);
    gsap.set(words, { opacity: 0.1 });

    /* Each word illuminates as scroll sweeps through */
    ScrollTrigger.create({
      trigger: quote,
      start: 'top 78%',
      end: 'bottom 55%',
      scrub: 1.2,
      onUpdate: function (self) {
        var p = self.progress;
        for (var i = 0; i < words.length; i++) {
          var threshold = (i / words.length) * 0.8;
          var o = Math.min(1, Math.max(0.1, (p - threshold) / 0.18));
          words[i].style.opacity = o;
        }
      }
    });

    /* Restore quote wrapper opacity (it was frozen) */
    gsap.set(quote, { opacity: 1 });

    if (author) {
      gsap.set(author, { opacity: 0 });
      gsap.to(author, {
        opacity: 1, y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: author, start: 'top 88%' }
      });
      gsap.from(author, { y: 14, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: author, start: 'top 88%' }
      });
    }
  }

  /* ============================================================
     A6 — PORTFOLIO: ORBIT LAYOUT + FLOAT ENTRANCE
  ============================================================ */

  function initPortfolio() {
    var grid     = document.querySelector('.work__grid');
    var allCards = Array.from(document.querySelectorAll('.work__card'));
    if (!grid || !allCards.length) return;

    /* ── Inject lightbox (once) ───────────────────── */
    if (!document.getElementById('gallery-lightbox')) {
      var lb = document.createElement('div');
      lb.id  = 'gallery-lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Image lightbox');
      lb.innerHTML =
        '<button id="gallery-lightbox__close" aria-label="Close lightbox">&times;</button>' +
        '<img id="gallery-lightbox__img" src="" alt="">' +
        '<p id="gallery-lightbox__caption"></p>';
      document.body.appendChild(lb);
    }
    var lbEl      = document.getElementById('gallery-lightbox');
    var lbImg     = document.getElementById('gallery-lightbox__img');
    var lbCap     = document.getElementById('gallery-lightbox__caption');
    var lbClose   = document.getElementById('gallery-lightbox__close');
    var lbPrevFocus;

    function openLightbox(card) {
      var img   = card.querySelector('.work__image img');
      var style = card.querySelector('.work__style');
      var year  = card.querySelector('.work__year');
      if (!img) return;
      lbImg.src = img.src;
      lbImg.alt = card.getAttribute('aria-label') || '';
      lbCap.textContent = [
        style ? style.textContent : '',
        year  ? year.textContent  : ''
      ].filter(Boolean).join(' — ');
      lbEl.classList.add('is-open');
      lbPrevFocus = document.activeElement;
      lbClose.focus();
    }

    function closeLightbox() {
      lbEl.classList.remove('is-open');
      lbImg.src = '';
      if (lbPrevFocus) lbPrevFocus.focus();
    }

    lbClose.addEventListener('click', closeLightbox);
    lbEl.addEventListener('click', function (e) {
      if (e.target === lbEl) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lbEl.classList.contains('is-open')) closeLightbox();
    });

    /* ── Active card list (updated by filter) ─────── */
    var activeCards = allCards.slice();

    /* ── Responsive orbit sizing ──────────────────── */
    function layoutOrbit() {
      var vw = window.innerWidth;
      var size, radius, cardW;
      if (vw < 480) {
        size = 520;  radius = 160; cardW = 98;
      } else if (vw < 768) {
        size = 720;  radius = 240; cardW = 130;
      } else if (vw < 1100) {
        size = 980;  radius = 330; cardW = 168;
      } else {
        size = 1280; radius = 440; cardW = 200;
      }
      grid.style.width  = size + 'px';
      grid.style.height = size + 'px';

      /* Position hidden cards in the centre so they don't poke out */
      allCards.forEach(function (card) {
        card.style.width = cardW + 'px';
        if (card.hasAttribute('data-hidden')) {
          card.style.left = (size / 2 - Math.round(cardW / 2)) + 'px';
          card.style.top  = (size / 2 - Math.round(cardW * 0.65)) + 'px';
        }
      });

      var n = activeCards.length;
      activeCards.forEach(function (card, i) {
        var angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        var x     = Math.round(Math.cos(angle) * radius);
        var y     = Math.round(Math.sin(angle) * radius);
        card.style.left  = (size / 2 + x - Math.round(cardW / 2)) + 'px';
        card.style.top   = (size / 2 + y - Math.round(cardW * 0.65)) + 'px';
        card.style.setProperty('--float-delay', (i * 0.35).toFixed(2) + 's');
        card.style.setProperty('--float-dur',   (2.6 + (i % 4) * 0.3).toFixed(1) + 's');
      });
      ScrollTrigger.refresh();
    }

    layoutOrbit();
    window.addEventListener('resize', layoutOrbit);

    /* ── Filter tabs ──────────────────────────────── */
    var filterBtns = Array.from(document.querySelectorAll('.work__filter'));
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var filter = btn.getAttribute('data-filter');
        allCards.forEach(function (card) {
          var match = filter === 'all' || card.getAttribute('data-style') === filter;
          if (match) {
            card.removeAttribute('data-hidden');
          } else {
            card.setAttribute('data-hidden', '');
          }
        });
        activeCards = allCards.filter(function (c) { return !c.hasAttribute('data-hidden'); });
        layoutOrbit();
      });
    });

    /* ── Pause orbit on card hover (desktop) ──────── */
    grid.addEventListener('mouseover', function (e) {
      if (e.target.closest('.work__card')) grid.classList.add('orbit-paused');
    });
    grid.addEventListener('mouseout', function (e) {
      if (e.target.closest('.work__card')) grid.classList.remove('orbit-paused');
    });

    /* ── Click / tap: panel toggle → lightbox ─────── */
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.work__card');
      if (!card || card.hasAttribute('data-hidden')) return;
      if (IS_MOBILE) {
        if (!card.classList.contains('panel-open')) {
          allCards.forEach(function (c) { c.classList.remove('panel-open'); });
          card.classList.add('panel-open');
        } else {
          openLightbox(card);
        }
      } else {
        openLightbox(card);
      }
    });

    /* Close panel when tapping outside (mobile) */
    document.addEventListener('click', function (e) {
      if (IS_MOBILE && !e.target.closest('.work__grid')) {
        allCards.forEach(function (c) { c.classList.remove('panel-open'); });
      }
    });

    /* ── Entrance: scale-fade inners in ───────────── */
    if (!REDUCED) {
      var inners = Array.from(document.querySelectorAll('.work__card-inner'));
      gsap.set(inners, { opacity: 0, scale: 0.78 });
      gsap.set(allCards, { opacity: 1 });

      ScrollTrigger.create({
        trigger: '.work',
        start: 'top 75%',
        once: true,
        onEnter: function () {
          inners.forEach(function (inner, i) {
            gsap.to(inner, {
              opacity: 1, scale: 1,
              duration: 0.75,
              delay: i * 0.07,
              ease: 'back.out(1.4)'
            });
          });
        }
      });
    }
  }

  /* ============================================================
     A7 — ABOUT: CLIP-PATH PORTRAIT REVEAL + TEXT STAGGER
  ============================================================ */

  function initAbout() {
    var portraitWrap = document.querySelector('.about__portrait-wrap');
    var portrait     = document.querySelector('.about__portrait');
    var textWrap     = document.querySelector('.about__text');

    if (portraitWrap && portrait) {
      gsap.set(portraitWrap, { opacity: 1 }); /* wrapper visible; clip handles reveal */
      gsap.from(portrait, {
        clipPath: 'inset(0 100% 0 0)',
        duration: 1.3,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: portraitWrap, start: 'top 78%' }
      });
    }

    if (textWrap) {
      gsap.set(textWrap, { opacity: 1 });
      var children = Array.from(textWrap.children);
      gsap.set(children, { opacity: 0, y: 28, filter: 'blur(6px)' });
      gsap.to(children, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.8,
        stagger: 0.11,
        ease: 'power2.out',
        scrollTrigger: { trigger: textWrap, start: 'top 76%' }
      });
    }
  }

  /* ============================================================
     A8 — SPECIALTIES: 3D CARD TILT ON HOVER
  ============================================================ */

  function initSpecialties() {
    if (IS_MOBILE) return;

    document.querySelectorAll('.specialty-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var rx   = ((e.clientY - rect.top)  / rect.height - 0.5) * -12;
        var ry   = ((e.clientX - rect.left) / rect.width  - 0.5) *  12;
        gsap.to(card, {
          rotateX: rx, rotateY: ry, scale: 1.025,
          duration: 0.35,
          ease: 'power2.out',
          transformPerspective: 900
        });
      });

      card.addEventListener('mouseleave', function () {
        gsap.to(card, {
          rotateX: 0, rotateY: 0, scale: 1,
          duration: 0.65,
          ease: 'elastic.out(1, 0.4)',
          transformPerspective: 900
        });
      });
    });
  }

  /* ============================================================
     A8b — DECORATIVE IMAGES: PARALLAX SCROLL
  ============================================================ */

  function initDecoImages() {
    var koi = document.querySelector('.process__deco-koi');

    if (koi) {
      gsap.to(koi, {
        yPercent: -28,
        ease: 'none',
        scrollTrigger: {
          trigger: '.process',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2
        }
      });
    }
  }

  /* ============================================================
     A9 — PROCESS: STAGGERED REVEAL WITH ALTERNATING OFFSETS
  ============================================================ */

  function initProcess() {
    var steps = Array.from(document.querySelectorAll('.process__step'));
    if (!steps.length) return;

    /* opacity pre-frozen; add y offset */
    steps.forEach(function (step, i) {
      var yFrom = (i % 2 === 0) ? -18 : 18;
      gsap.set(step, { y: yFrom });

      gsap.to(step, {
        opacity: 1, y: 0,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 85%'
        }
      });
    });
  }

  /* ============================================================
     A10 — SECTION LABELS: LINE DRAW + TEXT SLIDE
  ============================================================ */

  function initSectionLabels() {
    document.querySelectorAll('.section-label').forEach(function (label) {
      var line = label.querySelector('.section-label__line');
      var text = label.querySelector('.section-label__text');

      gsap.set(label, { opacity: 1 }); /* un-freeze wrapper */
      if (line) gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
      if (text) gsap.set(text, { opacity: 0, x: -10 });

      ScrollTrigger.create({
        trigger: label,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          if (line) gsap.to(line, { scaleX: 1, duration: 0.7, ease: 'power3.out' });
          if (text) gsap.to(text, { opacity: 1, x: 0, duration: 0.6, delay: 0.18, ease: 'power2.out' });
        }
      });
    });
  }

  /* ============================================================
     A11 — CONTACT: HEADLINE REVEAL + CTA FILL HOVER
  ============================================================ */

  function initContact() {
    var inner    = document.querySelector('.contact__inner');
    var headline = document.querySelector('.contact__headline');
    var sub      = document.querySelector('.contact__sub');
    var cta      = document.querySelector('.contact__cta');
    var ig       = document.querySelector('.contact__instagram');

    if (inner) gsap.set(inner, { opacity: 1 }); /* un-freeze wrapper */

    /* Headline: slide up + fade */
    if (headline) {
      gsap.set(headline, { opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.96 });
      gsap.to(headline, {
        opacity: 1, y: 0, filter: 'blur(0px)', scale: 1,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: headline, start: 'top 82%' }
      });
    }

    /* Sub-text */
    if (sub) {
      gsap.set(sub, { opacity: 0, y: 16 });
      gsap.to(sub, {
        opacity: 1, y: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: { trigger: sub, start: 'top 88%' }
      });
    }

    /* CTA fill-wipe hover effect */
    if (cta) {
      cta.classList.add('js-hover');

      var fillDiv   = document.createElement('div');
      fillDiv.className = 'contact__cta__fill';

      var labelSpan = document.createElement('span');
      labelSpan.className = 'contact__cta__label';
      labelSpan.textContent = cta.textContent;

      cta.innerHTML = '';
      cta.appendChild(fillDiv);
      cta.appendChild(labelSpan);

      gsap.set(fillDiv, { scaleX: 0 });

      cta.addEventListener('mouseenter', function () {
        gsap.to(fillDiv,   { scaleX: 1, duration: 0.42, ease: 'power3.inOut', transformOrigin: 'left center' });
        gsap.to(labelSpan, { color: '#0a0a0a', duration: 0.28, delay: 0.18 });
      });
      cta.addEventListener('mouseleave', function () {
        gsap.to(fillDiv,   { scaleX: 0, duration: 0.32, ease: 'power3.inOut', transformOrigin: 'right center' });
        gsap.to(labelSpan, { color: '#ffffff', duration: 0.22 });
      });

      gsap.set(cta, { opacity: 0, y: 12 });
      gsap.to(cta, {
        opacity: 1, y: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: { trigger: cta, start: 'top 90%' }
      });
    }

    /* Instagram */
    if (ig) {
      gsap.set(ig, { opacity: 0 });
      gsap.to(ig, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: ig, start: 'top 92%' }
      });
    }
  }

  /* ============================================================
     A12 — ABOUT STAT PILLS: SPRING ENTRANCE
  ============================================================ */

  function initStats() {
    var pills = Array.from(document.querySelectorAll('.about__stat-pill'));
    if (!pills.length) return;

    pills.forEach(function (pill, i) {
      gsap.set(pill, { opacity: 0, scale: 0.82, y: 10 });
      gsap.to(pill, {
        opacity: 1, scale: 1, y: 0,
        duration: 0.65,
        ease: 'back.out(1.7)',
        delay: i * 0.1,
        scrollTrigger: { trigger: pill, start: 'top 90%' }
      });
    });
  }

  /* ============================================================
     A13 — FOOTER: SEQUENTIAL CHARACTER REVEAL
  ============================================================ */

  function initFooter() {
    var footerText = document.querySelector('.footer__text');
    if (!footerText) return;

    var chars = splitChars(footerText);
    gsap.set(chars, { opacity: 0 });
    gsap.to(chars, {
      opacity: 1,
      duration: 0.001,
      stagger: { amount: 0.9, from: 'start', ease: 'none' },
      scrollTrigger: { trigger: footerText, start: 'top 95%' }
    });
  }

  /* ============================================================
     A14 — SCROLL PROGRESS BAR
  ============================================================ */

  function initScrollProgress() {
    var fill = document.getElementById('scroll-progress-fill');
    if (!fill) return;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        fill.style.width = (self.progress * 100).toFixed(2) + '%';
      }
    });
  }

  /* ============================================================
     A15 — PAGE ENTRANCE OVERLAY (black fade-out on load)
  ============================================================ */

  function initPageOverlay() {
    var overlay = document.getElementById('page-overlay');
    if (!overlay) return;

    gsap.set(overlay, { opacity: 1, pointerEvents: 'none' });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out',
      delay: 0.15
    });
  }

  /* ============================================================
     A16 — HAMBURGER MORPH ANIMATION (GSAP replaces CSS)
  ============================================================ */

  function initHamburger() {
    var btn   = document.querySelector('.nav__hamburger');
    if (!btn) return;
    var spans = Array.from(btn.querySelectorAll('span'));
    if (spans.length < 3) return;

    /* Disable the CSS transitions so GSAP owns the transform */
    spans.forEach(function (s) { s.style.transition = 'none'; });

    btn.addEventListener('click', function () {
      requestAnimationFrame(function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        if (open) {
          gsap.to(spans[0], { y: 6,  rotation:  45, duration: 0.3, ease: 'power2.inOut' });
          gsap.to(spans[1], { opacity: 0, scaleX: 0, duration: 0.2 });
          gsap.to(spans[2], { y: -6, rotation: -45, duration: 0.3, ease: 'power2.inOut' });
        } else {
          gsap.to(spans[0], { y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' });
          gsap.to(spans[1], { opacity: 1, scaleX: 1, duration: 0.25, delay: 0.05 });
          gsap.to(spans[2], { y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' });
        }
      });
    });
  }

  /* ============================================================
     A17 — HERO SIGNATURE LINE DRAW (#4)
  ============================================================ */

  function initSignatureDraw() {
    var path = document.querySelector('.hero__sig-path');
    if (!path) return;
    var len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 2.2,
      ease: 'power2.inOut',
      delay: 1.8
    });
  }

  /* ============================================================
     A18 — STAMP TEXT REVEAL (#7)
  ============================================================ */

  function initStampReveal() {
    var els = Array.from(document.querySelectorAll('.specialty-card__name'));
    els.forEach(function (el) {
      gsap.set(el, { opacity: 0, scale: 0.93, filter: 'blur(8px)', y: 4 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(el, {
            opacity: 1, scale: 1, filter: 'blur(0px)', y: 0,
            duration: 0.65,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  /* ============================================================
     INIT SEQUENCE
  ============================================================ */

  injectDOM();

  if (REDUCED) {
    /* Restore frozen elements; still wire up interactive features */
    GSAP_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        gsap.set(el, { opacity: 1 });
      });
    });
    initPortfolio(); /* layout + filters + lightbox still needed */
    initScrollProgress();
    initPageOverlay();
    return;
  }

  initCursor();
  initNav();
  initHeroEntrance();
  initSignatureDraw();
  initParticles();
  initStatement();
  initPortfolio();
  initAbout();
  initSpecialties();
  initStampReveal();
  initDecoImages();
  initProcess();
  initSectionLabels();
  initContact();
  initStats();
  initFooter();
  initScrollProgress();
  initPageOverlay();
  initHamburger();

  /* Trigger a ScrollTrigger refresh after all DOM mutations
     (char/word splits add nodes that change layout heights) */
  ScrollTrigger.refresh();

}());
