/* Dlonem — the live parts of the site. Loaded on every page by site.js.
   Everything this touches is already written into the page, so a page works
   and reads true with no JavaScript, an ad blocker, or the Worker down. This
   only swaps in fresher values:

   <b data-live="spn.subs" data-fmt="h">11,600+</b>
       Steam/YouTube numbers from feed.dlonem.com/stats (a Cloudflare Worker
       that reads Steam's public API and the YouTube Data API).
       data-fmt:  h = rounded DOWN to the hundred, with "+"   (11,652 -> 11,600+)
                  x = exact                                  (1,579)
                  k = rounded DOWN to the thousand, as K     (427,856 -> 427K)
                  m = rounded DOWN to a tenth of a million   (6,409,403 -> 6.4M+)
       Rounding only ever goes down, so a figure stays true as it grows.
   <span data-live-date="spn.updated">4 October 2026</span>
       When the Workshop item was last updated (Steam), as a date.

   <p data-discord="hvZGMeJhB7" hidden></p>
       "191 online · 1,054 members", from Discord's public invite information
       (the figures Discord shows on the invite). data-suffix adds words after.
   <b data-discord-total>1,700+</b>
       All five servers added up.
   <img data-discord-icon="hvZGMeJhB7" data-size="256">
       The server's CURRENT icon, so changing it in Discord changes the site.
       The nav menus use this too.

   <div data-yt-live hidden></div>
       While the channel is live: the stream itself, playable on the page, with
       its title and description. Otherwise the next scheduled stream, in the
       visitor's own time zone. From feed.dlonem.com/live.
   While live, every page also gets a red dot on the logo, linking to it.

   Every value is written with textContent; links are built only from an
   11-character YouTube id or Discord's numeric ids; nothing is sent with
   cookies. */
