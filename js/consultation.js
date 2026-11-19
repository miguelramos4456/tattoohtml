/* ============================================================
   consultation.js — guided, one-question-at-a-time booking
   consultation with review and honest submission.

   Submission:
   • If AK_CONTENT.submission.endpoint is set, answers are POSTed
     as JSON and success is shown only on a 2xx response.
   • Otherwise the visitor's email app is opened with the summary
     pre-filled. The UI says clearly that nothing is sent until
     they press send there, and offers copy-to-clipboard.
   ============================================================ */

(function () {
  'use strict';

  var AK = window.AK || {};
  var esc = AK.esc;
  var C = window.AK_CONTENT || {};
  var artist = C.artist || {};
  var endpoint = (C.submission && C.submission.endpoint) || '';
  var EMAIL = artist.email || '';

  var root = document.querySelector('[data-consult]');
  if (!root) return;
  var form = root.querySelector('[data-consult-form]');
  var stage = root.querySelector('[data-consult-stage]');
  var bar = root.querySelector('[data-consult-bar]');
  var stepLabel = root.querySelector('[data-consult-step]');
  var errorEl = root.querySelector('[data-consult-error]');
  var prevBtn = root.querySelector('[data-consult-prev]');
  var nextBtn = root.querySelector('[data-consult-next]');

  var KEY = 'ak-consult-draft-v1';

  /* ----------------------------------------------------------
     Questions
  ---------------------------------------------------------- */
  var styleOpts = (artist.styles || []).concat(['Lettering', 'Not sure yet']);
  var budgetRanges = C.budgetRanges || [];
  var budgetStep = budgetRanges.length
    ? {
        id: 'budget',
        title: 'What is your approximate budget?',
        help: 'A rough range helps shape the design. You get an actual quote after the consultation.',
        type: 'single',
        options: budgetRanges.concat(['I’d like a quote first']),
        required: true
      }
    : {
        id: 'budget',
        title: 'What is your approximate budget?',
        help: 'A rough figure helps shape the design. You get an actual quote after the consultation.',
        type: 'single',
        options: ['I have a figure in mind', 'I’d like a quote first'],
        extra: { id: 'budgetAmount', label: 'Approximate amount (' + (C.currency || 'EUR') + ')', type: 'text', inputmode: 'decimal', showIf: 'I have a figure in mind' },
        required: true
      };

  var STEPS = [
    {
      id: 'style',
      title: 'What kind of tattoo are you imagining?',
      help: 'Choose as many as fit. “Not sure yet” is a perfectly good answer.',
      type: 'multi',
      options: styleOpts,
      required: true,
      short: 'Style'
    },
    {
      id: 'placement',
      title: 'Where on your body would you like it?',
      type: 'single',
      options: ['Forearm', 'Upper arm', 'Hand or fingers', 'Chest', 'Back', 'Ribs or side', 'Thigh', 'Calf or ankle', 'Neck', 'Somewhere else'],
      extra: { id: 'placementNote', label: 'Details', optional: true, type: 'text', placeholder: 'e.g. inner left forearm, wrapping slightly' },
      required: true,
      short: 'Placement'
    },
    {
      id: 'size',
      title: 'What approximate size do you have in mind?',
      type: 'single',
      options: ['Small · up to about 7 cm', 'Medium · palm to hand-sized', 'Large · about 15–30 cm', 'Large-scale · sleeve or back piece', 'Not sure, I’d like advice'],
      extra: { id: 'sizeNote', label: 'Size in cm', optional: true, type: 'text', placeholder: 'e.g. 12 × 8 cm' },
      required: true,
      short: 'Size'
    },
    {
      id: 'reference',
      title: 'Do you have reference images or an original idea?',
      type: 'single',
      options: ['I have reference images', 'I have an original idea', 'Both', 'I’d like help shaping it'],
      extra: { id: 'refLinks', label: 'Links to references', optional: true, type: 'textarea', rows: 3, placeholder: 'Instagram, Pinterest, Google Drive or Dropbox links, one per line' },
      note: 'This site can’t receive file uploads. Paste links above, or attach your images when you reply to Alexander’s email.',
      required: true,
      short: 'References'
    },
    {
      id: 'first',
      title: 'Is this your first tattoo?',
      type: 'single',
      options: ['Yes, it’s my first', 'No, I have tattoos already'],
      required: true,
      short: 'First tattoo'
    },
    Object.assign(budgetStep, { short: 'Budget' }),
    {
      id: 'timing',
      title: 'When would you like to book?',
      type: 'single',
      options: ['As soon as possible', 'In 1–3 months', 'In 3–6 months', 'I’m flexible'],
      extra: { id: 'timingNote', label: 'Preferred days or dates', optional: true, type: 'text', placeholder: 'e.g. weekdays, late March' },
      note: 'This is a preference, not a reservation. Alexander will confirm actual availability.',
      required: true,
      short: 'Timing'
    },
    {
      id: 'concept',
      title: 'Tell us a little more about your concept.',
      help: 'The story behind it, the mood, details you love, anything you want to avoid.',
      type: 'textarea',
      placeholder: 'Write as much or as little as you like…',
      required: true,
      minLength: 10,
      short: 'Concept'
    },
    {
      id: 'contact',
      title: 'Where should Alexander reply?',
      help: 'Your details are used only to reply to this request.',
      type: 'contact',
      short: 'Contact'
    }
  ];
  var REVIEW = STEPS.length; // index of the review screen

  /* ----------------------------------------------------------
     State
  ---------------------------------------------------------- */
  var saved = AK.store ? AK.store.get(KEY) : null;
  var data = (saved && saved.data) || {};
  var idx = 0;
  var returnToReview = false;
  var finished = false;

  function persist() { if (AK.store) AK.store.set(KEY, { data: data, t: Date.now() }); }

  /* ----------------------------------------------------------
     Rendering
  ---------------------------------------------------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function optHTML(step, opt, i) {
    var type = step.type === 'multi' ? 'checkbox' : 'radio';
    var val = data[step.id];
    var checked = type === 'checkbox' ? (val || []).indexOf(opt) > -1 : val === opt;
    var id = 'q-' + step.id + '-' + i;
    return '<label class="opt" for="' + id + '">' +
      '<input type="' + type + '" id="' + id + '" name="' + step.id + '" value="' + esc(opt) + '"' + (checked ? ' checked' : '') + ' />' +
      '<span>' + esc(opt) + '</span></label>';
  }

  function fieldHTML(f) {
    var v = data[f.id] || '';
    var label = '<label for="f-' + f.id + '">' + esc(f.label) +
      (f.optional ? ' <span class="opt-tag">(optional)</span>' : '') + '</label>';
    var attrs = ' id="f-' + f.id + '" name="' + f.id + '"' +
      (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
      (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') +
      (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '') +
      (f.required ? ' required aria-required="true"' : '');
    var input = f.type === 'textarea'
      ? '<textarea' + attrs + ' rows="' + (f.rows || 5) + '">' + esc(v) + '</textarea>'
      : '<input type="' + (f.inputType || 'text') + '"' + attrs + ' value="' + esc(v) + '" />';
    return '<div class="field" data-field="' + f.id + '"' + (f.showIf && data[f.parent] !== f.showIf ? ' hidden' : '') + '>' +
      label + input + (f.hint ? '<p class="field__note">' + esc(f.hint) + '</p>' : '') + '</div>';
  }

  function renderStep() {
    errorEl.textContent = '';
    var total = STEPS.length;

    if (finished) return;

    if (idx === REVIEW) {
      renderReview();
    } else {
      var s = STEPS[idx];
      var head = '';
      var html;

      if (s.type === 'single' || s.type === 'multi') {
        html = '<fieldset class="q">' +
          '<legend class="q__title" tabindex="-1">' + head + esc(s.title) + '</legend>' +
          (s.help ? '<p class="q__help">' + esc(s.help) + '</p>' : '') +
          '<div class="q__opts">' + s.options.map(function (o, i) { return optHTML(s, o, i); }).join('') + '</div>' +
          (s.extra ? fieldHTML(Object.assign({ parent: s.id }, s.extra)) : '') +
          (s.note ? '<p class="q__note">' + esc(s.note) + '</p>' : '') +
          '</fieldset>';
      } else if (s.type === 'textarea') {
        html = '<div class="q">' +
          '<label class="q__title" for="f-' + s.id + '" tabindex="-1">' + head + esc(s.title) + '</label>' +
          (s.help ? '<p class="q__help">' + esc(s.help) + '</p>' : '') +
          '<div class="field"><textarea id="f-' + s.id + '" name="' + s.id + '" rows="7" placeholder="' + esc(s.placeholder || '') + '" aria-required="true">' + esc(data[s.id] || '') + '</textarea></div>' +
          '</div>';
      } else if (s.type === 'contact') {
        html = '<div class="q">' +
          '<h3 class="q__title" tabindex="-1">' + head + esc(s.title) + '</h3>' +
          '<p class="q__help">' + esc(s.help) + '</p>' +
          '<div class="field-row">' +
            fieldHTML({ id: 'name', label: 'Your name', required: true, autocomplete: 'name' }) +
            fieldHTML({ id: 'email', label: 'Email', required: true, inputType: 'email', autocomplete: 'email', inputmode: 'email' }) +
          '</div>' +
          fieldHTML({ id: 'handle', label: 'Instagram or phone', optional: true, placeholder: 'If you prefer another way to talk' }) +
          '</div>';
      }
      stage.innerHTML = html;
    }

    var shown = Math.min(idx + 1, total);
    stepLabel.textContent = idx === REVIEW
      ? 'Review your answers'
      : 'Question ' + shown + ' of ' + total;
    bar.style.transform = 'scaleX(' + (idx === REVIEW ? 1 : idx / total) + ')';

    prevBtn.hidden = idx === 0;
    nextBtn.hidden = false;
    nextBtn.disabled = false;
    if (idx === REVIEW) {
      nextBtn.textContent = endpoint ? 'Send request' : 'Send via email';
    } else if (returnToReview) {
      nextBtn.textContent = 'Back to review';
    } else {
      nextBtn.textContent = idx === REVIEW - 1 ? 'Review →' : 'Next →';
    }
  }

  function answerText(s) {
    var v = data[s.id];
    var out = Array.isArray(v) ? v.join(', ') : (v || '');
    if (s.extra && data[s.extra.id] && (!s.extra.showIf || data[s.id] === s.extra.showIf)) {
      out += (out ? '\n' : '') + data[s.extra.id];
    }
    return out;
  }

  function contactText() {
    return [data.name, data.email, data.handle].filter(Boolean).join('\n');
  }

  function renderReview() {
    var rows = STEPS.map(function (s, i) {
      var a = s.type === 'contact' ? contactText() : answerText(s);
      return '<div class="summary__row">' +
        '<span class="summary__q">' + esc(s.short || s.title) + '</span>' +
        '<span class="summary__a">' + (a ? esc(a) : '<em>Not answered</em>') + '</span>' +
        '<button type="button" class="summary__edit" data-edit="' + i + '" aria-label="Edit ' + esc(s.short || s.title) + '">Edit</button>' +
      '</div>';
    }).join('');

    var how = endpoint
      ? 'Sending delivers this summary directly to Alexander.'
      : 'Sending opens your email app with this summary filled in, addressed to ' + esc(EMAIL) + '. It is only sent when you press send there.';

    stage.innerHTML =
      '<div class="q">' +
        '<h3 class="q__title" tabindex="-1">Your consultation, at a glance.</h3>' +
        '<p class="q__help">Check everything reads right. ' + how + '</p>' +
        '<div class="summary">' + rows + '</div>' +
        '<div class="summary-actions">' +
          '<button type="button" class="btn btn--small btn--outline" data-copy>Copy summary</button>' +
          '<button type="button" class="btn btn--small btn--ghost" data-reset>Start over</button>' +
        '</div>' +
      '</div>';
  }

  function focusTitle() {
    var t = stage.querySelector('.q__title');
    if (t) t.focus({ preventScroll: true });
    var r = root.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      root.scrollIntoView({ behavior: AK.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  /* ----------------------------------------------------------
     Reading + validating input
  ---------------------------------------------------------- */
  function collect() {
    if (idx >= REVIEW) return;
    var s = STEPS[idx];
    if (s.type === 'multi') {
      data[s.id] = Array.prototype.map.call(stage.querySelectorAll('input[name="' + s.id + '"]:checked'), function (i) { return i.value; });
    } else if (s.type === 'single') {
      var c = stage.querySelector('input[name="' + s.id + '"]:checked');
      data[s.id] = c ? c.value : '';
    }
    stage.querySelectorAll('.field input, .field textarea').forEach(function (el) {
      data[el.name] = el.value.trim();
    });
    persist();
  }

  function fail(msg, el) {
    errorEl.textContent = msg;
    if (el) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', 'consult-error');
      el.focus();
    }
    return false;
  }

  function validate() {
    errorEl.id = 'consult-error';
    stage.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    if (idx >= REVIEW) return true;
    var s = STEPS[idx];
    if (s.type === 'multi' && (!data[s.id] || !data[s.id].length)) {
      return fail('Pick at least one option, or choose “Not sure yet”.', stage.querySelector('input'));
    }
    if (s.type === 'single' && !data[s.id]) {
      return fail('Choose the option that fits best.', stage.querySelector('input'));
    }
    if (s.type === 'textarea' && (data[s.id] || '').length < (s.minLength || 1)) {
      return fail('A sentence or two is enough, so Alexander knows where to start.', stage.querySelector('textarea'));
    }
    if (s.type === 'contact') {
      if (!data.name) return fail('Add your name so Alexander knows who to reply to.', stage.querySelector('#f-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) {
        return fail('That email doesn’t look right. Please check it.', stage.querySelector('#f-email'));
      }
    }
    return true;
  }

  /* ----------------------------------------------------------
     Summary text + submission
  ---------------------------------------------------------- */
  function summaryText() {
    var lines = ['Tattoo consultation request', ''];
    STEPS.forEach(function (s, i) {
      if (s.type === 'contact') return;
      lines.push((s.short || s.title).toUpperCase());
      lines.push(answerText(s) || '(not answered)');
      lines.push('');
    });
    lines.push('CONTACT');
    lines.push(contactText());
    return lines.join('\n');
  }

  function payload() {
    var out = { _subject: 'Tattoo consultation: ' + (data.name || ''), name: data.name, email: data.email, contact: data.handle || '' };
    STEPS.forEach(function (s) {
      if (s.type === 'contact') return;
      out[s.short || s.id] = answerText(s);
    });
    out.summary = summaryText();
    return out;
  }

  function mailtoHref() {
    return 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent('Tattoo consultation: ' + (data.name || '')) +
      '&body=' + encodeURIComponent(summaryText());
  }

  function copySummary(btn) {
    var text = summaryText();
    var ok = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy summary'; }, 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text) && ok(); });
    } else if (fallbackCopy(text)) ok();
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function showDone(kind) {
    finished = true;
    bar.style.transform = 'scaleX(1)';
    stepLabel.textContent = kind === 'sent' ? 'Sent' : 'Almost done';
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    errorEl.textContent = '';
    var html;
    if (kind === 'sent') {
      html = '<div class="done"><h3 class="done__title q__title" tabindex="-1">Received.</h3>' +
        '<p>Your consultation reached Alexander. He’ll reply to <strong>' + esc(data.email) + '</strong>.</p>' +
        '<p>If you have reference images, keep them ready to share when he replies.</p></div>';
      AK.store && AK.store.del(KEY);
    } else {
      html = '<div class="done"><h3 class="done__title q__title" tabindex="-1">One last step.</h3>' +
        '<p>Your email app should have opened with the consultation filled in. <strong>It isn’t sent until you press send there.</strong> Attach any reference images to that email.</p>' +
        '<p>Didn’t open? Copy the summary and email it to <a href="mailto:' + esc(EMAIL) + '">' + esc(EMAIL) + '</a>.</p>' +
        '<div class="summary-actions">' +
          '<a class="btn btn--small btn--solid" href="' + esc(mailtoHref()) + '">Open email again</a>' +
          '<button type="button" class="btn btn--small btn--outline" data-copy>Copy summary</button>' +
          '<button type="button" class="btn btn--small btn--ghost" data-back-review>Back to review</button>' +
        '</div></div>';
    }
    stage.innerHTML = html;
    focusTitle();
  }

  function submit() {
    if (endpoint) {
      nextBtn.disabled = true;
      nextBtn.textContent = 'Sending…';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload())
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showDone('sent');
      }).catch(function () {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Try again';
        errorEl.innerHTML = 'Your request couldn’t be sent. Nothing was lost. Try again, or <a href="' + esc(mailtoHref()) + '">send it by email instead</a>.';
      });
    } else {
      window.location.href = mailtoHref();
      showDone('mail');
    }
  }

  /* ----------------------------------------------------------
     Events
  ---------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (finished) return;
    collect();
    if (!validate()) return;
    if (idx === REVIEW) { submit(); return; }
    idx = returnToReview ? REVIEW : idx + 1;
    if (idx === REVIEW) returnToReview = false;
    renderStep();
    focusTitle();
  });

  prevBtn.addEventListener('click', function () {
    collect();
    if (idx > 0) idx--;
    returnToReview = false;
    renderStep();
    focusTitle();
  });

  // live: conditional extra fields + clear errors
  stage.addEventListener('change', function (e) {
    if (idx >= REVIEW) return;
    var s = STEPS[idx];
    if (s.extra && s.extra.showIf && e.target.name === s.id) {
      var f = stage.querySelector('[data-field="' + s.extra.id + '"]');
      if (f) f.hidden = e.target.value !== s.extra.showIf;
    }
    errorEl.textContent = '';
    e.target.removeAttribute && e.target.removeAttribute('aria-invalid');
  });

  stage.addEventListener('click', function (e) {
    var edit = e.target.closest('[data-edit]');
    if (edit) {
      idx = parseInt(edit.getAttribute('data-edit'), 10);
      returnToReview = true;
      renderStep();
      focusTitle();
      return;
    }
    var copy = e.target.closest('[data-copy]');
    if (copy) { copySummary(copy); return; }
    if (e.target.closest('[data-reset]')) {
      data = {};
      AK.store && AK.store.del(KEY);
      idx = 0;
      renderStep();
      focusTitle();
      return;
    }
    if (e.target.closest('[data-back-review]')) {
      finished = false;
      idx = REVIEW;
      renderStep();
      focusTitle();
    }
  });

  renderStep();

}());
