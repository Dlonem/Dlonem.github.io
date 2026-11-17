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
      s.src = '/js/search.js?v=8';
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
       Apps, Mods, Games and Community each open a short menu, so someone who knows
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
      ], foot: ['Guides to taking a break', '/apps/#guides'] },
      mods: { items: [
        { t: 'The Long Night & Azor Ahai', d: 'Submod for A Game of Thrones', u: '/mods/the-long-night/', i: I + 'long-night.png',
          x: [['Wiki', '/mods/the-long-night/wiki/'], ['Download', '/mods/the-long-night/download/']] },
        { t: 'Supernatural', d: 'Vampires, werewolves, witches', u: '/mods/supernatural/', i: I + 'spn.png',
          x: [['Wiki', '/mods/supernatural/wiki/'], ['Download', '/mods/supernatural/download/']] },
        { t: 'Compatibility Patch', d: 'Run both together with AGOT', u: '/mods/#the-compatibility-patch', i: I + 'patch.png' }
      ], foot: ['Mods not working? Start here', '/ck3-mod-help/'] },
      games: { items: [
        { t: 'Recommended games', d: 'What I play, and buying keys safely', u: '/games/', i: I + 'games.png',
          x: [['Heavy rotation', '/games/#in-heavy-rotation'], ['Buying keys', '/games/#buying-keys-without-getting-burned']] },
        { t: 'World of Warcraft: Forever', d: 'Guides from my own runs', u: '/wow-forever/', i: I + 'wow-forever.png',
          x: [['Dungeons', '/wow-forever/dungeons/'], ['Add-ons', '/wow-forever/addons/']] },
        { t: 'The Gray Company', d: 'Our WoW Forever guild', u: '/community/the-gray-company/', i: I + 'grey.png', dc: 'UcJmm4XQVZ' },
        { t: 'Crusader Kings III', d: 'Two mods and a repair guide', u: '/mods/', i: I + 'spn.png',
          x: [['Supernatural', '/mods/supernatural/'], ['The Long Night', '/mods/the-long-night/']] }
      ], foot: ['All the WoW Forever guides', '/games/#wow-forever-guides'] },
      comm: { items: [
        { t: 'The Gray Company', d: 'Our WoW Forever guild', u: '/community/the-gray-company/', i: I + 'grey.png', dc: 'UcJmm4XQVZ',
          x: [['Guide', '/wow-forever/'], ['Classes', '/wow-forever/classes/'], ['Add-ons', '/wow-forever/addons/']] },
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

    /* ---------------- the section bar ----------------
       A second row under the menu bar listing the pages of the section you
       are in, with the current one marked, so the next page is one click.
       BARS is the one list: a page belongs to the bar whose link is the
       longest match for its address (/mods/supernatural/wiki/ picks the
       Supernatural bar, /mods/ the Crusader Kings bar), and the first bar
       wins a tie, so the specific bars sit above the general ones. The home
       page has none. The dropdown menus above keep only a couple of
       shortcuts each; the full list of a section's pages lives here.
       It scrolls away with the page; the menu bar itself is what follows you. */
    var BARS = [
      { t: 'World of Warcraft: Forever', l: [['Overview', '/wow-forever/'], ['Dungeons', '/wow-forever/dungeons/'],
        ['Classes', '/wow-forever/classes/'], ['Class quiz', '/wow-forever/class-quiz/'], ['Add-ons', '/wow-forever/addons/'],
        ['World PvP', '/wow-forever/world-pvp/'], ['Rulesets', '/wow-forever/rulesets/'], ['Names', '/wow-forever/name-reservation/'],
        ['Our guild', '/community/the-gray-company/']] },
      { t: 'Supernatural', l: [['Overview', '/mods/supernatural/'], ['Wiki', '/mods/supernatural/wiki/'], ['Download', '/mods/supernatural/download/']] },
      { t: 'The Long Night', l: [['Overview', '/mods/the-long-night/'], ['Wiki', '/mods/the-long-night/wiki/'], ['Download', '/mods/the-long-night/download/']] },
      { t: 'Crusader Kings III', l: [['All mods', '/mods/'], ['Supernatural', '/mods/supernatural/'], ['The Long Night', '/mods/the-long-night/'],
        ['Mods not working?', '/ck3-mod-help/']] },
      { t: 'Apps', l: [['All apps', '/apps/'], ['THC Break Buddy', '/apps/thc-break-buddy/'], ['Caffeine Break Buddy', '/apps/caffeine-break-buddy/'],
        ['Nicotine Break Buddy', '/apps/nicotine-break-buddy/'], ['Tiny Dragon Hoard', '/apps/tiny-dragon-hoard/']] },
      { t: 'Taking a break', l: [['Tolerance break', '/tolerance-break/'], ['Caffeine break', '/caffeine-break/'],
        ['Quitting nicotine', '/quit-nicotine/'], ['The apps', '/apps/']] },
      { t: 'Community', l: [['All communities', '/community/'], ['The Gray Company', '/community/the-gray-company/'], ['The Game Center', '/tgc/']] },
      { t: 'Games', l: [['Recommended games', '/games/'], ['WoW Forever', '/wow-forever/'], ['Crusader Kings III', '/mods/']] },
      { t: 'News', l: [['Latest', '/news/'], ['2025', '/news/2025/'], ['2024', '/news/2024/'], ['2023', '/news/2023/'], ['2022', '/news/2022/']] },
      { t: 'Dlonem', l: [['About', '/about/'], ['Legacy', '/legacy/'], ['Store', '/store/'], ['Support', '/support/'], ['Privacy', '/privacy/']] }
    ];
    (function () {
      var here = location.pathname, found = null, best = -1, cur = -1;
      if (here === '/' || here === '/index.html') return;
      BARS.forEach(function (b) {
        b.l.forEach(function (s, n) {
          if (here.indexOf(s[1]) === 0 && s[1].length > best) { best = s[1].length; found = b; cur = n; }
        });
      });
      if (!found) return;
      var bar = document.createElement('nav');
      bar.className = 'subnav';
      bar.setAttribute('aria-label', found.t);
      bar.innerHTML = '<div class="subnav-inner"><span class="subnav-t">' + esc(found.t) + '</span>' +
        found.l.map(function (s, n) {
          return '<a href="' + esc(s[1]) + '"' + (n === cur ? ' aria-current="page"' : '') + '>' + esc(s[0]) + '</a>';
        }).join('') + '</div>';
      header.parentNode.insertBefore(bar, header.nextSibling);
      var on = bar.querySelector('[aria-current]');
      if (on && on.offsetLeft + on.offsetWidth > bar.clientWidth) bar.querySelector('.subnav-inner').scrollLeft = on.offsetLeft - 20;
    })();

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
          /* an App Store chip in this menu: live.js greys it out if Apple has the app unlisted */
          if (window.DlonemAppStore && panel.querySelector('a[href*="apps.apple.com/"]')) window.DlonemAppStore(panel);
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

  /* ---------------- keep the menu bar on one row ----------------
     On a desktop the logo, search, gear and every link share one row. A
     longer Join button (the guild page, the mod pages) or a new link can
     push the last items onto a second row, which is the bug this guards
     against: if the links have wrapped below the logo, the bar switches to
     a tighter size (.nav-fit in style.css) and checks again. Measured after
     the webfont loads and on every resize; the drawer below BP is left alone. */
  (function () {
    var nav = document.querySelector('.nav'), links = nav && nav.querySelector('.nav-inner nav'),
        brand = nav && nav.querySelector('.brand');
    if (!links || !brand) return;
    var wrapped = function () {
      return links.getBoundingClientRect().top > brand.getBoundingClientRect().bottom - 4;
    };
    /* first the long Join buttons swap to their short label (data-short on
       the guild and mod pages), so every page keeps the same type size; only
       if that is not enough does the whole bar tighten */
    var join = links.querySelector('a.join[data-short]'), long = join && join.textContent;
    var fit = function () {
      nav.classList.remove('nav-fit');
      if (join) join.textContent = long;
      if (innerWidth <= BP) return;
      if (join && wrapped()) join.textContent = join.getAttribute('data-short');
      if (wrapped()) nav.classList.add('nav-fit');
    };
    /* the gear is added further down this file, so measure just before the
       first paint, once everything in the bar exists */
    if (window.requestAnimationFrame) requestAnimationFrame(fit); else fit();
    var t = 0;
    addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    addEventListener('load', fit);
  })();

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
    s.src = '/js/live.js?v=9';
    s.async = true;
    document.body.appendChild(s);
  })();

  /* ---------------- the sky and the season ----------------
     The hero (the banner at the top of every page) follows the visitor's own
     clock and calendar, with nothing fetched. By the hour: a sun glow that
     crosses the banner from left (6 am) to right (6 pm), clouds by day and
     stars only after dusk. By the date: a season, see SEASONS.
     All CSS (.sky-* and .season-* in style.css); the moving parts sit out under
     prefers-reduced-motion. Dates and hours live here and nowhere else. */
  (function () {
    var hero = document.querySelector('main .hero');
    var root = document.documentElement;
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), h = d.getHours() + d.getMinutes() / 60;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* the hour */
    var light = h < 5 || h >= 20 ? 0 : h < 7 ? (h - 5) / 2 : h < 18 ? 1 : 1 - (h - 18) / 2;
    root.classList.add(light >= 0.85 ? 'sky-day' : light > 0.15 ? 'sky-dusk' : 'sky-night');
    if (hero && light > 0) {
      var sun = document.createElement('span');
      sun.className = 'sun';
      sun.setAttribute('aria-hidden', 'true');
      sun.style.left = Math.round(Math.min(Math.max((h - 6) / 12, 0), 1) * 100) + '%';
      sun.style.opacity = light.toFixed(2);
      hero.appendChild(sun);
      /* by day the stars give way to a few slow clouds; they thin out at dusk */
      if (!still) for (var c = 0; c < 5; c++) {
        var cl = document.createElement('span');
        cl.className = 'cloud';
        cl.style.top = (6 + c * 16 + Math.random() * 8).toFixed(0) + '%';
        cl.style.width = (160 + Math.random() * 220).toFixed(0) + 'px';
        cl.style.animationDuration = (160 + Math.random() * 120).toFixed(0) + 's';
        cl.style.animationDelay = (-Math.random() * 280).toFixed(0) + 's';
        cl.style.opacity = (light * (0.2 + Math.random() * 0.14)).toFixed(2);
        cl.setAttribute('aria-hidden', 'true');
        hero.appendChild(cl);
      }
    }

    /* the date: [fromMonth, fromDay, toMonth, toDay, name] — first match wins */
    var SEASONS = [
      [12, 28,  1,  2, 'newyear'],     /* confetti */
      [ 2,  1,  2, 14, 'valentine'],   /* hearts */
      [ 7,  1,  7,  4, 'fourth'],      /* fireworks */
      [10, 15, 10, 31, 'halloween'],   /* orange, a few leaves */
      [11, 20, 11, 30, 'thanksgiving'],/* leaves, and warm lights under the menu bar */
      [ 9, 22, 11, 30, 'autumn'],      /* leaves */
      [12,  1, 12, 27, 'christmas'],   /* snow, the snowbank, and coloured lights */
      [12,  1,  1,  6, 'winter']       /* snow, and a snowbank that grows to Christmas */
    ];
    var today = m * 100 + day, calendar = '';
    for (var i = 0; i < SEASONS.length && !calendar; i++) {
      var s = SEASONS[i], from = s[0] * 100 + s[1], to = s[2] * 100 + s[3];
      if (from <= to ? (today >= from && today <= to) : (today >= from || today <= to)) calendar = s[4];
    }

    /* ---- the visitor's own choice (the gear in the menu bar) ----
       'auto' follows the calendar above. Kept in this browser's localStorage,
       sent nowhere. dl-fx = '0' stops the falling leaves and snow only. */
    var PICK = [['auto', 'Auto'], ['autumn', 'Autumn'], ['thanksgiving', 'Thanksgiving'],
                ['christmas', 'Christmas'], ['winter', 'Winter'], ['none', 'Plain']];
    var NAMES = { newyear: 'New Year', valentine: 'Valentine’s', fourth: 'Fourth of July', halloween: 'Halloween',
                  thanksgiving: 'Thanksgiving', autumn: 'autumn', christmas: 'Christmas', winter: 'winter' };
    var get = function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
    var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
    var choice = get('dl-theme') || 'auto', fx = get('dl-fx') !== '0';
    var ok = false;
    for (var p = 0; p < PICK.length; p++) if (PICK[p][0] === choice) ok = true;
    if (!ok) choice = 'auto';

    var made = [], raf = 0, timer = 0;        /* everything a season adds, so a new pick can take it away */
    var add = function (parent, el) { el.setAttribute('aria-hidden', 'true'); parent.appendChild(el); made.push(el); return el; };

    function clear() {
      made.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      made = [];
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
      raf = timer = 0;
      root.className = root.className.replace(/\s*\bseason-[a-z]+\b/g, '').replace(/\s*\bhas-lights\b/g, '');
      document.body.style.paddingBottom = '';
    }

    function drop(cls, n, text, size) {
      if (!hero) return;
      for (var k = 0; k < n; k++) {
        var f = document.createElement('span');
        f.className = cls;
        f.style.left = Math.round(Math.random() * 100) + '%';
        f.style.animationDuration = (8 + Math.random() * 10).toFixed(1) + 's';
        f.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
        f.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
        var px = size[0] + Math.random() * (size[1] - size[0]);
        if (text) { f.textContent = text; f.style.fontSize = px.toFixed(0) + 'px'; }
        else { f.style.width = px.toFixed(0) + 'px'; f.style.height = (px * 0.45).toFixed(0) + 'px'; }
        if (cls === 'confetti') f.style.background = ['#FF5C7A', '#FFD166', '#4FD1C5', '#8FA3DF', '#fff'][k % 5];
        add(hero, f);
      }
    }

    /* Leaves and snow fall down the whole window, not just the banner. One
       canvas under the menu bar that ignores the mouse. Nothing is ever drawn
       over an advert: the ad boxes are measured twice a second and any flake
       inside one is skipped. Stops while the tab is in the background. */
    function fall(kind, n, fast) {
      if (still || !fx) return;
      var cv = add(document.body, document.createElement('canvas'));
      cv.className = 'fx-fall';
      var ctx = cv.getContext('2d');
      if (!ctx) return;
      var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), ads = [];
      var size = function () {
        W = innerWidth; H = innerHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      size();
      addEventListener('resize', size);
      if (W < 700) n = Math.round(n * 0.5);
      var LEAF = kind === 'halloween' ? ['#FF8A2A', '#B5407A', '#E0661F'] : ['#F2A541', '#C8521E', '#E07B2A', '#D9A030'];
      var bits = [];
      for (var k = 0; k < n; k++) bits.push({
        x: Math.random(), y: Math.random(), r: kind === 'snow' ? 1.3 + Math.random() * 2.3 : 6 + Math.random() * 6,
        v: (kind === 'snow' ? 22 : 30) + Math.random() * 34, a: Math.random() * 6.28, w: 0.4 + Math.random() * 1.1,
        o: 0.55 + Math.random() * 0.4, c: LEAF[k % LEAF.length]
      });
      var measure = function () {
        ads = [].slice.call(document.querySelectorAll('ins.adsbygoogle, .google-auto-placed, .adslot.is-filled')).map(function (el) {
          return el.getBoundingClientRect();
        }).filter(function (r) { return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H; });
      };
      measure();
      timer = setInterval(measure, 500);
      var last = 0;
      var frame = function (t) {
        raf = requestAnimationFrame(frame);
        if (document.hidden) { last = 0; return; }
        var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
        last = t;
        ctx.clearRect(0, 0, W, H);
        for (var k = 0; k < bits.length; k++) {
          var b = bits[k];
          b.y += b.v * (fast ? 2.6 : 1) * dt / H;
          b.a += b.w * dt;
          if (b.y > 1.03) { b.y = -0.03; b.x = Math.random(); }
          var x = b.x * W + Math.sin(b.a) * (kind === 'snow' ? 14 : 30) - (fast ? b.y * 120 : 0), y = b.y * H, hit = false;
          for (var j = 0; j < ads.length && !hit; j++) {
            var r = ads[j];
            hit = x > r.left - 14 && x < r.right + 14 && y > r.top - 14 && y < r.bottom + 14;
          }
          if (hit) continue;
          ctx.globalAlpha = b.o;
          if (kind === 'snow') {
            ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832);
            ctx.fillStyle = '#D9E3FC'; ctx.fill();
            ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(104,134,216,.42)'; ctx.stroke();   /* so it reads on the pale sections too */
          } else {
            ctx.save(); ctx.translate(x, y); ctx.rotate(b.a);
            ctx.beginPath(); ctx.moveTo(-b.r, 0);
            ctx.quadraticCurveTo(0, -b.r * 0.75, b.r, 0); ctx.quadraticCurveTo(0, b.r * 0.75, -b.r, 0);
            ctx.fillStyle = b.c; ctx.fill();
            ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(90,30,0,.35)';
            ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.lineTo(b.r, 0); ctx.stroke();
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;
      };
      raf = requestAnimationFrame(frame);
    }

    /* a string of bulbs that hangs under the menu bar and follows it down the page */
    function lights(colours) {
      var nav = document.querySelector('.nav');
      if (!nav) return;
      var row = add(nav, document.createElement('div'));
      row.className = 'lights';
      var n = Math.ceil((nav.clientWidth || innerWidth) / 44) + 1;
      for (var k = 0; k < n; k++) {
        var b = document.createElement('i');
        b.style.left = (k * 44 + 17) + 'px';
        b.style.color = colours[(k * 7 + (k % 3)) % colours.length];
        b.style.animationDelay = (-Math.random() * 4).toFixed(2) + 's';
        b.style.animationDuration = (2.6 + Math.random() * 2.2).toFixed(2) + 's';
        row.appendChild(b);
      }
      root.classList.add('has-lights');
    }

    function snowbank() {
      var bank = add(document.body, document.createElement('span'));
      bank.className = 'snowbank snowbank-page';
      var grown = 6 + Math.round(Math.min(m === 12 ? day : 25, 25) * 0.6);
      if (innerWidth < 700) grown = Math.min(grown, 12);
      bank.style.height = grown + 'px';
      document.body.style.paddingBottom = grown + 'px';     /* so the last line of the footer clears it */
    }

    function apply() {
      clear();
      var season = choice === 'auto' ? calendar : choice === 'none' ? '' : choice;
      if (!season) return;
      root.classList.add('season-' + season);
      if (season === 'winter' || season === 'christmas') {
        var storm = choice === 'auto' && m === 12 && day >= 21 && day <= 25;   /* a proper snowfall for Christmas week */
        if (storm) root.classList.add('season-storm');
        fall('snow', storm ? 90 : 46, storm);
        snowbank();
        if (season === 'christmas') lights(['#FF4D5E', '#34D17A', '#FFC83D', '#4DA3FF', '#FF7AD9']);
      } else if (season === 'autumn') fall('leaf', 16);
      else if (season === 'thanksgiving') { fall('leaf', 16); lights(['#FFB347', '#FF8A3D', '#FFD98A', '#F0652B']); }
      else if (season === 'halloween') fall('halloween', 10);
      else if (still) return;
      else if (season === 'valentine') drop('heart', 12, '♥', [12, 24]);
      else if (season === 'newyear') drop('confetti', 36, '', [8, 14]);
      else if (season === 'fourth' && hero) {
        for (var b = 0; b < 6; b++) {
          var fw = document.createElement('span');
          fw.className = 'firework';
          fw.style.left = (10 + Math.random() * 80).toFixed(0) + '%';
          fw.style.top = (12 + Math.random() * 50).toFixed(0) + '%';
          fw.style.animationDelay = (b * 1.4 + Math.random()).toFixed(1) + 's';
          fw.style.color = ['#FF5C7A', '#fff', '#6FA8FF'][b % 3];
          add(hero, fw);
        }
      }
    }
    apply();

    /* ---- the gear: pick a theme, or switch the falling bits off ----
       Built here for the same reason the search button is: one file, and the
       navs cannot drift apart. */
    var sBtn = document.querySelector('.nav-inner .nav-search');
    if (!sBtn) return;
    var wrap = document.createElement('span');
    wrap.className = 'nav-gear';
    var gear = document.createElement('button');
    gear.type = 'button';
    gear.setAttribute('aria-label', 'Theme and effects');
    gear.setAttribute('aria-expanded', 'false');
    gear.setAttribute('aria-controls', 'theme-pop');
    gear.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/>' +
      '<path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/></svg>';
    var pop = document.createElement('div');
    pop.className = 'theme-pop';
    pop.id = 'theme-pop';
    pop.hidden = true;
    wrap.appendChild(gear);
    wrap.appendChild(pop);
    sBtn.parentNode.insertBefore(wrap, sBtn.nextSibling);

    function draw() {
      var auto = calendar ? 'Today: ' + NAMES[calendar] : 'Nothing on today';
      pop.innerHTML = '<p class="tp-h">Theme</p>' + PICK.map(function (o) {
        return '<button type="button" class="tp-o tp-' + o[0] + '" data-theme="' + o[0] + '" aria-pressed="' + (o[0] === choice) + '">' +
          '<i></i><span>' + o[1] + (o[0] === 'auto' ? '<small>' + auto + '</small>' : '') + '</span></button>';
      }).join('') +
        '<p class="tp-h">Effects</p>' +
        '<button type="button" class="tp-o tp-fx" data-fx="1" aria-pressed="' + fx + '"><i></i><span>Falling leaves and snow' +
        (still ? '<small>Off: your device asks for less motion</small>' : '') + '</span></button>' +
        '<p class="tp-n">Saved in this browser only.</p>';
    }
    function open(on) {
      if (on) draw();
      pop.hidden = !on;
      gear.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    gear.addEventListener('click', function (e) { e.stopPropagation(); open(pop.hidden); });
    pop.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      if (b.getAttribute('data-fx')) { fx = !fx; set('dl-fx', fx ? '1' : '0'); }
      else { choice = b.getAttribute('data-theme'); set('dl-theme', choice); }
      apply();
      draw();
    });
    document.addEventListener('click', function () { if (!pop.hidden) open(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) { open(false); gear.focus(); }
    });
  })();

  /* ---------------- the store nudge ----------------
     Someone on their fifth page here has probably not seen that there is a
     store. One small card, bottom corner, once; a tap on either button and it
     never comes back. Counted in localStorage, nothing sent anywhere. */
  (function () {
    var KEY_SEEN = 'dl-pages', KEY_DONE = 'dl-nudge';
    var path = location.pathname;
    if (path.indexOf('/store/') === 0) { try { localStorage.setItem(KEY_DONE, '1'); } catch (e) {} return; }
    var seen = 0, done = '';
    try { done = localStorage.getItem(KEY_DONE) || ''; seen = (parseInt(localStorage.getItem(KEY_SEEN), 10) || 0) + 1; localStorage.setItem(KEY_SEEN, String(seen)); } catch (e) { return; }
    if (done || seen < 5) return;
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
    function finish() { try { localStorage.setItem(KEY_DONE, '1'); } catch (e) {} if (card.parentNode) card.parentNode.removeChild(card); }
    var card = el('aside', 'nudge'); card.setAttribute('aria-label', 'The Dlonem store');
    var p = el('p'); p.appendChild(el('b', '', 'There is a store now.'));
    p.appendChild(document.createTextNode('Shirts, hoodies and mugs with the Dlonem mark, printed to order. Each one helps keep the mods and apps free.'));
    var row = el('div', 'nudge-row');
    var go = el('a', 'btn btn-solid', 'Have a look'); go.href = '/store/'; go.addEventListener('click', finish);
    var no = el('button', '', 'Not now'); no.type = 'button'; no.addEventListener('click', finish);
    row.appendChild(go); row.appendChild(no); card.appendChild(p); card.appendChild(row);
    setTimeout(function () { document.body.appendChild(card); }, 6000);
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
