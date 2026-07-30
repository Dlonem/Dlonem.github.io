/* Dlonem — gallery enhancement.
   Progressive by design: every .shots row already works as a plain scroll-snap
   strip with no JS at all. This layers on arrows, position dots, auto-advance
   and a click-to-enlarge lightbox, without touching the slide markup — so the
   existing onerror="this.parentNode.remove()" fallbacks keep working. */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
               matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- lightbox */
  var lb, lbImg, lastFocus;

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Enlarged image');
    lb.innerHTML = '<button class="lightbox-x" type="button" aria-label="Close">×</button>' +
                   '<img alt="">';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');

    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox-x')) closeBox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.hasAttribute('open')) closeBox();
    });
  }

  function openBox(src, alt) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lightbox-x').focus();
  }

  function closeBox() {
    lb.removeAttribute('open');
    lbImg.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------------------------------------------------------- galleries */
  function enhance(strip) {
    var slides = [].slice.call(strip.querySelectorAll('.shot'));
    if (slides.length < 2) return;

    strip.classList.add('is-enhanced');

    var frame = document.createElement('div');
    frame.className = 'gal-frame';
    strip.parentNode.insertBefore(frame, strip);
    frame.appendChild(strip);

    function arrow(cls, label, glyph) {
      var b = document.createElement('button');
      b.className = 'gal-btn ' + cls;
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = glyph;
      frame.appendChild(b);
      return b;
    }
    var prev = arrow('gal-prev', 'Previous', '‹');
    var next = arrow('gal-next', 'Next', '›');

    var dots = document.createElement('div');
    dots.className = 'gal-dots';
    frame.parentNode.insertBefore(dots, frame.nextSibling);

    /* Slides are narrower than the viewport (min(78%,420px)), so several are
       visible at once and the strip has fewer distinct scroll stops than it has
       images. Dots therefore mark SCROLL POSITIONS, not images — the same thing
       Netflix/Amazon rails do. Counting them per image would leave dots that can
       never activate. */
    function step() {
      var a = slides[0].getBoundingClientRect();
      var b = slides[1].getBoundingClientRect();
      return Math.round(b.left - a.left) || Math.round(a.width) || 1;
    }

    function maxScroll() {
      return Math.max(0, strip.scrollWidth - strip.clientWidth);
    }

    function stops() {
      return Math.max(1, Math.round(maxScroll() / step()) + 1);
    }

    function index() {
      var m = maxScroll();
      if (m <= 1) return 0;
      if (strip.scrollLeft >= m - 2) return stops() - 1;   /* pinned to the end */
      return Math.min(stops() - 1, Math.round(strip.scrollLeft / step()));
    }

    function goTo(n) {
      var last = stops() - 1;
      if (n < 0) n = last;
      if (n > last) n = 0;
      var target = n >= last ? maxScroll() : Math.min(maxScroll(), n * step());
      strip.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
    }

    var buttons = [];

    function buildDots() {
      var want = stops();
      if (buttons.length === want) return;
      dots.innerHTML = '';
      buttons = [];
      if (want < 2) { dots.hidden = true; return; }
      dots.hidden = false;
      for (var n = 0; n < want; n++) {
        (function (k) {
          var b = document.createElement('button');
          b.className = 'gal-dot';
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to position ' + (k + 1) + ' of ' + want);
          b.addEventListener('click', function () { goTo(k); hold(); });
          dots.appendChild(b);
          buttons.push(b);
        })(n);
      }
    }

    function paint() {
      buildDots();
      var i = index();
      buttons.forEach(function (b, k) {
        var on = k === i;
        b.setAttribute('aria-current', on ? 'true' : 'false');
        b.classList.toggle('is-on', on);
      });
      var single = maxScroll() <= 1;
      prev.hidden = next.hidden = single;
    }

    /* ---- auto advance ---- */
    var timer = null, stopped = false;
    var delay = parseInt(strip.getAttribute('data-interval'), 10) || 7000;

    function play() {
      if (reduce || stopped || timer || maxScroll() <= 1) return;
      timer = setInterval(function () { goTo(index() + 1); }, delay);
    }
    function pause() { clearInterval(timer); timer = null; }
    function hold() { stopped = true; pause(); }   /* deliberate input wins, for good */

    prev.addEventListener('click', function () { goTo(index() - 1); hold(); });
    next.addEventListener('click', function () { goTo(index() + 1); hold(); });

    frame.addEventListener('mouseenter', pause);
    frame.addEventListener('mouseleave', play);
    frame.addEventListener('focusin', pause);
    frame.addEventListener('focusout', play);
    strip.addEventListener('touchstart', hold, { passive: true });
    strip.addEventListener('wheel', hold, { passive: true });

    frame.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { goTo(index() - 1); hold(); }
      if (e.key === 'ArrowRight') { goTo(index() + 1); hold(); }
    });

    var raf;
    strip.addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    }, { passive: true });

    var rt;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(paint, 120);
    });

    /* ---- click to enlarge ---- */
    slides.forEach(function (s) {
      s.classList.add('is-zoomable');
      s.addEventListener('click', function () {
        var img = s.querySelector('img');
        if (img) openBox(img.currentSrc || img.src, img.alt);
      });
    });

    /* no timer for a gallery nobody is looking at */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en[0].isIntersecting ? play() : pause();
      }, { threshold: 0.25 }).observe(frame);
    } else {
      play();
    }

    paint();
  }

  function init() {
    [].slice.call(document.querySelectorAll('.shots')).forEach(enhance);
  }

  /* wait for load so hotlinked Steam images have settled and the onerror
     fallbacks have already pruned any dead slides */
  if (document.readyState === 'complete') init();
  else addEventListener('load', init);
})();
