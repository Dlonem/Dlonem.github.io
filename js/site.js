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
  /* below this width the nav is the Menu drawer; must match the
     max-width:1040px queries in style.css */
  var BP = 1040;

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
      s.src = '/js/search.js?v=3';
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
      if (innerWidth > BP) open(false);
    });

    /* ---------------- menus ----------------
       Apps, Mods and Community each open a short menu, so someone who knows
       where they are going gets there in one move. The word itself still links
       to the hub page. The small arrow beside it opens the menu; on a desktop
       with a mouse, resting the pointer on the item opens it too. In the phone
       drawer the arrow expands the same list in place.

       Built here from this ONE list, like the search button, so the 30-odd
       navs can never drift apart. Edit a menu here and nowhere else. Icons are
       only fetched the first time a menu opens. */
    var I = '/assets/icons/news/';
    /* store chips: tagged the same way as the /thc/ smart links, so Play
       Console shows installs that came from this menu as source "menu" */
    var PLAY = function (id) {
      return 'https://play.google.com/store/apps/details?id=com.dlonem.' + id + '&referrer=' +
        encodeURIComponent('utm_source=menu&utm_medium=smartlink&utm_campaign=dlonem');
    };
    var APPSTORE_THC = 'https://apps.apple.com/app/thc-break-buddy/id6795227377';
    var MENUS = {
      apps: { items: [
        { t: 'THC Break Buddy', d: 'Tolerance break tracker', u: '/apps/thc-break-buddy/', i: I + 'thc.png',
          x: [['Android', PLAY('thcbreakbuddy'), 'Get it on Google Play'], ['iOS', APPSTORE_THC, 'Get it on the App Store']] },
        { t: 'Caffeine Break Buddy', d: 'Caffeine tracker and timeline', u: '/apps/caffeine-break-buddy/', i: I + 'caffeine.png',
          x: [['Android', PLAY('caffeinebreakbuddy'), 'Get it on Google Play']] },
        { t: 'Nicotine Break Buddy', d: 'Quit cigarettes, vapes and pouches', u: '/apps/nicotine-break-buddy/', i: I + 'nicotine.png',
          x: [['Android', PLAY('nicotinebreakbuddy'), 'Get it on Google Play']] },
        { t: 'Tiny Dragon Hoard', d: 'A cozy fantasy flight game', u: '/apps/tiny-dragon-hoard/', i: I + 'dragon.png',
          x: [['Android', PLAY('tinydragonhoard'), 'Get it on Google Play']] }
      ] },
      mods: { items: [
        { t: 'The Long Night & Azor Ahai', d: 'Submod for A Game of Thrones', u: '/mods/the-long-night/', i: I + 'long-night.png',
          x: [['Wiki', '/mods/the-long-night/wiki/'], ['Download', '/mods/the-long-night/download/']] },
        { t: 'Supernatural', d: 'Vampires, werewolves, witches', u: '/mods/supernatural/', i: I + 'spn.png',
          x: [['Wiki', '/mods/supernatural/wiki/'], ['Download', '/mods/supernatural/download/']] },
        { t: 'Compatibility Patch', d: 'Run both together with AGOT', u: '/mods/#the-compatibility-patch', i: I + 'patch.png' }
      ], foot: ['Mods not working? Start here', '/ck3-mod-help/'] },
      comm: { items: [
        { t: 'The Grey Company', d: 'Our WoW Forever guild', u: '/community/the-grey-company/', i: I + 'grey.png', dc: 'UcJmm4XQVZ',
          x: [['Guide', '/wow-forever/']] },
        { t: 'The Game Center', d: 'A gaming Discord since 2016', u: '/tgc/', i: I + 'tgc.png', dc: 'hvZGMeJhB7' },
        { t: "Dlonem's Den", d: 'The YouTube channel’s server', u: '/community/#dlonems-den', i: I + 'den.png', dc: 'StACe9hVtT' },
        { t: 'The Long Night', d: 'Discord for the mod', u: '/community/#the-long-night-server', i: I + 'long-night.png', dc: 'PTJzPQbqG7' },
        { t: 'Supernatural', d: 'Discord for the mod', u: '/community/#supernatural-server', i: I + 'spn.png', dc: 'Efvd2B97xx' }
      ] }
    };
    var hoverOK = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
    var wide = function () { return innerWidth > BP; };
    var menus = [];
    var esc = function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    };
    var closeAll = function (except) {
      menus.forEach(function (m) { if (m !== except) m.set(false); });
    };

    [].slice.call(list.querySelectorAll('a[data-p]')).forEach(function (a) {
      var key = a.getAttribute('data-p'), cfg = MENUS[key];
      if (!cfg) return;
      var item = document.createElement('div');
      item.className = 'nav-item';
      a.parentNode.insertBefore(item, a);
      item.appendChild(a);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-caret';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'nm-' + key);
      btn.setAttribute('aria-label', a.textContent.replace(/\s+/g, ' ').trim() + ' menu');
      btn.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
      item.appendChild(btn);
      /* the page's own section: one pill around the word AND its arrow, in the
         page's theme colour (each themed page styles a.active itself) */
      if (a.classList.contains('active')) {
        item.classList.add('is-active');
        try { item.style.setProperty('--nav-active-ink', getComputedStyle(a).color); } catch (e) {}
      }

      var here = location.pathname;
      var html = '<ul>' + cfg.items.map(function (it) {
        var cur = it.u.indexOf('#') < 0 && it.u === here ? ' aria-current="page"' : '';
        var x = it.x ? '<span class="nm-x">' + it.x.map(function (s) {
          var ext = /^https?:/.test(s[1]);
          return '<a href="' + esc(s[1]) + '"' + (s[1] === here ? ' aria-current="page"' : '') +
            (ext ? ' rel="noopener" class="nm-store" aria-label="' + esc(it.t + ': ' + s[2]) + '"' : '') +
            '>' + esc(s[0]) + '</a>';
        }).join('') + '</span>' : '';
        return '<li><a class="nm-link" href="' + esc(it.u) + '"' + cur + '>' +
          '<img alt="" width="34" height="34" decoding="async" data-src="' + esc(it.i) + '"' +
          (it.dc ? ' data-discord-icon="' + esc(it.dc) + '" data-size="64"' : '') + '>' +
          '<span class="nm-t">' + esc(it.t) + '</span><span class="nm-d">' + esc(it.d) + '</span></a>' + x + '</li>';
      }).join('') + '</ul>' +
        (cfg.foot ? '<a class="nm-foot" href="' + esc(cfg.foot[1]) + '">' + esc(cfg.foot[0]) + ' &rarr;</a>' : '');
      var panel = document.createElement('div');
      panel.className = 'nav-menu';
      panel.id = 'nm-' + key;
      panel.hidden = true;
      panel.innerHTML = html;
      item.appendChild(panel);

      var m = { byHover: false };
      var place = function () {
        panel.style.removeProperty('--nm-shift');
        if (!wide()) return;
        var r = panel.getBoundingClientRect(), vw = document.documentElement.clientWidth;
        if (r.right > vw - 12) panel.style.setProperty('--nm-shift', (vw - 12 - r.right) + 'px');
        else if (r.left < 12) panel.style.setProperty('--nm-shift', (12 - r.left) + 'px');
      };
      m.set = function (on) {
        if (on === !panel.hidden) return;
        if (on) {
          [].slice.call(panel.querySelectorAll('img[data-src]')).forEach(function (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
          });
          closeAll(m);
          panel.hidden = false;
          item.classList.add('is-open');
          place();
        } else {
          panel.hidden = true;
          item.classList.remove('is-open');
          m.byHover = false;
        }
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      };
      menus.push(m);

      btn.addEventListener('click', function () {
        // a click on an arrow the pointer already opened keeps it open
        if (!panel.hidden && m.byHover) { m.byHover = false; return; }
        m.set(panel.hidden);
      });
      var tOpen = 0, tShut = 0;
      item.addEventListener('mouseenter', function () {
        if (!hoverOK.matches || !wide()) return;
        clearTimeout(tShut);
        if (panel.hidden) tOpen = setTimeout(function () { m.set(true); m.byHover = true; }, 110);
      });
      item.addEventListener('mouseleave', function () {
        if (!hoverOK.matches || !wide()) return;
        clearTimeout(tOpen);
        tShut = setTimeout(function () { m.set(false); }, 260);
      });
      item.addEventListener('focusout', function (e) {
        if (wide() && e.relatedTarget && !item.contains(e.relatedTarget)) m.set(false);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); m.set(false); btn.focus(); }
        else if (e.key === 'ArrowDown' && e.target === btn) {
          e.preventDefault(); m.set(true);
          var first = panel.querySelector('a'); if (first) first.focus();
        }
      });
    });
    if (menus.length) {
      document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('.nav-item')) closeAll();
      });
      var wasWide = wide();
      addEventListener('resize', function () {
        if (wide() !== wasWide) { wasWide = wide(); closeAll(); }
      });
    }
  }

  /* ---------------- ad placements ----------------
     Only pages that declare a .adslot pay for this request. */
  if (document.querySelector('.adslot')) {
    var a = document.createElement('script');
    a.src = '/js/ads.js?v=2';
    a.defer = true;
    document.head.appendChild(a);
  }

  /* the live parts of the site (numbers, Discord counts and icons, the YouTube
     live notice) live in one file, loaded here so every page gets it. It must stay ABOVE the scroll
     reveal: that section returns early (reduced motion, no observer, a page
     with nothing to reveal), and anything after it would never run. */
  (function () {
    if (document.querySelector('script[src^="/js/live.js"]')) return;
    var s = document.createElement('script');
    s.src = '/js/live.js?v=4';
    s.async = true;
    document.body.appendChild(s);
  })();

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
