/* 세잎 들판: 로그인, 읽기, 적기, 고치기, 지우기, 신고.
   데이터는 Supabase에 있고, config.js가 비어 있으면 예시 기록으로만 움직이는 미리보기로 열립니다. */
(function () {
  const cfg = window.HAPPY_CONFIG || {};
  const $ = id => document.getElementById(id);
  const sheet = $('sheet'), body = $('sheet-body');
  const PENDING = 'happy:pending';     // 로그인하러 다녀오는 동안 하던 일을 기억해 두는 곳
  const LIMITS = { line: 80, place: 40, more: 2000 };

  /* ---------- small helpers ---------- */
  // h('p', { class: 'note' }, '글자', child) — 글자는 항상 textContent로 들어가서 안전합니다
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const dot = s => (s || '').slice(0, 10).replace(/-/g, '.');
  const localDay = iso => { const d = new Date(iso); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  const chars = s => [...(s || '')].length; // 이모지도 한 글자로 셉니다

  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 3400);
  }
  function errMsg(e) {
    const m = (e && (e.message || e.error_description)) || String(e);
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return '인터넷 연결을 확인하고 다시 해 주세요.';
    if (/JWT|token/i.test(m)) return '로그인이 풀렸어요. 다시 로그인해 주세요.';
    return `잠시 후 다시 해 주세요. (${m})`;
  }

  /* ---------- connect ---------- */
  // 관리자용 키가 들어 있으면 아무것도 하지 않고 멈춥니다
  function keyProblem(key) {
    if (/^sb_secret_/.test(key)) return true;
    const parts = key.split('.');
    if (parts.length === 3) {
      try {
        const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const p = JSON.parse(atob(b + '='.repeat((4 - b.length % 4) % 4)));
        return p.role === 'service_role';
      } catch (_) { /* 알 수 없는 모양이면 Supabase가 판단하게 둡니다 */ }
    }
    return false;
  }

  let sb = null;
  const wantsServer = !!(cfg.supabaseUrl && cfg.supabaseKey);
  if (wantsServer && keyProblem(cfg.supabaseKey)) {
    document.body.prepend(h('p', { class: 'wrap', style: 'padding:16px 20px;background:#fbeae8;color:#b3261e;margin:0' },
      'config.js에 관리자용(secret / service_role) 키가 들어 있어요. 이 키는 공개되면 안 됩니다. 지금 바로 지우고, Supabase에서 그 키를 새로 발급(rotate)해 주세요. 공개용 Publishable(anon) 키를 넣어야 해요.'));
    return;
  }
  if (wantsServer && window.supabase) {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  const demo = !sb;
  if (demo) $('demo-note').hidden = false;
  if (wantsServer && !sb) $('demo-note').textContent = 'Supabase 라이브러리를 불러오지 못해 미리보기로 열었어요. 인터넷 연결을 확인해 주세요.';

  /* ---------- data: Supabase, or memory in preview ---------- */
  const BUCKET = cfg.photoBucket || 'happy-photos';
  let user = null;

  const server = {
    async list() {
      const out = [];
      for (let from = 0; from < 10000; from += 1000) {
        const { data, error } = await sb.from('happies').select('id,fx,fy,user_id,line').order('created_at').range(from, from + 999);
        if (error) throw error;
        out.push(...data);
        if (data.length < 1000) break;
      }
      return out;
    },
    async get(id) {
      const { data, error } = await sb.from('happies').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async mine() {
      const { data, error } = await sb.from('happies').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(row) {
      const { data, error } = await sb.from('happies').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, row) {
      const { data, error } = await sb.from('happies').update(row).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      const { data, error } = await sb.from('happies').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data.length) throw new Error('지울 수 없는 기록이에요.');
    },
    async report(id, reason) {
      const { error } = await sb.from('reports').insert({ happy_id: id, reason: reason || null });
      if (error) throw error;
    },
    async upload(blob) {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (error) throw error;
      return path;
    },
    async unlink(path) { await sb.storage.from(BUCKET).remove([path]); },
    photoUrl(path) { return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; },
  };

  // 미리보기: 새로고침하면 처음으로 돌아가요
  const DEMO = [
    { line: '퇴근길 버스에서 창가 자리가 비어 있었다', place: '472번 버스', happy_on: '2026-10-14', fx: 0.22, fy: 0.3 },
    { line: '엄마가 싸 준 김밥이 아직 따뜻했다', place: '회사 옥상', happy_on: '2026-10-09', fx: 0.64, fy: 0.24,
      more: '점심시간에 혼자 옥상에 올라갔다. 은박지를 벗기니 김이 살짝 올라왔다.\n별것 아닌데 하루 종일 그 김 생각이 났다.' },
    { line: '빨래가 해 질 녘에 딱 맞춰 말랐다', place: '베란다', happy_on: '2026-10-02', fx: 0.43, fy: 0.55 },
    { line: '오랜만에 연락한 친구가 바로 답장을 했다', place: '', happy_on: '2026-09-27', fx: 0.82, fy: 0.5 },
    { line: '처음 간 빵집인데 사장님이 하나 더 넣어 주셨다', place: '동네 골목 빵집', happy_on: '2026-09-20', fx: 0.12, fy: 0.68,
      more: '소금빵을 두 개 샀는데 봉투에 세 개가 들어 있었다. 다음에 또 오라고 하셨다.' },
  ].map((r, i) => ({ id: 'demo-' + i, user_id: 'demo-other', more: null, photo_path: null, created_at: r.happy_on + 'T12:00:00', updated_at: null, hidden: false, ...r }));
  const demoPhotos = new Map();
  const memory = {
    rows: DEMO.slice(),
    async list() { return this.rows.map(r => ({ id: r.id, fx: r.fx, fy: r.fy, user_id: r.user_id, line: r.line })); },
    async get(id) { return this.rows.find(r => r.id === id) || null; },
    async mine() { return this.rows.filter(r => r.user_id === user.id).reverse(); },
    async create(row) {
      const r = { id: 'demo-' + Date.now(), user_id: user.id, created_at: new Date().toISOString(), updated_at: null, hidden: false, ...row };
      this.rows.push(r); return r;
    },
    async update(id, row) {
      const r = this.rows.find(x => x.id === id);
      Object.assign(r, row, { updated_at: new Date().toISOString() }); return r;
    },
    async remove(id) { this.rows = this.rows.filter(r => r.id !== id); },
    async report() {},
    async upload(blob) { const p = 'demo/' + Date.now(); demoPhotos.set(p, URL.createObjectURL(blob)); return p; },
    async unlink(p) { URL.revokeObjectURL(demoPhotos.get(p)); demoPhotos.delete(p); },
    photoUrl(p) { return demoPhotos.get(p) || ''; },
  };
  const api = demo ? memory : server;

  /* ---------- the field ---------- */
  const foundN = $('found-n'), totalN = $('total-n'), hintText = $('hint-text'), hintBtn = $('hint-btn'), openBtn = $('open-btn');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const IDLE_HINT = coarse ? '한 손가락으로 헤집고, 두 손가락으로 둘러보세요' : '마우스를 올려 헤집고, 끌거나 스크롤해서 둘러보세요';
  hintText.textContent = IDLE_HINT;
  let shown = null;

  const field = CloverField($('field'), {
    width: cfg.fieldWidth, height: cfg.fieldHeight,
    onPick: pick,
    onShow(c) {
      shown = c;
      openBtn.hidden = !c;
      if (c) openBtn.textContent = c.kind === 'empty' ? '여기에 적기' : '열어 보기';
    },
    onFound(n, all, c) {
      foundN.textContent = n; totalN.textContent = all;
      if (c) hintText.textContent = c.kind === 'empty' ? '빈 세잎이에요. 눌러서 행복을 적어 보세요.' : c.mine ? '내가 심은 세잎이에요.' : '누군가의 행복이에요. 눌러서 읽어 보세요.';
      if (all && n === all) hintText.textContent = '들판의 세잎을 모두 찾았어요. 행복은 원래 흔했습니다.';
      if (!c && n === 0) hintText.textContent = IDLE_HINT;
      hintBtn.disabled = all > 0 && n === all;
      hintBtn.textContent = hintBtn.disabled ? '다 찾았어요' : '하나 보여 주기';
    },
  });
  // 적힌 세잎은 꽃 표시로 이미 보이니, "하나 보여 주기"는 빈 세잎부터 찾아 줘요
  hintBtn.addEventListener('click', () => field.hint('empty'));
  openBtn.addEventListener('click', () => { if (shown) pick(shown); });

  const records = new Map(); // id -> { id, fx, fy, user_id }
  let empties = [];
  let emptySeq = 0;

  // 빈 세잎 자리: 들판 어디든, 기존 세잎과 너무 가깝지 않은 곳을 무작위로 고릅니다
  function freeSpot() {
    const taken = [...records.values(), ...empties];
    const { width: W, height: H } = field.world;
    let pick = null, far = -1;
    for (let t = 0; t < 300; t++) {
      const fx = 0.03 + Math.random() * 0.94, fy = 0.03 + Math.random() * 0.94;
      let d = Infinity;
      for (const p of taken) d = Math.min(d, Math.hypot((p.fx - fx) * W, (p.fy - fy) * H));
      if (d > 130) return { fx, fy };
      if (d > far) { far = d; pick = { fx, fy }; }
    }
    return pick;
  }
  function newEmpty() {
    const spot = freeSpot();
    const e = { key: 'empty-' + (++emptySeq), kind: 'empty', fx: spot.fx, fy: spot.fy };
    empties.push(e);
    return e;
  }
  const asClover = r => ({ key: r.id, kind: 'happy', fx: r.fx, fy: r.fy, text: r.line, mine: !!user && r.user_id === user.id });

  async function load() {
    let list = [];
    try { list = await api.list(); }
    catch (e) { toast('기록을 불러오지 못했어요. ' + errMsg(e)); }
    records.clear();
    list.forEach(r => records.set(r.id, r));
    empties = [];
    const n = Math.max(1, cfg.emptyClovers ?? 30);
    for (let i = 0; i < n; i++) newEmpty();
    field.set([...list.map(asClover), ...empties]);
    feed.reset();
  }

  /* ---------- the list beside the field: a few lines people wrote, one of them changing every few seconds ---------- */
  const feed = (() => {
    const box = $('feed'), list = $('feed-list');
    const narrow = matchMedia('(max-width: 640px)');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shownIds = [], timer = 0, paused = false, turn = 0;
    const size = () => narrow.matches ? 1 : 6;
    const pool = () => [...records.values()].filter(r => r.line);
    const pickNew = () => {
      const left = pool().filter(r => !shownIds.includes(r.id));
      return left.length ? left[(Math.random() * left.length) | 0] : null;
    };
    function item(r) {
      return h('li', { 'data-id': r.id },
        h('button', { type: 'button', title: '들판에서 보기', onclick: () => field.reveal(r.id, () => openRead(r.id)) },
          h('span', { class: 'dot' + (user && r.user_id === user.id ? ' mine' : '') }), h('span', { class: 't' }, r.line)));
    }
    function reset() {
      shownIds = [];
      const n = Math.min(size(), pool().length);
      for (let i = 0; i < n; i++) { const r = pickNew(); if (r) shownIds.push(r.id); }
      list.replaceChildren(...shownIds.map(id => item(records.get(id))));
      box.hidden = !shownIds.length;
      clearInterval(timer);
      timer = setInterval(rotate, narrow.matches ? 4500 : 3800);
    }
    // swap one line for one not on screen, oldest slot first, fading between them
    function rotate() {
      if (paused || document.hidden || sheet.open) return;
      const r = pickNew();
      if (!r || !shownIds.length) return;
      const slot = turn++ % shownIds.length;
      const li = list.children[slot];
      const swap = () => { shownIds[slot] = r.id; li.replaceWith(item(r)); };
      if (reduceMotion || !li) { swap(); return; }
      li.classList.add('out');
      setTimeout(() => { swap(); const n = list.children[slot]; n.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('in'))); }, 380);
    }
    box.addEventListener('pointerenter', () => { paused = true; });
    box.addEventListener('pointerleave', () => { paused = false; });
    box.addEventListener('focusin', () => { paused = true; });
    box.addEventListener('focusout', () => { paused = false; });
    narrow.addEventListener('change', reset);
    return {
      reset,
      // a line someone just wrote goes to the top at once
      put(id) {
        const r = records.get(id);
        if (!r) return;
        const at = shownIds.indexOf(id);
        if (at >= 0) { list.children[at].replaceWith(item(r)); return; }
        shownIds.unshift(id);
        list.prepend(item(r));
        while (shownIds.length > size()) { shownIds.pop(); list.lastElementChild.remove(); }
        box.hidden = false;
      },
      drop(id) {
        const at = shownIds.indexOf(id);
        if (at < 0) return;
        const r = pickNew();
        if (r) { shownIds[at] = r.id; list.children[at].replaceWith(item(r)); }
        else { shownIds.splice(at, 1); list.children[at].remove(); }
        box.hidden = !shownIds.length;
      },
      mine() { for (const li of list.children) li.querySelector('.dot').classList.toggle('mine', !!user && records.get(li.dataset.id)?.user_id === user.id); },
    };
  })();

  function pick(c) {
    if (c.kind === 'empty') openEmpty(c);
    else openRead(c.key);
  }

  /* ---------- the sheet ---------- */
  let onLeave = null, openedAt = 0;
  function open(nodes, leave) {
    openedAt = performance.now();
    if (onLeave) { const f = onLeave; onLeave = null; f(); }
    body.replaceChildren(...nodes.filter(n => n != null && n !== false));
    onLeave = leave || null;
    if (!sheet.open) sheet.showModal();
    body.scrollTop = 0; sheet.scrollTop = 0;
  }
  const close = () => sheet.close();
  sheet.addEventListener('close', () => { if (onLeave) { const f = onLeave; onLeave = null; f(); } });
  // 바깥 어두운 곳을 누르면 닫힙니다. 손가락으로 세잎을 눌러 막 열린 직후에 따라오는 클릭은 무시해요
  sheet.addEventListener('click', e => { if (e.target === sheet && performance.now() - openedAt > 500) close(); });

  function head(eyebrow, title) {
    return h('div', { class: 'sheet-head' },
      h('div', { style: 'display:grid;gap:6px' },
        eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null,
        h('h2', { id: 'sheet-title' }, title)),
      h('button', { type: 'button', class: 'x-btn', 'aria-label': '닫기', onclick: close }, '×'));
  }
  function loading(text) { open([head(null, text || '불러오는 중…')]); }

  /* ---------- login ---------- */
  const returnUrl = () => location.origin + location.pathname;
  function savePending(p) { try { sessionStorage.setItem(PENDING, JSON.stringify(p)); } catch (_) {} }
  function takePending() {
    try { const v = sessionStorage.getItem(PENDING); sessionStorage.removeItem(PENDING); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }

  // 로그인이 되어 있으면 true. 아니면 하던 일을 기억해 두고 로그인 창을 엽니다.
  function requireLogin(pending, why) {
    if (user) return true;
    if (pending) savePending(pending);
    openLogin(why);
    return false;
  }

  function openLogin(why) {
    let leaving = false;
    const providers = (cfg.loginProviders && cfg.loginProviders.length ? cfg.loginProviders : [{ id: 'google', label: 'Google로 계속하기' }]);
    open([
      head(null, '로그인이 필요해요'),
      h('p', { class: 'note' }, why || '행복을 적으려면 로그인해 주세요. 읽기는 로그인 없이 할 수 있어요.', h('br'), '로그인하면 지금 하던 곳으로 바로 돌아와요.'),
      h('div', { class: 'providers' }, providers.map(p => h('button', {
        type: 'button', class: 'btn wide' + (p.id === 'google' ? ' primary' : ''),
        async onclick(e) {
          const btn = e.currentTarget;
          btn.disabled = true;
          leaving = true;
          if (demo) { setUser({ id: 'demo-me' }); close(); resume(); return; }
          const { error } = await sb.auth.signInWithOAuth({ provider: p.id, options: { redirectTo: returnUrl() } });
          if (error) { leaving = false; btn.disabled = false; toast('로그인을 시작하지 못했어요. ' + errMsg(error)); }
        },
      }, p.label))),
      demo ? h('p', { class: 'note' }, '미리보기에서는 누르면 바로 로그인한 것처럼 움직여요.') : null,
    ], () => { if (!leaving) takePending(); }); // 그냥 닫으면 하던 일도 잊습니다
  }

  const navAuth = $('nav-auth');
  function setUser(u) {
    const changed = (user && user.id) !== (u && u.id);
    user = u;
    navAuth.textContent = user ? '로그아웃' : '로그인';
    if (changed) { for (const r of records.values()) field.update(r.id, { mine: !!user && r.user_id === user.id }); feed.mine(); }
  }
  navAuth.addEventListener('click', async () => {
    if (!user) { takePending(); openLogin('로그인하면 행복을 적고, 내가 쓴 기록을 고치거나 지울 수 있어요.'); return; }
    if (sb) await sb.auth.signOut();
    setUser(null);
    toast('로그아웃했어요.');
  });

  // 로그인하고 돌아왔을 때, 하던 일을 이어서 합니다
  function resume() {
    const p = takePending();
    if (!p || !user) return;
    if (p.type === 'write') {
      let spot = empties.find(e => e.key === p.spot.key);
      if (!spot) { // 새로고침으로 빈 세잎이 새로 뿌려졌으니, 그 자리에 다시 둡니다
        spot = { key: p.spot.key + '-back', kind: 'empty', fx: p.spot.fx, fy: p.spot.fy };
        empties.push(spot); field.add(spot);
      }
      field.reveal(spot.key);
      openWrite({ spot, draft: p.draft });
    } else if (p.type === 'edit') openEditById(p.id);
    else if (p.type === 'report') openReport(p.id);
    else if (p.type === 'mine') openMine();
  }

  /* ---------- an empty clover ---------- */
  function openEmpty(c) {
    open([
      head('빈 세잎', '아직 아무도 적지 않은 세잎이에요'),
      h('p', { class: 'note' }, '여기에 행복을 적으면 이 자리에 계속 남아서, 다음에 들판을 헤집는 사람이 찾을 수 있어요.'),
      h('div', { class: 'row end' },
        h('button', { type: 'button', class: 'btn quiet', onclick: close }, '닫기'),
        h('button', { type: 'button', class: 'btn primary', onclick: () => startWrite(c) }, '여기에 행복 적기')),
    ]);
  }
  function startWrite(spot, draft) {
    if (!requireLogin({ type: 'write', spot: { key: spot.key, fx: spot.fx, fy: spot.fy }, draft })) return;
    openWrite({ spot, draft });
  }
  // 머리말의 "행복 적기": 들판을 빈 세잎 하나로 옮겨 가서 손으로 헤친 다음 적기 창을 엽니다
  $('nav-write').addEventListener('click', () => {
    let spot = empties[(Math.random() * empties.length) | 0];
    if (!spot) { spot = newEmpty(); field.add(spot); }
    field.reveal(spot.key, () => startWrite(spot));
  });

  /* ---------- reading ---------- */
  async function openRead(id) {
    loading();
    let r;
    try { r = await api.get(id); }
    catch (e) { open([head(null, '세잎을 열지 못했어요'), h('p', { class: 'note' }, errMsg(e))]); return; }
    if (!r) {
      open([head(null, '이제 볼 수 없는 세잎이에요'), h('p', { class: 'note' }, '글쓴이가 지웠거나, 신고가 쌓여 잠시 숨겨진 기록이에요.')]);
      records.delete(id); field.remove(id); feed.drop(id);
      return;
    }
    const mine = !!user && r.user_id === user.id;
    const moreText = h('p', { class: 'read-more', id: 'read-more', hidden: true }, r.more || '');
    const moreBtn = r.more ? h('button', {
      type: 'button', class: 'btn link', 'aria-expanded': 'false', 'aria-controls': 'read-more',
      onclick(e) {
        const on = moreText.hidden;
        moreText.hidden = !on;
        e.currentTarget.setAttribute('aria-expanded', String(on));
        e.currentTarget.textContent = on ? '접기' : '조금 더 읽기';
      },
    }, '조금 더 읽기') : null;

    open([
      head([dot(r.happy_on), r.place].filter(Boolean).join(' · '), r.line),
      (mine || r.hidden) ? h('div', { class: 'row' },
        mine ? h('span', { class: 'badge' }, '내가 심은 세잎') : null,
        r.hidden ? h('span', { class: 'badge warn' }, '신고가 쌓여 지금은 나에게만 보여요') : null) : null,
      r.photo_path ? h('figure', { class: 'read-photo', style: 'margin-block:0' }, h('img', { src: api.photoUrl(r.photo_path), alt: '글쓴이가 함께 올린 사진', loading: 'lazy' })) : null,
      moreBtn, moreText,
      h('div', { class: 'row split' },
        h('span', { class: 'eyebrow' }, `${localDay(r.created_at)}에 심음${r.updated_at ? ' · 고침' : ''}`),
        mine
          ? h('div', { class: 'row' },
              h('button', { type: 'button', class: 'btn', onclick: () => openWrite({ record: r }) }, '고치기'),
              h('button', { type: 'button', class: 'btn danger', onclick: () => openDelete(r) }, '지우기'))
          : h('button', { type: 'button', class: 'btn quiet', onclick: () => { if (requireLogin({ type: 'report', id: r.id }, '신고하려면 로그인해 주세요. 한 사람이 한 기록에 한 번만 신고할 수 있어요.')) openReport(r.id); } }, '신고')),
    ]);
  }

  /* ---------- writing and editing ---------- */
  async function openEditById(id) {
    loading();
    try {
      const r = await api.get(id);
      if (r && r.user_id === user.id) openWrite({ record: r }); else close();
    } catch (e) { toast(errMsg(e)); close(); }
  }

  function counter(input, max) {
    const c = h('span', { class: 'cnt' });
    const sync = () => { const n = chars(input.value); c.textContent = `${n} / ${max}`; c.classList.toggle('over', n > max); };
    input.addEventListener('input', sync); sync();
    return c;
  }

  function openWrite({ spot, draft, record }) {
    const editing = !!record;
    const src = draft || record || {};
    const t = today();

    const dateIn = h('input', { type: 'date', id: 'f-date', required: true, max: t, value: src.happy_on || t });
    const placeIn = h('input', { type: 'text', id: 'f-place', maxlength: LIMITS.place, placeholder: '예: 동네 빵집 앞 벤치', autocomplete: 'off', value: src.place || '' });
    const lineIn = h('input', { type: 'text', id: 'f-line', required: true, maxlength: LIMITS.line, placeholder: '오늘 나를 웃게 한 작은 일', autocomplete: 'off', value: src.line || '', 'aria-describedby': 'f-err' });
    const moreIn = h('textarea', { id: 'f-more', maxlength: LIMITS.more, rows: 5, placeholder: '길게 쓰고 싶을 때만 적어 주세요. 읽는 사람은 한 줄을 먼저 보고, 눌러야 이 글이 펼쳐져요.' });
    moreIn.value = src.more || '';
    const err = h('p', { class: 'err', id: 'f-err', role: 'alert' });

    // 사진: 고르는 순간 줄여 두고, 저장할 때 올립니다
    const photo = { blob: null, removed: false, url: null };
    const fileIn = h('input', { type: 'file', id: 'f-photo', accept: 'image/*', tabindex: '-1', 'aria-hidden': 'true' });
    const prevImg = h('img', { alt: '고른 사진 미리보기' });
    const prevMeta = h('span', { class: 'meta' });
    const prev = h('div', { class: 'photo-prev', hidden: true }, prevImg, prevMeta);
    const pickBtn = h('button', { type: 'button', class: 'btn', onclick: () => fileIn.click() }, '사진 고르기');
    const dropBtn = h('button', { type: 'button', class: 'btn quiet', hidden: true, onclick() {
      photo.blob = null; photo.removed = true; fileIn.value = '';
      if (photo.url) URL.revokeObjectURL(photo.url);
      photo.url = null; prev.hidden = true; dropBtn.hidden = true; pickBtn.textContent = '사진 고르기';
    } }, '사진 빼기');
    if (record && record.photo_path) {
      prevImg.src = api.photoUrl(record.photo_path); prevMeta.textContent = '지금 사진';
      prev.hidden = false; dropBtn.hidden = false; pickBtn.textContent = '다른 사진으로';
    }
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      pickBtn.disabled = true; pickBtn.textContent = '사진 줄이는 중…';
      try {
        const blob = await window.shrinkPhoto(f);
        if (photo.url) URL.revokeObjectURL(photo.url);
        photo.blob = blob; photo.removed = false; photo.url = URL.createObjectURL(blob);
        prevImg.src = photo.url;
        prevMeta.textContent = `${Math.round(f.size / 1024).toLocaleString()}KB → ${Math.round(blob.size / 1024).toLocaleString()}KB`;
        prev.hidden = false; dropBtn.hidden = false;
      } catch (e) { toast(e.message || '사진을 줄이지 못했어요.'); }
      pickBtn.disabled = false; pickBtn.textContent = photo.blob || !prev.hidden ? '다른 사진으로' : '사진 고르기';
    });

    const submit = h('button', { type: 'submit', class: 'btn primary' }, editing ? '고친 내용 저장' : '들판에 심기');
    const form = h('form', { class: 'form', novalidate: true },
      h('div', { class: 'two' },
        h('div', { class: 'f' }, h('label', { for: 'f-date' }, '행복했던 날'), dateIn),
        h('div', { class: 'f' }, h('label', { for: 'f-place' }, h('span', null, '장소 ', h('span', { class: 'opt' }, '선택')), counter(placeIn, LIMITS.place)), placeIn)),
      h('div', { class: 'f' }, h('label', { for: 'f-line' }, h('span', null, '한 줄'), counter(lineIn, LIMITS.line)), lineIn),
      h('details', { class: 'more', open: !!src.more },
        h('summary', null, '조금 더 적기 (선택)'),
        h('div', { class: 'f' }, h('label', { for: 'f-more' }, h('span', { class: 'opt' }, '길게 적기'), counter(moreIn, LIMITS.more)), moreIn)),
      h('div', { class: 'f photo-pick' },
        h('span', { class: 'lab' }, h('span', null, '사진 ', h('span', { class: 'opt' }, '선택 · 1장'))),
        prev, h('div', { class: 'row' }, pickBtn, dropBtn, fileIn)),
      err,
      h('div', { class: 'row end' },
        h('button', { type: 'button', class: 'btn quiet', onclick: close }, '취소'),
        submit));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.textContent = '';
      const row = {
        happy_on: dateIn.value,
        place: placeIn.value.trim() || null,
        line: lineIn.value.trim(),
        more: moreIn.value.trim() || null,
      };
      if (!row.line) { err.textContent = '한 줄은 꼭 적어 주세요.'; lineIn.focus(); return; }
      if (chars(row.line) > LIMITS.line) { err.textContent = `한 줄은 ${LIMITS.line}자까지예요.`; lineIn.focus(); return; }
      if (!row.happy_on || row.happy_on > today()) { err.textContent = '행복했던 날은 오늘이나 그 전 날짜로 골라 주세요.'; dateIn.focus(); return; }
      if (chars(row.place) > LIMITS.place || chars(row.more) > LIMITS.more) { err.textContent = '글자 수를 조금 줄여 주세요.'; return; }
      // 쓰는 사이에 로그인이 풀렸다면, 쓴 글을 기억해 두고 다시 로그인합니다 (사진은 다시 골라야 해요)
      if (!user) {
        requireLogin(editing ? { type: 'edit', id: record.id } : { type: 'write', spot: { key: spot.key, fx: spot.fx, fy: spot.fy }, draft: row },
          '로그인이 풀렸어요. 다시 로그인하면 쓰던 글로 돌아와요.');
        return;
      }

      submit.disabled = true; submit.textContent = photo.blob ? '사진 올리는 중…' : '저장하는 중…';
      let uploaded = null;
      try {
        let photo_path = record ? record.photo_path : null;
        if (photo.blob) { uploaded = await api.upload(photo.blob); photo_path = uploaded; }
        else if (photo.removed) photo_path = null;
        submit.textContent = '저장하는 중…';
        const saved = editing
          ? await api.update(record.id, { ...row, photo_path })
          : await api.create({ ...row, photo_path, fx: spot.fx, fy: spot.fy });
        // 바꾸거나 뺀 예전 사진은 지웁니다
        if (record && record.photo_path && record.photo_path !== photo_path) api.unlink(record.photo_path).catch(() => {});
        if (photo.url) URL.revokeObjectURL(photo.url);
        records.set(saved.id, { id: saved.id, fx: saved.fx, fy: saved.fy, user_id: saved.user_id, line: saved.line });
        feed.put(saved.id);

        if (editing) {
          field.update(saved.id, { text: saved.line });
          toast('고쳤어요.');
          openRead(saved.id);
        } else {
          // 빈 세잎이 내 세잎이 되고, 들판 어딘가에 새 빈 세잎이 하나 생깁니다
          empties = empties.filter(x => x.key !== spot.key);
          field.update(spot.key, { key: saved.id, kind: 'happy', mine: true, text: saved.line });
          field.add(newEmpty());
          close();
          field.reveal(saved.id);
          toast(demo ? '심었어요. 미리보기라서 새로고침하면 사라져요.' : '들판에 심었어요. 다음 사람이 이 자리에서 찾을 수 있어요.');
        }
      } catch (e2) {
        if (uploaded) api.unlink(uploaded).catch(() => {});
        err.textContent = errMsg(e2);
        submit.disabled = false; submit.textContent = editing ? '고친 내용 저장' : '들판에 심기';
      }
    });

    open([head(editing ? '내 세잎 고치기' : '빈 세잎에 적기', editing ? '행복을 고쳐 적어요' : '오늘의 세잎 한 장'), form],
      () => { if (photo.url) URL.revokeObjectURL(photo.url); });
    setTimeout(() => lineIn.focus({ preventScroll: true }), 50);
  }

  /* ---------- deleting ---------- */
  function openDelete(r, back) {
    const yes = h('button', { type: 'button', class: 'btn danger', async onclick() {
      yes.disabled = true; yes.textContent = '지우는 중…';
      try {
        await api.remove(r.id);
        if (r.photo_path) api.unlink(r.photo_path).catch(() => {});
        records.delete(r.id); field.remove(r.id); feed.drop(r.id);
        toast('지웠어요.');
        if (back) back(); else close();
      } catch (e) { yes.disabled = false; yes.textContent = '지우기'; toast(errMsg(e)); }
    } }, '지우기');
    open([
      head(null, '이 세잎을 지울까요?'),
      h('p', { class: 'note' }, `“${r.line}”`, h('br'), '지우면 들판에서 사라지고 되돌릴 수 없어요.'),
      h('div', { class: 'row end' }, h('button', { type: 'button', class: 'btn quiet', onclick: () => back ? back() : openRead(r.id) }, '그대로 두기'), yes),
    ]);
  }

  /* ---------- reporting ---------- */
  function openReport(id) {
    const reason = h('select', { id: 'f-reason' },
      ['불쾌하거나 혐오스러운 내용', '광고나 스팸', '다른 사람의 개인정보', '기타'].map(v => h('option', { value: v }, v)));
    const yes = h('button', { type: 'button', class: 'btn danger', async onclick() {
      yes.disabled = true;
      try {
        await api.report(id, reason.value);
        toast('신고했어요. 고맙습니다.');
        close();
      } catch (e) {
        yes.disabled = false;
        toast(e && e.code === '23505' ? '이미 신고한 기록이에요.' : errMsg(e));
        if (e && e.code === '23505') close();
      }
    } }, '신고하기');
    open([
      head(null, '이 기록을 신고할까요?'),
      h('p', { class: 'note' }, '신고가 3번 쌓이면 관리자가 확인할 때까지 들판에서 숨겨져요. 누가 신고했는지는 글쓴이에게 보이지 않아요.'),
      h('div', { class: 'f' }, h('label', { for: 'f-reason' }, '이유'), reason),
      h('div', { class: 'row end' }, h('button', { type: 'button', class: 'btn quiet', onclick: () => openRead(id) }, '취소'), yes),
    ]);
  }

  /* ---------- my records ---------- */
  async function openMine() {
    loading('내 기록');
    let list;
    try { list = await api.mine(); }
    catch (e) { open([head(null, '내 기록'), h('p', { class: 'note' }, errMsg(e))]); return; }
    const out = h('button', { type: 'button', class: 'btn quiet', onclick: () => navAuth.click() }, '로그아웃');
    if (!list.length) {
      open([head(null, '내 기록'),
        h('p', { class: 'note' }, '아직 심은 세잎이 없어요. 들판에서 빈 세잎을 찾아보세요.'),
        h('div', { class: 'row split' }, out, h('button', { type: 'button', class: 'btn primary', onclick: () => { close(); $('nav-write').click(); } }, '행복 적기'))]);
      return;
    }
    open([
      head(`모두 ${list.length}개`, '내 기록'),
      h('ul', { class: 'mine' }, list.map(r => h('li', null,
        h('span', { class: 'eyebrow' }, [dot(r.happy_on), r.place].filter(Boolean).join(' · ')),
        h('span', { class: 'l' }, r.line),
        r.hidden ? h('span', { class: 'badge warn' }, '신고가 쌓여 숨겨짐') : null,
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn', onclick: () => { close(); field.reveal(r.id, () => openRead(r.id)); } }, '들판에서 보기'),
          h('button', { type: 'button', class: 'btn', onclick: () => openWrite({ record: r }) }, '고치기'),
          h('button', { type: 'button', class: 'btn danger', onclick: () => openDelete(r, openMine) }, '지우기'))))),
      h('div', { class: 'row' }, out),
    ]);
  }
  $('nav-mine').addEventListener('click', () => {
    if (requireLogin({ type: 'mine' }, '내 기록을 보려면 로그인해 주세요.')) openMine();
  });

  /* ---------- help, and the card shown on a first visit ---------- */
  function openHelp() {
    const steps = [
      ['헤집기', coarse ? '한 손가락으로 네잎을 헤치면 아래 숨은 세잎이 드러나요.' : '마우스를 들판 위에서 움직이면 네잎이 헤쳐지고 아래 숨은 세잎이 드러나요.'],
      ['둘러보기', coarse ? '들판은 화면보다 훨씬 넓어요. 두 손가락으로 끌어서 옮겨 다니세요.' : '들판은 화면보다 훨씬 넓어요. 끌거나 스크롤해서 옮겨 다니세요.'],
      ['읽기', '누군가 적어 둔 세잎 위에는 작은 흰 꽃이 피어 있어요. 꽃을 누르면 바로 읽을 수 있어요. 옆 목록의 문장을 눌러도 그 세잎으로 데려가 줘요. 로그인은 필요 없어요.'],
      ['심기', '꽃이 없는 곳 아래에는 빈 세잎이 숨어 있어요. 헤집어서 찾으면 내 행복을 적을 수 있고, 그 자리에 꽃이 피어 다음 사람을 기다립니다. 내가 심은 곳의 꽃은 금색이에요.'],
    ];
    open([
      head(null, '이렇게 써요'),
      h('ol', { class: 'steps' }, steps.map(([b, t]) => h('li', null, h('b', null, b), h('span', null, t)))),
      h('p', { class: 'note' }, '오른쪽 위 작은 지도는 들판 전체예요. 누르면 그곳으로 옮겨 가요.'),
      skyPicker(),
      h('div', { class: 'row split' },
        h('a', { href: 'privacy.html', class: 'btn quiet' }, '개인정보처리방침'),
        h('button', { type: 'button', class: 'btn primary', onclick: close }, '들판으로')),
    ]);
  }
  // 들판의 시간: 평소엔 시계를 따르고, 원하면 하나로 고정할 수 있어요
  function skyPicker() {
    const opts = [['auto', '시계 따라'], ['dawn', '새벽'], ['day', '낮'], ['dusk', '해 질 녘'], ['night', '밤']];
    const now = window.Sky ? window.Sky.choice() : 'auto';
    const group = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': '들판의 시간' },
      opts.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === now), onclick(e) {
        window.Sky && window.Sky.set(v);
        for (const b of group.children) b.setAttribute('aria-checked', String(b === e.currentTarget));
      } }, t)));
    return h('div', { class: 'f' }, h('span', { class: 'lab' }, '들판의 시간'), group);
  }
  if (window.Sky) { window.Sky.mount($('flies')); window.Sky.onChange(phase => field.setLight(phase)); }
  $('help-btn').addEventListener('click', openHelp);
  const intro = $('intro');
  try { if (localStorage.getItem('happy:intro-closed')) intro.hidden = true; } catch (_) { /* 저장소를 못 쓰면 매번 보여 줘요 */ }
  $('intro-close').addEventListener('click', () => {
    intro.hidden = true;
    try { localStorage.setItem('happy:intro-closed', '1'); } catch (_) { /* 괜찮아요 */ }
  });

  /* ---------- start ---------- */
  (async function start() {
    if (sb) {
      // 구글에서 돌아온 직후라면 여기서 로그인이 마무리됩니다
      const { data } = await sb.auth.getSession();
      setUser(data.session ? data.session.user : null);
      const q = new URLSearchParams(location.search), hash = new URLSearchParams(location.hash.slice(1));
      const failed = q.get('error_description') || hash.get('error_description');
      if (q.has('code') || q.has('error') || hash.has('access_token') || hash.has('error')) history.replaceState(null, '', location.pathname);
      if (failed) { toast('로그인하지 못했어요. ' + failed); takePending(); }
      sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));
    }
    await load();
    resume();
  })();
})();