(function () {
  'use strict';
  if (!window.fetch || !document.querySelector || window.__dlonemLive) return;
  window.__dlonemLive = true;

  var FEED = 'https://feed.dlonem.com/';
  var SERVERS = ['UcJmm4XQVZ', 'hvZGMeJhB7', 'StACe9hVtT', 'PTJzPQbqG7', 'Efvd2B97xx'];
  var YTID = /^[A-Za-z0-9_-]{11}$/;
  var TZ = 'America/New_York';   /* the studio's dates, same as the news feed */

  function getJSON(url, ms) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 6000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, credentials: 'omit' })
      .then(function (r) { clearTimeout(t); return r.ok ? r.json() : null; })
      .catch(function () { clearTimeout(t); return null; });
  }
  function all(sel) { return [].slice.call(document.querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function isCount(n) { return typeof n === 'number' && isFinite(n) && n >= 0 && n < 1e10 && Math.floor(n) === n; }
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmt(n, how) {
    if (how === 'x') return commas(n);
    if (how === 'k') return commas(Math.floor(n / 1000)) + 'K';
    if (how === 'm') return (Math.floor(n / 1e5) / 10).toFixed(1) + 'M+';
    return commas(Math.floor(n / 100) * 100) + '+';
  }
  /* what the page already says, as a number: "11,600+" 11600, "427K" 427000, "6.4M+" 6400000 */
  function shown(s) {
    var m = String(s).replace(/,/g, '').match(/([\d.]+)\s*([KM])?/);
    if (!m) return null;
    var v = parseFloat(m[1]);
    return m[2] === 'K' ? v * 1e3 : m[2] === 'M' ? v * 1e6 : v;
  }
  /* A live value replaces the written one only if it is a real count and not
     wildly below it: a glitch that reports 0 or a tiny number never shows. */
  function put(e, n) {
    if (!isCount(n) || n < 1) return;
    var was = shown(e.textContent);
    if (was && n < was * 0.5) return;
    var text = fmt(n, e.getAttribute('data-fmt') || 'h');
    if (text !== e.textContent) e.textContent = text;
  }
  /* "4 October 2026" -> its time, without relying on the browser's date parser
     (Safari does not read that form) */
  var MON = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
             'september', 'october', 'november', 'december'];
  function written(s) {
    var m = String(s).trim().toLowerCase().match(/^(\d{1,2}) ([a-z]+) (\d{4})$/);
    var mo = m ? MON.indexOf(m[2]) : -1;
    return mo < 0 ? NaN : Date.UTC(+m[3], mo, +m[1], 12);
  }
  function day(d) {
    try {
      return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d);
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------- numbers */
  var nums = all('[data-live]'), dates = all('[data-live-date]');
  if (nums.length || dates.length) {
    getJSON(FEED + 'stats').then(function (d) {
      if (!d || !d.ok) return;
      var s = d.steam || {}, y = d.youtube || {};
      var both = function (k) {
        var a = s.spn && s.spn[k], b = s.tln && s.tln[k];
        return isCount(a) && isCount(b) ? a + b : null;
      };
      var V = {
        'spn.subs': s.spn && s.spn.subs, 'spn.visitors': s.spn && s.spn.visitors, 'spn.favs': s.spn && s.spn.favs,
        'tln.subs': s.tln && s.tln.subs, 'tln.visitors': s.tln && s.tln.visitors, 'tln.favs': s.tln && s.tln.favs,
        'patch.subs': s.patch && s.patch.subs,
        'mods.subs': both('subs'), 'mods.visitors': both('visitors'), 'mods.favs': both('favs'),
        'yt.subs': y.subs, 'yt.views': y.views, 'yt.videos': y.videos,
        'yt.top': y.top && y.top.views, 'yt.showcase': y.showcase && y.showcase.views
      };
      nums.forEach(function (e) {
        var k = e.getAttribute('data-live');
        if (Object.prototype.hasOwnProperty.call(V, k)) put(e, V[k]);
      });
      var D = { 'spn.updated': s.spn && s.spn.updated, 'tln.updated': s.tln && s.tln.updated,
                'patch.updated': s.patch && s.patch.updated };
      dates.forEach(function (e) {
        var t = D[e.getAttribute('data-live-date')];
        if (!isCount(t)) return;
        var when = new Date(t * 1000);
        var was = written(e.textContent);
        /* only ever moves forward, and never into the future */
        if (when.getTime() > Date.now() + 864e5) return;
        if (isFinite(was) && when.getTime() < was - 2 * 864e5) return;
        var text = day(when);
        if (text && text !== e.textContent) e.textContent = text;
      });
    });
  }

  /* ---------------------------------------------------------------- Discord */
  var dc = all('[data-discord]'), tot = all('[data-discord-total]');
  var icons = all('img[data-discord-icon]').filter(function (i) { return !(i.closest && i.closest('.nav-menu')); });
  var needsCounts = dc.length || tot.length;
  var discordP = null;
  /* feed.dlonem.com/discord asks Discord once every ten minutes for everyone.
     If it cannot, a page that shows counts asks Discord itself. */
  function discord() {
    if (discordP) return discordP;
    discordP = getJSON(FEED + 'discord').then(function (d) {
      if (d && d.ok && d.servers) return d.servers;
      if (!needsCounts) return {};
      return Promise.all(SERVERS.map(function (c) {
        return getJSON('https://discord.com/api/v9/invites/' + c + '?with_counts=true', 5000).then(function (x) {
          if (!x || !x.guild) return null;
          var m = x.approximate_member_count, o = x.approximate_presence_count;
          if (!isCount(m) || m < 1) return null;
          return [c, { id: String(x.guild.id || ''), icon: x.guild.icon || null, members: m,
                       online: isCount(o) && o <= m ? o : null }];
        });
      })).then(function (rows) {
        var by = {};
        rows.forEach(function (r) { if (r) by[r[0]] = r[1]; });
        return by;
      });
    });
    return discordP;
  }
  function iconURL(s, size) {
    if (!s || !/^\d{5,25}$/.test(s.id || '') || !/^(a_)?[0-9a-f]{32}$/.test(s.icon || '')) return null;
    return 'https://cdn.discordapp.com/icons/' + s.id + '/' + s.icon +
      (s.icon.indexOf('a_') === 0 ? '.gif' : '.png') + '?size=' + size;
  }
  function applyIcons(by, list) {
    list.forEach(function (img) {
      var s = by[img.getAttribute('data-discord-icon')];
      var size = parseInt(img.getAttribute('data-size'), 10) || 128;
      var url = iconURL(s, size);
      if (!url || img.getAttribute('data-live-src') === url) return;
      var probe = new Image();
      probe.onload = function () {
        img.setAttribute('data-live-src', url);
        if (img.hasAttribute('data-src')) img.setAttribute('data-src', url);   /* a menu not opened yet */
        else img.src = url;
        img.removeAttribute('srcset');
        var alt = img.getAttribute('data-alt-live');
        if (alt != null) img.alt = alt;
      };
      probe.src = url;
    });
  }
  function applyCounts(by) {
    dc.forEach(function (p) {
      var r = by[p.getAttribute('data-discord')];
      if (!r || !isCount(r.members) || r.members < 1) return;
      p.textContent = '';
      if (isCount(r.online) && r.online > 0) {
        p.appendChild(el('i', 'dc-dot'));
        p.appendChild(el('b', null, commas(r.online) + ' online'));
        p.appendChild(document.createTextNode(' · '));
      }
      p.appendChild(el('b', null, commas(r.members) + (r.members === 1 ? ' member' : ' members')));
      var suf = p.getAttribute('data-suffix');
      if (suf) p.appendChild(document.createTextNode(' ' + suf));
      p.hidden = false;
    });
    if (tot.length) {
      /* only when every server answered, and each server counted once */
      var seen = {}, sum = 0, ok = true;
      SERVERS.forEach(function (c) {
        var r = by[c];
        if (!r || !isCount(r.members)) { ok = false; return; }
        if (r.id && seen[r.id]) return;
        if (r.id) seen[r.id] = 1;
        sum += r.members;
      });
      if (ok) tot.forEach(function (e) { put(e, sum); });
    }
  }
  if (needsCounts || icons.length) {
    discord().then(function (by) { applyCounts(by); applyIcons(by, icons); });
  }
  /* the nav menus: only asked for when someone opens or points at one */
  var navIcons = all('.nav-menu img[data-discord-icon]');
  if (navIcons.length) {
    var hooked = false;
    var wake = function () {
      if (hooked) return;
      hooked = true;
      discord().then(function (by) { applyIcons(by, navIcons); });
    };
    navIcons.forEach(function (img) {
      var item = img.closest ? img.closest('.nav-item') : null;
      if (!item) return;
      ['pointerenter', 'focusin', 'click', 'touchstart'].forEach(function (ev) {
        item.addEventListener(ev, wake, { passive: true });
      });
    });
  }

  /* ---------------------------------------------------------------- app versions */
  /* <span data-app-ver="ios.thc">1.0.51</span> and <span data-app-date="ios.thc">7 October 2026</span>,
     from Apple's public lookup through feed.dlonem.com/apps. A version only
     ever moves up and a date only forward. */
  var appVer = all('[data-app-ver]'), appDate = all('[data-app-date]');
  function newer(a, b) {   /* is version a at least version b? */
    var x = String(a).split('.'), y = String(b).split('.');
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var p = parseInt(x[i] || '0', 10), q = parseInt(y[i] || '0', 10);
      if (p !== q) return p > q;
    }
    return true;
  }
  /* Apple turns away Cloudflare's servers (seen 8 Oct 2026), so when the Worker
     has no answer the page asks Apple's public lookup itself. Only the app
     pages that show a version do this. */
  var APPLE = { thc: '6795227377' };
  function appleDirect() {
    var keys = Object.keys(APPLE), ios = {};
    return Promise.all(keys.map(function (k) {
      return getJSON('https://itunes.apple.com/lookup?country=us&id=' + APPLE[k], 6000).then(function (j) {
        var a = j && j.results && j.results[0];
        if (!a || String(a.trackId) !== APPLE[k] || !/^\d+(\.\d+){1,3}$/.test(String(a.version || ''))) return;
        var t = Date.parse(a.currentVersionReleaseDate || '');
        if (isFinite(t)) ios[k] = { version: String(a.version), released: new Date(t).toISOString() };
      });
    })).then(function () { return Object.keys(ios).length ? { ok: true, ios: ios } : null; });
  }
  if (appVer.length || appDate.length) {
    getJSON(FEED + 'apps').then(function (d) { return d && d.ok && d.ios ? d : appleDirect(); }).then(function (d) {
      if (!d || !d.ok || !d.ios) return;
      appVer.forEach(function (e) {
        var k = String(e.getAttribute('data-app-ver')).replace(/^ios\./, ''), a = d.ios[k];
        if (a && /^\d+(\.\d+){1,3}$/.test(a.version) && newer(a.version, e.textContent)) e.textContent = a.version;
      });
      appDate.forEach(function (e) {
        var k = String(e.getAttribute('data-app-date')).replace(/^ios\./, ''), a = d.ios[k];
        var t = a && Date.parse(a.released), was = written(e.textContent);
        if (!isFinite(t) || t > Date.now() + 864e5 || (isFinite(was) && t < was - 2 * 864e5)) return;
        var text = day(new Date(t));
        if (text) e.textContent = text;
      });
    });
  }

  /* ---------------------------------------------------------------- newest uploads */
  /* <div class="vidrail" data-yt-newest>: the channel's newest full video and
     newest Short go to the front of the hand-picked rail, tagged "New". */
  var rail = document.querySelector('[data-yt-newest]');
  if (rail) {
    getJSON(FEED + 'videos').then(function (d) {
      if (!d || !d.ok || !d.items) return;
      var have = [].map.call(rail.querySelectorAll('a[href]'), function (a) { return a.href; }).join(' ');
      var fresh = d.items.filter(function (v) {
        return v && YTID.test(String(v.id || '')) && have.indexOf(v.id) === -1;
      });
      /* the newest full video and the newest Short, so a run of Shorts never
         pushes the long videos out */
      var picks = [];
      [false, true].forEach(function (isShort) {
        for (var i = 0; i < fresh.length; i++) if (!!fresh[i].short === isShort) { picks.push(fresh[i]); break; }
      });
      picks.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      var want = picks.length;
      picks.forEach(function (v, i) {
        var a = el('a', 'vcard is-new');
        a.href = v.short ? 'https://www.youtube.com/shorts/' + v.id : 'https://youtu.be/' + v.id;
        a.rel = 'noopener';
        a.style.order = String(i - want);   /* ahead of the daily shuffle */
        var th = el('span', 'vcard-thumb');
        var img = el('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 480;
        img.height = 360;
        img.onerror = function () { th.remove(); };
        img.src = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
        th.appendChild(img);
        var body = el('span', 'vcard-body');
        body.appendChild(el('span', 'vcard-tag', v.short ? 'New Short' : 'New upload'));
        body.appendChild(el('span', 'vcard-title', String(v.title || '').slice(0, 140)));
        a.appendChild(th);
        a.appendChild(body);
        rail.insertBefore(a, rail.firstChild);
      });
      if (picks.length) { rail.scrollLeft = 0; try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
    });
  }

  /* ---------------------------------------------------------------- YouTube live */
  getJSON(FEED + 'live').then(function (d) {
    if (!d || !d.ok || !d.video || !YTID.test(String(d.video.id || ''))) return;
    var v = d.video, isLive = d.state === 'live';
    var watch = 'https://www.youtube.com/watch?v=' + v.id;
    var title = String(v.title || 'Live on YouTube').slice(0, 160);
    var start = v.start ? new Date(v.start) : null;
    if (!isLive) {
      if (d.state !== 'upcoming' || !start || isNaN(start.getTime())) return;
      if (start.getTime() < Date.now() - 3600e3) return;
    }
    var slots = all('[data-yt-live]');

    if (isLive) {
      /* the logo on every page: a red ring and a LIVE tag, the way YouTube marks
         a live channel. The logo itself becomes a link to the stream on YouTube;
         the word "Dlonem" next to it still goes home. */
      var brand = document.querySelector('.nav .brand');
      var logo = brand && brand.querySelector('img');
      var bar = brand && brand.parentNode;
      if (logo && bar && !bar.querySelector('.brand-live')) {
        brand.classList.add('is-live');
        var ring = el('a', 'brand-live');
        ring.href = watch;
        ring.rel = 'noopener';
        ring.title = 'Live now on YouTube: ' + title;
        ring.setAttribute('aria-label', 'Dlonem is live on YouTube: ' + title);
        ring.appendChild(el('span', 'bl-tag', 'LIVE'));
        bar.appendChild(ring);
        var place = function () {
          var a = logo.getBoundingClientRect(), b = bar.getBoundingClientRect();
          ring.style.left = (a.left - b.left) + 'px';
          ring.style.top = (a.top - b.top) + 'px';
          ring.style.width = a.width + 'px';
          ring.style.height = a.height + 'px';
        };
        place();
        addEventListener('resize', place);
        addEventListener('load', place);
        /* a late web-font swap or the bar re-wrapping moves the logo without a resize */
        if ('ResizeObserver' in window) new ResizeObserver(place).observe(bar);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      }
      slots.forEach(function (box) {
        box.textContent = '';
        box.className = 'yt-live is-live ytl-big';
        if (!document.getElementById('live')) box.id = 'live';
        var player = el('div', 'ytl-player');
        var play = el('button', 'ytl-play');
        play.type = 'button';
        play.setAttribute('aria-label', 'Play the live stream here: ' + title);
        var img = el('img');
        img.alt = '';
        img.decoding = 'async';
        img.onerror = function () {
          if (img.src.indexOf('hqdefault_live') > -1) img.src = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
          else img.remove();
        };
        img.src = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault_live.jpg';
        play.appendChild(img);
        play.appendChild(el('span', 'ytl-btn', 'Watch here'));
        play.addEventListener('click', function () {
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0';
          f.title = title;
          f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
          f.setAttribute('allowfullscreen', '');
          f.referrerPolicy = 'strict-origin-when-cross-origin';
          player.textContent = '';
          player.appendChild(f);
        });
        player.appendChild(play);
        var info = el('div', 'ytl-info');
        info.appendChild(el('span', 'yt-live-tag', 'Live now'));
        info.appendChild(el('h2', 'ytl-title', title));
        var desc = String(v.description || '').trim();
        if (desc) info.appendChild(el('p', 'ytl-desc', desc.slice(0, 600)));
        var row = el('div', 'ytl-actions');
        var a = el('a', 'btn btn-solid ytl-go', 'Watch on YouTube');
        a.href = watch;
        a.rel = 'noopener';
        row.appendChild(a);
        info.appendChild(row);
        box.appendChild(player);
        box.appendChild(info);
        box.hidden = false;
      });
      return;
    }

    var when = '';
    try {
      when = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(start);
    } catch (e) { when = start.toUTCString(); }
    slots.forEach(function (box) {
      box.textContent = '';
      box.className = 'yt-live is-next';
      var a = el('a', 'yt-live-in');
      a.href = watch;
      a.rel = 'noopener';
      a.appendChild(el('span', 'yt-live-tag', 'Next live stream'));
      var txt = el('span', 'yt-live-txt');
      txt.appendChild(el('b', null, title));
      txt.appendChild(el('span', 'yt-live-when', when));
      a.appendChild(txt);
      a.appendChild(el('span', 'yt-live-go', 'Set a reminder'));
      box.appendChild(a);
      box.hidden = false;
    });
  });
})();
