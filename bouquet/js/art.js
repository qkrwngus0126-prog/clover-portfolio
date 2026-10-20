/* Code-drawn art: flower heads, foliage sprigs, wrapping paper and ribbons, all as SVG strings.
   Heads draw in a -50..50 square; 'tall' art in -30..30 × -120..0 and 'sprig' art in -40..40 × -160..0,
   both with the stem end at (0,0). PNG illustrations in images/flowers replace the heads when present. */
(function () {
  'use strict';

  /* ---------- colour ---------- */
  function rgb(hex) {
    const h = hex.replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  function hex(c) { return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); }
  const dark = (c, t) => mix(c, '#2b1d1a', t);
  const light = (c, t) => mix(c, '#ffffff', t);
  function lum(c) { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  /* ---------- seeded randomness, so a flower always looks the same ---------- */
  function rng(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
    return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; };
  }

  const f = n => Math.round(n * 10) / 10;

  /* A petal from the origin to (0,-len), half-width w. pointed 0 = round tip, 1 = sharp tip. */
  function petal(len, w, pointed = 0) {
    const t = 1 - pointed * 0.75;
    return `M0,0 C${f(w * 1.05)},${f(-len * 0.22)} ${f(w * t)},${f(-len * 1.02)} 0,${f(-len)} C${f(-w * t)},${f(-len * 1.02)} ${f(-w * 1.05)},${f(-len * 0.22)} 0,0Z`;
  }
  function ring(n, len, w, fill, opt = {}) {
    const { rot = 0, pointed = 0, stroke = dark(fill, 0.3), sw = 0.6, offset = 0, jitter = 0, r = null } = opt;
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = rot + (360 / n) * i + (r ? (r() - 0.5) * jitter : 0);
      const l = len * (r ? 1 - r() * 0.08 : 1);
      out += `<path d="${petal(l, w, pointed)}" transform="rotate(${f(a)}) translate(0,${-offset})" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-opacity=".55"/>`;
    }
    return out;
  }
  function circle(cx, cy, r, fill, extra = '') { return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`; }
  function ruffle(r0, amp, n, rand) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r0 + (i % 2 ? amp : -amp * 0.4) * (0.6 + rand() * 0.6);
      d += (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ',' + f(Math.sin(a) * rr);
    }
    return d + 'Z';
  }

  /* ---------- heads ---------- */
  const shapes = {};

  shapes.rose = (c, r) => {
    const d1 = dark(c, 0.14), d2 = dark(c, 0.3), l1 = light(c, 0.12);
    return ring(5, 47, 27, d1, { rot: r() * 72, r, jitter: 10 }) +
      ring(5, 41, 25, c, { rot: 36 + r() * 20, r, jitter: 10 }) +
      ring(4, 31, 21, l1, { rot: r() * 90, r, jitter: 12 }) +
      circle(0, -2, 17, d1) +
      `<path d="M-15,4 C-16,-12 -2,-20 9,-14 C16,-9 14,4 4,7 C-5,9 -9,0 -4,-6 C1,-11 8,-6 5,-1" fill="none" stroke="${d2}" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M-21,6 C-18,20 18,20 21,6 C14,13 -14,13 -21,6Z" fill="${c}" stroke="${d2}" stroke-width=".6" stroke-opacity=".5"/>`;
  };

  shapes.sprayrose = (c, r) => {
    const mini = (x, y, s, rot) => `<g transform="translate(${x},${y}) scale(${s}) rotate(${rot})">${shapes.rose(c, r)}</g>`;
    return `<path d="M-6,22 C-10,10 -18,-6 -22,-26" stroke="#5f7a4a" stroke-width="2.4" fill="none"/>` +
      `<ellipse cx="-24" cy="-32" rx="6" ry="9" fill="${dark(c, 0.1)}" transform="rotate(-24 -24 -32)"/>` +
      `<path d="M-30,-26 C-26,-30 -20,-30 -18,-24 M-28,-22 C-24,-24 -20,-22 -19,-20" stroke="#5f7a4a" stroke-width="1.6" fill="none"/>` +
      mini(14, -14, 0.5, 20) + mini(-14, 10, 0.46, -30) + mini(16, 22, 0.4, 60);
  };

  shapes.peony = (c, r) => {
    const d1 = dark(c, 0.12), l1 = light(c, 0.15), l2 = light(c, 0.3);
    return ring(9, 48, 19, d1, { rot: r() * 40, r, jitter: 14 }) +
      ring(8, 42, 19, c, { rot: 20, r, jitter: 14 }) +
      ring(8, 33, 16, l1, { rot: 8, r, jitter: 16 }) +
      ring(7, 25, 14, c, { rot: 30, r, jitter: 16 }) +
      ring(6, 17, 11, l2, { rot: 0, r, jitter: 20 }) +
      circle(0, 0, 6, l1) + ring(5, 9, 6, light(c, 0.4), { rot: 15 });
  };

  shapes.ranunculus = (c, r) => {
    let s = ring(8, 47, 22, dark(c, 0.16), { rot: r() * 40, r, jitter: 8 });
    const shades = [c, light(c, 0.1), dark(c, 0.06), light(c, 0.2), c, light(c, 0.28)];
    shades.forEach((col, i) => {
      const len = 40 - i * 6.2;
      s += ring(Math.max(4, 8 - i), len, len * 0.55, col, { rot: i * 23 + r() * 20, r, jitter: 6 });
    });
    return s + circle(0, 0, 4.5, '#6f7c3c') + circle(-1, -1, 1.6, '#a6b46a');
  };

  shapes.lisianthus = (c, r) => {
    const d1 = dark(c, 0.14), l1 = light(c, 0.18);
    return ring(5, 47, 31, d1, { rot: r() * 72, r, jitter: 8 }) +
      ring(5, 40, 27, c, { rot: 36, r, jitter: 8 }) +
      ring(4, 24, 17, l1, { rot: r() * 90, r, jitter: 10 }) +
      `<path d="M-9,5 C-10,-6 2,-12 8,-5 C12,1 5,8 -1,5" fill="none" stroke="${dark(c, 0.32)}" stroke-width="1.4" stroke-linecap="round"/>`;
  };

  shapes.carnation = (c, r) => {
    const cols = [dark(c, 0.16), c, light(c, 0.12), dark(c, 0.06), light(c, 0.22)];
    let s = '';
    [47, 39, 30, 21, 12].forEach((rad, i) => {
      s += `<path d="${ruffle(rad, 5, 40 - i * 4, r)}" fill="${cols[i]}" stroke="${dark(c, 0.3)}" stroke-width=".6" stroke-opacity=".5" transform="rotate(${r() * 30})"/>`;
    });
    return s;
  };

  shapes.gerbera = (c, r) => {
    const center = lum(c) > 0.8 ? '#7a8a3a' : '#4a3520';
    return ring(24, 48, 6.4, dark(c, 0.14), { rot: 7, pointed: 0.2, r, jitter: 3 }) +
      ring(24, 43, 6, c, { pointed: 0.2, r, jitter: 3 }) +
      ring(18, 25, 3.6, light(c, 0.14), { rot: 5 }) +
      circle(0, 0, 13, center) + circle(0, 0, 8, dark(center, 0.2)) +
      circle(0, 0, 13, 'none', `stroke="${light(c, 0.3)}" stroke-width="1.6" stroke-dasharray="1.4 2.2"`);
  };

  shapes.sunflower = (c, r) => {
    let s = ring(22, 49, 8, '#E3A21A', { rot: 8, pointed: 0.85, r, jitter: 4 }) +
      ring(22, 45, 8, c, { pointed: 0.85, r, jitter: 4 }) + circle(0, 0, 22, '#5b3a1a');
    for (let i = 0; i < 60; i++) {
      const rad = Math.sqrt(i / 60) * 19, a = i * 2.39996;
      s += circle(Math.cos(a) * rad, Math.sin(a) * rad, 1.3, i % 3 ? '#7a5228' : '#3f2711');
    }
    return s;
  };

  shapes.daisy = (c, r) => {
    const center = c === '#F4CC45' ? '#d9a521' : '#cdbb3c';
    return ring(18, 47, 7.5, dark(c, 0.14), { rot: 10, r, jitter: 4 }) +
      ring(18, 42, 7, c, { r, jitter: 4 }) +
      ring(14, 26, 5, light(c, 0.1), { rot: 6 }) +
      circle(0, 0, 11, center) + circle(-2, -2, 5, light(center, 0.3));
  };

  shapes.tulip = (c) => {
    const d1 = dark(c, 0.16), d2 = dark(c, 0.32), l1 = light(c, 0.16);
    return `<path d="M-6,46 C-4,30 -2,26 0,22" stroke="#5f7a4a" stroke-width="4" fill="none"/>` +
      `<path d="M-26,-2 C-30,-30 -20,-44 -12,-48 C-6,-34 -6,-14 -8,4Z" fill="${d1}" stroke="${d2}" stroke-width=".6"/>` +
      `<path d="M26,-2 C30,-30 20,-44 12,-48 C6,-34 6,-14 8,4Z" fill="${d1}" stroke="${d2}" stroke-width=".6"/>` +
      `<path d="M0,30 C-22,28 -28,6 -24,-14 C-20,-30 -10,-40 -2,-45 C0,-42 2,-42 4,-45 C12,-40 22,-30 24,-14 C28,6 22,28 0,30Z" fill="${c}" stroke="${d2}" stroke-width=".7" stroke-opacity=".6"/>` +
      `<path d="M0,26 C-3,8 -2,-20 1,-40" stroke="${l1}" stroke-width="2" fill="none" opacity=".8"/>` +
      `<path d="M-16,20 C-24,6 -22,-14 -14,-30" stroke="${d1}" stroke-width="1" fill="none" opacity=".6"/>`;
  };

  shapes.hydrangea = (c, r) => {
    let s = circle(0, 0, 46, dark(c, 0.22));
    for (let i = 0; i < 42; i++) {
      const rad = Math.sqrt((i + 0.5) / 42) * 40, a = i * 2.39996;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      const col = mix(c, r() > 0.5 ? '#ffffff' : '#2b1d1a', r() * 0.22);
      s += `<g transform="translate(${f(x)},${f(y)}) rotate(${f(r() * 90)})">` +
        ring(4, 9.5, 6.4, col, { sw: 0.5 }) + circle(0, 0, 1.4, dark(c, 0.35)) + '</g>';
    }
    return s;
  };

  shapes.anemone = (c, r) => {
    let s = ring(6, 47, 25, dark(c, 0.12), { rot: r() * 60, r, jitter: 8 }) +
      ring(6, 42, 22, c, { rot: 30, r, jitter: 8 }) + circle(0, 0, 15, light(c, 0.1));
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      s += `<line x1="0" y1="0" x2="${f(Math.cos(a) * 17)}" y2="${f(Math.sin(a) * 17)}" stroke="#2a2430" stroke-width=".7"/>` +
        circle(Math.cos(a) * 17, Math.sin(a) * 17, 1.4, '#22202a');
    }
    return s + circle(0, 0, 9, '#1e1b22') + circle(-2, -2, 3, '#3a3542');
  };

  shapes.lily = (c) => {
    const d1 = dark(c, 0.16), throat = lum(c) > 0.8 ? '#dfe3a8' : light(c, 0.35);
    let s = ring(3, 49, 15, d1, { rot: 0, pointed: 1 }) + ring(3, 47, 14, c, { rot: 60, pointed: 1 });
    for (let i = 0; i < 6; i++) {
      s += `<path d="M0,0 L0,-30" transform="rotate(${i * 60})" stroke="${throat}" stroke-width="3" opacity=".8" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 30) * Math.PI / 180, x = Math.cos(a) * 20, y = Math.sin(a) * 20;
      s += `<line x1="0" y1="0" x2="${f(x)}" y2="${f(y)}" stroke="#b9b66a" stroke-width="1"/>` +
        `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="4.4" fill="#8a4a22" transform="rotate(${i * 60 + 120} ${f(x)} ${f(y)})"/>`;
    }
    return s + circle(0, 0, 3, '#c9c48a');
  };

  shapes.alstroemeria = (c, r) => {
    const floret = (x, y, s, rot) => {
      let g = ring(6, 19, 9, c, { rot: 30, pointed: 0.3, stroke: dark(c, 0.3) }) + ring(3, 13, 6, light(c, 0.2), { rot: 0, pointed: 0.4 });
      for (let i = 0; i < 6; i++) {
        g += `<path d="M${-2 + i * 0.8},${-6 - i % 2 * 2} l${0.6},-3" stroke="#3a2420" stroke-width="1" stroke-linecap="round"/>`;
      }
      g += circle(0, 0, 2.4, '#e8cf6a');
      return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">${g}</g>`;
    };
    return `<path d="M0,44 C0,30 -14,10 -22,-10 M0,30 C4,10 18,-4 22,-14 M2,20 C2,0 2,-14 0,-22" stroke="#5f7a4a" stroke-width="2" fill="none"/>` +
      floret(-22, -12, 1.05, -20) + floret(22, -14, 1, 25) + floret(0, -24, 1.15, r() * 40);
  };

  shapes.freesia = (c) => {
    const centre = lum(c) > 0.75 ? '#f0d36a' : '#fff1b0';
    const fl = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})">${ring(6, 13, 7.5, c, { rot: 15 })}${circle(0, 0, 3.2, centre)}</g>`;
    return `<path d="M-40,28 C-20,12 0,4 18,-6 C30,-12 40,-24 42,-36" stroke="#6b8a4c" stroke-width="2.6" fill="none"/>` +
      fl(-22, 0, 1.55) + fl(0, -10, 1.35) + fl(18, -20, 1.1) +
      `<ellipse cx="32" cy="-30" rx="4" ry="7" fill="${light(c, 0.05)}" transform="rotate(40 32 -30)"/>` +
      `<ellipse cx="40" cy="-38" rx="3" ry="5" fill="#9cb06a" transform="rotate(50 40 -38)"/>`;
  };

  shapes.sweetpea = (c, r) => {
    const fl = (x, y, s, rot) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">` +
      `<path d="${ruffle(16, 2.4, 22, r)}" fill="${c}" stroke="${dark(c, 0.28)}" stroke-width=".6" transform="translate(0,-6) scale(1.15 0.9)"/>` +
      `<path d="M-12,4 C-14,14 -2,16 0,8 C2,16 14,14 12,4 C6,0 -6,0 -12,4Z" fill="${dark(c, 0.12)}"/>` +
      `<path d="M-3,6 C-2,12 2,12 3,6Z" fill="${light(c, 0.3)}"/></g>`;
    return `<path d="M0,46 C0,20 -4,0 -10,-20 M0,24 C8,10 16,-4 20,-14" stroke="#7e9a5a" stroke-width="2" fill="none"/>` +
      fl(-16, -18, 1.05, -15) + fl(18, -12, 0.95, 20) + fl(0, 10, 1.15, 0);
  };

  /* ---------- fillers ---------- */
  shapes.gypsophila = (c, r) => {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4;
      s += `<path d="M0,40 Q${f(Math.cos(a) * 18)},${f(Math.sin(a) * 18 + 20)} ${f(Math.cos(a) * 38)},${f(Math.sin(a) * 38 + 6)}" stroke="#94a77a" stroke-width=".9" fill="none"/>`;
    }
    for (let i = 0; i < 58; i++) {
      const rad = Math.sqrt(r()) * 40, a = r() * Math.PI * 2;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad * 0.8 - 4;
      s += circle(x, y, 2 + r() * 1.6, i % 4 ? c : light(c, 0.5), `stroke="${dark(c, 0.18)}" stroke-width=".4"`);
    }
    return s;
  };

  shapes.statice = (c, r) => {
    let s = `<path d="M0,44 L0,0 M0,20 L-20,-10 M0,14 L20,-14 M0,6 L-6,-26" stroke="#8aa070" stroke-width="2" fill="none"/>`;
    for (let i = 0; i < 26; i++) {
      const rad = Math.sqrt(r()) * 36, a = r() * Math.PI * 2;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad * 0.75 - 10;
      s += `<rect x="${f(x - 5)}" y="${f(y - 5)}" width="10" height="10" rx="4" fill="${mix(c, '#2b1d1a', r() * 0.15)}" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`;
      if (i % 2) s += circle(x, y, 1.6, '#fbf7ee');
    }
    return s;
  };

  shapes.waxflower = (c, r) => {
    let s = `<path d="M0,44 C0,20 -4,0 -16,-20 M0,24 C10,10 20,-2 26,-18 M0,10 C2,-6 4,-20 6,-34" stroke="#7a6b4c" stroke-width="1.6" fill="none"/>`;
    for (let i = 0; i < 14; i++) {
      const rad = 12 + r() * 28, a = -Math.PI / 2 + (r() - 0.5) * 2.6;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad + 4;
      s += `<g transform="translate(${f(x)},${f(y)}) rotate(${f(r() * 72)})">${ring(5, 7, 4.4, c, { sw: 0.4 })}${circle(0, 0, 2, '#7a3b3a')}</g>`;
    }
    return s;
  };

  shapes.gomphrena = (c, r) => {
    let s = `<path d="M0,44 C0,20 -10,0 -18,-14 M0,30 C6,10 16,0 20,-12 M0,20 C0,0 2,-14 2,-26" stroke="#6f8a50" stroke-width="1.6" fill="none"/>`;
    [[-18, -18, 1], [20, -16, 0.9], [2, -30, 1.05], [-6, 0, 0.85], [14, 4, 0.8]].forEach(([x, y, k]) => {
      s += `<g transform="translate(${x},${y}) scale(${k})"><ellipse rx="10" ry="11" fill="${c}"/>`;
      for (let i = 0; i < 9; i++) {
        s += `<path d="M${f(-6 + (i % 3) * 6)},${f(-7 + Math.floor(i / 3) * 6)} q2,-2 4,0" stroke="${dark(c, 0.25)}" stroke-width=".8" fill="none"/>`;
      }
      s += '</g>';
    });
    return s;
  };

  shapes.matricaria = (c, r) => {
    let s = `<path d="M0,44 C0,20 -14,2 -24,-12 M0,30 C8,12 20,2 26,-10 M0,18 C-2,0 -2,-14 0,-26" stroke="#6b8a4c" stroke-width="1.5" fill="none"/>`;
    [[-24, -14], [26, -12], [0, -28], [-10, 2], [14, 6], [-26, 14], [28, 16]].forEach(([x, y], i) => {
      s += `<g transform="translate(${x},${y}) scale(${0.9 + (i % 3) * 0.1})">${ring(12, 9, 2.6, c, { r, jitter: 6 })}${circle(0, 0, 4, '#e8c33a')}${circle(-1, -1, 1.6, '#f4dc6a')}</g>`;
    });
    return s;
  };

  /* ---------- tall flowers (stem end at 0,0) ---------- */
  shapes.delphinium = (c, r) => {
    let s = `<path d="M0,0 L0,-112" stroke="#5f7a4a" stroke-width="3"/>`;
    for (let i = 0; i < 11; i++) {
      const t = i / 10, y = -28 - t * 84, size = 1.05 - t * 0.6, x = (i % 2 ? 7 : -7) * (1 - t * 0.6);
      if (t > 0.8) { s += `<ellipse cx="${f(x * 0.5)}" cy="${f(y)}" rx="${f(4 * size + 1)}" ry="${f(5 * size + 1.5)}" fill="${dark(c, 0.08)}"/>`; continue; }
      s += `<g transform="translate(${f(x)},${f(y)}) scale(${f(size)}) rotate(${f(r() * 72)})">${ring(5, 12, 7.4, mix(c, '#ffffff', r() * 0.15), { sw: 0.5 })}${circle(0, 0, 3.2, lum(c) > 0.8 ? '#3d4a7a' : '#f4f2ea')}</g>`;
    }
    return s;
  };

  shapes.stock = (c, r) => {
    let s = `<path d="M0,0 L0,-110" stroke="#6d8a54" stroke-width="3.4"/>`;
    for (let i = 0; i < 12; i++) {
      const t = i / 11, y = -26 - t * 84, rad = 13 - t * 7, x = (i % 2 ? 6 : -6) * (1 - t * 0.5);
      s += `<path d="${ruffle(rad, 2.4, 16, r)}" transform="translate(${f(x)},${f(y)})" fill="${i % 3 ? c : light(c, 0.14)}" stroke="${dark(c, 0.3)}" stroke-width=".5"/>`;
      s += circle(x, y, 2, dark(c, 0.18));
    }
    return s;
  };

  shapes.calla = (c) => {
    const d1 = dark(c, 0.18), inside = lum(c) > 0.75 ? '#f3efd8' : light(c, 0.2);
    return `<path d="M0,0 C0,-14 1,-30 2,-44" stroke="#5f7a4a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M2,-42 C-14,-58 -18,-92 -10,-112 C-2,-104 16,-98 22,-82 C26,-70 14,-52 2,-42Z" fill="${c}" stroke="${d1}" stroke-width=".8"/>` +
      `<path d="M-10,-112 C-2,-104 16,-98 22,-82 C10,-90 -2,-100 -10,-112Z" fill="${inside}"/>` +
      `<path d="M2,-48 C2,-62 4,-76 6,-86" stroke="#e9c443" stroke-width="3.6" stroke-linecap="round" fill="none"/>` +
      `<path d="M-6,-60 C-10,-80 -10,-96 -8,-106" stroke="${d1}" stroke-width="1" fill="none" opacity=".6"/>`;
  };

  /* ---------- foliage sprigs (stem end at 0,0) ---------- */
  shapes.eucalyptus = (c, r) => {
    let s = `<path d="M0,0 C2,-40 -4,-90 6,-154" stroke="#7f8f78" stroke-width="2.2" fill="none"/>`;
    for (let i = 0; i < 9; i++) {
      const t = i / 8, y = -18 - t * 132, x = Math.sin(t * 3) * 3 + 1, side = i % 2 ? 1 : -1, rad = 14 - t * 6;
      s += circle(x + side * (rad * 0.8), y, rad, mix(c, '#ffffff', r() * 0.18), `stroke="${light(c, 0.38)}" stroke-width="1.4"`);
      s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + side * rad * 0.7)}" y2="${f(y)}" stroke="${dark(c, 0.15)}" stroke-width=".7"/>`;
    }
    return s;
  };

  shapes.ruscus = (c, r) => {
    let s = `<path d="M0,0 C1,-50 -2,-100 2,-156" stroke="${dark(c, 0.1)}" stroke-width="1.8" fill="none"/>`;
    for (let i = 0; i < 12; i++) {
      const t = i / 11, y = -16 - t * 136, side = i % 2 ? 1 : -1, len = 26 - t * 10;
      s += `<path d="${petal(len, 6.5, 1)}" transform="translate(${f(side * 1)},${f(y)}) rotate(${side * (52 + r() * 10)})" fill="${mix(c, '#ffffff', r() * 0.1)}" stroke="${dark(c, 0.25)}" stroke-width=".5"/>`;
    }
    return s;
  };

  shapes.lemonleaf = (c, r) => {
    let s = `<path d="M0,0 C-2,-50 4,-100 -2,-150" stroke="#5b4a3a" stroke-width="2" fill="none"/>`;
    for (let i = 0; i < 7; i++) {
      const t = i / 6, y = -22 - t * 126, side = i % 2 ? 1 : -1, len = 36 - t * 12;
      const rot = side * (48 + r() * 14);
      s += `<g transform="translate(0,${f(y)}) rotate(${f(rot)})"><path d="${petal(len, len * 0.42, 0.6)}" fill="${mix(c, '#ffffff', r() * 0.1)}" stroke="${dark(c, 0.3)}" stroke-width=".6"/>` +
        `<path d="M0,0 L0,${f(-len * 0.92)}" stroke="${light(c, 0.25)}" stroke-width=".9"/></g>`;
    }
    return s;
  };

  shapes.mistyblue = (c, r) => {
    let s = '';
    const branches = [[0, -150], [-24, -120], [22, -128], [-12, -96], [14, -84]];
    branches.forEach(([x, y]) => {
      s += `<path d="M0,0 C${f(x * 0.2)},${f(y * 0.4)} ${f(x * 0.8)},${f(y * 0.7)} ${x},${y}" stroke="#7d8d6a" stroke-width="1.2" fill="none"/>`;
      for (let i = 0; i < 16; i++) {
        const t = 0.45 + r() * 0.55;
        s += circle(x * t + (r() - 0.5) * 8, y * t + (r() - 0.5) * 6, 1.6 + r() * 1.4, mix(c, '#ffffff', r() * 0.3));
      }
    });
    return s;
  };

  /* ---------- public: art for a flower ---------- */
  const VIEWBOX = { head: '-50 -50 100 100', tall: '-30 -120 60 120', sprig: '-40 -160 80 160' };

  function flowerSVG(flower, colorHex) {
    const draw = shapes[flower.shape] || shapes.daisy;
    const body = draw(colorHex, rng(flower.id + colorHex));
    return `<svg viewBox="${VIEWBOX[flower.art] || VIEWBOX.head}" overflow="visible" aria-hidden="true">${body}</svg>`;
  }

  /* ---------- wrapping paper (coordinates relative to the binding point) ---------- */
  let uid = 0;
  function paperDefs(wrap, id) {
    if (!wrap) return '';
    if (wrap.style === 'kraft') {
      return `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/>` +
        `<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .55 -.18"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter>`;
    }
    if (wrap.style === 'news') {
      return `<pattern id="${id}" width="46" height="9" patternUnits="userSpaceOnUse"><rect width="46" height="9" fill="${wrap.hex}"/>` +
        `<rect x="2" y="3" width="${18 + 9}" height="1.4" fill="#8b857a" opacity=".55"/><rect x="31" y="3" width="13" height="1.4" fill="#8b857a" opacity=".55"/></pattern>`;
    }
    return '';
  }
  function paperFill(wrap, id, shade = 0) {
    if (wrap.style === 'news') return `fill="url(#${id})"`;
    const col = shade ? dark(wrap.hex, shade) : wrap.hex;
    if (wrap.style === 'sheer') return `fill="#ffffff" fill-opacity="${0.42 - shade}" stroke="#ffffff" stroke-opacity=".9" stroke-width="1.2"`;
    if (wrap.style === 'kraft') return `fill="${col}" filter="url(#${id})"`;
    return `fill="${col}"`;
  }
  function edge(wrap) { return wrap.style === 'sheer' ? '#d9d4ca' : dark(wrap.hex, 0.22); }

  /* g = { R: dome radius, top: y of the dome top, low: y of the dome's lower edge } */
  function wrapBack(wrap, g) {
    if (!wrap) return '';
    const id = 'pp' + (++uid), W = g.R + 64, T = g.top - 34;
    const sheet = (rot, shade) => `<g transform="rotate(${rot})"><path d="M-14,8 L${f(-W * 0.92)},${f(T * 0.58)} L${f(-W * 0.18)},${f(T)} L${f(W * 0.62)},${f(T * 0.8)} L14,8Z" ${paperFill(wrap, id, shade)} stroke="${edge(wrap)}" stroke-width=".8" stroke-linejoin="round"/>` +
      `<path d="M0,6 L${f(-W * 0.18)},${f(T)}" stroke="${edge(wrap)}" stroke-width=".7" opacity=".45"/></g>`;
    return `<defs>${paperDefs(wrap, id)}</defs>` + sheet(-14, 0.1) + sheet(13, 0.04);
  }

  function wrapFront(wrap, g) {
    if (!wrap) return '';
    const id = 'pf' + (++uid), w = g.R * 0.86 + 34, y = Math.min(-36, g.low);
    const sag = 24, neck = 15, skirt = 40, bottom = 132;
    const body = `M${f(-w)},${f(y)} C${f(-w * 0.5)},${f(y + sag)} ${f(w * 0.5)},${f(y + sag)} ${f(w)},${f(y)} ` +
      `C${f(w * 0.7)},${f(y * 0.45)} ${neck + 6},-6 ${neck},2 L${skirt},${bottom} C${skirt * 0.4},${bottom + 6} ${-skirt * 0.4},${bottom + 6} ${-skirt},${bottom} L${-neck},2 ` +
      `C${-neck - 6},-6 ${f(-w * 0.7)},${f(y * 0.45)} ${f(-w)},${f(y)}Z`;
    const flap = `M${f(w)},${f(y)} C${f(w * 0.3)},${f(y + sag * 0.8)} ${f(-w * 0.2)},${f(y * 0.5)} -2,2 L-${skirt - 6},${bottom} L${skirt},${bottom} L${neck},2 C${neck + 6},-6 ${f(w * 0.7)},${f(y * 0.45)} ${f(w)},${f(y)}Z`;
    const crease = (x1, y1) => `<path d="M${f(x1)},${f(y1)} L0,0" stroke="${edge(wrap)}" stroke-width=".8" opacity=".5" fill="none"/>`;
    return `<defs>${paperDefs(wrap, id)}</defs>` +
      `<path d="${body}" ${paperFill(wrap, id, 0.02)} stroke="${edge(wrap)}" stroke-width=".9" stroke-linejoin="round"/>` +
      crease(-w * 0.45, y + sag * 0.7) +
      `<path d="${flap}" ${paperFill(wrap, id, 0)} stroke="${edge(wrap)}" stroke-width=".9" stroke-linejoin="round"/>` +
      `<path d="M${f(w)},${f(y)} C${f(w * 0.3)},${f(y + sag * 0.8)} ${f(-w * 0.2)},${f(y * 0.5)} -2,2" stroke="${wrap.style === 'sheer' ? '#ffffff' : light(wrap.hex, 0.35)}" stroke-width="1.4" fill="none" opacity=".7"/>` +
      crease(w * 0.5, y + 6);
  }

  /* ---------- ribbon at the binding point ---------- */
  function ribbonSVG(ribbon, wrapped) {
    if (!ribbon) {
      // no ribbon: plain florist's tape around the stems
      return wrapped ? '' : `<rect x="-11" y="-4" width="22" height="9" rx="3" fill="#7d8a55"/><path d="M-11,0 L11,-2" stroke="#93a067" stroke-width="1"/>`;
    }
    const c = ribbon.hex, d = dark(c, 0.25), l = light(c, 0.35);
    if (ribbon.style === 'twine') {
      return `<g fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round">` +
        `<path d="M-16,-3 L16,-3 M-16,1 L16,1 M-16,5 L16,5" stroke="${d}"/>` +
        `<path d="M0,0 C-10,-16 -30,-12 -24,0 C-20,8 -8,4 0,0 C8,4 20,8 24,0 C30,-12 10,-16 0,0"/>` +
        `<path d="M0,1 C-4,14 -10,30 -18,44 M0,1 C4,16 8,30 12,48"/></g>` + circle(0, 0, 3, d);
    }
    const op = ribbon.style === 'sheer' ? ' fill-opacity=".72"' : '';
    return `<rect x="-${wrapped ? 20 : 13}" y="-6" width="${wrapped ? 40 : 26}" height="11" rx="2" fill="${c}"${op} stroke="${d}" stroke-width=".7"/>` +
      `<path d="M-2,2 C-8,22 -16,44 -24,66 L-13,62 L-8,70 C-4,46 0,24 3,4Z" fill="${dark(c, 0.08)}"${op} stroke="${d}" stroke-width=".7"/>` +
      `<path d="M2,2 C8,22 18,42 26,62 L15,60 L12,68 C6,46 1,24 -2,4Z" fill="${c}"${op} stroke="${d}" stroke-width=".7"/>` +
      `<path d="M0,0 C-14,-24 -44,-20 -40,-2 C-36,12 -14,8 0,0Z" fill="${c}"${op} stroke="${d}" stroke-width=".8"/>` +
      `<path d="M0,0 C14,-24 44,-20 40,-2 C36,12 14,8 0,0Z" fill="${c}"${op} stroke="${d}" stroke-width=".8"/>` +
      (ribbon.style === 'satin' ? `<path d="M-6,-4 C-14,-14 -30,-14 -34,-6 M6,-4 C14,-14 30,-14 34,-6" stroke="${l}" stroke-width="1.6" fill="none" opacity=".8"/>` : '') +
      `<rect x="-6" y="-7" width="12" height="13" rx="4" fill="${dark(c, 0.05)}"${op} stroke="${d}" stroke-width=".8"/>`;
  }

  /* little round swatch for the wrap picker */
  function wrapSwatch(wrap) {
    const id = 'sw' + (++uid);
    return `<svg viewBox="0 0 60 60" aria-hidden="true"><defs>${paperDefs(wrap, id)}</defs>` +
      `<rect width="60" height="60" ${paperFill(wrap, id)}/>` +
      `<path d="M0,40 L60,18" stroke="${edge(wrap)}" stroke-width="1" opacity=".5"/></svg>`;
  }

  window.HansongiArt = { flowerSVG, wrapBack, wrapFront, ribbonSVG, wrapSwatch, mix, dark, light, lum };
})();
