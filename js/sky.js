/* Dlonem — sky of the day.
   ------------------------------------------------------------------
   The hero gradient rotates daily. This stamps one `sky-*` class onto
   <html> before first paint, and the stylesheet turns that class into
   a different --grad-hero.

   Two deliberate properties:
   • With JS off, no class is set and the hero stays Deep Field — the
     house sky — because that is the :root default. Nothing to break.
   • Skies only re-point CSS variables, never `background` directly, so
     pages that paint their own hero (the Supernatural page) still win.

   To add a sky: add it to SKIES below and add a matching
   `html.sky-<name>` rule in css/style.css. Nothing else to touch.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var SKIES = ['deep', 'longnight', 'ember', 'aurora', 'firstlight', 'moonrise'];

  /* Dated skies beat the daily rotation.
     [startMonth, startDay, endMonth, endDay, sky] — ranges may wrap the year. */
  var CALENDAR = [
    [12,  1,  1, 15, 'longnight'],  /* deep winter — the mod's own season */
    [10, 25, 10, 31, 'ember'],      /* the week of Halloween */
    [ 3, 19,  3, 22, 'firstlight'], /* spring equinox */
    [ 6, 19,  6, 22, 'aurora']      /* summer solstice */
  ];

  var now = new Date(),
      today = (now.getMonth() + 1) * 100 + now.getDate(),
      pick = null,
      i, c, from, to, inRange;

  for (i = 0; i < CALENDAR.length; i++) {
    c = CALENDAR[i];
    from = c[0] * 100 + c[1];
    to   = c[2] * 100 + c[3];
    inRange = (from <= to) ? (today >= from && today <= to)
                           : (today >= from || today <= to);
    if (inRange) { pick = c[4]; break; }
  }

  if (!pick) {
    var jan1 = new Date(now.getFullYear(), 0, 1);
    var dayOfYear = Math.floor((now - jan1) / 86400000);
    pick = SKIES[dayOfYear % SKIES.length];
  }

  document.documentElement.className += ' sky-' + pick;
})();
