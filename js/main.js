/* ============================================================
   main.js — global layout: header, mobile menu, nav state,
   content binding, quiet entrance reveals.
   Native scrolling only. No scroll-driven animation.
   ============================================================ */

(function () {
  'use strict';

  var C = window.AK_CONTENT || {};
  var artist = C.artist || {};

  /* ----------------------------------------------------------
     Shared helpers (exposed for the other modules)
  ---------------------------------------------------------- */
  var AK = window.AK = window.AK || {};

  AK.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  AK.reducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  AK.store = {
    get: function (k) { try { return JSON.parse(window.localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* noop */ } }
  };

  /* ----------------------------------------------------------
     Bind artist details from content.js
  ---------------------------------------------------------- */
  if (artist.email) {
    document.querySelectorAll('[data-artist-email]').forEach(function (a) {
      a.href = 'mailto:' + artist.email;
      a.textContent = artist.email;
    });
  }
  if (artist.instagram) {
    document.querySelectorAll('[data-artist-ig]').forEach(function (a) {
      a.href = 'https://instagram.com/' + encodeURIComponent(artist.instagram);
      a.textContent = '@' + artist.instagram;
    });
  }
  document.querySelectorAll('[data-artist-city]').forEach(function (el) {
    if (artist.city) el.textContent = artist.city;
    else el.closest('div, p') && el.closest('div, p').setAttribute('hidden', '');
  });
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* About */
  (function () {
    var about = C.about || {};
    var quoteEl = document.querySelector('[data-about-quote]');
    var bioEl = document.querySelector('[data-about-bio]');
    var listEl = document.querySelector('[data-about-statements]');
    var frame = document.querySelector('[data-portrait-frame]');
    var statements = about.statements || [];

    if (quoteEl) {
      if (statements[0]) quoteEl.textContent = statements[0];
      else quoteEl.remove();
    }
    if (bioEl) {
      bioEl.innerHTML = (about.bio || []).map(function (p) { return '<p>' + AK.esc(p) + '</p>'; }).join('');
    }
    if (listEl) {
      listEl.innerHTML = statements.slice(1).map(function (s) { return '<li>' + AK.esc(s) + '</li>'; }).join('');
      if (!listEl.children.length) listEl.remove();
    }
    if (frame && about.portrait) {
      var img = new Image();
      img.alt = about.portraitAlt || artist.name || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onload = function () { frame.innerHTML = ''; frame.appendChild(img); };
      img.src = about.portrait;
    }
  }());

  /* ----------------------------------------------------------
     Header: solid background once past the top of the hero
  ---------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('.hero');
  if (header && hero && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
    hero.appendChild(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-solid', !entries[0].isIntersecting);
    }).observe(sentinel);
  } else if (header) {
    header.classList.add('is-solid');
  }

  /* ----------------------------------------------------------
     Mobile menu
  ---------------------------------------------------------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    menu.hidden = !open;
    header.classList.toggle('is-solid', open || window.scrollY > 40);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = menu.querySelector('a');
      if (first) first.focus();
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     Current section in nav (aria-current)
  ---------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = map[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sectionObs.observe(s);
    });
  }

  /* ----------------------------------------------------------
     Quiet entrance: elements fade in once when first seen.
     Purely cosmetic and never hides content without JS.
  ---------------------------------------------------------- */
  if ('IntersectionObserver' in window && !AK.reducedMotion()) {
    var revealSel = [
      '.display', '.about__portrait', '.about__body', '.process__photo', '.step',
      '.consult__panel', '.faq__ask', '.faq__browse', '.contact__grid'
    ].join(',');
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealObs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll(revealSel).forEach(function (el) {
      if (el.closest('.hero')) return;
      el.classList.add('reveal');
      revealObs.observe(el);
    });
  }

}());
