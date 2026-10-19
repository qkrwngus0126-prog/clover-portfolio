/* 네잎클로버 들판.
   clover-portfolio의 index.html에 있던 들판을 그대로 옮기고, 숨은 세잎을 바깥에서 넣고 뺄 수 있게 바꿨습니다.

   const field = CloverField(document.getElementById('field'), {
     onPick(clover)   // 찾은 세잎을 눌렀을 때
     onShow(clover)   // 지금 라벨이 떠 있는 세잎이 바뀔 때 (없으면 null)
     onFound(n, all)  // 세잎을 하나 찾을 때마다
   });
   field.set([{ key, kind: 'happy' | 'empty', fx, fy, mine }])   // fx, fy는 들판 안의 0~1 좌표
   field.update(key, patch) / field.remove(key) / field.reveal(key) / field.hint() */
(function () {
  window.CloverField = function (field, opts) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = field.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    // white clover greens: front, slightly yellow, and a cooler one
    const GREENS = ['#4f7f45', '#5c8a48', '#44713f'];
    // a found clover lights up: a written one sunlit, an empty one pale, like a page not yet written on
    const LIT = { happy: ['#6a9a54', '#74a35a', '#6c9a58'], empty: ['#a3bf8e', '#acc697', '#9fbb8c'] };
    const TIERS = [0.66, 0.86, 1.0];      // back, middle, front layer brightness
    const ROTS = 6;                       // rotations baked into each sprite so light and shadow stay put
    const SPRITE = 96;
    const HIDDEN_Z = 0.3;
    const TIER_RES = [0.68, 0.64, 0.72];  // sprites are rendered at the largest size each layer is drawn

    let W = 0, H = 0, dpr = 1, items = [], split = 0, hidden = [], soil = null;
    let cloverSprites = [], grassSprites = [], threeSprites = [], litSprites = { happy: [], empty: [] };
    let raf = 0, shownNow = null;
    const pointer = { x: -999, y: -999, active: false, vx: 0, vy: 0 };

    // one label for the whole field: the lit clover nearest the hand
    const tag = document.createElement('span');
    tag.className = 'find-tag is-hidden';
    tag.setAttribute('aria-hidden', 'true');
    field.appendChild(tag);

    function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function shade(col, k) {
      const [r, g, b] = Array.isArray(col) ? col : rgb(col);
      const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
      return `rgb(${f(r)},${f(g)},${f(b)})`;
    }
    function jitterColor(hex) {
      const [r, g, b] = rgb(hex), j = () => (Math.random() - 0.5) * 14;
      return [r + j(), g + j(), b + j() * 0.6];
    }
    function sheet(res) {
      const s = document.createElement('canvas');
      s.width = s.height = Math.round(SPRITE * res * dpr);
      const c = s.getContext('2d');
      c.scale(res * dpr, res * dpr); c.translate(SPRITE / 2, SPRITE / 2);
      return [s, c];
    }

    // one obovate leaflet with a shallow notch at the tip, base at the origin, pointing up
    function leaflet(c, L, w, col) {
      const p = new Path2D();
      p.moveTo(0, 0);
      p.bezierCurveTo(-0.2 * L * w, -0.1 * L, -0.58 * L * w, -0.4 * L, -0.5 * L * w, -0.73 * L);
      p.bezierCurveTo(-0.44 * L * w, -0.99 * L, -0.13 * L * w, -1.04 * L, 0, -0.88 * L);
      p.bezierCurveTo(0.13 * L * w, -1.04 * L, 0.44 * L * w, -0.99 * L, 0.5 * L * w, -0.73 * L);
      p.bezierCurveTo(0.58 * L * w, -0.4 * L, 0.2 * L * w, -0.1 * L, 0, 0);
      const g = c.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, shade(col, 0.5));
      g.addColorStop(0.4, shade(col, 0.92));
      g.addColorStop(1, shade(col, 1.12));
      c.fillStyle = g; c.fill(p);
      c.save(); c.clip(p);
      // the pale crescent white clover carries on every leaflet
      c.strokeStyle = `rgba(224,238,206,${0.12 + Math.random() * 0.12})`; c.lineWidth = L * (0.07 + Math.random() * 0.05); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-0.44 * L * w, -0.64 * L); c.quadraticCurveTo(0, -0.28 * L, 0.44 * L * w, -0.64 * L); c.stroke();
      // side veins
      c.strokeStyle = 'rgba(12,30,10,0.2)'; c.lineWidth = 0.55;
      for (let i = 1; i <= 5; i++) {
        const y = -L * (0.12 + i * 0.13);
        c.beginPath();
        c.moveTo(0, y); c.quadraticCurveTo(-0.22 * L * w, y - 0.04 * L, -0.56 * L * w, y - 0.14 * L);
        c.moveTo(0, y); c.quadraticCurveTo(0.22 * L * w, y - 0.04 * L, 0.56 * L * w, y - 0.14 * L);
        c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(14,34,12,0.4)'; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(0, -0.04 * L); c.lineTo(0, -0.86 * L); c.stroke();
      c.strokeStyle = 'rgba(236,246,222,0.12)'; c.lineWidth = 0.7; c.stroke(p);
    }

    // light from the top left, shadow cast down and to the right, the same for every sprite
    function finish(src, tier, res) {
      const S = src.width, c = src.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-atop';
      const g = c.createLinearGradient(S * 0.15, S * 0.15, S * 0.85, S * 0.85);
      g.addColorStop(0, 'rgba(255,250,215,0.16)');
      g.addColorStop(0.5, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.3)');
      c.fillStyle = g; c.fillRect(0, 0, S, S);
      if (tier < 1) { c.fillStyle = `rgba(8,16,10,${1 - tier})`; c.fillRect(0, 0, S, S); }
      c.globalCompositeOperation = 'source-over';
      const out = document.createElement('canvas');
      out.width = out.height = S;
      const o = out.getContext('2d');
      o.shadowColor = 'rgba(0,0,0,0.6)'; o.shadowBlur = 6 * dpr * res; o.shadowOffsetX = 2 * dpr * res; o.shadowOffsetY = 4 * dpr * res;
      o.drawImage(src, 0, 0);
      return out;
    }

    function makeClover(n, base, rot, tier, res) {
      const [s, c] = sheet(res);
      const L = SPRITE * 0.29;
      const col = jitterColor(base);
      c.strokeStyle = shade(col, 0.72); c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.3, L * 0.6, L * 0.12, L * 1.25); c.stroke();
      c.rotate(rot);
      for (let i = 0; i < n; i++) {
        c.save();
        c.rotate((Math.PI * 2 / n) * i + (Math.random() - 0.5) * 0.28);
        const fore = 0.74 + Math.random() * 0.26; // a leaflet tilted away looks shorter
        c.scale(0.96 + Math.random() * 0.08, fore);
        leaflet(c, L, 0.9 + Math.random() * 0.15, jitterColor(base));
        c.restore();
      }
      c.fillStyle = shade(col, 0.42);
      c.beginPath(); c.arc(0, 0, 1.6, 0, Math.PI * 2); c.fill();
      return finish(s, tier, res);
    }

    function makeTuft(tier) {
      const [s, c] = sheet(0.8);
      const blades = 3 + (Math.random() * 3 | 0);
      for (let i = 0; i < blades; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
        const len = SPRITE * (0.28 + Math.random() * 0.16);
        const bx = (Math.random() - 0.5) * 8, by = SPRITE * 0.14;
        const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len;
        const bend = (Math.random() - 0.5) * 18;
        const col = jitterColor(GREENS[(Math.random() * GREENS.length) | 0]);
        const g = c.createLinearGradient(bx, by, tx, ty);
        g.addColorStop(0, shade(col, 0.45)); g.addColorStop(1, shade(col, 1.15));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(bx - 1.6, by);
        c.quadraticCurveTo((bx + tx) / 2 + bend - 1, (by + ty) / 2, tx, ty);
        c.quadraticCurveTo((bx + tx) / 2 + bend + 1, (by + ty) / 2, bx + 1.6, by);
        c.fill();
      }
      return finish(s, tier, 0.8);
    }

    function buildSprites() {
      const r = k => (Math.PI * 2 / ROTS) * k;
      cloverSprites = TIERS.map((t, ti) => GREENS.flatMap(g => Array.from({ length: ROTS }, (_, k) => makeClover(4, g, r(k), t, TIER_RES[ti]))));
      grassSprites = TIERS.map(t => Array.from({ length: 3 }, () => makeTuft(t)));
      // the hidden three-leaf clovers share one sprite per rotation, plain and lit, however many there are
      threeSprites = Array.from({ length: ROTS }, (_, k) => makeClover(3, GREENS[k % GREENS.length], r(k), 0.86, 0.64));
      litSprites = {
        happy: Array.from({ length: ROTS }, (_, k) => makeClover(3, LIT.happy[k % 3], r(k), 1.0, 0.64)),
        empty: Array.from({ length: ROTS }, (_, k) => makeClover(3, LIT.empty[k % 3], r(k), 1.0, 0.64)),
      };
    }

    function buildSoil() {
      soil = document.createElement('canvas');
      soil.width = Math.round(W * dpr); soil.height = Math.round(H * dpr);
      const c = soil.getContext('2d');
      c.fillStyle = '#0e1410'; c.fillRect(0, 0, soil.width, soil.height);
      const dots = Math.round(W * H / 60);
      for (let i = 0; i < dots; i++) {
        const a = Math.random() * 0.12 + 0.03;
        c.fillStyle = Math.random() < 0.65 ? `rgba(110,86,60,${a})` : `rgba(60,90,55,${a})`;
        const r = (Math.random() * 1.6 + 0.4) * dpr;
        c.fillRect(Math.random() * soil.width, Math.random() * soil.height, r, r);
      }
      // leaf litter and runners: what you see when you dig down to the ground
      c.scale(dpr, dpr);
      const litter = Math.round(W * H / 700);
      for (let i = 0; i < litter; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        c.save(); c.translate(x, y); c.rotate(Math.random() * Math.PI * 2);
        if (Math.random() < 0.55) {
          const l = 3 + Math.random() * 5;
          c.fillStyle = `rgba(${70 + Math.random() * 40},${60 + Math.random() * 30},${35 + Math.random() * 15},${0.35 + Math.random() * 0.3})`;
          c.beginPath(); c.ellipse(0, 0, l, l * 0.55, 0, 0, Math.PI * 2); c.fill();
        } else {
          c.strokeStyle = `rgba(${45 + Math.random() * 25},${70 + Math.random() * 30},${40 + Math.random() * 15},0.5)`;
          c.lineWidth = 0.8 + Math.random() * 0.8; c.lineCap = 'round';
          const l = 10 + Math.random() * 18;
          c.beginPath(); c.moveTo(-l / 2, 0); c.quadraticCurveTo(0, (Math.random() - 0.5) * 8, l / 2, 0); c.stroke();
        }
        c.restore();
      }
    }

    function makeHidden(c) {
      return {
        key: c.key, kind: c.kind, mine: !!c.mine, fx: c.fx, fy: c.fy, x: c.fx * W, y: c.fy * H,
        rk: (Math.random() * ROTS) | 0, s: 0.6, found: false, t: 0, seen: 0, lit: false,
      };
    }

    function buildItems() {
      items = [];
      const step = 18.3; // about 20% more leaves than a 20px grid
      for (let y = -step; y < H + step; y += step * 0.86) {
        for (let x = -step; x < W + step; x += step) {
          const z = Math.random();
          const tier = z < 0.33 ? 0 : z < 0.66 ? 1 : 2;
          const grass = Math.random() < 0.16;
          items.push({
            hx: x + (Math.random() - 0.5) * step * 0.95,
            hy: y + (Math.random() - 0.5) * step * 0.95,
            rx: 0, ry: 0, ox: 0, oy: 0, vx: 0, vy: 0, rot: 0,
            z, tier, grass,
            // the bottom layer is drawn larger so no bare soil shows until you dig
            s: (grass ? 0.5 : 0.44) + z * 0.2 + Math.random() * 0.06 + (tier === 0 && !grass ? 0.1 : 0),
            v: grass ? (Math.random() * 3) | 0 : (Math.random() * GREENS.length * ROTS) | 0,
          });
        }
      }
      sortItems();
    }
    // back to front, so nearer leaves overlap farther ones
    function sortItems() {
      items.sort((a, b) => a.z - b.z);
      split = items.findIndex(c => c.z >= HIDDEN_Z);
    }

    function resize() {
      const r = field.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width === W && r.height === H) return;
      W = r.width; H = r.height;
      const nd = Math.min(window.devicePixelRatio || 1, 2);
      const rebuild = !cloverSprites.length || nd !== dpr;
      dpr = nd;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      if (rebuild) buildSprites();
      buildSoil(); buildItems();
      hidden.forEach(h => { h.x = h.fx * W; h.y = h.fy * H; });
      bury(hidden);
      if (shownNow) placeTag(shownNow);
      draw(true);
    }

    const R = 66; // how far a fingertip parts the leaves

    // is the hidden clover in the open? test its centre and its three leaflets against nearer leaves only
    function exposed(h) {
      const L = SPRITE * h.s * 0.29;
      const pts = [[h.x, h.y]];
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / ROTS) * h.rk + (Math.PI * 2 / 3) * i - Math.PI / 2;
        pts.push([h.x + Math.cos(a) * L * 0.55, h.y + Math.sin(a) * L * 0.55]);
      }
      let open = 0;
      for (const [x, y] of pts) {
        let covered = false;
        for (let i = split; i < items.length && !covered; i++) {
          const c = items[i], r = SPRITE * c.s * 0.25;
          const dx = c.hx + c.ox - x, dy = c.hy + c.oy - y;
          if (dx * dx + dy * dy < r * r) covered = true;
        }
        if (!covered) open++;
      }
      return open >= 3;
    }

    // make sure every hidden clover starts properly buried under a few nearer leaves
    function bury(list) {
      if (!W) return;
      for (const h of list) {
        for (let k = 0; k < 4; k++) {
          const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 8, z = 0.7 + Math.random() * 0.3;
          items.push({ hx: h.x + Math.cos(a) * d, hy: h.y + Math.sin(a) * d, rx: 0, ry: 0, ox: 0, oy: 0, vx: 0, vy: 0, rot: 0,
            z, tier: 2, grass: false, s: 0.6 + Math.random() * 0.08, v: (Math.random() * GREENS.length * ROTS) | 0 });
        }
      }
      sortItems();
    }

    let last = 0;
    function step(now) {
      // physics runs on real time, so slow devices close the field just as quickly
      const k = Math.min(3, last ? (now - last) / 16.67 : 1);
      last = now;
      let energy = 0;
      const p = pointer;
      for (const c of items) {
        let tx = c.rx, ty = c.ry;
        if (p.active) {
          const bx = c.hx + c.rx, by = c.hy + c.ry;
          const dx = bx - p.x, dy = by - p.y, d = Math.hypot(dx, dy) || 0.01;
          if (d < R) {
            const f = 1 - d / R;
            // upper leaves part fully, the lower ones only lean, so a dug hole still shows layers
            const push = R * f * (0.3 + c.z * 0.75);
            tx += dx / d * push + p.vx * f * 0.6;
            ty += dy / d * push + p.vy * f * 0.6;
            // leaves that were dug through lag a moment before they settle back
            c.rx += (tx - c.rx) * 0.03 * f * k;
            c.ry += (ty - c.ry) * 0.03 * f * k;
          }
        }
        c.vx += (tx - c.ox) * 0.09 * k; c.vy += (ty - c.oy) * 0.09 * k;
        const damp = Math.pow(0.76, k);
        c.vx *= damp; c.vy *= damp;
        const mv = Math.abs(c.vx) + Math.abs(c.vy);
        if (mv > 0.02) mark(c.hx + c.ox, c.hy + c.oy, reach(c));
        c.ox += c.vx * k; c.oy += c.vy * k;
        if (mv > 0.02) mark(c.hx + c.ox, c.hy + c.oy, reach(c));
        const settle = Math.pow(0.965, k);
        c.rx *= settle; c.ry *= settle;
        c.rot = c.ox * 0.008;
        energy += Math.abs(c.vx) + Math.abs(c.vy) + Math.abs(c.rx) * 0.05;
      }
      for (const h of hidden) {
        const near = p.active && Math.hypot(p.x - h.x, p.y - h.y) < R * 1.2;
        // a found clover far from the hand only needs checking while it is still lit
        const open = near || (h.found && h.lit) ? exposed(h) : false;
        if (open) h.seen = Math.max(h.seen, now);
        if (!h.found && open && p.active) find(h);
        if (h.found) {
          if (h.t < 0.999) { h.t += (1 - h.t) * 0.09; energy += 1; mark(h.x, h.y, SPRITE * h.s * 0.7); }
          // a found clover is lit while it is in the open, with a short grace period
          const lit = now - h.seen < 260;
          if (lit !== h.lit) { h.lit = lit; mark(h.x, h.y, SPRITE * h.s * 0.7); }
          if (lit) energy += 1;
        }
      }
      // only one label at a time: the lit clover nearest the hand
      let best = null, bestD = Infinity;
      for (const h of hidden) {
        if (!h.lit) continue;
        const d = p.active ? Math.hypot(p.x - h.x, p.y - h.y) : now - h.seen;
        if (d < bestD) { bestD = d; best = h; }
      }
      if (best !== shownNow) show(best);
      p.vx *= 0.8; p.vy *= 0.8;
      return energy;
    }

    function label(h) {
      if (h.kind === 'empty') return '빈 세잎 · 눌러서 적기';
      return h.mine ? '내가 심은 세잎 · 눌러서 읽기' : '누군가의 행복 · 눌러서 읽기';
    }
    function show(h) {
      shownNow = h;
      if (h) { tag.textContent = label(h); tag.classList.toggle('is-empty', h.kind === 'empty'); placeTag(h); }
      tag.classList.toggle('is-hidden', !h);
      opts.onShow && opts.onShow(h ? public_(h) : null);
    }
    function placeTag(h) {
      // keep the whole label inside the field, whatever its length
      const half = (tag.offsetWidth || 160) / 2 + 8;
      tag.style.left = Math.max(half, Math.min(W - half, h.x)) + 'px';
      tag.style.top = h.y + 'px';
    }

    function blit(img, x, y, rot, s) {
      const cs = Math.cos(rot) * s * dpr, sn = Math.sin(rot) * s * dpr;
      ctx.setTransform(cs, sn, -sn, cs, x * dpr, y * dpr);
      ctx.drawImage(img, -SPRITE / 2, -SPRITE / 2, SPRITE, SPRITE);
    }

    function drawItem(c) {
      const img = c.grass ? grassSprites[c.tier][c.v] : cloverSprites[c.tier][c.v];
      blit(img, c.hx + c.ox, c.hy + c.oy, c.rot, c.s);
    }

    // only the part of the field that moved is painted again each frame
    let dirty = null;
    function mark(x, y, r) {
      if (!dirty) dirty = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
      else { dirty.x0 = Math.min(dirty.x0, x - r); dirty.y0 = Math.min(dirty.y0, y - r); dirty.x1 = Math.max(dirty.x1, x + r); dirty.y1 = Math.max(dirty.y1, y + r); }
    }
    const reach = c => SPRITE * c.s * 0.5 + 6;

    function draw(full) {
      if (!W) return;
      let x0 = 0, y0 = 0, x1 = W, y1 = H;
      if (!full) {
        if (!dirty) return;
        x0 = Math.max(0, Math.floor(dirty.x0)); y0 = Math.max(0, Math.floor(dirty.y0));
        x1 = Math.min(W, Math.ceil(dirty.x1)); y1 = Math.min(H, Math.ceil(dirty.y1));
        if (x1 <= x0 || y1 <= y0) { dirty = null; return; }
      }
      dirty = null;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const px = Math.floor(x0 * dpr), py = Math.floor(y0 * dpr), pw = Math.ceil((x1 - x0) * dpr) + 1, ph = Math.ceil((y1 - y0) * dpr) + 1;
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      ctx.drawImage(soil, px, py, pw, ph, px, py, pw, ph);
      const hit = c => { const x = c.hx + c.ox, y = c.hy + c.oy, r = reach(c); return x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1; };
      for (let i = 0; i < split; i++) if (hit(items[i])) drawItem(items[i]);
      for (const h of hidden) {
        const r = SPRITE * h.s * 0.7;
        if (h.x + r < x0 || h.x - r > x1 || h.y + r < y0 || h.y - r > y1) continue;
        const pop = h.found ? 1 + Math.sin(Math.min(h.t, 1) * Math.PI) * 0.18 : 1;
        blit(threeSprites[h.rk], h.x, h.y, 0, h.s * pop);
        if (h.found && h.lit) {
          ctx.globalAlpha = 0.85;
          blit(litSprites[h.kind][h.rk], h.x, h.y, 0, h.s * pop);
          ctx.globalAlpha = 1;
        }
      }
      for (let i = split; i < items.length; i++) if (hit(items[i])) drawItem(items[i]);
      ctx.restore();
    }

    function tick(now) {
      const e = step(now);
      draw(false);
      raf = (e > 0.4 || pointer.active || sweeping) ? requestAnimationFrame(tick) : (last = 0);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(tick); }

    const found = () => hidden.filter(x => x.found).length;
    function find(h) {
      h.found = true; h.t = 0;
      opts.onFound && opts.onFound(found(), hidden.length, public_(h));
      wake();
    }
    const public_ = h => ({ key: h.key, kind: h.kind, mine: h.mine, fx: h.fx, fy: h.fy });

    /* pointer: dragging digs, a short tap on a found clover (or its label) opens it */
    let releaseTimer = 0, down = null;
    function local(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function release() { clearTimeout(releaseTimer); if (!sweeping) pointer.active = false; }
    canvas.addEventListener('pointermove', e => {
      clearTimeout(releaseTimer);
      const q = local(e);
      if (pointer.active) { pointer.vx = q.x - pointer.x; pointer.vy = q.y - pointer.y; }
      pointer.x = q.x; pointer.y = q.y; pointer.active = true;
      if (down) down.moved = Math.max(down.moved, Math.hypot(q.x - down.x, q.y - down.y));
      wake();
    });
    canvas.addEventListener('pointerdown', e => {
      clearTimeout(releaseTimer);
      const q = local(e); pointer.x = q.x; pointer.y = q.y; pointer.active = true;
      down = { x: q.x, y: q.y, t: performance.now(), moved: 0 };
      canvas.setPointerCapture?.(e.pointerId); wake();
    });
    canvas.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse') release();
    });
    canvas.addEventListener('pointerup', e => {
      const q = local(e);
      if (down && down.moved < 12 && performance.now() - down.t < 700) tap(q);
      down = null;
      if (e.pointerType === 'mouse') return;
      // a lifted finger leaves the hole open long enough to tap the clover
      clearTimeout(releaseTimer); releaseTimer = setTimeout(release, 1500);
    });
    canvas.addEventListener('pointercancel', () => { down = null; release(); });

    function tap(q) {
      let pick = null;
      if (shownNow && !tag.classList.contains('is-hidden')) {
        const r = tag.getBoundingClientRect(), f = canvas.getBoundingClientRect();
        const x = q.x + f.left, y = q.y + f.top;
        if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) pick = shownNow;
      }
      if (!pick) {
        let bestD = 34;
        for (const h of hidden) {
          if (!h.found) continue;
          const d = Math.hypot(h.x - q.x, h.y - q.y);
          if (d < bestD) { bestD = d; pick = h; }
        }
      }
      if (pick && opts.onPick) opts.onPick(public_(pick));
    }

    /* the hint: a hand sweeps the leaves aside over one hidden clover, holds, then lets go */
    let sweeping = false;
    function sweep(h) {
      if (!h || sweeping || !W) return;
      sweeping = true;
      const t0 = performance.now(), dur = reduce ? 1 : 900;
      const sx = h.x + (h.x < W / 2 ? 140 : -140), sy = h.y + 60;
      const move = now => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        const wob = Math.sin(k * Math.PI * 4) * 18 * (1 - k);
        const nx = sx + (h.x - sx) * e + wob, ny = sy + (h.y - sy) * e - wob * 0.5;
        pointer.vx = nx - pointer.x; pointer.vy = ny - pointer.y;
        pointer.x = nx; pointer.y = ny; pointer.active = true;
        wake();
        if (k < 1) requestAnimationFrame(move);
        else {
          // hold the leaves open while it is found, then let the field close again
          const hold = performance.now();
          const keep = t => {
            pointer.vx = 0; pointer.vy = 0; pointer.x = h.x + 6; pointer.y = h.y + 4;
            if (t - hold < 2200) requestAnimationFrame(keep);
            else { sweeping = false; pointer.active = false; }
          };
          requestAnimationFrame(keep);
        }
      };
      requestAnimationFrame(move);
    }

    new ResizeObserver(() => { resize(); }).observe(field);
    resize();

    // a small gust when the page opens, so the field reads as alive
    if (!reduce) {
      for (const c of items) { c.vx = (Math.random() - 0.3) * 3; c.vy = (Math.random() - 0.5) * 2; }
      wake();
    }

    const byKey = key => hidden.find(h => h.key === key);
    return {
      set(list) {
        hidden = list.map(makeHidden);
        if (W) { buildItems(); bury(hidden); }
        show(null);
        draw(true);
        opts.onFound && opts.onFound(0, hidden.length, null);
      },
      add(c) {
        const h = makeHidden(c);
        hidden.push(h);
        bury([h]);
        draw(true);
        opts.onFound && opts.onFound(found(), hidden.length, null);
        return h;
      },
      update(key, patch) {
        const h = byKey(key);
        if (!h) return;
        Object.assign(h, patch);
        if (shownNow === h) show(h);
        mark(h.x, h.y, SPRITE); wake();
      },
      remove(key) {
        hidden = hidden.filter(h => h.key !== key);
        if (shownNow && shownNow.key === key) show(null);
        draw(true);
        opts.onFound && opts.onFound(found(), hidden.length, null);
      },
      reveal(key) {
        const h = byKey(key);
        if (h) sweep(h);
      },
      hint(kind) {
        const left = hidden.filter(x => !x.found && (!kind || x.kind === kind));
        const pool = left.length ? left : hidden.filter(x => !x.found);
        sweep(pool[(Math.random() * pool.length) | 0]);
        return pool.length > 0;
      },
      left: () => hidden.length - found(),
    };
  };
})();
