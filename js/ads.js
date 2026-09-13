/* ads.js — manual AdSense placements for dlonem.com.
   ---------------------------------------------------------------------------
   WHY THIS FILE EXISTS
   Before this, the site ran Auto ads only: one loader tag per page and Google
   decided every placement. That gave away control of where ads land on a
   13,000-word wiki. This file keeps every slot ID in ONE place and lets the
   pages declare placements as markup:

       <div class="adslot" data-ad="article"></div>

   To add or change a unit you edit SLOTS below and nothing else. A slot whose
   id is still '' renders nothing at all — no gap, no empty box — so unfinished
   units are safe to leave in place.

   site.js loads this file only on pages that actually contain a .adslot.
   ---------------------------------------------------------------------------
   HOW TO FILL IN A NEW UNIT
   AdSense -> Ads -> By ad unit -> create the unit, then copy the number out of
   data-ad-slot="..." in the code it gives you. In-feed ALSO gives you a
   data-ad-layout-key="-xx+yy+zz-.." — that goes in feedKey.                   */
(function () {
  'use strict';

  var CLIENT = 'ca-pub-5299635657419886';

  var SLOTS = {
    /* Display — responsive. Created 2026-09-12. Used as the banner that sits
       under the hero on long pages. */
    display:   '1173987963',

    /* Multiplex — "autorelaxed". Created 2026-09-12. A grid of suggestions;
       it belongs at the END of a long read, never in the middle. */
    multiplex: '4600640813',

    /* In-article — NOT CREATED YET. This is the highest-earning format on the
       wiki and the mod pages because it renders as part of the text flow.
       Create it in AdSense and paste the number here. */
    article:   '',

    /* In-feed — NOT CREATED YET. Matches the card grids on /apps/, /mods/ and
       /games/. Needs BOTH the slot number and the layout key. */
    feed:      '',
    feedKey:   ''
  };

  var FORMAT = {
    display:   { fmt: 'auto',       full: true  },
    article:   { fmt: 'fluid',      layout: 'in-article' },
    feed:      { fmt: 'fluid',      key: true   },
    multiplex: { fmt: 'autorelaxed' }
  };

  var nodes = document.querySelectorAll('.adslot');
  if (!nodes.length) return;

  var pushed = 0;

  Array.prototype.forEach.call(nodes, function (host) {
    var kind = host.getAttribute('data-ad') || 'display';
    var slot = SLOTS[kind];
    var spec = FORMAT[kind];

    /* No id yet, or an unknown kind: leave the page exactly as it was. */
    if (!spec || !slot) { host.remove(); return; }
    if (kind === 'feed' && !SLOTS.feedKey) { host.remove(); return; }

    var label = document.createElement('span');
    label.className = 'adslot-label';
    label.textContent = 'Advertisement';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', spec.fmt);
    if (spec.full)   ins.setAttribute('data-full-width-responsive', 'true');
    if (spec.layout) ins.setAttribute('data-ad-layout', spec.layout);
    if (spec.key)    ins.setAttribute('data-ad-layout-key', SLOTS.feedKey);

    host.appendChild(label);
    host.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed++;
    } catch (e) {
      /* The loader is blocked (ad blocker, or offline). Take the whole block
         back out so the page reads as if it was never there. */
      host.remove();
    }
  });

  /* AdSense stamps data-ad-status on the <ins> once it has decided. Until that
     happens the slot carries no margin and shows no label, so a blocked or
     never-approved slot is invisible; only a genuinely filled one earns its
     space. "unfilled" removes the box entirely. */
  if (pushed && 'MutationObserver' in window) {
    var mark = function (el) {
      var box = el.closest ? el.closest('.adslot') : null;
      if (!box) return;
      var st = el.getAttribute('data-ad-status');
      if (st === 'unfilled') {
        box.classList.add('is-empty');
        box.classList.remove('is-filled');
      } else if (st === 'filled') {
        box.classList.add('is-filled');
        box.classList.remove('is-empty');
      }
    };
    new MutationObserver(function (recs) {
      recs.forEach(function (r) { mark(r.target); });
    }).observe(document.body, {
      subtree: true, attributes: true, attributeFilter: ['data-ad-status']
    });
    /* Catch any unit that resolved before the observer was attached. */
    Array.prototype.forEach.call(
      document.querySelectorAll('ins.adsbygoogle[data-ad-status]'), mark);
  }
})();
