/* Dlonem — the add-ons page filter. Loaded only by /wow-forever/addons/.

   [data-kit-filter] buttons   show only the add-ons for one kind of player
   .kit-card[data-for]         who a card is for ("tank heal", "all", ...)
   section[data-kit]           a section whose cards are all hidden hides too

   Every card is written into the HTML, so the page reads in full without this.
   The choice is kept in the address (#for=tank) so it can be shared. */
(function () {
  'use strict';
  if (!document.querySelector) return;
  var bar = document.querySelector('[data-kit-filter]');
  if (!bar) return;
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  var btns = all('button[data-k]', bar);
  var cards = all('.kit-card[data-for]');
  var secs = all('section[data-kit]');
  var note = document.querySelector('.kit-filter-note');
  var names = {};
  btns.forEach(function (b) { names[b.getAttribute('data-k')] = b.textContent; });

  function apply(k) {
    var shown = 0;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-k') === k ? 'true' : 'false'); });
    cards.forEach(function (c) {
      var f = ' ' + c.getAttribute('data-for') + ' ';
      var on = k === 'all' || f.indexOf(' ' + k + ' ') >= 0 || f.indexOf(' all ') >= 0;
      c.hidden = !on;
      if (on) shown++;
    });
    secs.forEach(function (s) {
      s.hidden = k !== 'all' && !all('.kit-card', s).some(function (c) { return !c.hidden; });
    });
    if (note) note.textContent = k === 'all' ? '' : 'Showing ' + shown + ' add-ons for ' + names[k].toLowerCase() +
      ', including the ones every player gets something from.';
    try { history.replaceState(null, '', k === 'all' ? location.pathname : '#for=' + k); } catch (e) { /* fine */ }
  }

  bar.hidden = false;
  btns.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-k')); });
  });
  var m = /^#for=([a-z]+)$/.exec(location.hash || '');
  if (m && names[m[1]]) apply(m[1]);
})();
