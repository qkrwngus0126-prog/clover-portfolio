/* The bouquet view. Every stem is a "stalk" pinned at the binding point and rotated outward, so the
   whole arrangement sways like a real bunch held in the hand. Layers, back to front:
   shadow, back paper, leaves, tall flowers, fillers, main flowers, front paper, ribbon.
   The interactive view runs small springs every frame; static views (stamp, final card, recipe
   thumbnails) lay out once. */
(function () {
  'use strict';

  const D = window.HANSONGI;
  const Art = window.HansongiArt;
  const flowersById = Object.fromEntries(D.flowers.map(fl => [fl.id, fl]));
  const wrapsById = Object.fromEntries(D.wraps.map(w => [w.id, w]));
  const ribbonsById = Object.fromEntries(D.ribbons.map(r => [r.id, r]));

  const WORLD_W = 440, WORLD_H = 560, BX = 220, BY = 380, LC = 160;
  const GOLDEN = 2.39996;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- flower art: PNG if it exists in images/flowers, code drawing otherwise ---------- */
  const imgState = {};   // key -> 'ok' | 'missing' | 'pending'
  function colorHex(colorId) { return (D.colors[colorId] || { hex: '#dddddd' }).hex; }
  function imgSrc(key) { return D.images.flowers + key + D.images.ext; }
  function artHTML(flower, colorId) {
    const key = flower.id + '-' + colorId;
    if (imgState[key] === 'ok') return `<div class="art" data-key="${key}"><img src="${imgSrc(key)}" alt="" draggable="false"></div>`;
    if (!imgState[key]) probe(key);
    return `<div class="art" data-key="${key}">${Art.flowerSVG(flower, colorHex(colorId))}</div>`;
  }
  function probe(key) {
    imgState[key] = 'pending';
    const im = new Image();
    im.onload = () => {
      imgState[key] = 'ok';
      document.querySelectorAll(`.art[data-key="${key}"]`).forEach(el => {
        el.innerHTML = `<img src="${imgSrc(key)}" alt="" draggable="false">`;
      });
    };
    im.onerror = () => { imgState[key] = 'missing'; };
    im.src = imgSrc(key);
  }

  /* ---------- layout: where every stem goes ---------- */
  function hash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return ((h >>> 0) % 1000) / 1000; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function layout(stems) {
    const mains = [], talls = [], fillers = [], leaves = [];
    stems.forEach(s => {
      const fl = flowersById[s.f];
      if (!fl) return;
      if (fl.group === 'leaf') leaves.push(s);
      else if (fl.group === 'filler') fillers.push(s);
      else if (fl.art === 'tall') talls.push(s);
      else mains.push(s);
    });
    const n = mains.length, m = fillers.length;
    const eff = n + m * 0.45 + talls.length * 0.5;
    const R = eff ? clamp(28 + 21 * Math.sqrt(eff), 44, 160) : 0;
    const out = {};
    const polar = (x, y) => ({ ang: Math.atan2(x, -y) * 180 / Math.PI, len: Math.hypot(x, y) });

    // the dome: main flowers on a sunflower spiral, squashed to read as a mound seen from the front
    const dome = (list, i, total, radius, spin, inner) => {
      const rr = total === 1 ? 0 : radius * (inner + (1 - inner) * Math.sqrt((i + 0.35) / total));
      const th = i * GOLDEN + spin;
      const x = rr * Math.cos(th);
      const y = -LC + rr * Math.sin(th) * 0.62 + Math.pow(rr / (radius || 1), 2) * 16;
      return { x, y, rr };
    };

    mains.forEach((s, i) => {
      const p = dome(mains, i, n, R * 0.92, -1.2, 0);
      const depth = R ? 1 - p.rr / R : 1;
      const fl = flowersById[s.f];
      out[s.uid] = Object.assign(polar(p.x, p.y), {
        kind: 'head', size: 82 * fl.size, depth,
        z: 400 + Math.round(depth * 180 + (p.y + LC) * 0.6),
        scale: 0.86 + 0.14 * depth, hrot: (hash(s.uid) - 0.5) * 30, flex: 0.8 + depth * 0.25
      });
    });

    fillers.forEach((s, j) => {
      const fl = flowersById[s.f];
      const p = n ? dome(fillers, j, m, R * 1.08, 0.9, 0.5) : dome(fillers, j, m, R * 0.9, 0.9, 0);
      out[s.uid] = Object.assign(polar(p.x, p.y), {
        kind: 'head', size: 70 * fl.size, depth: 0.35,
        z: (n ? 380 : 400) + Math.round((p.y + LC) * 0.2 + j % 7),
        scale: 0.92, hrot: (hash(s.uid) - 0.5) * 60, flex: 1.05
      });
    });

    talls.forEach((s, k) => {
      const fl = flowersById[s.f];
      const spread = ((k * 0.618 + 0.5) % 1 - 0.5) * (talls.length > 1 ? 64 : 0);
      out[s.uid] = {
        ang: spread + (hash(s.uid) - 0.5) * 8, len: LC + R * 0.12 - 30, kind: 'tall',
        size: 76 * fl.size, depth: 0.15, z: 150 + k, scale: 1, hrot: 0, flex: 1.2
      };
    });

    const reach = LC + R * 0.62 + 34;
    leaves.forEach((s, k) => {
      const spread = ((k * 0.618 + 0.31) % 1 - 0.5) * 96;
      out[s.uid] = {
        ang: spread, len: reach * (0.8 + hash(s.uid) * 0.14), kind: 'sprig',
        size: 1, depth: -0.25, z: 20 + k, scale: 1, hrot: 0, flex: 1.25
      };
    });

    return { R, top: -(LC + R * 0.62), low: -LC + R * 0.55 + 6, items: out, count: stems.length, hasTall: talls.length > 0, hasLeaf: leaves.length > 0 };
  }

  /* ---------- the view ---------- */
  class BouquetView {
    constructor(el, opts = {}) {
      this.el = el;
      this.static = !!opts.static || reduceMotion;
      this.interactive = !opts.static;
      this.nodes = new Map();
      this.g = layout([]);
      this.wrap = null; this.ribbon = null;
      this.pointer = { x: 0, y: 0, sx: 0, sy: 0, lastX: 0 };
      this.cam = { s: 1, cy: BY - LC, ts: 1, tcy: BY - LC };

      el.classList.add('bq');
      if (this.interactive) el.classList.add('bq-live');
      el.innerHTML =
        `<div class="bq-world" style="width:${WORLD_W}px;height:${WORLD_H}px">` +
          `<div class="bq-shadow" style="left:${BX}px;top:${BY + 150}px"></div>` +
          `<svg class="bq-layer bq-back" width="1" height="1" overflow="visible"></svg>` +
          `<div class="bq-stalks"></div>` +
          `<svg class="bq-layer bq-front" width="1" height="1" overflow="visible"></svg>` +
          `<svg class="bq-layer bq-ribbon" width="1" height="1" overflow="visible"></svg>` +
        `</div>`;
      this.world = el.firstChild;
      this.shadow = this.world.querySelector('.bq-shadow');
      this.back = this.world.querySelector('.bq-back');
      this.stalks = this.world.querySelector('.bq-stalks');
      this.front = this.world.querySelector('.bq-front');
      this.ribbonEl = this.world.querySelector('.bq-ribbon');

      this.ro = new ResizeObserver(() => { this.fit(); if (this.static) this.frame(0, true); });
      this.ro.observe(el);

      if (this.interactive) this.bindPointer();
      if (!this.static) { this.tick = this.tick.bind(this); this.raf = requestAnimationFrame(this.tick); }
    }

    destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.el.innerHTML = ''; }

    bindPointer() {
      const area = this.el;
      const move = (e) => {
        const r = area.getBoundingClientRect();
        const x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        const y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
        const dx = x - this.pointer.x;
        this.pointer.x = x; this.pointer.y = y;
        // a quick swipe nudges every stem, so the bunch wobbles instead of just leaning
        if (!this.static) this.nodes.forEach(n => { n.v += clamp(dx, -0.25, 0.25) * 9 * n.flex; });
      };
      area.addEventListener('pointermove', move);
      area.addEventListener('pointerdown', move);
      area.addEventListener('pointerleave', () => { this.pointer.x = 0; this.pointer.y = 0; });
      area.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { this.pointer.x = 0; this.pointer.y = 0; } });
    }

    /* stems: [{uid, f, c}] in the order they were added */
    update(stems, wrapId, ribbonId) {
      const g = layout(stems);
      this.g = g;
      const seen = new Set();
      let newcomer = null;

      stems.forEach(s => {
        const t = g.items[s.uid];
        if (!t) return;
        seen.add(s.uid);
        let n = this.nodes.get(s.uid);
        if (!n) {
          n = this.createNode(s, t);
          this.nodes.set(s.uid, n);
          newcomer = n;
        }
        Object.assign(n, { tAng: t.ang, tLen: t.len, depth: t.depth, tScale: t.scale, flex: t.flex });
        n.el.style.zIndex = t.z;
        if (t.kind === 'sprig') this.sizeSprig(n, t.len);
      });

      this.nodes.forEach((n, uid) => {
        if (!seen.has(uid) && !n.leaving) {
          n.leaving = true;
          if (this.static) { n.el.remove(); this.nodes.delete(uid); }
        }
      });

      // "톡": the new stem drops in from above and its neighbours lean away a little
      if (newcomer && !this.static) {
        this.nodes.forEach(n => {
          if (n === newcomer || n.leaving) return;
          const d = n.tAng - newcomer.tAng;
          n.v += Math.sign(d || 1) * 2.4 * Math.exp(-Math.abs(d) / 22);
        });
      }

      const wrap = wrapsById[wrapId] || null, ribbon = ribbonsById[ribbonId] || null;
      const geoKey = Math.round(g.R / 4);
      if (wrap !== this.wrap || ribbon !== this.ribbon || geoKey !== this.geoKey) {
        const wrapChanged = wrap !== this.wrap;
        this.back.innerHTML = Art.wrapBack(wrap, g);
        this.front.innerHTML = Art.wrapFront(wrap, g);
        this.ribbonEl.innerHTML = Art.ribbonSVG(ribbon, !!wrap);
        if (wrapChanged && wrap && !this.static) this.wrapIn = 1;
        this.wrap = wrap; this.ribbon = ribbon; this.geoKey = geoKey;
      }
      this.el.classList.toggle('is-empty', stems.length === 0);
      this.fit();
      if (this.static) this.frame(0, true);
    }

    createNode(s, t) {
      const fl = flowersById[s.f];
      const el = document.createElement('div');
      el.className = 'stalk stalk-' + t.kind;
      const head = document.createElement('div');
      head.className = 'head';
      head.innerHTML = artHTML(fl, s.c);
      const stem = document.createElement('i');
      stem.className = 'stem';
      el.append(stem, head);
      this.stalks.appendChild(el);

      let w, h;
      if (t.kind === 'tall') { w = t.size; h = t.size * 2; }
      else if (t.kind === 'sprig') { w = 0; h = 0; }
      else { w = h = t.size; }
      head.style.width = w + 'px'; head.style.height = h + 'px';
      head.style.left = -w / 2 + 'px';
      head.style.top = (t.kind === 'tall' ? -h : -h / 2) + 'px';

      const r = hash(s.uid);
      const fresh = !this.static;
      return {
        el, head, stem, kind: t.kind, hrot: t.hrot,
        ang: t.ang, len: t.len, tAng: t.ang, tLen: t.len,
        a: 0, v: 0, k: 0.035 + r * 0.03, damp: 0.86 + r * 0.04, phase: r * 6.28, flex: t.flex,
        sc: fresh ? 0.3 : 1, vs: 0, lift: fresh ? 70 : 0, vl: 0, op: fresh ? 0 : 1,
        tail: 74 + r * 26, depth: t.depth, tScale: t.scale, leaving: false
      };
    }

    sizeSprig(n, len) {
      if (n.sprigLen && Math.abs(n.sprigLen - len) < 1) return;
      n.sprigLen = len;
      const h = len, w = len * 0.5;
      Object.assign(n.head.style, { width: w + 'px', height: h + 'px', left: -w / 2 + 'px', top: -(h + 54) + 'px' });
    }

    /* camera: zoom so the whole bunch fits, centred on its middle */
    fit() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return;
      this.base = Math.min(w / WORLD_W, h / WORLD_H);
      this.vw = w; this.vh = h;
      const g = this.g;
      const top = g.top - (g.hasTall ? 90 : 46) - (g.hasLeaf ? 20 : 0);
      const bottom = this.wrap ? 150 : 130;
      const contentH = bottom - top, contentW = 2 * (g.R + 96);
      const zoom = g.count ? Math.min(1.15, (WORLD_H - 30) / contentH, (WORLD_W - 10) / contentW) : 1.1;
      this.cam.ts = zoom;
      this.cam.tcy = BY + (top + bottom) / 2;
      if (this.static) { this.cam.s = this.cam.ts; this.cam.cy = this.cam.tcy; }
    }

    tick(time) {
      this.raf = requestAnimationFrame(this.tick);
      const dt = Math.min(3, this.last ? (time - this.last) / 16.67 : 1);
      this.last = time;
      this.frame(time, false, dt);
    }

    frame(time, settle, dt = 1) {
      const P = this.pointer, cam = this.cam;
      const ease = (k) => 1 - Math.pow(1 - k, dt);
      if (settle) { P.sx = 0; P.sy = 0; } else {
        P.sx += (P.x - P.sx) * ease(0.08);
        P.sy += (P.y - P.sy) * ease(0.08);
      }
      cam.s += (cam.ts - cam.s) * (settle ? 1 : ease(0.06));
      cam.cy += (cam.tcy - cam.cy) * (settle ? 1 : ease(0.06));
      const s = (this.base || 1) * cam.s;
      // the whole bunch turns a few degrees toward the pointer, like holding it up and tilting it in the hand
      const tilt = this.interactive ? `translate(${BX}px, ${cam.cy}px) rotateY(${(P.sx * 9).toFixed(2)}deg) rotateX(${(-P.sy * 5).toFixed(2)}deg) translate(${-BX}px, ${-cam.cy}px)` : '';
      this.world.style.transform = `translate(${this.vw / 2 - BX * s}px, ${this.vh / 2 - cam.cy * s}px) scale(${s}) ${tilt}`;

      const T = P.sx * 7;
      const breathe = settle ? 0 : 0.55;
      const t = time * 0.0011;

      this.nodes.forEach((n, uid) => {
        if (settle) {
          n.ang = n.tAng; n.len = n.tLen; n.a = 0; n.v = 0; n.sc = n.leaving ? 0 : 1; n.lift = 0; n.op = 1;
        } else {
          for (let i = 0; i < Math.round(dt) || i < 1; i++) {
            const target = T * n.flex + Math.sin(t + n.phase) * breathe;
            n.v += (target - n.a) * n.k;
            n.v *= n.damp;
            n.a += n.v;
            const goal = n.leaving ? 0 : 1;
            n.vs += (goal - n.sc) * 0.16; n.vs *= 0.72; n.sc += n.vs;
            n.vl += ((n.leaving ? 40 : 0) - n.lift) * 0.13; n.vl *= 0.7; n.lift += n.vl;
          }
          n.ang += (n.tAng - n.ang) * ease(0.14);
          n.len += (n.tLen - n.len) * ease(0.14);
          n.op += ((n.leaving ? 0 : 1) - n.op) * ease(n.leaving ? 0.3 : 0.2);
          if (n.leaving && n.op < 0.03) { n.el.remove(); this.nodes.delete(uid); return; }
        }
        const reach = n.len + n.lift;
        const tail = this.wrap ? 40 : n.tail;   // under paper the cut ends would poke out of the skirt
        n.el.style.transform = `translate(${BX}px, ${BY}px) rotate(${(n.ang + n.a).toFixed(2)}deg)`;
        n.el.style.opacity = n.op.toFixed(3);
        if (n.kind === 'sprig') {
          n.stem.style.cssText = `top:-60px;height:${(60 + tail).toFixed(1)}px`;
          n.head.style.transform = `translateY(${(-n.lift).toFixed(1)}px)`;
        } else {
          n.stem.style.cssText = `top:${(-reach).toFixed(1)}px;height:${(reach + tail).toFixed(1)}px`;
          const px = P.sx * n.depth * 10, py = P.sy * n.depth * 6;
          const counter = -(n.ang + n.a) * 0.45 + n.hrot;
          n.head.style.transform = `translate(${px.toFixed(1)}px, ${(py - reach).toFixed(1)}px) rotate(${counter.toFixed(1)}deg) scale(${(n.sc * n.tScale).toFixed(3)})`;
        }
      });

      // paper sits between the stems: the back sheet lags behind, the front sheet leads, which reads as depth
      if (this.wrapIn) this.wrapIn = settle ? 0 : this.wrapIn * Math.pow(0.86, dt);
      if (this.wrapIn < 0.002) this.wrapIn = 0;
      const wi = this.wrapIn || 0;
      this.back.style.transform = `translate(${BX - P.sx * 4}px, ${BY + wi * 30}px) rotate(${(T * 0.55).toFixed(2)}deg) scale(${1 - wi * 0.1})`;
      this.back.style.opacity = 1 - wi;
      this.front.style.transform = `translate(${BX + P.sx * 3}px, ${BY + wi * 60}px) rotate(${(T * 0.4).toFixed(2)}deg)`;
      this.front.style.opacity = 1 - wi;
      this.ribbonEl.style.transform = `translate(${BX + P.sx * 3}px, ${BY + wi * 60}px) rotate(${(T * 0.4).toFixed(2)}deg) scale(${1 + wi * 0.4})`;
      this.shadow.style.transform = `translateX(${(-50 - P.sx * 18).toFixed(1)}%) scaleX(${(0.6 + this.g.R / 220).toFixed(2)})`;
    }
  }

  window.BouquetView = BouquetView;
  window.HansongiArtHTML = artHTML;
})();
