/* Anthrogen · Biological Abundance — scroll scenes.

   How it moves
   - Every animation follows the scrollbar: nothing plays by itself, scrolling back reverses it.
   - Desktop: all scenes live as layers in ONE fixed stage. Scrolling drives a single timeline in which
     scenes dissolve into each other, often handing an element across (the seed becomes the protein,
     the tinker line moves into the collage, the lime block behind the eggs becomes the lime page…).
   - Each scene comes to rest as a "beat" (a held spread). While a beat holds, its pieces drift a few
     pixels so the page never feels dead. If you stop scrolling between beats, the page eases on to
     the nearest one, like a page falling open.
   - Lenis gives the wheel a little momentum so motion glides instead of stepping.
   - Phones keep simpler, separate scenes. Reduced motion / no JavaScript: a still page in reading order.
   Timings are in "screens": 1 = one screen height of scrolling. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  root.classList.remove('motion-pending');

  /* ---------------- navigation ---------------- */
  var nav = document.querySelector('.nav');
  var label = nav.querySelector('.nav-label');
  var labelText = nav.querySelector('.nav-label-text');
  var menu = document.getElementById('nav-menu');
  var bar = nav.querySelector('.nav-progress-bar');
  var cover = document.getElementById('cover');
  var stageMode = false;           // true on desktop with motion: nav state then comes from the master timeline
  var jumpTo = null;               // set by the stage: menu links jump to beats

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    label.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  }
  label.addEventListener('click', function () { setOpen(menu.hidden); });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    setOpen(false);
    if (jumpTo) { e.preventDefault(); jumpTo(a.getAttribute('href').slice(1)); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  // progress line: hidden until the pointer comes near the top edge (or the menu is open)
  document.addEventListener('mousemove', function (e) { nav.classList.toggle('is-hot', e.clientY < 64); }, { passive: true });

  function setLabel(name) { if (name && labelText.textContent !== name) labelText.textContent = name; }
  function updateProgress() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  var navTargets = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var darkZones = Array.prototype.slice.call(document.querySelectorAll('.dark-zone, #possible'));
  var coverGone = false;
  function updateFlowNav() {   // phones and still page: work the label out from what's on screen
    var y = innerHeight * 0.4, current = null;
    navTargets.forEach(function (el) { if (el.getBoundingClientRect().top <= y) current = el; });
    if (current) setLabel(current.getAttribute('data-nav'));
    var dark = false;
    darkZones.forEach(function (el) {
      if (el.id === 'possible' && !el.classList.contains('dark-now')) return;
      var r = el.getBoundingClientRect(); if (r.top <= 30 && r.bottom > 30) dark = true;
    });
    nav.classList.toggle('on-dark', dark);
    var visible = coverGone || cover.getBoundingClientRect().bottom < innerHeight * 0.15;
    nav.classList.toggle('is-visible', visible);
    if (!visible) setOpen(false);
  }
  function onScroll() { updateProgress(); if (!stageMode) updateFlowNav(); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!hasGsap || reduce) return;   // still page, everything already visible

  /* ---------------- shared set-up ---------------- */
  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);
  var q = function (s, ctx) { return (ctx || document).querySelector(s); };
  var qa = function (s, ctx) { return gsap.utils.toArray((ctx || document).querySelectorAll(s)); };
  var screens = function (n) { return function () { return '+=' + Math.round(n * innerHeight); }; };

  // smooth scrolling with a little momentum (mouse wheels and trackpads; phones keep native touch scrolling)
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.85, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToY(y, dur) {
    if (lenis) lenis.scrollTo(y, { duration: dur || 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // the cover title types itself out on load, letter by letter, then holds
  (function () {
    var title = q('.cover-title'), full = title.textContent;
    title.setAttribute('aria-label', full);
    title.textContent = '';
    var letters = full.split('').map(function (ch) {
      var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      title.appendChild(s); return s;
    });
    gsap.set(letters, { opacity: 0 });
    gsap.to(letters, { opacity: 1, duration: 0.05, stagger: 0.075, delay: 0.6, ease: 'none' });
  })();

  // words that unfurl one after another (layout never shifts)
  function unfurl(el) {
    var full = el.getAttribute('data-text');
    el.setAttribute('aria-label', full);
    el.textContent = '';
    var words = full.split(' ').map(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      if (i) el.appendChild(document.createTextNode(' '));
      el.appendChild(s); return s;
    });
    gsap.set(words, { autoAlpha: 0, y: 6 });
    return words;
  }
  // an element's resting box inside a container, ignoring any transforms GSAP has applied
  function restBox(el, stop) {
    var x = 0, y = 0, n = el;
    while (n && n !== stop) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
  }
  function spreadBox() {   // the printed spread, centred on screen
    var sw = Math.min(innerWidth - 32, (innerHeight - 32) * 1.4205), sh = sw / 1.4205;
    return { left: (innerWidth - sw) / 2, top: (innerHeight - sh) / 2, width: sw, height: sh };
  }
  // the protein seed → frame measurement (shared by both layouts)
  function growTo(seed, frame, prop) {
    return function () {
      var s = seed.getBoundingClientRect(), f = frame.getBoundingClientRect();
      var sx = gsap.getProperty(seed, 'x'), sy = gsap.getProperty(seed, 'y'), sc = gsap.getProperty(seed, 'scaleX'), scy = gsap.getProperty(seed, 'scaleY');
      var w0 = s.width / sc, h0 = s.height / scy, l0 = s.left - sx, t0 = s.top - sy;
      var fx = gsap.getProperty(frame, 'x'), fy = gsap.getProperty(frame, 'y');
      return { x: (f.left - fx) - l0, y: (f.top - fy) - t0, scaleX: f.width / w0, scaleY: f.height / h0 }[prop];
    };
  }

  var mm = gsap.matchMedia();

  /* =====================================================================
     DESKTOP: one stage, one timeline
     ===================================================================== */
  mm.add('(min-width: 900px)', function () {
    stageMode = true;
    root.classList.add('stage-mode');
    var track = q('.stage-track'), stage = q('.stage');
    var L = {};
    ['opening', 'opener-1', 'proteins', 'collage', 'amino', 'counting', 'search', 'vine', 'possible', 'opener-2']
      .forEach(function (id) { L[id] = document.getElementById(id); });
    var tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
    var beats = [];        // [start, end, name]
    var navMarks = [];     // [time, label, dark]

    /* ---- the vocabulary: everything travels UP through a deep space ----
       arrive: comes up from below and settles into its printed place
       depart: carries on upward and out of view (nearer things faster than far ones)
       fades are kept for three things only: chapter changes through black, words appearing, the cover handing over */
    function show(layer, at) { tl.set(layer, { visibility: 'visible' }, at); }
    function hide(layer, at) { tl.set(layer, { visibility: 'hidden' }, at); }
    function arrive(els, at, d, from) {
      tl.fromTo(els, { y: function () { return innerHeight * (from || 0.55); }, autoAlpha: 0 },
                     { y: 0, autoAlpha: 1, duration: d || 0.6, ease: 'power3.out', immediateRender: false }, at);
    }
    function depart(els, at, d) {
      gsap.utils.toArray(els).forEach(function (el, i) {
        tl.to(el, { y: function () { var r = restBox(el, stage); return '-=' + (r.top + r.height + 80); }, duration: (d || 0.8) + (i % 3) * 0.08, ease: 'power2.in' }, at);
      });
    }
    function fadeIn(els, at, d) { tl.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: d || 0.4, immediateRender: false }, at); }
    function fadeOut(els, at, d) { tl.to(els, { autoAlpha: 0, duration: d || 0.4 }, at); }
    function beat(name, at, dur) {   // a held spread: still, so the pause reads as a pause
      tl.addLabel(name, at);
      beats.push([at, at + dur, name]);
      tl.to({}, { duration: dur }, at);
    }
    function mark(at, name, dark) { navMarks.push([at, name, !!dark]); }

    Object.keys(L).forEach(function (k) { if (k !== 'opening') gsap.set(L[k], { visibility: 'hidden' }); });

    /* 0 · cover (title has typed itself out on load) → fades to the plain "Anthrogen" page */
    var coverEl = q('#cover'), titleWord = q('.title-word');
    mark(0, '', false);
    beat('cover', 0, 0.8);
    fadeOut(coverEl, 0.8, 0.6);
    mark(1.0, 'Anthrogen', false);
    beat('title', 1.4, 0.6);

    /* 1 · fade to black: I. Instruments of Abundance, white on black */
    var o1 = L['opener-1'], o1text = qa('.col-r > *', o1);
    gsap.set(o1, { autoAlpha: 0 }); gsap.set(o1text, { autoAlpha: 0 });
    tl.to(o1, { autoAlpha: 1, duration: 0.6 }, 2.0);
    fadeIn(o1text, 2.5, 0.4);
    hide(L.opening, 2.65);
    mark(2.3, 'I. Instruments of Abundance', true);
    beat('opener1', 2.9, 0.7);

    /* 2 · back up to paper; p. 5 rises in; the seed grows into the protein */
    var P = L.proteins, seed = q('.seed', P), frame = q('.pframe', P), p5 = q('.p5-text', P);
    var lowA = q('.lower', P), lowB = q('.lower-b', P), p7a = q('.p7a', P), p7b = q('.p7b', P), poses = qa('.pose', P);
    var bounce = q('.pw-bounce', P), wiggle = q('.pw-wiggle', P), walk = q('.pw-walk', P), words = [bounce, wiggle, walk];
    function placeB() { lowB.style.top = (lowA.offsetTop + lowA.offsetHeight + parseFloat(getComputedStyle(p7a).fontSize) * 0.7) + 'px'; }
    placeB(); ScrollTrigger.addEventListener('refreshInit', placeB);
    gsap.set([p5, seed, frame, p7a, p7b].concat(words), { autoAlpha: 0 });
    gsap.set(poses.slice(1), { autoAlpha: 0 });
    fadeOut(o1text, 3.6, 0.3);
    tl.to(o1, { autoAlpha: 0, duration: 0.5 }, 3.8);
    mark(3.95, 'I. Instruments of Abundance', false);
    show(P, 3.9);
    hide(o1, 4.3);
    arrive([p5, seed], 4.1, 0.7);
    beat('p5', 4.8, 0.5);
    tl.to(p5, { y: function () { return '-=' + (restBox(p5, stage).top + 200); }, duration: 0.6, ease: 'power2.in' }, 5.3)
      .to(seed, { x: growTo(seed, frame, 'x'), y: growTo(seed, frame, 'y'), scaleX: growTo(seed, frame, 'scaleX'), scaleY: growTo(seed, frame, 'scaleY'), ease: 'power2.inOut', duration: 0.6 }, 5.3)
      .to(q('.seed-img', seed), { autoAlpha: 0, duration: 0.15 }, 5.45)
      .to(frame, { autoAlpha: 1, duration: 0.1 }, 5.9)
      .set(seed, { autoAlpha: 0 }, 6.01);

    /* 3 · the protein spread builds: ¶1–2, the poses, ¶3 */
    arrive(p7a, 6.0, 0.7);
    beat('p7a', 6.7, 0.6);
    tl.to(poses[1], { autoAlpha: 1, duration: 0.08 }, 7.35)
      .to(frame, { y: '-=4%', duration: 0.08, ease: 'power2.out' }, 7.35)
      .to(frame, { y: '+=4%', duration: 0.1, ease: 'bounce.out' }, 7.43)
      .to(bounce, { autoAlpha: 1, duration: 0.12 }, 7.4)
      .to(frame, { rotation: 2.2, duration: 0.06 }, 7.7)
      .to(frame, { rotation: -2.2, duration: 0.08 }, 7.76)
      .to(frame, { rotation: 0, duration: 0.06 }, 7.84)
      .to(wiggle, { autoAlpha: 1, duration: 0.12 }, 7.75)
      .to(poses[2], { autoAlpha: 1, duration: 0.08 }, 8.05)
      .to(poses[3], { autoAlpha: 1, duration: 0.08 }, 8.4)
      .to(frame, { x: '6%', duration: 0.3, ease: 'power1.inOut' }, 8.4)    // the protein's own little walk
      .to(walk, { autoAlpha: 1, duration: 0.12 }, 8.5);
    arrive(p7b, 8.8, 0.7);
    beat('proteins', 9.5, 1.0);

    /* 4 · travel on: the protein spread rises away while the collage rises in, each image at its own depth;
       the line appears once they have landed */
    var C = L.collage, tinker = q('.tinker', C), items = qa('.c-item', C);
    gsap.set(items, { autoAlpha: 0 }); gsap.set(tinker, { autoAlpha: 0 });
    depart([p7a, p7b, frame, bounce, wiggle, walk], 10.5, 0.8);
    show(C, 10.55);
    hide(P, 11.6);
    var DEPTH = [-0.6, 0.4, 0.9, -0.2, 0.7, -0.9, 0.1, -0.5, 0.8, -0.1, 0.3];   // -1 far back … 1 close to the reader
    var order = items.map(function (el, i) { return i; }).sort(function (a, b) { return items[a].offsetTop - items[b].offsetTop; });
    order.forEach(function (idx, k) {
      var el = items[idx], d = DEPTH[idx];
      tl.fromTo(el,
        { y: function () { return innerHeight * (0.8 + 0.25 * (1 - d) / 2); }, z: -420 + d * 300, rotationX: 48 - d * 12, rotationY: d * 9,
          transformPerspective: 1100, transformOrigin: '50% 100%', autoAlpha: 0 },
        { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, duration: 0.9 - d * 0.12, ease: 'power3.out', immediateRender: false },
        10.7 + k * 0.1);
    });
    fadeIn(tinker, 12.55, 0.45);
    beat('collage', 13.0, 1.0);

    /* 5 · move through the collage: near images slip past quickly and slightly larger, far ones lag behind.
       The lime page with the two diagrams rises in on the left; its three lines follow into their places. */
    var A = L.amino, panel = q('.amino-panel', A), aLines = qa('.amino-text p', A);
    gsap.set(aLines, { autoAlpha: 0 });
    items.forEach(function (el, i) {
      var d = DEPTH[i];
      tl.to(el, { y: function () { var r = restBox(el, stage); return '-=' + (r.top + r.height + 120); }, z: d * 160,
                  duration: 1.05 - d * 0.3, ease: 'power1.in' }, 14.0 + (1 - d) * 0.08);
    });
    tl.to(tinker, { y: function () { return '-=' + (innerHeight * 0.6); }, autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, 14.05);
    show(A, 14.35);
    tl.fromTo(panel, { y: function () { return innerHeight; } }, { y: 0, duration: 1.0, ease: 'power3.out', immediateRender: false }, 14.35);
    hide(C, 15.4);
    aLines.forEach(function (el, i) { arrive(el, 14.9 + i * 0.18, 0.75, 0.6); });
    beat('amino', 15.9, 1.3);

    /* 6 · the lime page rises away; the counting spread rises in, its six images one by one, left to right */
    var K = L.counting, kText = q('.page.verso .ptext', K), kText2 = q('.page.recto .ptext', K), sItems = qa('.s-item', K);
    var p11a = q('.p11a', K), p11b = q('.p11b', K), imagine = q('.imagine', K);
    var p11first = document.createElement('span'); p11first.className = 'p11-first';
    if (p11a.firstChild && p11a.firstChild.nodeType === 3) { var tn = p11a.firstChild; p11a.insertBefore(p11first, tn); p11first.appendChild(tn); }
    gsap.set([kText, p11first, imagine, p11b].concat(sItems), { autoAlpha: 0 });
    tl.to(panel, { y: function () { return -innerHeight * 1.05; }, duration: 1.0, ease: 'power2.in' }, 17.2);
    depart(aLines, 17.2, 0.8);
    show(K, 17.4);
    arrive(kText, 17.75, 0.7);
    hide(A, 18.3);
    beat('counting1', 18.45, 0.4);
    sItems.forEach(function (el, i) { arrive(el, 18.85 + i * 0.22, 0.55, 0.45); });
    arrive(p11first, 20.4, 0.5, 0.25);
    fadeIn(imagine, 20.8, 0.3);
    beat('imagine', 21.1, 0.7);                 // "for a second": a pause
    arrive(p11b, 21.8, 0.6, 0.3);
    beat('counting', 22.4, 1.1);

    /* 7 · p. 14: the counting spread rises away; each paragraph rises in on its own;
       then the chart draws while the closing line arrives */
    var S = L.search, paras = qa('.p14-text p', S), chart = q('.chart', S), oneway = q('.oneway', S), clip = q('.wclip-rect', S);
    gsap.set(paras.concat([chart, oneway]), { autoAlpha: 0 });
    gsap.set(clip, { attr: { width: 0 } });
    depart([kText, kText2, p11b].concat(sItems), 23.5, 0.8);
    show(S, 23.7);
    arrive(paras[0], 24.1, 0.7);
    hide(K, 24.6);
    beat('p14a', 24.8, 0.55);
    arrive(paras[1], 25.35, 0.7);
    beat('p14b', 26.05, 0.35);
    arrive(chart, 26.4, 0.6, 0.35);
    tl.to(clip, { attr: { width: 262 }, duration: 0.85 }, 26.5);
    arrive(oneway, 26.45, 0.7, 0.4);
    beat('search', 27.35, 1.3);

    /* 8 · p. 15: the page rises away; the vine grows up into the centre; the sentence's words appear in place,
       the gap sitting on the tendril; it holds */
    var V = L.vine, vine = q('.vine', V), travel = q('.travel', V), gap = q('.gap', V), halves = qa('.h1, .h2', travel);
    var T0 = 0.638, T1 = 0.747;   // measured from the image: the tendril's span where the line crosses it
    function sizeGap() {
      var pad = parseFloat(getComputedStyle(travel).fontSize) * 0.45;
      gap.style.width = ((T1 - T0) * vine.offsetWidth + 2 * pad) + 'px';
      // the sentence sits still, positioned so the gap lies on the tendril
      var v = restBox(vine, stage), mid = v.left + v.width * (T0 + T1) / 2;
      travel.style.left = (mid - (gap.offsetLeft + gap.offsetWidth / 2)) + 'px';
    }
    sizeGap(); ScrollTrigger.addEventListener('refreshInit', sizeGap);
    gsap.set([vine].concat(halves), { autoAlpha: 0 });
    depart(paras.concat([chart, oneway]), 28.65, 0.8);
    show(V, 28.8);
    tl.fromTo(vine, { y: function () { return innerHeight; }, autoAlpha: 1 }, { y: 0, duration: 1.1, ease: 'power3.out', immediateRender: false }, 28.85);
    hide(S, 29.6);
    fadeIn(halves[0], 29.75, 0.4);
    fadeIn(halves[1], 30.05, 0.4);
    beat('vine', 30.5, 1.2);

    /* 9 · pp. 16–17: the vine rises away; the boxes rise in and their words unfurl; then the question.
       Then the boxes fade, the question moves to the centre at its own size, alone on the paper. Then black, and II. */
    var Q = L.possible, b1 = q('.box1', Q), b2 = q('.box2', Q), qn = q('.question', Q), qBig = q('.question-big', Q);
    var typed = qa('.type', Q).map(unfurl);
    gsap.set([b1, b2], { autoAlpha: 0 });
    tl.to(travel, { y: function () { return '-=' + (restBox(travel, stage).top + 120); }, duration: 0.6, ease: 'power1.in' }, 31.7);
    depart(vine, 31.75, 0.9);
    show(Q, 31.9);
    arrive(b1, 32.4, 0.7);                        // the sentence has cleared before the first box arrives
    hide(V, 32.8);
    tl.to(typed[0], { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power1.out', stagger: 0.07 }, 32.85);
    arrive(b2, 33.45, 0.7);
    tl.to(typed[1], { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power1.out', stagger: 0.07 }, 33.9)
      .to(typed[2], { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power1.out', stagger: 0.07 }, 34.35);
    beat('possible', 34.75, 1.0);
    var qSize = function () { return parseFloat(getComputedStyle(qn).fontSize); };
    var qCenter = function (axis) { return function () { var r = restBox(qn, stage); return axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2; }; };
    tl.set(qn, { autoAlpha: 0 }, 35.75)
      .fromTo(qBig, { left: qCenter('x'), top: qCenter('y'), fontSize: qSize, autoAlpha: 1 },
                    { left: function () { return innerWidth / 2; }, top: function () { return innerHeight / 2; },
                      duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 35.75);
    fadeOut([b1, b2], 35.75, 0.6);
    beat('question', 36.7, 1.1);                  // alone on the paper
    var o2 = L['opener-2'], o2text = qa('.col-r > *', o2);
    gsap.set(o2, { autoAlpha: 0 }); gsap.set(o2text, { autoAlpha: 0 });
    fadeOut(qBig, 37.8, 0.35);
    show(o2, 37.95);
    tl.to(o2, { autoAlpha: 1, duration: 0.6 }, 37.95);
    fadeIn(o2text, 38.5, 0.4);
    hide(Q, 38.6);
    mark(38.1, 'II. The Fringes of Reason', true);
    beat('opener2', 38.9, 1.0);
    var TOTAL = 40.1;
    tl.to({}, { duration: 0.2 }, TOTAL - 0.2);

    /* ---- connect the timeline to the scrollbar ---- */
    function sizeTrack() { track.style.height = ((TOTAL + 1) * innerHeight) + 'px'; }
    sizeTrack(); ScrollTrigger.addEventListener('refreshInit', sizeTrack);
    var st = ScrollTrigger.create({
      trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.7, animation: tl, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var t = self.progress * TOTAL, name = '', dark = false;
        navMarks.forEach(function (m) { if (t >= m[0]) { name = m[1]; dark = m[2]; } });
        setLabel(name); nav.classList.toggle('on-dark', dark);
        var visible = t > 1.0; nav.classList.toggle('is-visible', visible); if (!visible) setOpen(false);
        menu.querySelectorAll('a').forEach(function (a) {
          var id = a.getAttribute('href').slice(1);
          var on = (id === 'cover' && t < 2.3) || (id === 'section-1' && t >= 2.3 && t < 38.1) || (id === 'section-2' && t >= 38.1);
          a.setAttribute('aria-current', on ? 'true' : 'false');
        });
      }
    });
    var yFor = function (time) { return st.start + (time / TOTAL) * (st.end - st.start); };

    /* ---- beats: if the reader stops between two spreads, ease on to the next one ---- */
    var idle, dir = 1, snapping = false;
    var noSnap = /[?&]nosnap\b/.test(location.search);   // for testing transitions frame by frame
    function settle() {
      if (snapping || noSnap) return;
      var t = (scrollY - st.start) / (st.end - st.start) * TOTAL;
      if (t <= 0 || t >= TOTAL) return;
      for (var i = 0; i < beats.length; i++) if (t >= beats[i][0] - 0.02 && t <= beats[i][1] + 0.02) return;   // already resting on a beat
      var target = null;
      if (dir > 0) { for (i = 0; i < beats.length; i++) if (beats[i][0] > t) { target = beats[i][0] + 0.05; break; } }
      else { for (i = beats.length - 1; i >= 0; i--) if (beats[i][1] < t) { target = beats[i][1] - 0.05; break; } }
      if (target === null || Math.abs(target - t) > 1.8) return;
      snapping = true;
      scrollToY(yFor(target), 0.6 + Math.min(1, Math.abs(target - t)) * 0.7);
      setTimeout(function () { snapping = false; }, 1400);
    }
    function onMove(delta) { if (delta) dir = delta > 0 ? 1 : -1; clearTimeout(idle); idle = setTimeout(settle, 220); }
    var lastY = scrollY;
    if (lenis) lenis.on('scroll', function (e) { onMove(e.direction); });
    else addEventListener('scroll', function () { onMove(scrollY - lastY); lastY = scrollY; }, { passive: true });

    // menu links jump to their beat
    jumpTo = function (id) { var name = { cover: 'cover', 'section-1': 'opener1', 'section-2': 'opener2' }[id]; scrollToY(yFor(tl.labels[name] + 0.05), 1.6); };

    return function () {   // leaving desktop size: undo
      stageMode = false; jumpTo = null;
      root.classList.remove('stage-mode');
      track.style.height = '';
    };
  });

  /* =====================================================================
     PHONES: separate scenes in the page flow
     ===================================================================== */
  mm.add('(max-width: 899px)', function () {
    var rise = function () { return innerHeight * 0.45; };

    // the cover holds, then fades to the title page
    gsap.timeline({ scrollTrigger: { trigger: '#opening', start: 'top top', end: screens(1.4), pin: true, scrub: true,
      onUpdate: function (s) { coverGone = s.progress > 0.92; } } })
      .to({}, { duration: 0.7 }).to('#cover', { autoAlpha: 0, ease: 'none', duration: 0.7 });

    // section opener texture breathes in and out
    qa('.opener-texture').forEach(function (tex) {
      gsap.set(tex, { opacity: 0 });
      gsap.timeline({ scrollTrigger: { trigger: tex.parentNode, start: 'top 85%', end: 'bottom 15%', scrub: true, refreshPriority: -1 } })
        .to(tex, { opacity: 0.9, duration: 0.35 }).to(tex, { opacity: 0.9, duration: 0.3 }).to(tex, { opacity: 0, duration: 0.35 });
    });

    // proteins: one block of text at a time under the frame
    (function () {
      var P = q('#proteins'), seed = q('.seed', P), frame = q('.pframe', P), p5 = q('.p5-text', P);
      var p7a = q('.p7a', P), p7b = q('.p7b', P), poses = qa('.pose', P);
      var words = [q('.pw-bounce', P), q('.pw-wiggle', P), q('.pw-walk', P)];
      gsap.set(poses.slice(1), { autoAlpha: 0 }); gsap.set([frame, p7a, p7b].concat(words), { autoAlpha: 0 });
      var t = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: P, start: 'top top', end: screens(7), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      t.to(p5, { y: function () { return -(p5.offsetTop + p5.offsetHeight + 20); }, duration: 0.7 }, 0.4)
       .to(seed, { x: growTo(seed, frame, 'x'), y: growTo(seed, frame, 'y'), scaleX: growTo(seed, frame, 'scaleX'), scaleY: growTo(seed, frame, 'scaleY'), ease: 'power1.inOut', duration: 0.5 }, 0.45)
       .to(q('.seed-img', seed), { autoAlpha: 0, duration: 0.15 }, 0.6)
       .to(frame, { autoAlpha: 1, duration: 0.12 }, 0.95).set(seed, { autoAlpha: 0 }, 1.08)
       .fromTo(p7a, { y: rise, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 1.1)
       .to({}, { duration: 0.6 }, 1.7)
       .to(p7a, { autoAlpha: 0, duration: 0.15 }, 2.3)
       .to(poses[1], { autoAlpha: 1, duration: 0.08 }, 2.45).to(words[0], { autoAlpha: 1, duration: 0.1 }, 2.5)
       .to(words[1], { autoAlpha: 1, duration: 0.1 }, 2.85)
       .to(poses[2], { autoAlpha: 1, duration: 0.08 }, 3.2)
       .to(poses[3], { autoAlpha: 1, duration: 0.08 }, 3.6).to(words[2], { autoAlpha: 1, duration: 0.1 }, 3.7)
       .to(words, { autoAlpha: 0, duration: 0.15 }, 4.1)
       .fromTo(p7b, { y: rise, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 4.2)
       .to({}, { duration: 1.1 }, 4.8)
       .to([frame, p7b], { autoAlpha: 0, y: '-=40', duration: 0.6 }, 5.9).to({}, { duration: 0.3 }, 6.5);
    })();

    // collage: the images float up in depth as their page arrives; the tinker line appears once they're in
    qa('#collage .page').forEach(function (pg) {
      qa('.c-item', pg).forEach(function (el, i) {
        gsap.from(el, { y: 120 + (i % 3) * 40, rotationX: 40, transformPerspective: 900, transformOrigin: '50% 100%', autoAlpha: 0, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 105%', end: 'top 55%', scrub: 0.6 } });
      });
    });
    gsap.from('#collage .tinker', { autoAlpha: 0, scrollTrigger: { trigger: '#collage .page.verso', start: 'top 25%', end: 'top 5%', scrub: 0.5 } });
    // counting and p. 14: each block fades in as it arrives; the waves draw as the chart passes
    qa('#counting .s-item, #counting .ptext, #search .p14-text p, #search .oneway').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 16, scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 60%', scrub: 0.5 } });
    });
    var clip = q('#search .wclip-rect'); gsap.set(clip, { attr: { width: 0 } });
    gsap.to(clip, { attr: { width: 262 }, ease: 'none', scrollTrigger: { trigger: '#search .chart', start: 'top 85%', end: 'top 35%', scrub: 0.5 } });

    // pp. 16–17: words unfurl; the question grows (real text) as the page goes dark
    (function () {
      var Q = q('#possible'), b1 = q('.box1', Q), b2 = q('.box2', Q), qn = q('.question', Q), qBig = q('.question-big', Q);
      var typed = qa('.type', Q).map(unfurl);
      var qSize = function () { return parseFloat(getComputedStyle(qn).fontSize); };
      var qc = function (axis) { return function () { var r = restBox(qn, Q); return axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2; }; };
      var t = gsap.timeline({ scrollTrigger: { trigger: Q, start: 'top top', end: screens(5.2), pin: true, scrub: 0.5, invalidateOnRefresh: true,
        onUpdate: function (s) { Q.classList.toggle('dark-now', s.progress > 0.88); } } });
      t.to({}, { duration: 0.25 }, 0)
       .to(typed[0], { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.07 }, 0.25)
       .to(typed[1], { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.07 }, 1.45)
       .to(typed[2], { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.07 }, 2.0)
       .to({}, { duration: 0.6 }, 2.4)
       .set(qn, { autoAlpha: 0 }, 3.0)
       .fromTo(qBig, { left: qc('x'), top: qc('y'), fontSize: qSize, autoAlpha: 1, color: '#231f20' },
                     { left: function () { return Q.offsetWidth / 2; }, top: function () { return Q.offsetHeight / 2; },
                       duration: 0.6, ease: 'power2.inOut', immediateRender: false }, 3.0)
       .to([b1, b2], { autoAlpha: 0, duration: 0.5 }, 3.0)
       .to({}, { duration: 0.9 }, 3.6)
       .to(qBig, { autoAlpha: 0, duration: 0.3 }, 4.5)
       .to(Q, { backgroundColor: '#110e0c', duration: 0.4 }, 4.6)


    })();
  });

  // fonts change text widths: re-measure once they have loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
