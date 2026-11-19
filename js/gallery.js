/* ============================================================
   gallery.js — Selected Work: editorial grid, filters, lightbox.
   Content comes from AK_CONTENT.portfolio (js/content.js).
   ============================================================ */

(function () {
  'use strict';

  var AK = window.AK || {};
  var esc = AK.esc;
  var C = window.AK_CONTENT || {};

  var grid = document.querySelector('[data-work-grid]');
  var filtersEl = document.querySelector('[data-filters]');
  var countEl = document.querySelector('[data-work-count]');
  var noticeEl = document.querySelector('[data-work-notice]');
  if (!grid) return;

  // Absolute URLs: a url() inside a CSS custom property resolves against
  // the stylesheet, not the page, so relative paths would 404.
  var MASKS = ['assets/textures/ink-stroke.webp', 'assets/textures/ink-blot.webp', 'assets/textures/ink-speckle.webp']
    .map(function (p) { return new URL(p, document.baseURI).href; });
  var isDemo = /[?&]demo\b/.test(window.location.search);

  /* Only real entries with an image are treated as work */
  var items = (C.portfolio || []).filter(function (p) { return p && p.src; });

  if (!items.length && isDemo) items = demoItems();

  /* ----------------------------------------------------------
     Empty state — numbered pending plates, nothing invented
  ---------------------------------------------------------- */
  if (!items.length) {
    if (noticeEl) {
      noticeEl.hidden = false;
      noticeEl.innerHTML =
        '<p><strong>Portfolio photographs are on their way.</strong> In the meantime, ' +
        '<a href="#consult">start a consultation</a> or see recent work on ' +
        (C.artist && C.artist.instagram
          ? '<a href="https://instagram.com/' + encodeURIComponent(C.artist.instagram) + '" target="_blank" rel="noopener noreferrer">Instagram</a>.'
          : 'Instagram.') +
        '</p>';
    }
    if (filtersEl) filtersEl.hidden = true;
    if (countEl) countEl.hidden = true;
    var html = '';
    var ars = ['4 / 5', '3 / 4', '4 / 5', '3 / 2', '3 / 4', '4 / 5'];
    for (var i = 0; i < 4; i++) {
      html +=
        '<li class="work__item">' +
          '<div class="plate plate--empty">' +
            '<div class="plate__media" style="--ar:' + ars[i] + ';--mask:url(\'' + MASKS[i % 3] + '\')">' +
              '<div class="plate__pending"><span class="label">Photograph pending</span></div>' +
            '</div>' +
            '<div class="plate__cap"><span class="plate__title">Coming soon</span></div>' +
          '</div>' +
        '</li>';
    }
    grid.innerHTML = html;
    return;
  }

  // Optional note set by the artist in content.js (e.g. while sample images are used)
  if (!isDemo && C.portfolioNote && noticeEl) {
    noticeEl.hidden = false;
    noticeEl.innerHTML = '<p>' + esc(C.portfolioNote) + '</p>';
  }

  if (isDemo && noticeEl) {
    noticeEl.hidden = false;
    noticeEl.innerHTML =
      '<p><strong>Demo mode.</strong> These plates are ink textures, not tattoos. They exist only to preview the grid, filters and viewer. Remove <code>?demo</code> from the address to see the live gallery.</p>';
  }

  /* ----------------------------------------------------------
     Filters — generated from the styles actually present
  ---------------------------------------------------------- */
  var order = (C.artist && C.artist.styles) || [];
  var counts = {};
  items.forEach(function (it) { if (it.style) counts[it.style] = (counts[it.style] || 0) + 1; });
  var styles = Object.keys(counts).sort(function (a, b) {
    var ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  var current = 'All';
  var visible = items.slice();

  function renderFilters() {
    if (!filtersEl) return;
    if (styles.length < 2) { filtersEl.hidden = true; return; }
    filtersEl.innerHTML = ['All'].concat(styles).map(function (s) {
      var n = s === 'All' ? items.length : counts[s];
      return '<button type="button" class="filter" data-style="' + esc(s) + '" aria-pressed="' + (s === current) + '">' +
        esc(s) + '<sup>' + n + '</sup></button>';
    }).join('');
  }

  filtersEl && filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-style]');
    if (!b) return;
    current = b.getAttribute('data-style');
    filtersEl.querySelectorAll('.filter').forEach(function (f) {
      f.setAttribute('aria-pressed', String(f === b));
    });
    renderGrid(true);
  });

  /* ----------------------------------------------------------
     Grid
  ---------------------------------------------------------- */
  function plateHTML(it, idx) {
    var ar = it.width && it.height ? it.width + ' / ' + it.height : '4 / 5';
    var meta = [it.placement, it.year].filter(Boolean).join(' · ');
    var media;
    if (it.demo) {
      media = '<div class="plate__media" style="--ar:' + ar + ';--mask:url(\'' + it.mask + '\')">' +
                '<span class="plate__demo-tag">Demo</span></div>';
    } else {
      media = '<div class="plate__media" style="--ar:' + ar + '">' +
                '<img src="' + esc(it.src) + '" alt="' + esc(it.alt || '') + '"' +
                (it.width ? ' width="' + it.width + '" height="' + it.height + '"' : '') +
                ' loading="lazy" decoding="async" /></div>';
    }
    var label = 'Open ' + (it.title || 'piece') + (it.style ? ', ' + it.style : '') + ' in viewer';
    return '<li class="work__item' + (idx < 0 ? '' : '') + '">' +
      '<button type="button" class="plate' + (it.demo ? ' plate--demo' : '') + '" data-index="' + idx + '" aria-label="' + esc(label) + '">' +
        media +
        '<span class="plate__cap">' +
          '<span class="plate__title">' + esc(it.title || 'Untitled') + '</span>' +
          '<span class="plate__meta">' + esc(it.style || '') + '</span>' +
          (meta ? '<span class="plate__open">' + esc(meta) + '</span>' : '') +
        '</span>' +
      '</button></li>';
  }

  function renderGrid(animate) {
    visible = current === 'All' ? items.slice() : items.filter(function (it) { return it.style === current; });
    grid.innerHTML = visible.map(plateHTML).join('');
    if (countEl) {
      countEl.textContent = visible.length + (visible.length === 1 ? ' piece' : ' pieces') +
        (current === 'All' ? '' : ' · ' + current);
    }
    if (animate && !AK.reducedMotion()) {
      Array.prototype.forEach.call(grid.children, function (li, i) {
        li.style.animationDelay = Math.min(i, 8) * 45 + 'ms';
        li.classList.add('is-entering');
      });
    }
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-index]');
    if (b) open(parseInt(b.getAttribute('data-index'), 10), b);
  });

  /* ----------------------------------------------------------
     Lightbox (native <dialog>: focus trap + Esc for free)
  ---------------------------------------------------------- */
  var lb = document.querySelector('[data-lightbox]');
  var lbMedia = lb && lb.querySelector('[data-lb-media]');
  var lbIndex = lb && lb.querySelector('[data-lb-index]');
  var lbTitle = lb && lb.querySelector('[data-lb-title]');
  var lbMeta = lb && lb.querySelector('[data-lb-meta]');
  var lbNote = lb && lb.querySelector('[data-lb-note]');
  var pos = 0;
  var opener = null;

  function show(i) {
    var n = visible.length;
    pos = (i + n) % n;
    var it = visible[pos];
    if (it.demo) {
      lbMedia.innerHTML = '<div class="plate plate--demo"><div class="plate__media" style="--mask:url(\'' + it.mask + '\')"><span class="plate__demo-tag">Demo</span></div></div>';
    } else {
      lbMedia.innerHTML = '<img src="' + esc(it.src) + '" alt="' + esc(it.alt || '') + '"' +
        (it.width ? ' width="' + it.width + '" height="' + it.height + '"' : '') + ' decoding="async" />';
    }
    lbIndex.textContent = (pos + 1) + ' of ' + n + (current === 'All' ? '' : ' · ' + current);
    lbTitle.textContent = it.title || 'Untitled';
    var rows = [['Style', it.style], ['Placement', it.placement], ['Project', it.type], ['Year', it.year]]
      .filter(function (r) { return r[1]; });
    lbMeta.innerHTML = rows.map(function (r) {
      return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>';
    }).join('');
    lbNote.textContent = it.note || '';

    // preload neighbours
    [visible[(pos + 1) % n], visible[(pos - 1 + n) % n]].forEach(function (nb) {
      if (nb && nb.src && !nb.demo) { var im = new Image(); im.src = nb.src; }
    });
    var multi = n > 1;
    lb.querySelector('[data-lb-prev]').hidden = !multi;
    lb.querySelector('[data-lb-next]').hidden = !multi;
  }

  function open(i, from) {
    if (!lb || typeof lb.showModal !== 'function') {
      var it = visible[i];
      if (it && it.src && !it.demo) window.open(it.src, '_blank', 'noopener');
      return;
    }
    opener = from || null;
    show(i);
    lb.showModal();
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('[data-lb-close]').focus();
  }

  if (lb) {
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(pos - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(pos + 1); });
    lb.querySelector('[data-lb-close]').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
      if (opener) opener.focus();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(pos + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(pos - 1); }
    });
    // click on the empty frame (not on media or controls) closes
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__frame')) lb.close();
    });
    // swipe
    var sx = null, sy = null;
    lbMedia.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    lbMedia.addEventListener('pointerup', function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) show(pos + (dx < 0 ? 1 : -1));
    });
    lbMedia.addEventListener('pointercancel', function () { sx = sy = null; });
  }

  renderFilters();
  renderGrid(false);

  /* ----------------------------------------------------------
     helpers
  ---------------------------------------------------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function demoItems() {
    var st = ['Fine Line', 'Realism', 'Japanese', 'Blackwork', 'Geometric'];
    var dims = [[1200, 1500], [1200, 1600], [1600, 1200], [1200, 1500], [1200, 1600], [1200, 1500], [1500, 1200], [1200, 1600], [1200, 1500]];
    return dims.map(function (d, i) {
      return {
        demo: true,
        src: 'demo',
        mask: MASKS[i % 3],
        width: d[0], height: d[1],
        title: 'Demo plate ' + (i + 1),
        style: st[i % st.length],
        placement: 'Placement',
        type: 'Demo entry',
        note: 'Demo content for previewing the layout. Not a tattoo.'
      };
    });
  }

}());
