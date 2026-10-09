/* Anthrogen · Biological Abundance — scroll scenes.

   How it moves (round 7)
   - The story is a run of MOMENTS (about half a screen of scrolling each, with a light snap, so one
     flick of the wheel or one swipe moves you on).
   - Scrolling PUSHES what is leaving up and out, in step with your scroll.
   - Arriving at a moment plays its ENTRANCE by itself: a fade with a slight rise (panels rise from below),
     and FOLLOWERS that come in a moment later, when a reader would get to them.
   - Scrolling back runs everything backwards.
   - Desktop: all scenes are layers in ONE fixed stage. Phones: the page scrolls, each piece plays as it
     reaches the screen, and the protein and green-box scenes hold for a few swipes.
   - Reduced motion / no JavaScript: a still page in reading order.
   Scroll distances are in "screens" (1 = one screen height); entrance timings are in seconds. */
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
  var lastGrainY = -999;
  function shuffleGrain() {   // living grain: a new grain pattern every ~28px of scroll; perfectly still when you stop
    if (reduce || Math.abs(scrollY - lastGrainY) < 28) return;
    lastGrainY = scrollY;
    root.style.setProperty('--gx', Math.round(Math.random() * 220) + 'px');
    root.style.setProperty('--gy', Math.round(Math.random() * 220) + 'px');
  }
  function onScroll() { updateProgress(); shuffleGrain(); if (!stageMode) updateFlowNav(); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- pp. 30–31: the hairline arrows ----------------
     Drawn from where the text blocks really sit (screen type is larger than print, so lines can wrap
     differently); each route copies the printed one: down, across, up, into the next block. */
  function offBox(el, stop) {
    var x = 0, y = 0, n = el;
    while (n && n !== stop) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight };
  }
  function lineBoxes(el, box) {   // first and last line of a block, in the same coordinates as box
    var rg = document.createRange(); rg.selectNodeContents(el);
    var er = el.getBoundingClientRect(), rows = [];
    Array.prototype.forEach.call(rg.getClientRects(), function (c) {
      if (c.width < 1) return;
      var top = c.top - er.top, row = null;
      rows.forEach(function (w) { if (Math.abs(w.t - top) < c.height * 0.5) row = w; });
      if (!row) rows.push({ t: top, b: c.bottom - er.top, l: c.left - er.left, r: c.right - er.left });
      else { row.l = Math.min(row.l, c.left - er.left); row.r = Math.max(row.r, c.right - er.left); row.b = Math.max(row.b, c.bottom - er.top); }
    });
    rows.sort(function (a, b) { return a.t - b.t; });
    var abs = function (w) { return { l: box.l + w.l, r: box.l + w.r, t: box.t + w.t, b: box.t + w.b, mid: box.t + (w.t + w.b) / 2 }; };
    return { fl: abs(rows[0]), ll: abs(rows[rows.length - 1]) };
  }
  function drawConnectors() {
    var layer = document.getElementById('s30');
    if (!layer || innerWidth < 900) return;
    var svg = layer.querySelector('.connectors svg'), sp = layer.querySelector('.spread');
    var S0 = offBox(sp, layer), k = sp.offsetWidth / 708.66, xg = S0.l + 384.2 * k;   // xg: the inner margin of the right-hand page
    var fb = [];
    for (var i = 0; i < 10; i++) {
      var el = layer.querySelector('.fb' + i), b = offBox(el, layer), ln = lineBoxes(el, b);
      b.fl = ln.fl; b.ll = ln.ll; b.mid = (b.t + b.b) / 2; fb.push(b);
    }
    var clampIn = function (x, T) { return Math.min(x, T.r - 10 * k); };
    var R = [
      function (S, T) { var x = S.l + 13 * k; return [[x, S.b + 3 * k], [x, T.mid], [T.l - 8.7 * k, T.mid]]; },
      function (S, T) { var x = S.l + 10.2 * k; return [[x, S.b + 6 * k], [x, T.mid], [T.l - 11.5 * k, T.mid]]; },
      function (S, T) { var x0 = Math.min(S.ll.r + 12 * k, xg - 8 * k), y = S.ll.mid; return [[x0, y], [xg, y], [xg, T.mid], [T.l - 5 * k, T.mid]]; },
      function (S, T) { var y = S.fl.mid, xc = clampIn(S.fl.r + 33.7 * k, T); return [[S.fl.r + 10.7 * k, y], [xc, y], [xc, T.t - 6 * k]]; },
      function (S, T) { var x0 = Math.min(S.l + 161.3 * k, S.r - 5 * k), ym = (S.b + T.t) / 2, x1 = T.l + 66.7 * k; return [[x0, S.b + 2 * k], [x0, ym], [x1, ym], [x1, T.t - 7 * k]]; },
      function (S, T) { var y = S.fl.b, xc = clampIn(S.fl.r + 52.2 * k, T); return [[S.fl.r + 6.5 * k, y], [xc, y], [xc, T.t - 9 * k]]; },
      function (S, T) { var x = S.l + 102.4 * k; return [[x, S.b + 12 * k], [x, T.t - 7 * k]]; },
      function (S, T) { var y = S.fl.mid + 3 * k, yu = T.t - 36 * k, x2 = T.l + 114.3 * k; return [[S.fl.r + 13.7 * k, y], [xg, y], [xg, yu], [x2, yu], [x2, T.t - 8 * k]]; },
      function (S, T) { var x = S.l + 5.4 * k, y = T.fl.b; return [[x, S.b + 8 * k], [x, y], [T.l - 16.3 * k, y]]; }
    ];
    R.forEach(function (fn, n) {
      var pts = fn(fb[n], fb[n + 1]);
      svg.querySelector('[data-cn="' + n + '"]').setAttribute('d', 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'));
      var a = pts[pts.length - 2], e = pts[pts.length - 1], dx = e[0] - a[0], dy = e[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len; dy /= len;
      var hl = 3.2 * k, hw = 3 * k, bx = e[0] - dx * hl, by = e[1] - dy * hl;
      svg.querySelector('[data-head="' + n + '"]').setAttribute('d', 'M' + (bx - dy * hw).toFixed(1) + ' ' + (by + dx * hw).toFixed(1) +
        ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) + ' L' + (bx + dy * hw).toFixed(1) + ' ' + (by - dx * hw).toFixed(1));
    });
  }
  drawConnectors();
  addEventListener('resize', drawConnectors);
  addEventListener('load', drawConnectors);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawConnectors);

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
  // the same, for text that keeps its italics: each word becomes its own span
  function unfurlWords(el) {
    if (el._words) return el._words;
    var out = [], nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); out.push(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    el._words = out; return out;
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

  /* ---------------- the prompt: a quiet "Scroll" under the title, arrows at chapter ends ---------------- */
  var prompt = q('.prompt'), promptText = q('.prompt-text', prompt), promptTimer = null, promptGo = null;
  function showPrompt(kind, dark, go) {
    prompt.hidden = false;
    prompt.className = 'prompt is-' + kind + (dark ? ' on-dark' : '');
    prompt.setAttribute('aria-label', kind === 'top' ? 'Back to the beginning' : kind === 'scroll' ? 'Scroll to begin' : 'Continue');
    promptText.textContent = kind === 'scroll' ? 'Scroll' : '';
    promptGo = go;
    requestAnimationFrame(function () { prompt.classList.add('is-on'); });
  }
  function hidePrompt() { prompt.classList.remove('is-on'); }
  prompt.addEventListener('click', function () { if (promptGo) promptGo(); hidePrompt(); });

  /* ---------------- shared entry vocabulary (time-based: plays by itself once its moment is reached) ---------------- */
  var DRIFT = 26;
  function enterIn(tl, els, at, o) {   // ENTER: fade in with a slight rise
    o = o || {};
    els = gsap.utils.toArray(els); if (!els.length) return;
    gsap.set(els, { autoAlpha: 0 });
    tl.fromTo(els, { autoAlpha: 0, translate: '0px ' + (o.drift || DRIFT) + 'px' },
      { autoAlpha: 1, translate: '0px 0px', duration: o.dur || 0.8, ease: 'power2.out', stagger: o.stagger || 0, immediateRender: false }, at || 0);
  }
  function fadeInT(tl, els, at, d) {
    els = gsap.utils.toArray(els); if (!els.length) return;
    gsap.set(els, { autoAlpha: 0 });
    tl.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: d || 0.7, ease: 'power1.out', immediateRender: false }, at || 0);
  }
  function fadeOutT(tl, els, at, d) {
    els = gsap.utils.toArray(els); if (!els.length) return;
    tl.fromTo(els, { autoAlpha: 1 }, { autoAlpha: 0, duration: d || 0.45, ease: 'power1.in', immediateRender: false }, at || 0);
  }
  function riseIn(tl, el, at, d) {     // RISE: a whole panel comes up from below the screen
    gsap.set(el, { autoAlpha: 0 });
    tl.fromTo(el, { autoAlpha: 1, translate: function () { return '0px ' + innerHeight + 'px'; } },
      { translate: '0px 0px', duration: d || 1.0, ease: 'power3.out', immediateRender: false }, at || 0);
  }
  function wordsIn(tl, el, at, gap) {  // UNFURL: word by word, in place
    var ws = unfurlWords(el);
    gsap.set(el, { autoAlpha: 0 }); gsap.set(ws, { autoAlpha: 0, y: 6 });
    tl.set(el, { autoAlpha: 1 }, at).to(ws, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power1.out', stagger: gap || 0.07 }, at);
    return 0.22 + (gap || 0.07) * (ws.length - 1);
  }
  function decodeIn(tl, el, at) {      // "Bit by bit,": each letter flickers through 0s and 1s, then settles
    if (!el._chars) {
      var txt = el.textContent; el.setAttribute('aria-label', txt); el.textContent = '';
      el._chars = txt.split('').map(function (ch) {
        var s = document.createElement('span'); s.className = 'bit'; s.setAttribute('aria-hidden', 'true');
        s.textContent = ch; s._ch = ch; el.appendChild(s); return s;
      });
    }
    var chars = el._chars, n = chars.length, prog = { p: 0 };
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, at).fromTo(prog, { p: 0 }, { p: 1, duration: 1.3, ease: 'none', immediateRender: false, onUpdate: function () {
      chars.forEach(function (s, i) {
        if (s._ch === ' ') return;
        var settle = 0.25 + (i / n) * 0.7;
        if (prog.p >= settle) s.textContent = s._ch;
        else s.textContent = Math.random() < 0.5 ? '0' : '1';
      });
    } }, at);
  }

  /* =====================================================================
     DESKTOP: one stage. The story is a run of MOMENTS.
     - Scrolling between two moments pushes what is leaving up and out, in step with the scroll.
     - Reaching a moment plays its entrance by itself (fades with a slight rise, followers at reading pace).
     - About half a screen of scrolling per moment; a light snap so one flick moves you on.
     ===================================================================== */
  mm.add('(min-width: 900px)', function () {
    stageMode = true;
    root.classList.add('stage-mode');
    var track = q('.stage-track'), stage = q('.stage');
    var LAYERS = qa('.stage .layer'), L = {};
    LAYERS.forEach(function (el) { L[el.id] = el; });
    gsap.set(LAYERS, { visibility: 'hidden' });
    L.opening.style.visibility = 'visible';
    var X = gsap.timeline({ paused: true, defaults: { ease: 'none' } });   // the scrolled part: pushes
    var MOM = [], pos = 0;

    function pushOut(els, start, dur, depthOf) {   // PUSH: carried up and out with the scroll
      gsap.utils.toArray(els).forEach(function (el, i) {
        var d = depthOf ? depthOf(el) : 0, k = 1 + d * 0.35;
        X.fromTo(el, { y: 0, scale: 1 }, { y: function () { var r = restBox(el, stage); return -(r.top + r.height + 100) * k; },
          scale: 1 + d * 0.12, duration: dur * (1 - (i % 3) * 0.06), immediateRender: false }, start + (i % 3) * 0.02 * dur);
      });
    }
    function moment(name, o) {
      var d = o.d || 0.55;
      if (MOM.length) pos += d;
      if (o.push) pushOut(o.push, pos - d, d, o.depthOf);
      var tl = gsap.timeline({ paused: true });
      if (o.enter) o.enter(tl);
      var prev = MOM[MOM.length - 1] || { layers: [], nav: '', dark: false };
      MOM.push({ name: name, at: pos, d: d, tl: tl, state: MOM.length ? 0 : 1, layers: o.layers || prev.layers,
                 nav: o.nav !== undefined ? o.nav : prev.nav, dark: o.dark !== undefined ? o.dark : prev.dark, prompt: o.prompt });
    }
    function layerTo(tl, layer, from, to, at, d) {
      tl.fromTo(layer, { opacity: from }, { opacity: to, duration: d || 0.6, ease: 'power1.inOut', immediateRender: false }, at || 0);
    }

    /* ---------- generated spreads (II and III): read data-m / data-d / data-move / data-out ---------- */
    var topLevel = function (layer) {
      return qa('[data-m]', layer).filter(function (el) {
        if (el.closest('svg')) return false;
        var p = el.parentElement.closest('[data-m]'); return !p || !layer.contains(p);
      });
    };
    var leavers = function (id) { return topLevel(L[id]).concat(qa('[data-leave]', L[id])); };
    function animIn(tl, el, at) {
      var mv = el.getAttribute('data-move') || 'enter';
      if (mv === 'enter') return enterIn(tl, el, at);
      if (mv === 'fade') return fadeInT(tl, el, at);
      if (mv === 'rise') return riseIn(tl, el, at);
      if (mv === 'unfurl') return wordsIn(tl, el, at);
      if (mv === 'decode') return decodeIn(tl, el, at);
      if (mv === 'lines') {
        var ls = qa('.ln', el); gsap.set(el, { autoAlpha: 0 }); gsap.set(ls, { autoAlpha: 0, y: 6 });
        tl.set(el, { autoAlpha: 1 }, at).to(ls, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.4 }, at);
        return;
      }
      if (mv === 'swell') {   // the lime bar opens from the middle, the question appears on it
        var bar = q('.hl-bar', el), tx = q('.hl-text', el);
        gsap.set(el, { autoAlpha: 0 }); gsap.set(bar, { scaleX: 0 }); gsap.set(tx, { autoAlpha: 0 });
        tl.set(el, { autoAlpha: 1 }, at).to(bar, { scaleX: 1, duration: 0.55, ease: 'power2.out' }, at).to(tx, { autoAlpha: 1, duration: 0.4 }, at + 0.3);
        return;
      }
      if (mv === 'draw') {    // a hairline arrow draws itself
        var head = q('[data-head="' + el.getAttribute('data-cn') + '"]', el.ownerSVGElement);
        gsap.set([el, head], { autoAlpha: 0 });
        tl.fromTo(el, { autoAlpha: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut', immediateRender: false }, at)
          .fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, immediateRender: false }, at + 0.45);
        return;
      }
      if (mv === 'eswap') {   // "int-e-rchang-e-able": the loose e's trade places, then sit exactly as printed
        enterIn(tl, el, at);
        var e1 = q('.ex1', el), e2 = q('.ex2', el);
        var dx = function () { return e2.offsetLeft - e1.offsetLeft; }, lift = function () { return parseFloat(getComputedStyle(el).fontSize) * 0.55; };
        tl.to(e1, { x: function () { return dx() / 2; }, y: function () { return -lift(); }, duration: 0.4, ease: 'power1.out' }, at + 1.0)
          .to(e1, { x: dx, y: 0, duration: 0.4, ease: 'power1.in' }, at + 1.4)
          .to(e2, { x: function () { return -dx() / 2; }, y: lift, duration: 0.4, ease: 'power1.out' }, at + 1.0)
          .to(e2, { x: function () { return -dx(); }, y: 0, duration: 0.4, ease: 'power1.in' }, at + 1.4);
      }
    }
    function invert(tl, layer, at) {   // the page turns black around what stays; what stays turns white, in place
      tl.fromTo(layer, { backgroundColor: 'rgba(17,14,12,0)' }, { backgroundColor: 'rgba(17,14,12,1)', duration: 0.4, ease: 'power1.in', immediateRender: false }, at);
      fadeOutT(tl, topLevel(layer).filter(function (el) { return !el.classList.contains('keep') && !el.querySelector('.keep'); }), at, 0.35);
      var keepText = qa('p.keep', layer);
      if (keepText.length) tl.fromTo(keepText, { color: '#231f20' }, { color: '#ffffff', duration: 0.4, immediateRender: false }, at);
    }
    function spread(id, o) {
      o = o || {};
      var layer = L[id], els = qa('[data-m]', layer), max = 0, inv = +layer.getAttribute('data-invert') || 0;
      els.forEach(function (el) { max = Math.max(max, +el.getAttribute('data-m')); });
      max = Math.max(max, inv);
      gsap.set(els, { autoAlpha: 0 });
      for (var k = 1; k <= max; k++) (function (k) {
        moment(id + '-' + k, {
          d: k === 1 ? (o.d1 || 0.9) : 0.55,
          layers: k === 1 ? (o.layers || [o.prev, id]) : [id],
          nav: k === 1 ? o.nav : undefined,
          dark: k === inv ? true : (k === 1 ? false : undefined),
          prompt: k === max ? o.prompt : undefined,
          push: k === 1 && o.prev ? (o.push || leavers(o.prev)) : null,
          enter: function (tl) {
            var off = 0;
            if (k === 1 && o.pre) { o.pre(tl); off = o.offset || 0.45; }
            els.forEach(function (el) { if (+el.getAttribute('data-m') === k) animIn(tl, el, off + (parseFloat(el.getAttribute('data-d')) || 0)); });
            qa('[data-out="' + k + '"]', layer).forEach(function (el) { fadeOutT(tl, el, off + (parseFloat(el.getAttribute('data-outd')) || 0)); });
            if (k === inv) invert(tl, layer, off);
          }
        });
      })(k);
    }

    /* ---------- Section I, moment by moment ---------- */
    var coverEl = q('#cover');
    moment('cover', { layers: ['opening'], nav: '', dark: false, prompt: 'scroll' });
    moment('title', { d: 0.6, nav: 'Anthrogen', enter: function (tl) { fadeOutT(tl, coverEl, 0, 0.7); } });

    var o1 = L['opener-1'], o1text = qa('.col-r > *', o1);
    gsap.set(o1, { opacity: 0 }); gsap.set(o1text, { autoAlpha: 0 });
    moment('opener1', { d: 0.7, layers: ['opening', 'opener-1'], nav: 'I. Instruments of Abundance', dark: true, enter: function (tl) {
      layerTo(tl, o1, 0, 1, 0, 0.7); fadeInT(tl, o1text, 0.6, 0.5);
    } });

    var P = L.proteins, seed = q('.seed', P), frame = q('.pframe', P), p5 = q('.p5-text', P), p5f = q('.p5-follow', P);
    var lowA = q('.lower', P), lowB = q('.lower-b', P), p7a = q('.p7a', P), p7b = q('.p7b', P), poses = qa('.pose', P);
    var bounce = q('.pw-bounce', P), wiggle = q('.pw-wiggle', P), walk = q('.pw-walk', P);
    function placeB() { lowB.style.top = (lowA.offsetTop + lowA.offsetHeight + parseFloat(getComputedStyle(p7a).fontSize) * 0.7) + 'px'; }
    placeB(); ScrollTrigger.addEventListener('refreshInit', placeB);
    gsap.set([frame, bounce, wiggle, walk], { autoAlpha: 0 }); gsap.set(poses.slice(1), { autoAlpha: 0 });
    moment('p5', { d: 0.7, layers: ['opener-1', 'proteins'], dark: false, enter: function (tl) {
      fadeOutT(tl, o1text, 0, 0.3); layerTo(tl, o1, 1, 0, 0.2, 0.6);
      enterIn(tl, p5, 0.6); fadeInT(tl, p5f, 2.6, 0.6);      // "proteins." comes once the sentence has been read
      fadeInT(tl, seed, 3.0, 0.6);
    } });
    moment('p7a', { layers: ['proteins'], push: [p5], enter: function (tl) {   // the seed grows into the protein
      tl.fromTo(seed, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, { x: growTo(seed, frame, 'x'), y: growTo(seed, frame, 'y'), scaleX: growTo(seed, frame, 'scaleX'), scaleY: growTo(seed, frame, 'scaleY'),
        ease: 'power2.inOut', duration: 0.8, immediateRender: false }, 0)
        .fromTo(q('.seed-img', seed), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0.2)
        .fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, 0.75)
        .fromTo(seed, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, immediateRender: false }, 0.9);
      enterIn(tl, p7a, 0.6);
    } });
    moment('poses', { enter: function (tl) {   // it bounces, wiggles, walks: one scroll, then it plays
      tl.fromTo(poses[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 0)
        .to(frame, { yPercent: -4, duration: 0.12, ease: 'power2.out' }, 0).to(frame, { yPercent: 0, duration: 0.3, ease: 'bounce.out' }, 0.12);
      fadeInT(tl, bounce, 0.05, 0.35);
      tl.to(frame, { rotation: 2.2, duration: 0.09 }, 1.0).to(frame, { rotation: -2.2, duration: 0.12 }, 1.09).to(frame, { rotation: 0, duration: 0.09 }, 1.21);
      fadeInT(tl, wiggle, 1.0, 0.35);
      tl.fromTo(poses[2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 1.8)
        .fromTo(poses[3], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 2.2)
        .to(frame, { xPercent: 6, duration: 0.6, ease: 'power1.inOut' }, 2.2);
      fadeInT(tl, walk, 2.3, 0.35);
    } });
    moment('p7b', { enter: function (tl) { enterIn(tl, p7b, 0); } });

    var C = L.collage, tinker = q('.tinker', C), items = qa('.c-item', C);
    var DEPTH = [-0.6, 0.4, 0.9, -0.2, 0.7, -0.9, 0.1, -0.5, 0.8, -0.1, 0.3];   // -1 far back … 1 close to the reader
    var depthOf = function (el) { var i = items.indexOf(el); return i < 0 ? 0 : DEPTH[i]; };
    gsap.set(items.concat([tinker]), { autoAlpha: 0 });
    moment('collage', { d: 0.9, layers: ['proteins', 'collage'], push: [p7a, p7b, frame, bounce, wiggle, walk], enter: function (tl) {
      var order = items.map(function (el, i) { return i; }).sort(function (a, b) { return items[a].offsetTop - items[b].offsetTop; });
      order.forEach(function (idx, k) {   // the collage keeps its depth: each image settles from its own distance
        var el = items[idx], d = DEPTH[idx];
        tl.fromTo(el, { autoAlpha: 0, translate: function () { return '0px ' + Math.round(innerHeight * (0.35 + 0.15 * (1 - d) / 2)) + 'px'; }, z: -420 + d * 300, rotationX: 48 - d * 12, rotationY: d * 9,
            transformPerspective: 1100, transformOrigin: '50% 100%', filter: 'blur(' + (1 + (1 - d) * 2.5).toFixed(1) + 'px)' },
          { autoAlpha: 1, translate: '0px 0px', z: 0, rotationX: 0, rotationY: 0, filter: 'blur(0px)', duration: 1.1 - d * 0.15, ease: 'power3.out', immediateRender: false }, k * 0.12);
      });
      fadeInT(tl, tinker, 2.1, 0.6);
    } });

    var A = L.amino, panel = q('.amino-panel', A), aLines = qa('.amino-text p', A);
    gsap.set(aLines, { autoAlpha: 0 }); gsap.set(panel, { autoAlpha: 0 });
    moment('amino', { d: 0.9, layers: ['collage', 'amino'], push: items.concat([tinker]), depthOf: depthOf, enter: function (tl) {
      riseIn(tl, panel, 0, 1.0); enterIn(tl, aLines[0], 0.8); enterIn(tl, aLines[1], 1.9);
    } });
    moment('amino3', { enter: function (tl) { enterIn(tl, aLines[2], 0); } });

    var K = L.counting, kText = q('.page.verso .ptext', K), kText2 = q('.page.recto .ptext', K), sItems = qa('.s-item', K);
    var kLead = q('.k-lead', K), kNum = q('.k-num', K), k1 = q('.k1', K), kBlack = q('.k-black', K);
    var p11a = q('.p11a', K), p11b = q('.p11b', K), imagine = q('.imagine', K);
    var p11first = document.createElement('span'); p11first.className = 'p11-first';
    if (p11a.firstChild && p11a.firstChild.nodeType === 3) { var tn = p11a.firstChild; p11a.insertBefore(p11first, tn); p11first.appendChild(tn); }
    gsap.set([kLead, kNum, k1, p11first, imagine, p11b].concat(sItems), { autoAlpha: 0 });
    gsap.set(kBlack, { opacity: 0 });
    moment('number', { d: 0.9, layers: ['amino', 'counting'], push: [panel].concat(aLines), enter: function (tl) {
      fadeInT(tl, kNum, 0.6, 0.8);       // 2×10³⁹⁰, alone
      fadeInT(tl, kLead, 2.2, 1.0);      // then the words of its sentence settle around it
    } });
    moment('atoms', { dark: true, enter: function (tl) {
      fadeOutT(tl, [kLead, kNum], 0, 0.45);
      layerTo(tl, kBlack, 0, 1, 0.15, 0.6);
      tl.set(k1, { color: '#ffffff' }, 0);
      fadeInT(tl, k1, 0.7, 0.8);
    } });
    moment('scales', { dark: false, enter: function (tl) {
      layerTo(tl, kBlack, 1, 0, 0, 0.6);
      tl.fromTo(k1, { color: '#ffffff' }, { color: '#231f20', duration: 0.6, immediateRender: false }, 0);
      sItems.forEach(function (el, i) { enterIn(tl, el, 0.5 + i * 0.3, { dur: 0.7 }); });   // small to vast, one after another
    } });
    moment('imagine', { enter: function (tl) { enterIn(tl, p11first, 0); fadeInT(tl, imagine, 1.7, 0.6); } });
    moment('scale', { enter: function (tl) { enterIn(tl, p11b, 0); } });

    var S = L.search, paras = qa('.p14-text p', S), chart = q('.chart', S), oneway = q('.oneway', S), clip = q('.wclip-rect', S);
    gsap.set(paras.concat([chart, oneway]), { autoAlpha: 0 }); gsap.set(clip, { attr: { width: 0 } });
    moment('p14a', { d: 0.9, layers: ['counting', 'search'], push: [kText, kText2, p11b].concat(sItems), enter: function (tl) { enterIn(tl, paras[0], 0.4); } });
    moment('p14b', { enter: function (tl) { enterIn(tl, paras[1], 0); } });
    moment('chart', { enter: function (tl) {
      enterIn(tl, chart, 0); tl.fromTo(clip, { attr: { width: 0 } }, { attr: { width: 262 }, duration: 1.2, ease: 'power1.inOut', immediateRender: false }, 0.3);
      enterIn(tl, oneway, 0.5);
    } });

    var V = L.vine, vine = q('.vine', V), travel = q('.travel', V), gap = q('.gap', V), halves = qa('.h1, .h2', travel);
    var T0 = 0.638, T1 = 0.747;   // measured from the image: the tendril's span where the line crosses it
    function sizeGap() {
      var pad = parseFloat(getComputedStyle(travel).fontSize) * 0.45;
      gap.style.width = ((T1 - T0) * vine.offsetWidth + 2 * pad) + 'px';
      var v = restBox(vine, stage), mid = v.left + v.width * (T0 + T1) / 2;
      travel.style.left = (mid - (gap.offsetLeft + gap.offsetWidth / 2)) + 'px';
    }
    sizeGap(); ScrollTrigger.addEventListener('refreshInit', sizeGap);
    gsap.set([vine].concat(halves), { autoAlpha: 0 });
    moment('vine', { d: 0.9, layers: ['search', 'vine'], push: paras.concat([chart, oneway]), enter: function (tl) {
      riseIn(tl, vine, 0, 1.3); fadeInT(tl, halves[0], 1.1, 0.5); fadeInT(tl, halves[1], 1.6, 0.5);
    } });

    var Q = L.possible, b1 = q('.box1', Q), b2 = q('.box2', Q), qn = q('.question', Q), qBig = q('.question-big', Q);
    var typed = qa('.type', Q);
    typed.forEach(function (el) { el.textContent = el.getAttribute('data-text'); });
    gsap.set([b1, b2], { autoAlpha: 0 });
    moment('boxes', { d: 0.9, layers: ['vine', 'possible'], push: [travel, vine], enter: function (tl) {
      enterIn(tl, b1, 0);
      var d1 = wordsIn(tl, typed[0], 0.7);
      enterIn(tl, b2, 0.7 + d1 + 0.5);
      wordsIn(tl, typed[1], 1.4 + d1 + 0.5);
    } });
    moment('question', { enter: function (tl) { wordsIn(tl, typed[2], 0.1, 0.1); } });
    var qSize = function () { return parseFloat(getComputedStyle(qn).fontSize); };
    var qCenter = function (axis) { return function () { var r = restBox(qn, stage); return axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2; }; };
    moment('alone', { prompt: 'next', enter: function (tl) {   // the question moves to the centre, alone on the paper
      tl.set(qn, { autoAlpha: 0 }, 0)
        .fromTo(qBig, { left: qCenter('x'), top: qCenter('y'), fontSize: qSize, autoAlpha: 1 },
                      { left: function () { return innerWidth / 2; }, top: function () { return innerHeight / 2; }, duration: 1.0, ease: 'power2.inOut', immediateRender: false }, 0);
      fadeOutT(tl, [b1, b2], 0, 0.6);
    } });

    var o2 = L['opener-2'], o2text = qa('.col-r > *', o2);
    gsap.set(o2, { opacity: 0 }); gsap.set(o2text, { autoAlpha: 0 });
    moment('opener2', { d: 0.8, layers: ['possible', 'opener-2'], nav: 'II. The Fringes of Reason', dark: true, enter: function (tl) {
      fadeOutT(tl, qBig, 0, 0.35); layerTo(tl, o2, 0, 1, 0.2, 0.6); fadeInT(tl, o2text, 0.8, 0.5);
    } });

    /* ---------- Section II ---------- */
    spread('s20', { prev: 'opener-2', push: [], layers: ['opener-2', 's20'], d1: 0.8, offset: 0.6, pre: function (tl) {
      fadeOutT(tl, o2text, 0, 0.3); layerTo(tl, o2, 1, 0, 0.2, 0.5);
    } });
    ['s22', 's24', 's26', 's28', 's30', 's32', 's34'].forEach(function (id, n, arr) { spread(id, { prev: n ? arr[n - 1] : 's20' }); });
    spread('s36', { prev: 's34', prompt: 'next' });

    /* ---------- Section III ---------- */
    var S36 = L.s36, o3 = L['opener-3'], o3text = qa('.col-r > *', o3);
    gsap.set(o3, { opacity: 0 }); gsap.set(o3text, { autoAlpha: 0 });
    moment('opener3', { d: 0.8, layers: ['s36', 'opener-3'], nav: 'III. History of the Future', dark: true, enter: function (tl) {
      fadeOutT(tl, qa('p.keep', S36), 0, 0.5); layerTo(tl, o3, 0, 1, 0.3, 0.3); fadeInT(tl, o3text, 0.7, 0.5);
    } });
    var Q4 = L.s40;
    gsap.set(Q4, { opacity: 0 });
    spread('s40', { prev: 'opener-3', push: [], layers: ['opener-3', 's40'], d1: 0.8, offset: 0, pre: function (tl) {
      fadeOutT(tl, o3text, 0, 0.3); layerTo(tl, Q4, 0, 1, 0.2, 0.8);
    } });
    MOM[MOM.length - 1].dark = false;
    spread('s42', { prev: 's40', push: [], offset: 0.5, pre: function (tl) { layerTo(tl, Q4, 1, 0, 0, 0.6); } });
    spread('s44', { prev: 's42' });
    spread('s46', { prev: 's44', prompt: 'next' });
    var S46 = L.s46, Cph = L.colophon;
    moment('colophon-in', { d: 0.8, layers: ['s46', 'colophon'], nav: 'III. History of the Future', dark: false, prompt: 'top', enter: function (tl) {
      layerTo(tl, S46, 1, 0, 0, 0.6);
      qa('[data-m]', Cph).forEach(function (el) { gsap.set(el, { autoAlpha: 0 }); fadeInT(tl, el, 0.5 + (parseFloat(el.getAttribute('data-d')) || 0), 0.7); });
    } });

    var TOTAL = pos;
    X.to({}, { duration: 0.01 }, TOTAL);
    var idx = {}; MOM.forEach(function (m, i) { idx[m.name] = i; });
    var TI2 = MOM[idx.opener2].at, TI3 = MOM[idx.opener3].at, TI1 = MOM[idx.opener1].at;

    /* ---- connect to the scrollbar ---- */
    function sizeTrack() { track.style.height = ((TOTAL + 1) * innerHeight) + 'px'; }
    sizeTrack(); ScrollTrigger.addEventListener('refreshInit', sizeTrack);
    var jumping = false, current = 0, lastVis = '';
    var lastT = 0;
    function sync(t, instant) {
      var k = 0;
      for (var i = 0; i < MOM.length; i++) if (MOM[i].at <= t + 1e-4) k = i;
      current = k;
      // layers: the current moment's and the next one's
      var vis = MOM[k].layers.concat(MOM[k + 1] ? MOM[k + 1].layers : []), key = vis.join(',');
      if (key !== lastVis) { lastVis = key; LAYERS.forEach(function (el) { el.style.visibility = vis.indexOf(el.id) >= 0 ? 'visible' : 'hidden'; }); }
      // entrances: play once the scroll is half way to a moment; run backwards when you scroll back past it
      var want = function (m) { return t >= m.at - m.d * 0.5; }, i, j;
      if (jumping || instant) {   // a long jump (menu, dragging the scrollbar): everything snaps to its state at once
        for (i = 1; i < MOM.length; i++) { var w = want(MOM[i]); if (w !== (MOM[i].state === 1)) { MOM[i].tl.pause().progress(w ? 1 : 0); MOM[i].state = w ? 1 : -1; } }
      } else {
        for (i = MOM.length - 1; i > 0; i--) if (!want(MOM[i]) && MOM[i].state === 1) {   // backwards: latest first
          for (j = MOM.length - 1; j > i; j--) if (MOM[j].state === -1 && MOM[j].tl.progress() > 0) MOM[j].tl.pause().progress(0);
          MOM[i].state = -1; MOM[i].tl.timeScale(2.5).reverse();
        }
        for (i = 1; i < MOM.length; i++) if (want(MOM[i]) && MOM[i].state !== 1) {        // forwards: earliest first
          // anything still playing from earlier moments finishes at once, so nothing arrives late over the new moment
          for (j = 0; j < i; j++) if (MOM[j].state === 1 && MOM[j].tl.progress() < 1) MOM[j].tl.progress(1);
          MOM[i].state = 1; MOM[i].tl.timeScale(1).play();
        }
      }
      var m = MOM[k];
      setLabel(m.nav); nav.classList.toggle('on-dark', !!m.dark);
      var visible = t > 0.3; nav.classList.toggle('is-visible', visible); if (!visible) setOpen(false);
      menu.querySelectorAll('a').forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        var on = (id === 'section-1' && t >= TI1 - 0.3 && t < TI2 - 0.3) || (id === 'section-2' && t >= TI2 - 0.3 && t < TI3 - 0.3) || (id === 'section-3' && t >= TI3 - 0.3);
        a.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }
    var st = ScrollTrigger.create({
      trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.35, animation: X, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var t = self.progress * TOTAL;
        sync(t, Math.abs(t - lastT) > 1.6); lastT = t;
        agitate(self.getVelocity(), t);
        clearTimeout(promptTimer); hidePrompt();
        promptTimer = setTimeout(checkPrompt, 1600);
      }
    });
    var yFor = function (time) { return st.start + (time / TOTAL) * (st.end - st.start); };
    var tNow = function () { return (scrollY - st.start) / (st.end - st.start) * TOTAL; };
    if (/[?&]nosnap\b/.test(location.search)) window.__stage = { moments: MOM, total: TOTAL, yFor: yFor };   // for frame-by-frame checks
    sync(0);

    /* ---- the protein breathes: its point cloud shimmers with scroll speed, and is still when you stop ---- */
    var disp = document.querySelector('#agitate feDisplacementMap'), turb = document.querySelector('#agitate feTurbulence');
    var agit = { s: 0 }, calm;
    var pA = MOM[idx.p7a].at - 0.5, pB = MOM[idx.collage].at;
    function agitate(v, t) {
      if (t < pA || t > pB) return;
      var target = Math.min(7, Math.abs(v) / 260);
      gsap.to(agit, { s: target, duration: 0.25, overwrite: true, onUpdate: function () {
        disp.setAttribute('scale', agit.s.toFixed(2)); turb.setAttribute('seed', String(Math.round(t * 40) % 50));
        frame.classList.toggle('agitated', agit.s > 0.15);
      } });
      clearTimeout(calm);
      calm = setTimeout(function () { gsap.to(agit, { s: 0, duration: 0.6, overwrite: true, onUpdate: function () {
        disp.setAttribute('scale', agit.s.toFixed(2)); frame.classList.toggle('agitated', agit.s > 0.15); } }); }, 120);
    }

    /* ---- snap: one flick moves you to the next moment; a nudge settles back ---- */
    var idle, dir = 1, snapping = false;
    var noSnap = /[?&]nosnap\b/.test(location.search);
    function settle() {
      if (snapping || noSnap || jumping) return;
      var t = tNow();
      if (t <= 0.001 || t >= TOTAL - 0.001) return;
      var k = 0; for (var i = 0; i < MOM.length; i++) if (MOM[i].at <= t) k = i;
      var a = MOM[k].at, b = MOM[k + 1] ? MOM[k + 1].at : a;
      if (Math.abs(t - a) < 0.012 || b === a) return;
      var f = (t - a) / (b - a), target = dir > 0 ? (f > 0.08 ? b : a) : (f < 0.92 ? a : b);
      snapping = true;
      scrollToY(yFor(target), 0.55 + Math.min(1, Math.abs(target - t)) * 0.5);
      setTimeout(function () { snapping = false; }, 1100);
    }
    function onMove(delta) { if (delta) dir = delta > 0 ? 1 : -1; clearTimeout(idle); idle = setTimeout(settle, 140); }
    var lastY = scrollY;
    if (lenis) lenis.on('scroll', function (e) { onMove(e.direction); });
    else addEventListener('scroll', function () { onMove(scrollY - lastY); lastY = scrollY; }, { passive: true });

    /* ---- prompts ---- */
    function goTo(i, dur) {
      jumping = Math.abs(MOM[i].at - tNow()) > 1.5;
      scrollToY(yFor(MOM[i].at), dur || 1.4);
      setTimeout(function () {
        if (!jumping) return;
        jumping = false;
        var m = MOM[i]; sync(tNow());
        if (i) { m.tl.progress(0).timeScale(1).play(); m.state = 1; }
      }, (dur || 1.4) * 1000 + 120);
    }
    function checkPrompt() {
      var t = tNow(), m = MOM[current];
      if (!m || !m.prompt || Math.abs(t - m.at) > 0.02) return;
      var i = current;
      showPrompt(m.prompt, m.dark, m.prompt === 'top' ? function () { goTo(0, 2.2); } : function () { goTo(i + 1, 0.9); });
    }
    setTimeout(checkPrompt, 3000);   // the first prompt: a few seconds after load
    document.addEventListener('mousemove', function (e) {
      if (current === 0 && tNow() < 0.02 && e.clientY > innerHeight * 0.7) checkPrompt();
    }, { passive: true });

    // menu links jump to the chapter openers
    jumpTo = function (id) { var name = { 'section-1': 'opener1', 'section-2': 'opener2', 'section-3': 'opener3' }[id]; if (name) goTo(idx[name], 1.8); };

    return function () {
      stageMode = false; jumpTo = null;
      root.classList.remove('stage-mode');
      track.style.height = '';
    };
  });

  /* =====================================================================
     PHONES: the page scrolls normally. Each piece plays by itself as it reaches the screen,
     and the scenes that need a stage (the protein, the green boxes) hold in place for a few
     swipes, one moment per swipe.
     ===================================================================== */
  mm.add('(max-width: 899px)', function () {
    // the cover holds, then fades to the title page
    gsap.timeline({ scrollTrigger: { trigger: '#opening', start: 'top top', end: screens(1.2), pin: true, scrub: true,
      onUpdate: function (s) { coverGone = s.progress > 0.92; } } })
      .to({}, { duration: 0.6 }).to('#cover', { autoAlpha: 0, ease: 'none', duration: 0.6 });
    var firstPrompt = setTimeout(function () { if (scrollY < 40) showPrompt('scroll', false, function () { scrollTo({ top: innerHeight * 1.3, behavior: 'smooth' }); }); }, 3000);
    addEventListener('scroll', function () { if (scrollY > 40) { clearTimeout(firstPrompt); hidePrompt(); } }, { passive: true });

    function onArrive(el, tl, start) {   // play when it reaches the screen; undo when you scroll back above it
      ScrollTrigger.create({ trigger: el, start: start || 'top 86%', onEnter: function () { tl.timeScale(1).play(); }, onLeaveBack: function () { tl.timeScale(2.5).reverse(); } });
    }
    function pinMoments(scene, builders, per) {   // a scene that holds for a few swipes; each swipe plays the next moment
      var tls = builders.map(function (b) { var tl = gsap.timeline({ paused: true }); b(tl); return tl; });
      var n = tls.length, state = tls.map(function () { return 0; });
      var len = function () { return (n - 1) * per * innerHeight + innerHeight * 0.25; };
      var pts = function () { var L = len(), a = []; for (var i = 0; i < n; i++) a.push(i * per * innerHeight / L); a.push(1); return a; };
      ScrollTrigger.create({ trigger: scene, start: 'top top', end: function () { return '+=' + Math.round(len()); }, pin: true, invalidateOnRefresh: true,
        snap: { snapTo: function (v) { var p = pts(), best = p[0]; p.forEach(function (x) { if (Math.abs(x - v) < Math.abs(best - v)) best = x; }); return best; }, duration: { min: 0.2, max: 0.5 }, delay: 0.12 },
        onUpdate: function (s) {
          var p = pts();
          tls.forEach(function (tl, i) {
            if (!i) return;   // the first moment plays as the scene comes up the screen (below)
            var want = s.progress >= p[i] - (p[1] - p[0]) * 0.4;
            if (want && state[i] !== 1) { state[i] = 1; tl.timeScale(1).play(); }
            else if (!want && state[i] === 1) { state[i] = -1; tl.timeScale(2.5).reverse(); }
          });
        },
      });
      ScrollTrigger.create({ trigger: scene, start: 'top 65%',
        onEnter: function () { state[0] = 1; tls[0].timeScale(1).play(); },
        onLeaveBack: function () { state[0] = -1; tls[0].timeScale(2.5).reverse(); } });
    }

    // the protein: four moments
    (function () {
      var P = q('#proteins'), seed = q('.seed', P), frame = q('.pframe', P), p5 = q('.p5-text', P), p5f = q('.p5-follow', P);
      var p7a = q('.p7a', P), p7b = q('.p7b', P), poses = qa('.pose', P);
      var words = [q('.pw-bounce', P), q('.pw-wiggle', P), q('.pw-walk', P)];
      gsap.set(poses.slice(1), { autoAlpha: 0 }); gsap.set([frame, p7a, p7b, seed, p5, p5f].concat(words), { autoAlpha: 0 });
      pinMoments(P, [
        function (tl) { enterIn(tl, p5, 0.2); fadeInT(tl, p5f, 2.2, 0.6); fadeInT(tl, seed, 2.6, 0.5); },
        function (tl) {
          fadeOutT(tl, p5, 0, 0.4);
          tl.fromTo(seed, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, { x: growTo(seed, frame, 'x'), y: growTo(seed, frame, 'y'), scaleX: growTo(seed, frame, 'scaleX'), scaleY: growTo(seed, frame, 'scaleY'), duration: 0.8, ease: 'power2.inOut', immediateRender: false }, 0.1)
            .fromTo(q('.seed-img', seed), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0.3)
            .fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, immediateRender: false }, 0.85)
            .fromTo(seed, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, immediateRender: false }, 1.0);
          enterIn(tl, p7a, 0.9);
        },
        function (tl) {
          fadeOutT(tl, p7a, 0, 0.3);
          tl.fromTo(poses[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 0.3); fadeInT(tl, words[0], 0.35, 0.3);
          tl.to(frame, { rotation: 2.2, duration: 0.09 }, 1.2).to(frame, { rotation: -2.2, duration: 0.12 }, 1.29).to(frame, { rotation: 0, duration: 0.09 }, 1.41);
          fadeInT(tl, words[1], 1.2, 0.3);
          tl.fromTo(poses[2], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 2.0)
            .fromTo(poses[3], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, immediateRender: false }, 2.4);
          fadeInT(tl, words[2], 2.4, 0.3);
        },
        function (tl) { fadeOutT(tl, words, 0, 0.3); enterIn(tl, p7b, 0.3); }
      ], 0.6);
    })();

    // collage: each image settles from its own depth as it reaches the screen; the tinker line once they're in
    qa('#collage .c-item').forEach(function (el, i) {
      var tl = gsap.timeline({ paused: true });
      gsap.set(el, { autoAlpha: 0 });
      tl.fromTo(el, { autoAlpha: 0, translate: '0px 90px', rotationX: 40, transformPerspective: 900, transformOrigin: '50% 100%', filter: 'blur(3px)' },
        { autoAlpha: 1, translate: '0px 0px', rotationX: 0, filter: 'blur(0px)', duration: 1.0, delay: (i % 3) * 0.12, ease: 'power3.out', immediateRender: false });
      onArrive(el, tl, 'top 92%');
    });
    (function () { var t = q('#collage .tinker'), tl = gsap.timeline({ paused: true }); fadeInT(tl, t, 0.3, 0.6); onArrive(q('#collage .page.verso'), tl, 'top 20%'); })();

    // counting: the number alone, then its sentence; the atoms line on black; the images one by one
    (function () {
      var K = q('#counting'), kLead = q('.k-lead', K), kNum = q('.k-num', K), k1 = q('.k1', K);
      var tl = gsap.timeline({ paused: true }); fadeInT(tl, kNum, 0.2, 0.8); fadeInT(tl, kLead, 1.6, 1.0); onArrive(q('.k0', K), tl);
      var tb = gsap.timeline({ paused: true });
      gsap.set(k1, { autoAlpha: 0 });
      tb.fromTo(k1, { autoAlpha: 1, backgroundColor: 'rgba(17,14,12,0)', color: '#231f20' }, { backgroundColor: 'rgba(17,14,12,1)', color: '#ffffff', duration: 0.6, immediateRender: false }, 0);
      onArrive(k1, tb, 'top 70%');
      var p11a = q('.p11a', K), im = q('.imagine', K), ti = gsap.timeline({ paused: true });
      enterIn(ti, p11a, 0); fadeInT(ti, im, 1.8, 0.6); onArrive(p11a, ti);
      qa('.s-item, .p11b', K).forEach(function (el) { var t = gsap.timeline({ paused: true }); enterIn(t, el, 0.1); onArrive(el, t); });
    })();

    // p. 14: each block as it arrives; the waves draw by themselves
    qa('#search .p14-text p, #search .oneway').forEach(function (el) { var t = gsap.timeline({ paused: true }); enterIn(t, el, 0.1); onArrive(el, t); });
    (function () {
      var clip = q('#search .wclip-rect'), t = gsap.timeline({ paused: true });
      gsap.set(clip, { attr: { width: 0 } });
      t.fromTo(clip, { attr: { width: 0 } }, { attr: { width: 262 }, duration: 1.4, ease: 'power1.inOut', immediateRender: false }, 0.2);
      onArrive(q('#search .chart'), t, 'top 75%');
    })();

    // pp. 16–17: the boxes type themselves; then the question, alone, then dark
    (function () {
      var Q = q('#possible'), b1 = q('.box1', Q), b2 = q('.box2', Q), qn = q('.question', Q), qBig = q('.question-big', Q);
      var typed = qa('.type', Q);
      typed.forEach(function (el) { el.textContent = el.getAttribute('data-text'); });
      var qSize = function () { return parseFloat(getComputedStyle(qn).fontSize); };
      var qc = function (axis) { return function () { var r = restBox(qn, Q); return axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2; }; };
      pinMoments(Q, [
        function (tl) { var d = wordsIn(tl, typed[0], 0.3); wordsIn(tl, typed[1], 0.3 + d + 0.6); },
        function (tl) { wordsIn(tl, typed[2], 0.1, 0.1); },
        function (tl) {
          tl.set(qn, { autoAlpha: 0 }, 0)
            .fromTo(qBig, { left: qc('x'), top: qc('y'), fontSize: qSize, autoAlpha: 1, color: '#231f20' },
                          { left: function () { return Q.offsetWidth / 2; }, top: function () { return Q.offsetHeight / 2; }, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, 0);
          fadeOutT(tl, [b1, b2], 0, 0.5);
        },
        function (tl) {
          fadeOutT(tl, qBig, 0, 0.35);
          tl.fromTo(Q, { backgroundColor: 'rgba(17,14,12,0)' }, { backgroundColor: 'rgba(17,14,12,1)', duration: 0.6, immediateRender: false }, 0.3)
            .call(function () { Q.classList.toggle('dark-now', tl.reversed() ? false : true); }, null, 0.5);
        }
      ], 0.6);
    })();

    // II and III: every piece plays by itself as it reaches the screen; a follower keeps its small delay
    qa('.sp [data-m]').forEach(function (el) {
      if (el.closest('svg') || el.classList.contains('bleed')) return;
      var mv = el.getAttribute('data-move') || 'enter', tl = gsap.timeline({ paused: true });
      var parent = el.parentElement.closest('[data-m]');
      var d = parent ? Math.max(0, (parseFloat(el.getAttribute('data-d')) || 0) - (parseFloat(parent.getAttribute('data-d')) || 0)) : 0.1;
      if (el.classList.contains('attrib')) d = 1.8;
      if (mv === 'unfurl') wordsIn(tl, el, d);
      else if (mv === 'decode') decodeIn(tl, el, d);
      else if (mv === 'lines') { var ls = qa('.ln', el); gsap.set(ls, { autoAlpha: 0 }); tl.to(ls, { autoAlpha: 1, duration: 0.3, stagger: 0.4 }, d); }
      else if (mv === 'swell') { gsap.set(q('.hl-bar', el), { scaleX: 0 }); gsap.set(q('.hl-text', el), { autoAlpha: 0 });
        tl.to(q('.hl-bar', el), { scaleX: 1, duration: 0.55 }, d).to(q('.hl-text', el), { autoAlpha: 1, duration: 0.4 }, d + 0.3); }
      else if (mv === 'eswap') {
        enterIn(tl, el, d);
        var e1 = q('.ex1', el), e2 = q('.ex2', el), dx = function () { return e2.offsetLeft - e1.offsetLeft; };
        tl.to(e1, { x: function () { return dx() / 2; }, y: -9, duration: 0.4 }, d + 1.0).to(e1, { x: dx, y: 0, duration: 0.4 }, d + 1.4)
          .to(e2, { x: function () { return -dx() / 2; }, y: 9, duration: 0.4 }, d + 1.0).to(e2, { x: function () { return -dx(); }, y: 0, duration: 0.4 }, d + 1.4);
      }
      else if (mv === 'fade' || parent) fadeInT(tl, el, d);
      else enterIn(tl, el, d);
      onArrive(parent || el, tl);
    });
    qa('.m-arrow').forEach(function (el) {
      var tl = gsap.timeline({ paused: true }); gsap.set(el, { scaleY: 0, transformOrigin: '50% 0%' });
      tl.to(el, { scaleY: 1, duration: 0.45, ease: 'power1.inOut' }, 0.4); onArrive(el, tl, 'top 90%');
    });
    // chapter ends: the page goes black with only what stays; an arrow leads on
    qa('.coda').forEach(function (el) {
      var tl = gsap.timeline({ paused: true }), ps = qa('p', el), nx = q('.p-next', el);
      gsap.set(ps.concat([nx]), { autoAlpha: 0 });
      tl.to(ps, { autoAlpha: 1, duration: 0.6, stagger: 0.5 }, 0.3).to(nx, { autoAlpha: 1, duration: 0.6 }, 1.8);
      onArrive(el, tl, 'top 55%');
      nx.addEventListener('click', function () { document.getElementById(nx.getAttribute('data-next')).scrollIntoView({ behavior: 'smooth' }); });
    });
  });

  // fonts change text widths: re-measure once they have loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
