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

    /* ---------------- site search ----------------
       Built here rather than in every page's markup, for the same reason the
       menu button is: one file to change instead of twenty, and no chance of
       the nav drifting apart between pages. search.js and the index are only
       fetched when someone actually searches. */
    var sBtn = document.createElement('button');
    sBtn.className = 'nav-search';
    sBtn.type = 'button';
    sBtn.setAttribute('aria-label', 'Search this site');
    sBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>' +
      '<span class="nav-search-t">Search</span>';
    list.parentNode.insertBefore(sBtn, list);

    var sLoaded = false;
    var openSearch = function () {
      if (window.DlonemSearch) { window.DlonemSearch.open(); return; }
      if (sLoaded) return;                 // already in flight
      sLoaded = true;
      var s = document.createElement('script');
      s.src = '/js/search.js?v=1';
      s.onerror = function () { sLoaded = false; };
      document.head.appendChild(s);        // search.js opens itself once parsed
    };
    sBtn.addEventListener('click', openSearch);

    /* "/" and ctrl/cmd-K are what people already press on a docs site. */
    document.addEventListener('keydown', function (e) {
      var t = e.target, tag = t && t.tagName;
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                   (t && t.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); openSearch(); return;
      }
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); openSearch();
      }
    });

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

  /* ---------------- ad placements ----------------
     Only pages that declare a .adslot pay for this request. */
  if (document.querySelector('.adslot')) {
    var a = document.createElement('script');
    a.src = '/js/ads.js?v=1';
    a.defer = true;
    document.head.appendChild(a);
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
