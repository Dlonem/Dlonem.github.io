/* search.js — site-wide search for dlonem.com.
   Loaded lazily by site.js the first time the magnifier is used, so it costs
   nothing on a normal page view. The index is a static JSON file generated at
   edit time (tools/build_search_index.py) — there is no third-party script and
   no request leaves the site. */
(function () {
  'use strict';

  var INDEX_URL = '/search-index.json?v=1';

  /* Shown before anything is typed: the pages people actually arrive for,
     taken from Search Console (top pages by clicks, Oct 2026). */
  var POPULAR = [
    { k: 'Wiki', t: 'The Long Night & Azor Ahai wiki', u: '/mods/the-long-night/wiki/' },
    { k: 'Mod', t: 'The Long Night & Azor Ahai', u: '/mods/the-long-night/' },
    { k: 'Wiki', t: 'Supernatural wiki', u: '/mods/supernatural/wiki/' },
    { k: 'Guide', t: 'CK3 mods not working?', u: '/ck3-mod-help/' },
    { k: 'Community', t: 'The Grey Company, a WoW Forever guild', u: '/community/the-grey-company/' },
    { k: 'App', t: 'THC Break Buddy', u: '/apps/thc-break-buddy/' }
  ];

  /* A few searches deserve a better answer than "nothing matched". */
  var EGGS = [
    { re: /only ?fans?/, k: 'Members only', t: 'Dlonem: exclusive content',
      x: 'The good stuff. Subscribers only. You were warned.',
      u: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  ];
  var docs = null, loading = null, dlg = null, input = null, list = null,
      status = null, results = [], active = -1, lastFocus = null, tId = 0;

  /* ---------- index ---------- */
  function load() {
    if (loading) return loading;
    loading = fetch(INDEX_URL, { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        docs = (j.docs || []).map(function (d) {
          d._t = d.t.toLowerCase();
          d._s = (d.s || '').toLowerCase();
          d._x = (d.x || '').toLowerCase();
          return d;
        });
        return docs;
      })
      .catch(function (e) { loading = null; throw e; });
    return loading;
  }

  /* ---------- scoring ----------
     Every term must appear somewhere in the entry (AND), which keeps a
     two-word query from returning everything that matched either word.
     Where it appears decides the rank. */
  function score(d, terms) {
    /* A section entry carries its page's title too. Scoring that title at full
       weight gave every section of a page an identical score — search "load
       order" and all eleven sections of the load-order guide tied, so the one
       actually about load order did not come first. For a section, the heading
       is the real title and the page title is only weak context. */
    var sec = !!d.s;
    var tHit  = sec ? 22 : 80,  tLead  = sec ? 30 : 120;
    var sHit  = 64,             sLead  = 92;
    var total = 0;

    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], s = 0;
      if (d._t.indexOf(t) === 0) s = tLead;
      else if (d._t.indexOf(t) > -1) s = tHit;
      if (sec) {
        if (d._s.indexOf(t) === 0) s = Math.max(s, sLead);
        else if (d._s.indexOf(t) > -1) s = Math.max(s, sHit);
      }
      if (s === 0) {
        var at = d._x.indexOf(t);
        if (at < 0) return 0;                 // term missing entirely -> drop
        s = at < 400 ? 16 : 9;                // early in the text counts more
        var occ = d._x.split(t).length - 1;
        s += Math.min(occ, 6);
      }
      total += s;
    }
    return total;
  }

  function query(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return [];
    var out = [];
    for (var i = 0; i < docs.length; i++) {
      var s = score(docs[i], terms);
      if (s > 0) out.push({ d: docs[i], s: s });
    }
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, 24);
  }

  /* ---------- snippet ---------- */
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function snippet(d, terms) {
    var x = d.x || '', lx = x.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = lx.indexOf(terms[i]);
      if (p > -1 && (at < 0 || p < at)) { at = p; }
    }
    if (at < 0) { at = 0; }
    var start = Math.max(0, at - 70);
    if (start > 0) { var sp = x.indexOf(' ', start); if (sp > -1 && sp < start + 24) start = sp + 1; }
    var cut = x.slice(start, start + 200);
    if (start + 200 < x.length) cut = cut.replace(/\s+\S*$/, '') + '…';
    var html = esc(cut);
    terms.forEach(function (t) {
      if (!t) return;
      html = html.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    });
    return (start > 0 ? '…' : '') + html;
  }

  /* ---------- render ---------- */
  function option(i, d, snip) {
    return '<li role="option" id="ds-o' + i + '" aria-selected="false">' +
      '<a href="' + esc(d.u) + '" tabindex="-1">' +
        '<span class="ds-kind">' + esc(d.k || '') + '</span>' +
        '<span class="ds-title">' + esc(d.s || d.t) + '</span>' +
        (d.s ? '<span class="ds-in">in ' + esc(d.t) + '</span>' : '') +
        (snip ? '<span class="ds-snip">' + snip + '</span>' : '') +
      '</a></li>';
  }

  function render(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    active = -1;
    list.hidden = false;
    if (!terms.length) {
      results = POPULAR.map(function (d) { return { d: d }; });
      list.innerHTML = '<li class="ds-head" role="presentation">Popular</li>' +
        POPULAR.map(function (d, i) { return option(i, d, ''); }).join('');
      status.textContent = '';
      return;
    }
    var lq = q.toLowerCase().replace(/\s+/g, ' ').trim();
    for (var e = 0; e < EGGS.length; e++) {
      if (EGGS[e].re.test(lq)) {
        results = [{ d: EGGS[e] }];
        list.innerHTML = option(0, EGGS[e], esc(EGGS[e].x));
        status.textContent = '1 result';
        return;
      }
    }
    if (!docs) { list.innerHTML = ''; status.textContent = 'Loading\u2026'; return; }
    results = query(q);
    if (!results.length) {
      list.innerHTML = '<li class="ds-none">Nothing matched “' + esc(q) +
        '”. Try a single word — “dragonglass”, “load order”, “caffeine”.</li>';
      status.textContent = 'No results';
      return;
    }
    list.innerHTML = results.map(function (r, i) {
      return option(i, r.d, snippet(r.d, terms));
    }).join('');
    status.textContent = results.length + (results.length === 1 ? ' result' : ' results');
  }

  function move(step) {
    if (!results.length) return;
    var items = list.querySelectorAll('li[role=option]');
    if (!items.length) return;
    if (active > -1 && items[active]) {
      items[active].classList.remove('on');
      items[active].setAttribute('aria-selected', 'false');
    }
    active += step;
    if (active < 0) active = items.length - 1;
    if (active >= items.length) active = 0;
    var el = items[active];
    el.classList.add('on');
    el.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- shell ---------- */
  function build() {
    dlg = document.createElement('div');
    dlg.className = 'ds';
    dlg.hidden = true;
    dlg.innerHTML =
      '<div class="ds-back" data-close></div>' +
      '<div class="ds-panel" role="dialog" aria-modal="true" aria-label="Search this site">' +
        '<div class="ds-bar">' +
          '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>' +
          '<input type="search" class="ds-input" autocomplete="off" autocorrect="off" spellcheck="false" ' +
            'placeholder="Search apps, mods, guides…" aria-label="Search this site" ' +
            'role="combobox" aria-expanded="true" aria-controls="ds-list" aria-autocomplete="list">' +
          '<button type="button" class="ds-x" data-close aria-label="Close search">Esc</button>' +
        '</div>' +
        '<ul class="ds-list" id="ds-list" role="listbox" aria-label="Search results" hidden></ul>' +
        '<p class="ds-hint">Every page on the site, plus every section of the Long Night wiki.</p>' +
        '<p class="ds-status" role="status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(dlg);
    input = dlg.querySelector('.ds-input');
    list = dlg.querySelector('.ds-list');
    status = dlg.querySelector('.ds-status');

    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { close(); return; }
      var a = e.target.closest('.ds-list a');
      if (a) close();                       // let the link navigate
    });
    input.addEventListener('input', function () {
      clearTimeout(tId);
      var v = input.value;
      tId = setTimeout(function () { render(v); }, 90);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var items = list.querySelectorAll('li[role=option] a');
        if (active > -1 && items[active]) { e.preventDefault(); items[active].click(); }
      } else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
  }

  function open() {
    if (!dlg) build();
    lastFocus = document.activeElement;
    dlg.hidden = false;
    document.documentElement.classList.add('ds-open');
    input.focus();
    input.select();
    status.textContent = '';
    render(input.value);                    // popular pages show at once
    load().then(function () {
      if (input.value) render(input.value);
    }).catch(function () {
      list.hidden = false;
      list.innerHTML = '<li class="ds-none">Search could not load. Use the menu to browse instead.</li>';
    });
  }

  function close() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    document.documentElement.classList.remove('ds-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* keep focus inside the dialog while it is open */
  document.addEventListener('focusin', function (e) {
    if (dlg && !dlg.hidden && !dlg.contains(e.target)) input.focus();
  });

  window.DlonemSearch = { open: open, close: close };
  open();     // site.js loads this file in response to a click, so open now
})();
