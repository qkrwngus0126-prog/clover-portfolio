/* 하늘: 지금 시각에 따라 들판의 빛과 화면 색을 바꿉니다.
   새벽 5–7시 · 낮 7–17시 · 해 질 녘 17–19시 · 밤 19–5시 (방문자 컴퓨터의 시계 기준)
   밤에는 반딧불이가 날아다녀요. 도움말 창에서 직접 고를 수도 있어요.

   Sky.set('auto' | 'dawn' | 'day' | 'dusk' | 'night')  Sky.choice()  Sky.phase() */
(function () {
  const root = document.documentElement;
  const KEY = 'happy:time';
  const THEME = { dawn: '#1a1820', day: '#eef0e4', dusk: '#21170f', night: '#0b1017' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function byClock(d = new Date()) {
    const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 19) return 'dusk';
    return 'night';
  }
  function choice() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (_) { return 'auto'; }
  }
  let current = null;
  const listeners = [];
  function apply() {
    const c = choice();
    const phase = c === 'auto' ? byClock() : c;
    if (phase === current) return;
    current = phase;
    root.dataset.time = phase;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = THEME[phase];
    flies.toggle(phase === 'night' ? 1 : phase === 'dusk' ? 0.35 : 0);
    for (const fn of listeners) fn(phase);
  }

  /* ---------- fireflies: a handful of soft lights drifting over the field at night ---------- */
  const flies = (() => {
    let canvas = null, ctx = null, list = [], raf = 0, amount = 0, last = 0, W = 0, H = 0;
    function size() {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W); canvas.height = Math.round(H);
      const n = Math.round(Math.min(40, W * H / 36000) * amount);
      while (list.length < n) list.push(spawn());
      list.length = n;
    }
    function spawn() {
      return { x: Math.random() * W, y: Math.random() * H, a: Math.random() * Math.PI * 2, sp: 0.15 + Math.random() * 0.35,
        ph: Math.random() * Math.PI * 2, rate: 0.6 + Math.random() * 0.9, r: 1.4 + Math.random() * 1.4 };
    }
    function frame(now) {
      raf = 0;
      if (!amount || document.hidden) return;
      // about 30 frames a second is plenty for something this slow
      if (now - last < 32) { raf = requestAnimationFrame(frame); return; }
      const dt = last ? Math.min(3, (now - last) / 16.67) : 1;
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const f of list) {
        f.a += (Math.random() - 0.5) * 0.18 * dt;
        f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt;
        if (f.x < -10) f.x = W + 10; else if (f.x > W + 10) f.x = -10;
        if (f.y < -10) f.y = H + 10; else if (f.y > H + 10) f.y = -10;
        const glow = Math.max(0, Math.sin(now / 1000 * f.rate + f.ph));
        if (glow < 0.04) continue;
        const R = f.r * 5;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
        g.addColorStop(0, `rgba(236,255,170,${0.9 * glow})`);
        g.addColorStop(0.25, `rgba(200,240,120,${0.45 * glow})`);
        g.addColorStop(1, 'rgba(200,240,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function still() {
      // with reduced motion: a few lights that simply stay where they are
      ctx.clearRect(0, 0, W, H);
      for (const f of list) {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
        g.addColorStop(0, 'rgba(236,255,170,0.55)'); g.addColorStop(1, 'rgba(200,240,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    function start() {
      if (!canvas || !amount) { if (ctx) ctx.clearRect(0, 0, W, H); return; }
      size();
      if (reduce) { still(); return; }
      last = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', start);
    return {
      mount(el) {
        canvas = el; ctx = canvas.getContext('2d');
        new ResizeObserver(start).observe(canvas);
        start();
      },
      toggle(a) { amount = a; list = []; start(); },
    };
  })();

  window.Sky = {
    set(c) {
      try { if (c === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, c); } catch (_) { /* 이번 방문에만 적용돼요 */ }
      current = null; apply();
    },
    choice,
    phase: () => current,
    mount(el) { flies.mount(el); },
    // call fn now and whenever the hour's light changes
    onChange(fn) { listeners.push(fn); if (current) fn(current); },
  };
  apply();
  // check the clock once a minute, so the light changes on its own while the page is open
  setInterval(apply, 60 * 1000);
})();
