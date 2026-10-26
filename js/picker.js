/* Dlonem — the WoW Forever class quiz. Loaded only by /wow-forever/class-quiz/.

   #pk-data   classes, order, questions, specs, races (written by build_guides_h.py
              from claude-tools/picker_data.py; verify_h.py plays every persona in
              that file through this same scoring)
   #pk        the form, one question at a time, with Back and Skip
   #pk-result the answer

   Scoring: each answer adds points to some classes. A second answer on the same
   question ("this one fits too") counts half. A class's match is its points
   divided by the most it could have earned on the questions you answered (the
   best option, plus half the second-best where a second answer was given), so no
   class wins just by appearing in more answers. Ties go to raw points, then order.
   picker_data.py is the same model in Python; verify_h.py runs both.

   Nothing is sent or stored. The answers sit in the address bar (#a=...), two
   characters per question (first choice, second choice, x for none), so a result
   can be shared and survives a reload. The older one-character form still reads.

   After the result, a short guild invite, built from the page's own "Find a guild"
   links so the Discord invite lives in one place. It only shows for a class that
   has an Alliance race, since the guild is Alliance. */
(function () {
  'use strict';
  if (!document.querySelector || !window.JSON) return;
  var dataEl = document.getElementById('pk-data');
  var root = document.getElementById('pk');
  if (!dataEl || !root) return;
  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var Q = D.questions, N = Q.length, ORDER = D.order, CLS = D.classes;
  var MIN = 8;                       // answers needed before a result means much
  var ans = [], sec = [];                 // first choice, second choice (half weight)
  for (var i = 0; i < N; i++) { ans.push(null); sec.push(null); }

  var form = root.querySelector('form');
  var sets = [].slice.call(form.querySelectorAll('fieldset'));
  var count = root.querySelector('.pk-count');
  var fill = root.querySelector('.pk-bar span');
  var top = root.querySelector('.pk-top');
  var nav = root.querySelector('.pk-nav');
  var back = root.querySelector('.pk-back');
  var skip = root.querySelector('.pk-skip');
  var out = document.getElementById('pk-result');
  var icons = document.getElementById('pk-icons');
  var cur = 0;

  top.hidden = false;
  nav.hidden = false;
  root.classList.add('is-live');

  function el(tag, cls, text) {
    var x = document.createElement(tag);
    if (cls) x.className = cls;
    if (text != null) x.textContent = text;
    return x;
  }

  function show(i) {
    cur = i;
    sets.forEach(function (f, j) { f.hidden = j !== i; });
    count.textContent = (i + 1) + ' of ' + N;
    fill.style.width = Math.round(i / N * 100) + '%';
    back.hidden = i === 0;
    label();
    paint(i);
    var lg = sets[i].querySelector('legend');
    if (lg && document.activeElement && document.activeElement !== document.body) {
      lg.setAttribute('tabindex', '-1');
      lg.focus();
    }
  }

  function next() {
    if (cur < N - 1) show(cur + 1); else finish();
  }

  // the second button reads Skip until the question has an answer, then Next
  function label() {
    skip.textContent = ans[cur] === null ? 'Skip this one' : 'Next';
    skip.classList.toggle('is-primary', ans[cur] !== null);
  }

  // Marks the chosen options and keeps the hint under them current.
  function paint(i) {
    var labels = [].slice.call(sets[i].querySelectorAll('label'));
    labels.forEach(function (l, j) {
      l.classList.toggle('is-first', ans[i] === j);
      l.classList.toggle('is-second', sec[i] === j);
    });
    var hint = sets[i].querySelector('.pk-hint');
    if (!hint) { hint = el('p', 'pk-hint'); sets[i].appendChild(hint); }
    hint.textContent = ans[i] === null ? '' :
      sec[i] === null ? 'Does a second one fit too? Tap it; it counts half. Tap your pick again to change it.'
                      : 'Your second pick counts half. Tap it again to remove it.';
  }

  // A tap on an answer: the first tap is the pick; a tap on another answer makes
  // it the second pick (half weight); tapping the pick again clears the question.
  sets.forEach(function (f, i) {
    [].slice.call(f.querySelectorAll('input[type=radio]')).forEach(function (r) {
      r.addEventListener('change', function () {     // keyboard arrows land here
        ans[i] = parseInt(r.value, 10);
        if (sec[i] === ans[i]) sec[i] = null;
        label(); paint(i);
      });
    });
    [].slice.call(f.querySelectorAll('label')).forEach(function (l, j) {
      l.addEventListener('click', function (e) {
        if (!(e.detail > 0)) return;                 // keyboard: let the radio do it
        if (ans[i] === null) return;                 // first pick: the radio handles it
        e.preventDefault();
        if (j === ans[i]) { ans[i] = null; sec[i] = null; [].slice.call(f.querySelectorAll('input')).forEach(function (r) { r.checked = false; }); }
        else sec[i] = (sec[i] === j) ? null : j;
        label(); paint(i);
      });
    });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && ans[i] !== null) { e.preventDefault(); next(); }
    });
  });
  skip.addEventListener('click', function () {
    if (ans[cur] === null) {
      sec[cur] = null;
      [].slice.call(sets[cur].querySelectorAll('input')).forEach(function (r) { r.checked = false; });
    }
    next();
  });
  back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  function score() {
    var raw = {}, best = {}, pct = {};
    ORDER.forEach(function (k) { raw[k] = 0; best[k] = 0; });
    Q.forEach(function (q, i) {
      if (ans[i] === null) return;
      var second = sec[i] !== null && sec[i] !== ans[i] ? sec[i] : null;
      ORDER.forEach(function (k) {
        var vals = q.options.map(function (o) { return o.pts[k] || 0; }).sort(function (a, b) { return b - a; });
        best[k] += Math.max(vals[0], 0);
        if (second !== null) best[k] += Math.max(vals.length > 1 ? vals[1] : 0, 0) * 0.5;
      });
      var opt = q.options[ans[i]];
      Object.keys(opt.pts).forEach(function (k) { raw[k] += opt.pts[k]; });
      if (second !== null) {
        var o2 = q.options[second];
        Object.keys(o2.pts).forEach(function (k) { raw[k] += o2.pts[k] * 0.5; });
      }
    });
    ORDER.forEach(function (k) { pct[k] = best[k] ? raw[k] / best[k] : 0; });
    var ranked = ORDER.slice().sort(function (a, b) {
      return (pct[b] - pct[a]) || (raw[b] - raw[a]) || (ORDER.indexOf(a) - ORDER.indexOf(b));
    });
    return { ranked: ranked, pct: pct, raw: raw };
  }

  function spec(k) {
    var tags = {};
    Q.forEach(function (q, i) {
      if (ans[i] === null) return;
      q.options[ans[i]].tags.forEach(function (t) { tags[t] = true; });
      if (sec[i] !== null && sec[i] !== ans[i]) q.options[sec[i]].tags.forEach(function (t) { tags[t] = true; });
    });
    var list = D.specs[k];
    for (var j = 0; j < list.length; j++) {
      var need = list[j][0], ok = true;
      for (var n = 0; n < need.length; n++) if (!tags[need[n]]) ok = false;
      if (ok) return list[j];
    }
    return list[list.length - 1];
  }

  function code() {
    return ans.map(function (a, i) {
      return (a === null ? 'x' : String(a)) + (a === null || sec[i] === null ? 'x' : String(sec[i]));
    }).join('');
  }

  function setHash(v) {
    try { history.replaceState(null, '', v ? '#a=' + v : location.pathname + location.search); }
    catch (e) { /* the address just won't carry the answers */ }
  }

  function answered() { return ans.filter(function (a) { return a !== null; }).length; }

  function restart() {
    for (var i = 0; i < N; i++) { ans[i] = null; sec[i] = null; }
    form.reset();
    sets.forEach(function (f, i) { paint(i); });
    out.hidden = true;
    while (out.firstChild) out.removeChild(out.firstChild);
    form.hidden = false; top.hidden = false; nav.hidden = false;
    setHash('');
    show(0);
  }

  function finish() {
    fill.style.width = '100%';
    while (out.firstChild) out.removeChild(out.firstChild);
    out.hidden = false;
    var n = answered();
    if (n < MIN) {
      out.appendChild(el('p', 'pk-fine', 'You answered ' + n + ' of ' + N + '. Answer at least ' + MIN +
        ' for a result worth trusting; skipped questions do not count for or against any class.'));
      var b = el('button', 'wf-btn', 'Start again');
      b.type = 'button';
      b.addEventListener('click', restart);
      out.appendChild(b);
      return;
    }
    form.hidden = true; top.hidden = true; nav.hidden = true;
    var s = score(), k = s.ranked[0], c = CLS[k];

    var hero = el('div', 'pk-hero');
    hero.style.setProperty('--c', c.color);
    var head = el('div', 'pk-head');
    var ic = icons && icons.querySelector('[data-k="' + k + '"] > *');
    if (ic) { var tile = el('span', 'pk-ico'); tile.appendChild(ic.cloneNode(true)); head.appendChild(tile); }
    var hd = el('div');
    hd.appendChild(el('small', null, 'Your best fit · ' + Math.round(s.pct[k] * 100) + '% match'));
    var h3 = el('h3', null, c.name);
    h3.setAttribute('tabindex', '-1');
    hd.appendChild(h3);
    head.appendChild(hd);
    hero.appendChild(head);
    hero.appendChild(el('p', null, c.pitch));
    if (c.mine) hero.appendChild(el('p', 'quiz-mine', c.mine));

    var whys = [];
    Q.forEach(function (q, i) {
      if (ans[i] === null) return;
      var o = q.options[ans[i]];
      if (o.why && (o.pts[k] || 0) >= 2) whys.push({ v: o.pts[k], t: o.why });
      if (sec[i] !== null && sec[i] !== ans[i]) {
        var o2 = q.options[sec[i]];
        if (o2.why && (o2.pts[k] || 0) >= 3) whys.push({ v: o2.pts[k] * 0.5, t: o2.why + ' (your second pick)' });
      }
    });
    whys.sort(function (a, b) { return b.v - a.v; });
    if (whys.length) {
      hero.appendChild(el('p', null, 'Why it fits what you told me:'));
      var ul = el('ul');
      whys.slice(0, 4).forEach(function (w) { ul.appendChild(el('li', null, 'You ' + w.t + '.')); });
      hero.appendChild(ul);
    }

    var sp = spec(k);
    var spd = el('div', 'pk-spec');
    spd.appendChild(document.createTextNode('A spec to start with: '));
    spd.appendChild(el('b', null, sp[1]));
    spd.appendChild(document.createTextNode(', because ' + sp[2] + '. Talents start at level 10, and you can change your mind at a trainer.'));
    hero.appendChild(spd);

    var al = [], ho = [];
    Object.keys(D.races).forEach(function (r) {
      var R = D.races[r];
      if (R.classes.indexOf(k) < 0) return;
      (R.faction === 'Alliance' ? al : ho).push(R.name);
    });
    hero.appendChild(el('p', 'pk-fine', 'Alliance: ' + (al.join(', ') || 'none') + '. Horde: ' + (ho.join(', ') || 'none') + '.'));
    var more = el('p');
    var a = el('a', null, 'Read the full ' + c.name + ' card →');
    a.href = '/wow-forever/classes/#class-' + k;
    more.appendChild(a);
    hero.appendChild(more);
    out.appendChild(hero);

    out.appendChild(el('p', 'pk-fine', 'Close behind:'));
    var also = el('div', 'pk-also');
    s.ranked.slice(1, 4).forEach(function (r) {
      var row = el('div', 'pk-row');
      var ln = el('a', null, CLS[r].name);
      ln.href = '/wow-forever/classes/#class-' + r;
      row.appendChild(ln);
      var m = el('div', 'pk-meter');
      var f = el('span');
      f.style.width = Math.max(4, Math.round(s.pct[r] * 100)) + '%';
      f.style.setProperty('--c', CLS[r].color);
      m.appendChild(f);
      row.appendChild(m);
      row.appendChild(el('b', null, Math.round(s.pct[r] * 100) + '%'));
      also.appendChild(row);
    });
    out.appendChild(also);

    var close = s.pct[k] - s.pct[s.ranked[1]] < 0.06;
    if (close) out.appendChild(el('p', 'pk-share', CLS[s.ranked[1]].name + ' is almost level with ' + c.name +
      '. Read both cards: either would suit the way you answered.'));
    var dc = document.querySelector('#find-a-guild a[href^="https://discord.gg/"]');
    var about = document.querySelector('#find-a-guild a[href="/community/the-grey-company/"]');
    if (dc && al.length) {
      var gb = el('div', 'pk-guild');
      var gp = el('p');
      gp.appendChild(el('b', null, 'Got your ' + c.name + '? Now find people to play it with. '));
      gp.appendChild(document.createTextNode('If you play Alliance on the Normal ruleset in North America, The Grey Company is my guild: leveling and social, every time zone welcome.'));
      gb.appendChild(gp);
      var row = el('div', 'pk-guild-row');
      var j = el('a', 'btn btn-solid', 'Join the Grey Company Discord');
      j.href = dc.href;
      row.appendChild(j);
      if (about) { var ab = el('a', 'wf-btn', 'About the guild'); ab.href = about.getAttribute('href'); row.appendChild(ab); }
      gb.appendChild(row);
      out.appendChild(gb);
    }
    out.appendChild(el('p', 'pk-share', 'Your answers are in this page’s address, so you can copy it to share the result or come back to it. Nothing is sent anywhere.'));

    var tools = el('div', 'pk-nav');
    var again = el('button', 'wf-btn', 'Start again');
    again.type = 'button';
    again.addEventListener('click', restart);
    tools.appendChild(again);
    out.appendChild(tools);

    setHash(code());
    h3.focus();
  }

  // a shared or reloaded result: #a= then two characters per question (first
  // pick, second pick, x for none); the older one-character form still works
  var m = /^#a=([0-9x]+)$/.exec(location.hash || '');
  if (m && (m[1].length === N || m[1].length === 2 * N)) {
    var okHash = true, wide = m[1].length === 2 * N;
    for (var qi = 0; qi < N; qi++) {
      var c1 = m[1].charAt(wide ? 2 * qi : qi), c2 = wide ? m[1].charAt(2 * qi + 1) : 'x';
      if (c1 === 'x') { ans[qi] = null; sec[qi] = null; continue; }
      var v1 = parseInt(c1, 10);
      if (v1 >= Q[qi].options.length) { okHash = false; break; }
      ans[qi] = v1;
      if (c2 !== 'x') {
        var v2 = parseInt(c2, 10);
        if (v2 >= Q[qi].options.length) { okHash = false; break; }
        sec[qi] = v2 === v1 ? null : v2;
      }
    }
    if (okHash && answered() >= MIN) {
      ans.forEach(function (v, i) {
        if (v === null) return;
        var r = sets[i].querySelector('input[value="' + v + '"]');
        if (r) r.checked = true;
        paint(i);
      });
      finish();
      return;
    }
    for (var z = 0; z < N; z++) { ans[z] = null; sec[z] = null; }
  }
  show(0);
})();
