/* policy.js — reading progress, TOC scroll-spy, back-to-top, copy-email.
   Progressive enhancement only: with JS off the document still reads fine. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- reading progress ---- */
  var bar = document.getElementById('progress');
  var top = document.getElementById('totop');

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = h.scrollTop || document.body.scrollTop;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (top) top.classList.toggle('on', y > 600);
  }

  /* ---- scroll-spy over the section rail ---- */
  var links = [].slice.call(document.querySelectorAll('[data-spy] a[href^="#"]'));
  var targets = links
    .map(function (a) {
      var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      return el ? { a: a, el: el } : null;
    })
    .filter(Boolean);

  function spy() {
    if (!targets.length) return;
    var line = (window.scrollY || 0) + 110;
    var cur = targets[0];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].el.offsetTop <= line) cur = targets[i];
    }
    // near the bottom the last section wins even if it's short
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      cur = targets[targets.length - 1];
    }
    for (var j = 0; j < targets.length; j++) {
      var on = targets[j] === cur;
      if (on) targets[j].a.setAttribute('aria-current', 'true');
      else targets[j].a.removeAttribute('aria-current');
    }
  }

  var queued = false;
  function tick() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      onScroll();
      spy();
    });
  }
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  tick();

  /* ---- smooth scroll + close the mobile jump-to after a pick ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hash.length < 2) return;
    var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', a.hash);
    var d = a.closest('details');
    if (d) d.open = false;
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });

  /* ---- copy the contact address ---- */
  var btn = document.querySelector('.copy');
  if (btn && navigator.clipboard) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.dataset.copy || '').then(function () {
        btn.textContent = 'copied';
        btn.dataset.done = '1';
        setTimeout(function () {
          btn.textContent = label;
          btn.removeAttribute('data-done');
        }, 1600);
      });
    });
  } else if (btn) {
    btn.remove();
  }
})();
