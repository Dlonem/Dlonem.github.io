/* site.js — mobile menu + scroll reveal.
   Both are progressive enhancements. The <html class="js"> hook is set from
   here, so if this file fails to load nothing is ever left hidden. */
(function () {
  'use strict';
  var root = document.documentElement;
  /* '.js' is already set inline in <head> so the header never paints in its
     no-JS shape (that repaint was a 0.127 layout shift). '.js-ready' is set
     HERE, and only here, so the reveal animations can never hide content
     unless this file actually ran. */
  root.classList.add('js');
  root.classList.add('js-ready');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- mobile menu ---------------- */
  var header = document.querySelector('.nav');
  var list = header && header.querySelector('.nav-inner nav');
  if (header && list) {
    if (!list.id) list.id = 'site-menu';
    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', list.id);
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span>';
    list.parentNode.insertBefore(btn, list);

    var open = function (state) {
      header.classList.toggle('is-open', state);
      btn.setAttribute('aria-expanded', state ? 'true' : 'false');
    };
    btn.addEventListener('click', function () {
      open(btn.getAttribute('aria-expanded') !== 'true');
    });
    // a tap on any link closes it
    list.addEventListener('click', function (e) {
      if (e.target.closest('a')) open(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { open(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-open') && !header.contains(e.target)) open(false);
    });
    // reopening at desktop width must not leave the menu stuck
    addEventListener('resize', function () {
      if (innerWidth > 780) open(false);
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var targets = [].slice.call(document.querySelectorAll(
    'main section .section-head, main .cards > *, main .stats > *, main .tiles > *,' +
    'main .twocol > *, main .feats > *, main .roost > *, main .days > *, main .loop > *,' +
    'main .modcard, main .patch, main .prose, main .faq, main .warn, main .kinds > *'
  ));
  if (!targets.length) return;

  if (reduce || !('IntersectionObserver' in window)) return; // leave everything visible

  targets.forEach(function (el) { el.classList.add('reveal'); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      // stagger siblings so a row of cards cascades instead of popping at once
      var sibs = el.parentNode ? [].slice.call(el.parentNode.children).filter(function (c) {
        return c.classList && c.classList.contains('reveal');
      }) : [];
      var i = sibs.indexOf(el);
      el.style.setProperty('--d', (i > 0 ? Math.min(i, 5) * 70 : 0) + 'ms');
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  targets.forEach(function (el) { io.observe(el); });

  /* IntersectionObserver only fires on elements that actually intersect. Jump
     straight down the page — an in-page anchor, End, a restored scroll position
     — and everything skipped over would stay invisible. This sweep catches any
     target that is now at or above the fold, and unhooks itself once they are
     all shown. */
  var sweeping = false;
  function sweep() {
    sweeping = false;
    var left = 0;
    targets.forEach(function (el) {
      if (el.classList.contains('in')) return;
      if (el.getBoundingClientRect().top < innerHeight) {
        el.style.setProperty('--d', '0ms');
        el.classList.add('in');
        io.unobserve(el);
      } else { left++; }
    });
    if (!left) removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    if (sweeping) return;
    sweeping = true;
    requestAnimationFrame(sweep);
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* last-ditch: never leave content invisible, whatever went wrong */
  setTimeout(function () {
    targets.forEach(function (el) {
      if (!el.classList.contains('in')) { el.style.setProperty('--d', '0ms'); el.classList.add('in'); }
    });
  }, 8000);

  /* anything already on screen at load reveals immediately, no delay */
  requestAnimationFrame(function () {
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92) { el.style.setProperty('--d', '0ms'); el.classList.add('in'); io.unobserve(el); }
    });
  });
})();
