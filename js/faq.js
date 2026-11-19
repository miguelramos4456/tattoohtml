/* ============================================================
   faq.js — question responder + browsable accordion.
   Deterministic keyword matching over AK_CONTENT.faq.
   Not AI: if nothing matches confidently, it says so and
   points the visitor to the artist.
   ============================================================ */

(function () {
  'use strict';

  var AK = window.AK || {};
  var esc = AK.esc;
  var C = window.AK_CONTENT || {};
  var FAQ = C.faq || [];
  var EMAIL = (C.artist && C.artist.email) || '';

  var form = document.querySelector('[data-faq-form]');
  var input = document.querySelector('[data-faq-input]');
  var suggestEl = document.querySelector('[data-faq-suggest]');
  var resultEl = document.querySelector('[data-faq-result]');
  var catsEl = document.querySelector('[data-faq-cats]');
  var listEl = document.querySelector('[data-faq-list]');
  if (!listEl || !FAQ.length) return;

  /* ----------------------------------------------------------
     Accordion list
  ---------------------------------------------------------- */
  listEl.innerHTML = FAQ.map(function (f, i) {
    return '<details class="qa" id="qa-' + i + '" data-cat="' + esc(f.cat) + '">' +
      '<summary><span class="qa__text">' + esc(f.q) + '</span><span class="qa__icon" aria-hidden="true"></span></summary>' +
      '<div class="qa__body"><p>' + esc(f.a) + '</p></div>' +
    '</details>';
  }).join('');
  var items = Array.prototype.slice.call(listEl.querySelectorAll('.qa'));

  /* Categories */
  var cats = [];
  FAQ.forEach(function (f) { if (cats.indexOf(f.cat) < 0) cats.push(f.cat); });
  var currentCat = 'All';
  if (catsEl) {
    catsEl.innerHTML = ['All'].concat(cats).map(function (c) {
      return '<button type="button" class="filter" data-cat="' + esc(c) + '" aria-pressed="' + (c === 'All') + '">' + esc(c) + '</button>';
    }).join('');
    catsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      setCat(b.getAttribute('data-cat'));
    });
  }
  function setCat(c) {
    currentCat = c;
    catsEl && catsEl.querySelectorAll('[data-cat]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === c));
    });
    items.forEach(function (d) {
      d.hidden = c !== 'All' && d.getAttribute('data-cat') !== c;
    });
  }

  /* ----------------------------------------------------------
     Suggestions
  ---------------------------------------------------------- */
  var SUGGEST = [0, 1, 7, 9, 3].filter(function (i) { return FAQ[i]; });
  function chipsHTML(ids) {
    return ids.map(function (i) {
      return '<button type="button" class="chip" data-ask="' + i + '">' + esc(FAQ[i].q) + '</button>';
    }).join('');
  }
  if (suggestEl) suggestEl.innerHTML = '<span class="visually-hidden">Suggested questions:</span>' + chipsHTML(SUGGEST);

  /* ----------------------------------------------------------
     Matching
  ---------------------------------------------------------- */
  var STOP = ('a an the i im i\'m me my you your yours is are am be do does did can could should would will ' +
    'to of in on for at it its this that what whats how when where which who why with about if or and ' +
    'need have has get got there any much many there please tell know want just').split(' ');

  function norm(s) {
    return ' ' + String(s).toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9äöüß\s-]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ').trim() + ' ';
  }
  function stem(w) {
    return w.replace(/(ings?|ed|es|s)$/, '');
  }
  function tokens(s) {
    return norm(s).trim().split(' ').filter(function (w) { return w && STOP.indexOf(w) < 0; }).map(stem);
  }

  // phrase form: every word stemmed, stopwords kept ("touch ups" → "touch up")
  function phrase(s) {
    return ' ' + norm(s).trim().split(' ').map(stem).join(' ') + ' ';
  }

  var index = FAQ.map(function (f) {
    return {
      kw: (f.keywords || []).map(function (k) { return phrase(k).trim(); }),
      qt: tokens(f.q)
    };
  });

  function score(query) {
    var nq = phrase(query);
    var qt = tokens(query);
    return index.map(function (ix, i) {
      var s = 0;
      ix.kw.forEach(function (k) {
        if (!k) return;
        if (k.indexOf(' ') > -1) {
          if (nq.indexOf(' ' + k + ' ') > -1) s += 3;
        } else if (qt.indexOf(k) > -1) {
          s += 2;
        }
      });
      qt.forEach(function (t) { if (t.length > 2 && ix.qt.indexOf(t) > -1) s += 1; });
      return { i: i, s: s };
    }).sort(function (a, b) { return b.s - a.s; });
  }

  /* ----------------------------------------------------------
     Answering
  ---------------------------------------------------------- */
  function contactLinks() {
    return '<a href="#consult">Start a consultation</a>' +
      (EMAIL ? '<a href="mailto:' + esc(EMAIL) + '">Email Alexander</a>' : '');
  }

  function answer(i, asked) {
    var f = FAQ[i];
    var related = score(f.q + ' ' + (f.keywords || []).join(' '))
      .filter(function (r) { return r.i !== i && r.s >= 3 && FAQ[r.i].cat === f.cat; })
      .slice(0, 2);
    resultEl.innerHTML =
      '<div class="answer">' +
        (asked ? '<p class="answer__you">You asked: “' + esc(asked) + '”</p>' : '') +
        '<h3 class="answer__q">' + esc(f.q) + '</h3>' +
        '<p class="answer__a">' + esc(f.a) + '</p>' +
        '<div class="answer__more">' +
          (related.length ? related.map(function (r) {
            return '<button type="button" data-ask="' + r.i + '">' + esc(FAQ[r.i].q) + '</button>';
          }).join('') : '') +
          '<span>Not quite it?</span>' + contactLinks() +
        '</div>' +
      '</div>';
    highlight(i);
  }

  function miss(asked) {
    resultEl.innerHTML =
      '<div class="answer answer--miss">' +
        '<p class="answer__you">You asked: “' + esc(asked) + '”</p>' +
        '<h3 class="answer__q">No confident answer.</h3>' +
        '<p class="answer__a">That one isn’t covered here, and it’s better to ask Alexander than to guess. Try rephrasing, or pick a common question below.</p>' +
        '<div class="answer__more">' + contactLinks() + '</div>' +
      '</div>';
    highlight(-1);
  }

  function highlight(i) {
    items.forEach(function (d, j) {
      d.classList.toggle('is-hit', j === i);
      if (j === i) {
        if (currentCat !== 'All' && d.getAttribute('data-cat') !== currentCat) setCat('All');
        d.open = true;
      }
    });
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q) { input && input.focus(); return; }
    var best = score(q);
    if (best[0] && best[0].s >= 2) answer(best[0].i, q);
    else miss(q);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ask]');
    if (!b) return;
    var i = parseInt(b.getAttribute('data-ask'), 10);
    if (input) input.value = FAQ[i].q;
    answer(i, null);
    var r = resultEl.getBoundingClientRect();
    if (r.top < 60 || r.bottom > window.innerHeight) {
      resultEl.scrollIntoView({ behavior: AK.reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  });

}());
