/* Dlonem — the WoW Forever guides' interactive parts. Loaded only by the
   guide pages. Every page reads completely without it: the boss tips, the
   checklist, the class cards and the race table are all written into the
   HTML; this only filters, remembers and enlarges.

   [data-role-filter] buttons     show one role's tips (.tip[data-role]) or all
   .wf-check input[data-key]      the "before you go" checklist, remembered in
                                  this browser only (try/catch: private windows)
   a.wf-zoom                      click a picture to enlarge it
   #cls-quiz                      the first-class quiz (data in #cls-data)
   [data-race]                    pick a race: its classes light up
   [data-cls-role]                show only classes that can fill a role */
(function () {
  'use strict';
  if (!document.querySelector) return;
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------ role filter */
  all('[data-role-filter]').forEach(function (bar) {
    var scope = document.getElementById(bar.getAttribute('data-role-filter'));
    if (!scope) return;
    var btns = all('button[data-role]', bar);
    bar.hidden = false;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var role = b.getAttribute('data-role');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        all('.tip[data-role]', scope).forEach(function (t) {
          var r = ' ' + t.getAttribute('data-role') + ' ';
          t.hidden = role !== 'all' && r.indexOf(' ' + role + ' ') < 0 && r.indexOf(' all ') < 0;
        });
        scope.setAttribute('data-showing', role);
      });
    });
  });

  /* ------------------------------------------------------------ checklist */
  var store = null;
  try { store = window.localStorage; store.setItem('wf-t', '1'); store.removeItem('wf-t'); } catch (e) { store = null; }
  all('.wf-check').forEach(function (list) {
    var key = 'wf-check:' + (list.getAttribute('data-list') || 'list');
    var saved = {};
    try { saved = JSON.parse((store && store.getItem(key)) || '{}') || {}; } catch (e) { saved = {}; }
    var boxes = all('input[type=checkbox][data-key]', list);
    var count = list.querySelector('.wf-check-count');
    function sync() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      if (count) count.textContent = n + ' of ' + boxes.length + ' ready';
    }
    boxes.forEach(function (b) {
      if (saved[b.getAttribute('data-key')]) b.checked = true;
      b.addEventListener('change', function () {
        saved[b.getAttribute('data-key')] = b.checked;
        try { if (store) store.setItem(key, JSON.stringify(saved)); } catch (e) { /* not kept */ }
        sync();
      });
    });
    var reset = list.querySelector('.wf-check-reset');
    if (reset) {
      reset.hidden = false;
      reset.addEventListener('click', function () {
        boxes.forEach(function (b) { b.checked = false; });
        saved = {};
        try { if (store) store.removeItem(key); } catch (e) { /* nothing kept */ }
        sync();
      });
    }
    sync();
  });

  /* ------------------------------------------------------------ enlarge */
  var lb = null, lbImg = null, lastFocus = null;
  function closeBox() {
    lb.removeAttribute('open');
    lbImg.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openBox(src, alt) {
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Enlarged image');
      var x = document.createElement('button');
      x.className = 'lightbox-x';
      x.type = 'button';
      x.setAttribute('aria-label', 'Close');
      x.textContent = '×';
      lbImg = document.createElement('img');
      lb.appendChild(x);
      lb.appendChild(lbImg);
      document.body.appendChild(lb);
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target === x) closeBox(); });
      document.addEventListener('keydown', function (e) {
        if (!lb.hasAttribute('open')) return;
        if (e.key === 'Escape') closeBox();
        else if (e.key === 'Tab') { e.preventDefault(); x.focus(); }   /* the close button is the only control */
      });
    }
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lightbox-x').focus();
  }
  all('a.wf-zoom').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;   /* new tab still works */
      e.preventDefault();
      var img = a.querySelector('img');
      openBox(a.getAttribute('href'), img ? img.alt : '');
    });
  });

  /* ------------------------------------------------------------ classes */
  var dataEl = document.getElementById('cls-data');
  var DATA = null;
  try { DATA = dataEl ? JSON.parse(dataEl.textContent) : null; } catch (e) { DATA = null; }
  if (!DATA) return;
  var CLS = DATA.classes, ORDER = DATA.order;

  /* role filter on the class cards */
  var roleBar = document.querySelector('[data-cls-roles]');
  if (roleBar) {
    roleBar.hidden = false;
    var rbtns = all('button[data-cls-role]', roleBar);
    var note = document.getElementById('cls-role-note');
    rbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var role = b.getAttribute('data-cls-role'), n = 0;
        rbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        ORDER.forEach(function (k) {
          var card = document.getElementById('class-' + k);
          var ok = role === 'all' || CLS[k].roles.indexOf(role) > -1;
          if (card) card.hidden = !ok;
          if (ok) n++;
        });
        if (note) note.textContent = role === 'all' ? 'Showing all nine classes.'
          : 'Showing the ' + n + ' classes that can ' + DATA.roleVerb[role] + '.';
      });
    });
  }

  /* race picker */
  var raceBtns = all('button[data-race]');
  var raceOut = document.getElementById('race-out');
  raceBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var race = b.getAttribute('data-race');
      var on = b.getAttribute('aria-pressed') !== 'true';
      raceBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b && on ? 'true' : 'false'); });
      all('#race-table tr[data-race]').forEach(function (row) {
        var mine = on && row.getAttribute('data-race') === race;
        row.classList.toggle('is-picked', mine);
        all('td[data-cls]', row).forEach(function (cell) {
          cell.classList.toggle('is-lit', mine && DATA.races[race].classes.indexOf(cell.getAttribute('data-cls')) > -1);
        });
      });
      if (raceOut) {
        if (!on) { raceOut.textContent = ''; return; }
        var r = DATA.races[race];
        var names = r.classes.map(function (k) { return CLS[k].name; });
        raceOut.textContent = r.name + ' (' + r.faction + ') can be: ' + names.join(', ') + '.' + (r.note ? ' ' + r.note : '');
      }
    });
  });
  var rp = document.querySelector('.race-pick');
  if (rp) rp.hidden = false;

  /* the quiz */
  var quiz = document.getElementById('cls-quiz');
  if (!quiz) return;
  quiz.hidden = false;
  var result = document.getElementById('quiz-result');
  var form = quiz.querySelector('form');
  function score() {
    var pts = {}, why = {};
    ORDER.forEach(function (k) { pts[k] = 0; why[k] = []; });
    var answered = 0;
    DATA.quiz.forEach(function (q) {
      var picked = form.querySelector('input[name="' + q.id + '"]:checked');
      if (!picked) return;
      answered++;
      var opt = q.options[+picked.value];
      Object.keys(opt.pts || {}).forEach(function (k) {
        pts[k] += opt.pts[k];
        if (opt.pts[k] >= 2 && opt.why) why[k].push(opt.why);
      });
    });
    return { pts: pts, why: why, answered: answered };
  }
  function render() {
    var s = score();
    if (s.answered < DATA.quiz.length) {
      result.hidden = false;
      result.className = 'quiz-result is-waiting';
      result.textContent = 'Answer all ' + DATA.quiz.length + ' questions to see your pick (' + s.answered + ' done).';
      return;
    }
    var ranked = ORDER.slice().sort(function (a, b) { return s.pts[b] - s.pts[a] || ORDER.indexOf(a) - ORDER.indexOf(b); });
    var top = ranked[0], next = ranked[1];
    result.textContent = '';
    result.className = 'quiz-result';
    result.style.setProperty('--c', CLS[top].color);
    var eb = document.createElement('span'); eb.className = 'eyebrow'; eb.textContent = 'Your best fit';
    var h = document.createElement('h3'); h.textContent = CLS[top].name;
    var p = document.createElement('p');
    var reasons = s.why[top].slice(0, 3);
    var said = reasons.length > 1 ? reasons.slice(0, -1).join(', ') + ' and ' + reasons[reasons.length - 1] : reasons.join('');
    p.textContent = (said ? 'Because you ' + said + '. ' : '') + CLS[top].pitch;
    result.appendChild(eb); result.appendChild(h); result.appendChild(p);
    if (CLS[top].mine) {
      var m = document.createElement('p'); m.className = 'quiz-mine'; m.textContent = CLS[top].mine;
      result.appendChild(m);
    }
    var also = document.createElement('p');
    also.className = 'quiz-also';
    also.appendChild(document.createTextNode('Also worth a look: '));
    var a2 = document.createElement('a'); a2.href = '#class-' + next; a2.textContent = CLS[next].name;
    also.appendChild(a2);
    also.appendChild(document.createTextNode('. '));
    var a1 = document.createElement('a'); a1.href = '#class-' + top; a1.textContent = 'Read the ' + CLS[top].name + ' card';
    also.appendChild(a1);
    also.appendChild(document.createTextNode(' for its races and roles.'));
    result.appendChild(also);
    var fine = document.createElement('p'); fine.className = 'quiz-fine';
    fine.textContent = 'A rule of thumb. Read the class cards before you decide.';
    result.appendChild(fine);
    result.hidden = false;
  }
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  var again = quiz.querySelector('.quiz-reset');
  if (again) again.addEventListener('click', function () { form.reset(); result.hidden = true; });
})();
