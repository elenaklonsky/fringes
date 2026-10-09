/* Anthrogen · scroll scenes.
   Every animation is tied to the scrollbar (scrub): nothing plays by itself, and scrolling back reverses it.
   Timings are written in "screens" (1 = one screen height of scrolling), matching the storyboard. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  root.classList.remove('motion-pending');

  /* ---------------- navigation (works with or without motion) ---------------- */
  var nav = document.querySelector('.nav');
  var label = nav.querySelector('.nav-label');
  var labelText = nav.querySelector('.nav-label-text');
  var menu = document.getElementById('nav-menu');
  var bar = nav.querySelector('.nav-progress-bar');
  var cover = document.getElementById('cover');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    label.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  }
  label.addEventListener('click', function () { setOpen(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });

  // progress line: hidden until the pointer comes near the top edge (or the menu is open)
  document.addEventListener('mousemove', function (e) { nav.classList.toggle('is-hot', e.clientY < 64); }, { passive: true });

  function updateProgress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  // which section are we in? (label text)
  var navTargets = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  function updateLabel() {
    var y = innerHeight * 0.4, current = null;
    navTargets.forEach(function (el) { if (el.getBoundingClientRect().top <= y) current = el; });
    var name = current ? current.getAttribute('data-nav') : '';
    if (name && labelText.textContent !== name) labelText.textContent = name;
    menu.querySelectorAll('a').forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      a.setAttribute('aria-current', current && (current.id === id || (id === 'cover' && current.id === 'title-page')) ? 'true' : 'false');
    });
  }
  var coverGone = false;
  function updateNavVisibility() {
    // shown once the cover has lifted away
    var visible = coverGone || cover.getBoundingClientRect().bottom < innerHeight * 0.15;
    nav.classList.toggle('is-visible', visible);
    if (!visible) setOpen(false);
  }
  function onScroll() { updateProgress(); updateLabel(); if (!hasGsap || reduce) updateNavVisibility(); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!hasGsap || reduce) return;   // still page, everything already visible

  /* ---------------- scroll scenes ---------------- */
  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);
  var vh = function () { return innerHeight; };
  var screens = function (n) { return function () { return '+=' + Math.round(n * innerHeight); }; };
  var q = function (s, ctx) { return (ctx || document).querySelector(s); };
  var qa = function (s, ctx) { return gsap.utils.toArray((ctx || document).querySelectorAll(s)); };

  /* Scene 0 → 1: the cover holds, then lifts away to uncover the title page */
  gsap.timeline({
    scrollTrigger: { trigger: '#opening', start: 'top top', end: screens(1.2), pin: true, scrub: true,
      onUpdate: function (st) { coverGone = st.progress > 0.92; nav.classList.toggle('is-visible', coverGone); if (!coverGone) setOpen(false); } }
  })
    .to({}, { duration: 0.5 })
    .to('#cover', { yPercent: -100, ease: 'none', duration: 0.7 });

  var mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, function (ctx) {
    var desktop = ctx.conditions.desktop;

    /* Scenes 3 + 4: proteins. p. 5 → seed grows → p. 7 ¶1–2 pass → poses → ¶3 passes → leaves */
    (function () {
      var scene = q('#proteins'), seed = q('.seed', scene), frame = q('.pframe', scene);
      var p5 = q('.p5-text', scene), p7a = q('.p7a', scene), p7b = q('.p7b', scene);
      var lowers = qa('.lower', scene), poses = qa('.pose', scene);
      var bounce = q('.pw-bounce', scene), wiggle = q('.pw-wiggle', scene), walk = q('.pw-walk', scene);
      var lowerH = function () { return lowers[0].getBoundingClientRect().height; };
      var pass = function (el) { return function () { return -(lowerH() + el.offsetHeight); }; };
      // seed → frame transform, measured from the layout (recomputed on resize)
      function grow(prop) {
        return function () {
          var s = seed.getBoundingClientRect(), f = frame.getBoundingClientRect();
          // undo any transform already on the seed by measuring its untransformed box
          var sx = gsap.getProperty(seed, 'x'), sy = gsap.getProperty(seed, 'y'), sc = gsap.getProperty(seed, 'scaleX'), scy = gsap.getProperty(seed, 'scaleY');
          var w0 = s.width / sc, h0 = s.height / scy, l0 = s.left - sx, t0 = s.top - sy;
          return { x: f.left - l0, y: f.top - t0, scaleX: f.width / w0, scaleY: f.height / h0 }[prop];
        };
      }
      gsap.set(poses.slice(1), { autoAlpha: 0 });
      gsap.set(frame, { autoAlpha: 0 });
      gsap.set([bounce, wiggle, walk], { autoAlpha: 0 });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: scene, start: 'top top', end: screens(6.4), pin: true, scrub: 0.6, invalidateOnRefresh: true }
      });
      // 0–0.4 read p. 5 (nothing moves)
      tl.to(p5, { y: function () { return -(p5.offsetTop + p5.offsetHeight + 20); }, duration: 0.7 }, 0.4)
        .to(seed, { x: grow('x'), y: grow('y'), scaleX: grow('scaleX'), scaleY: grow('scaleY'), ease: 'power1.inOut', duration: 0.5 }, 0.45)
        .to(q('.seed-img', seed), { autoAlpha: 0, duration: 0.15 }, 0.6)
        .to(frame, { autoAlpha: 1, duration: 0.12 }, 0.95)       // the seed has fully arrived by 0.95
        .set(seed, { autoAlpha: 0 }, 1.08)
      // 1.15–2.5 p. 7 ¶1–2 scroll through the column while pose 1 holds
        .fromTo(p7a, { y: 0 }, { y: pass(p7a), duration: 1.35 }, 1.15)
      // 2.55 pose 2 + hop + "They even bounce,"
        .to(poses[1], { autoAlpha: 1, duration: 0.08 }, 2.55)
        .to(frame, { y: '-=4%', duration: 0.08, ease: 'power2.out' }, 2.55)
        .to(frame, { y: '+=4%', duration: 0.1, ease: 'bounce.out' }, 2.63)
        .to(bounce, { autoAlpha: 1, duration: 0.1 }, 2.6)
      // 2.9 rock + "wiggle,"
        .to(frame, { rotation: 2.2, duration: 0.06 }, 2.9)
        .to(frame, { rotation: -2.2, duration: 0.08 }, 2.96)
        .to(frame, { rotation: 0, duration: 0.06 }, 3.04)
        .to(wiggle, { autoAlpha: 1, duration: 0.1 }, 2.95)
      // 3.3 pose 3
        .to(poses[2], { autoAlpha: 1, duration: 0.08 }, 3.3)
      // 3.7 pose 4 + drift + "and walk around."
        .to(poses[3], { autoAlpha: 1, duration: 0.08 }, 3.7)
        .to(frame, { x: desktop ? '6%' : '3%', duration: 0.3, ease: 'power1.inOut' }, 3.7)
        .to(walk, { autoAlpha: 1, duration: 0.1 }, 3.8);
      if (!desktop) tl.to([bounce, wiggle, walk], { autoAlpha: 0, duration: 0.15 }, 4.2);   // make room for ¶3 on phones
      // 4.3–5.6 ¶3 passes while the protein holds; 5.4–6.0 everything leaves together
      tl.fromTo(p7b, { y: 0 }, { y: pass(p7b), duration: 1.6 }, 4.3)
        .to([frame, bounce, wiggle, walk], { y: function () { return '-=' + vh(); }, duration: 0.7 }, 5.5)
        .to({}, { duration: 0.2 }, 6.2);
    })();

    /* Scene 5: collage assembles piece by piece, holds, leaves */
    if (desktop) {
      var items = qa('#collage .c-item');
      gsap.set(items, { autoAlpha: 0, y: 14 });
      var ctl = gsap.timeline({ scrollTrigger: { trigger: '#collage', start: 'top top', end: screens(3), pin: true, scrub: 0.5 } });
      items.forEach(function (el, i) { ctl.to(el, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power1.out' }, i * 0.16); });
      ctl.to({}, { duration: 0.8 });
    } else {
      qa('#collage .page').forEach(function (pg) {
        gsap.from(pg, { autoAlpha: 0, y: 30, duration: 0.8, scrollTrigger: { trigger: pg, start: 'top 85%', end: 'top 45%', scrub: 0.5 } });
      });
    }

    /* Scene 7: counting — images arrive left to right, a pause, then the closing line */
    if (desktop) {
      var s = qa('#counting .s-item'), imagine = q('#counting .imagine'), p11a = q('#counting .p11a'), p11b = q('#counting .p11b');
      var firstSentence = p11a.firstChild;   // text node before the italic sentence
      var span = document.createElement('span'); span.className = 'p11-first';
      if (firstSentence && firstSentence.nodeType === 3) { p11a.insertBefore(span, firstSentence); span.appendChild(firstSentence); }
      gsap.set(s, { autoAlpha: 0 });
      gsap.set([span, imagine, p11b], { autoAlpha: 0 });
      var ktl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#counting', start: 'top top', end: screens(4), pin: true, scrub: 0.5 } });
      ktl.to({}, { duration: 0.6 });
      s.forEach(function (el, i) { ktl.to(el, { autoAlpha: 1, duration: 0.14 }, 0.6 + i * 0.26); });
      ktl.to(span, { autoAlpha: 1, duration: 0.15 }, 2.0)
         .to(imagine, { autoAlpha: 1, duration: 0.15 }, 2.3)
         .to({}, { duration: 0.6 }, 2.45)                       // "for a second": nothing moves
         .to(p11b, { autoAlpha: 1, duration: 0.15 }, 3.0)
         .to({}, { duration: 0.85 }, 3.15);
    } else {
      qa('#counting .s-item, #counting .ptext').forEach(function (el) {
        gsap.from(el, { autoAlpha: 0, y: 16, scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 60%', scrub: 0.5 } });
      });
    }

    /* Scene 8a: the waves draw themselves, left to right (a widening clip; the axes are there from the start) */
    (function () {
      var clip = q('#search .wclip-rect');
      gsap.set(clip, { attr: { width: 0 } });
      var wtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: desktop
        ? { trigger: '#search .chart-pin', start: 'top top', end: screens(1.2), pin: true, scrub: 0.5 }
        : { trigger: '#search .chart', start: 'top 85%', end: 'top 25%', scrub: 0.5 } });
      wtl.to(clip, { attr: { width: 262 }, duration: 1 });
    })();

    /* Scene 8b: the sentence travels right to left past the upright vine (desktop only) */
    if (desktop) {
      var travel = q('#vine .travel');
      var vtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#vine', start: 'top top', end: screens(2), pin: true, scrub: 0.5, invalidateOnRefresh: true } });
      vtl.fromTo(travel, { x: function () { return innerWidth * 0.62; } },
                         { x: function () { return -(travel.scrollWidth - innerWidth * 0.3); }, duration: 1 });
    }

    /* Scene 9: the second box rises, the question appears, then stays alone */
    if (desktop) {
      var b1 = q('#possible .box1'), b2 = q('#possible .box2'), qn = q('#possible .question');
      gsap.set(b2, { autoAlpha: 0, y: '6vh' });
      gsap.set(qn, { autoAlpha: 0 });
      var ptl = gsap.timeline({ scrollTrigger: { trigger: '#possible', start: 'top top', end: screens(3), pin: true, scrub: 0.5, invalidateOnRefresh: true } });
      ptl.to({}, { duration: 0.5 })
         .to(b2, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power1.out' }, 0.5)
         .to(qn, { autoAlpha: 1, duration: 0.2 }, 1.2)
         .to([b1, b2], { y: function () { return -vh(); }, duration: 0.4, ease: 'power1.in' }, 1.8)
         .to(qn, {
           x: function () { var r = qn.getBoundingClientRect(); return innerWidth / 2 - (r.left + r.width / 2) + gsap.getProperty(qn, 'x'); },
           y: function () { var r = qn.getBoundingClientRect(); return innerHeight / 2 - (r.top + r.height / 2) + gsap.getProperty(qn, 'y'); },
           duration: 0.4, ease: 'power1.inOut' }, 1.8)
         .to({}, { duration: 0.4 }, 2.2)
         .to(qn, { autoAlpha: 0, duration: 0.3 }, 2.65);
    }
  });

  // fonts change text widths: re-measure once they have loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
