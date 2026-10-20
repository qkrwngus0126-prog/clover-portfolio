/* App state and screens. Everything the person picks lives in `state` and is kept in this browser
   so a refresh doesn't lose the bouquet. Words, flowers and recipes all come from data.js. */
(function () {
  'use strict';

  const D = window.HANSONGI;
  const artHTML = window.HansongiArtHTML;
  const Art = window.HansongiArt;
  const flowersById = Object.fromEntries(D.flowers.map(fl => [fl.id, fl]));
  const wrapsById = Object.fromEntries(D.wraps.map(w => [w.id, w]));
  const ribbonsById = Object.fromEntries(D.ribbons.map(r => [r.id, r]));
  const moodsById = Object.fromEntries(D.moods.map(m => [m.id, m]));

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const STEPS = ['flowers', 'wrap', 'real', 'card', 'done'];
  const STORE = 'hansongi:v1';

  /* ---------- state ---------- */
  const fresh = () => ({ stems: [], seq: 0, wrap: null, ribbon: null, mood: null, to: '', from: '', message: '', edited: false, step: 'flowers' });
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && Array.isArray(saved.stems)) {
      state = Object.assign(fresh(), saved);
      state.stems = state.stems.filter(s => flowersById[s.f]);
    }
  } catch (e) { /* private window or blocked storage: start fresh */ }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* not essential */ } }

  const ui = { group: 'main', color: {}, recMood: null, recViews: [], realViews: [] };
  D.flowers.forEach(fl => { ui.color[fl.id] = fl.colors[0].id; });

  /* ---------- helpers ---------- */
  const colorName = id => (D.colors[id] || { name: id }).name;
  const colorHex = id => (D.colors[id] || { hex: '#ddd' }).hex;
  function meaningOf(fid, cid) {
    const fl = flowersById[fid];
    const c = fl.colors.find(x => x.id === cid);
    return (c && c.meaning) || fl.meaning;
  }
  function hasBatchim(word) {
    const ch = word.trim().slice(-1).charCodeAt(0);
    if (ch < 0xac00 || ch > 0xd7a3) return false;
    return (ch - 0xac00) % 28 !== 0;
  }
  // stems grouped by flower+colour, in the order they were first added
  function bunches() {
    const map = new Map();
    state.stems.forEach(s => {
      const key = s.f + ':' + s.c;
      if (!map.has(key)) map.set(key, { key, f: s.f, c: s.c, n: 0 });
      map.get(key).n++;
    });
    const order = { main: 0, filler: 1, leaf: 2 };
    return [...map.values()].sort((a, b) => order[flowersById[a.f].group] - order[flowersById[b.f].group]);
  }
  function countOf(fid, cid) { return state.stems.filter(s => s.f === fid && s.c === cid).length; }
  function signature(list) { return [...new Set(list)].sort().join('|'); }
  const recipeSig = r => signature(r.items.map(([f, c]) => f + ':' + c));
  const currentSig = () => signature(state.stems.map(s => s.f + ':' + s.c));
  function today() {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ---------- names ---------- */
  document.title = `${D.serviceName} — 나만의 꽃다발 만들기`;
  $$('[data-name]').forEach(el => { el.textContent = D.serviceName; });
  $$('[data-tagline]').forEach(el => { el.textContent = D.tagline; });
  const enName = fl => fl.id.replace(/-/g, ' ').toUpperCase();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  // the big editorial line above the stage, one per step
  const TITLES = {
    flowers: 'ONE STEM.<br>AT A TIME.',
    wrap: 'WRAP IT<br>YOUR WAY.',
    real: 'SEE IT<br>FOR REAL.',
    card: 'SAY IT WITH<br>FLOWERS.',
    done: 'YOUR OWN<br>BLOOM.'
  };

  /* ---------- the live bouquet ---------- */
  const view = new BouquetView($('#stage'));
  const layout = $('.layout');
  const hoverable = window.matchMedia('(hover: hover)').matches;
  $('.stage-hint').textContent = hoverable ? 'MOVE YOUR CURSOR' : 'SWIPE THE BOUQUET';
  $('#stage').addEventListener('pointermove', () => layout.classList.add('has-moved'), { once: true });
  if (!hoverable) $('.stage-empty p').innerHTML = '아래 목록에서 꽃을 골라<br>한 송이씩 담아 보세요';

  function refresh(opts = {}) {
    view.update(state.stems, state.wrap, state.ribbon);
    const n = state.stems.length;
    layout.classList.toggle('is-empty', n === 0);
    $('.stage-count').textContent = n ? `${pad(n)} STEMS` : '';
    renderPicked();
    if (!opts.keepList) renderFlowerList();
    if (!state.edited) state.message = composeMessage();
    updateFoot();
    save();
  }

  /* ---------- step navigation ---------- */
  function go(step) {
    if (!STEPS.includes(step)) step = 'flowers';
    state.step = step;
    layout.dataset.step = step;
    $('.stage-title').innerHTML = TITLES[step];
    const empty = state.stems.length === 0 && step !== 'flowers';
    $$('[data-pane]').forEach(p => { p.hidden = empty || p.dataset.pane !== step; });
    $('.pane-empty').hidden = !empty;
    $$('.steps [role=tab]').forEach(b => {
      const on = b.dataset.go === step;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    const scene = step === 'card' ? 'postcard' : step === 'done' ? 'final' : 'bouquet';
    $('.scene-bouquet').hidden = scene !== 'bouquet' && !empty;
    $('.scene-postcard').hidden = scene !== 'postcard' || empty;
    $('.scene-final').hidden = scene !== 'final' || empty;
    if (!empty) {
      if (step === 'wrap') renderWraps();
      if (step === 'real') renderReal();
      if (step === 'card') renderPostcard();
      if (step === 'done') renderFinal();
    }
    updateFoot();
    $('.panel').scrollTop = 0;
    if (window.matchMedia('(max-width: 899px)').matches && step !== 'flowers' && document.body.dataset.view === 'app') {
      window.scrollTo({ top: 0 });
    }
    save();
  }

  function updateFoot() {
    const i = STEPS.indexOf(state.step);
    const labels = { flowers: '포장하기', wrap: '실사로 보기', real: '엽서 쓰기', card: '완성하기', done: '' };
    const next = $('[data-next]'), prev = $('[data-prev]');
    prev.hidden = i === 0;
    next.hidden = state.step === 'done';
    next.textContent = labels[state.step];
    next.disabled = state.stems.length === 0;
    // the one accent moment: finishing the bouquet
    next.classList.toggle('pill-accent', state.step === 'card');
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (t) go(t.dataset.go);
  });
  $('[data-next]').addEventListener('click', () => go(STEPS[STEPS.indexOf(state.step) + 1]));
  $('[data-prev]').addEventListener('click', () => go(STEPS[STEPS.indexOf(state.step) - 1]));
  $('.steps').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = STEPS.indexOf(state.step) + (e.key === 'ArrowRight' ? 1 : -1);
    if (i < 0 || i >= STEPS.length) return;
    go(STEPS[i]);
    $(`.steps [data-go="${STEPS[i]}"]`).focus();
  });

  /* ---------- 1. flowers ---------- */
  function renderSegment() {
    $('.segment').innerHTML = D.groups.map(g => {
      const n = D.flowers.filter(fl => fl.group === g.id).length;
      return `<button role="tab" aria-selected="${g.id === ui.group}" data-group="${g.id}">${esc(g.name)}<small>${n}</small></button>`;
    }).join('');
  }
  $('.segment').addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (!b) return;
    ui.group = b.dataset.group;
    renderSegment();
    renderFlowerList();
  });

  function cardAction(fl) {
    const cid = ui.color[fl.id], n = countOf(fl.id, cid);
    if (!n) return `<button type="button" class="pill pill-add" data-add>담기<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg></button>`;
    return `<div class="stepper" role="group" aria-label="${esc(fl.name)} ${esc(colorName(cid))} 송이 수">` +
      `<button type="button" data-remove aria-label="한 송이 빼기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg></button>` +
      `<output>${n}</output>` +
      `<button type="button" data-add aria-label="한 송이 더 담기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg></button></div>`;
  }
  function renderFlowerList() {
    const list = D.flowers.filter(fl => fl.group === ui.group);
    $('.flower-list').innerHTML = list.map(fl => {
      const cid = ui.color[fl.id];
      return `<li class="fcard" data-id="${fl.id}">` +
        `<button type="button" class="fcard-art" data-add aria-label="${esc(fl.name)} 한 송이 담기"><span class="mono fcard-no">No.${pad(D.flowers.indexOf(fl) + 1)}</span>${artHTML(fl, cid)}<span class="mono fcard-en">${enName(fl)}</span></button>` +
        `<div class="fcard-body">` +
          `<h3 class="fcard-name">${esc(fl.name)}</h3>` +
          `<p class="fcard-meaning">${esc(meaningOf(fl.id, cid))}</p>` +
          `<div class="dots" role="radiogroup" aria-label="색 고르기">` +
            fl.colors.map(c => `<button type="button" role="radio" aria-checked="${c.id === cid}" data-color="${c.id}" title="${esc(colorName(c.id))}" aria-label="${esc(colorName(c.id))}" style="--dot:${colorHex(c.id)}"></button>`).join('') +
          `</div>` +
          `<p class="fcard-color">${esc(colorName(cid))}</p>` +
          `<div class="fcard-act">${cardAction(fl)}</div>` +
        `</div></li>`;
    }).join('');
  }
  function updateCard(fid) {
    const li = $(`.fcard[data-id="${fid}"]`);
    if (!li) return;
    const fl = flowersById[fid], cid = ui.color[fid];
    $('.fcard-act', li).innerHTML = cardAction(fl);
    $('.fcard-meaning', li).textContent = meaningOf(fid, cid);
    $('.fcard-color', li).textContent = colorName(cid);
    $('.fcard-art .art', li).outerHTML = artHTML(fl, cid);
    $$('[data-color]', li).forEach(b => b.setAttribute('aria-checked', b.dataset.color === cid));
  }

  function addStem(fid, cid) {
    if (state.stems.length >= 60) { toast('꽃다발 하나에 60송이까지 담을 수 있어요'); return; }
    state.stems.push({ uid: 's' + (++state.seq), f: fid, c: cid });
    refresh({ keepList: true });
    updateCard(fid);
  }
  function removeStem(fid, cid) {
    for (let i = state.stems.length - 1; i >= 0; i--) {
      if (state.stems[i].f === fid && state.stems[i].c === cid) { state.stems.splice(i, 1); break; }
    }
    refresh({ keepList: true });
    updateCard(fid);
  }

  $('.flower-list').addEventListener('click', (e) => {
    const li = e.target.closest('.fcard');
    if (!li) return;
    const fid = li.dataset.id;
    const dot = e.target.closest('[data-color]');
    if (dot) { ui.color[fid] = dot.dataset.color; updateCard(fid); return; }
    if (e.target.closest('[data-add]')) { addStem(fid, ui.color[fid]); return; }
    if (e.target.closest('[data-remove]')) removeStem(fid, ui.color[fid]);
  });

  function renderPicked() {
    const list = bunches();
    $('.picked').hidden = list.length === 0;
    $('.picked-total').innerHTML = `<b>${pad(state.stems.length)}</b> STEMS`;
    $('.picked-list').innerHTML = list.map(b => {
      const fl = flowersById[b.f];
      return `<li><span class="chip-dot" style="--dot:${colorHex(b.c)}"></span>${esc(fl.name)}` +
        (fl.colors.length > 1 ? ` <span class="chip-sub">${esc(colorName(b.c))}</span>` : '') +
        ` <b>${b.n}</b><button type="button" data-f="${b.f}" data-c="${b.c}" aria-label="${esc(fl.name)} 한 송이 빼기"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg></button></li>`;
    }).join('');
  }
  $('.picked-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (b) removeStem(b.dataset.f, b.dataset.c);
  });
  $('[data-clear]').addEventListener('click', () => {
    const before = JSON.stringify(state);
    state.stems = []; state.wrap = null; state.ribbon = null;
    refresh();
    toast('꽃다발을 비웠어요', '되돌리기', () => restore(before));
  });

  /* ---------- 2. wrap ---------- */
  function renderWraps() {
    const none = (on, label, field) => `<li><button type="button" class="swatch" aria-pressed="${on}" data-${field}=""><span class="swatch-chip swatch-none"></span><span>${label}</span></button></li>`;
    $('#wrap-list').innerHTML = none(!state.wrap, '포장 없이', 'wrap') + D.wraps.map(w =>
      `<li><button type="button" class="swatch" aria-pressed="${state.wrap === w.id}" data-wrap="${w.id}"><span class="swatch-chip">${Art.wrapSwatch(w)}</span><span>${esc(w.name)}</span></button></li>`).join('');
    $('#ribbon-list').innerHTML = none(!state.ribbon, '리본 없이', 'ribbon') + D.ribbons.map(r =>
      `<li><button type="button" class="swatch" aria-pressed="${state.ribbon === r.id}" data-ribbon="${r.id}"><span class="swatch-chip swatch-ribbon swatch-${r.style}" style="--dot:${r.hex}"></span><span>${esc(r.name)}</span></button></li>`).join('');
  }
  $('#wrap-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-wrap]');
    if (!b) return;
    state.wrap = b.dataset.wrap || null;
    if (state.wrap && !state.ribbon) state.ribbon = D.ribbons[0].id;
    refresh(); renderWraps();
  });
  $('#ribbon-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ribbon]');
    if (!b) return;
    state.ribbon = b.dataset.ribbon || null;
    refresh(); renderWraps();
  });

  /* ---------- 3. realistic preview ---------- */
  function photoHTML(r, cls) {
    return `<div class="photo ${cls || ''}" data-photo="${r.id}">` +
      `<img src="${D.images.real + r.photo}" alt="${esc(r.name)} 조합을 실제 꽃으로 만든 모습 (AI 이미지)" loading="lazy">` +
      `<div class="photo-wait"><div class="photo-sketch"></div><p>이 조합의 실사 미리보기는 준비 중이에요</p></div></div>`;
  }
  // images that fail to load fall back to the drawn bouquet with a "준비 중" note
  function wirePhotos(root) {
    $$('.photo', root).forEach(ph => {
      const img = $('img', ph);
      const r = D.recipes.find(x => x.id === ph.dataset.photo);
      const fail = () => {
        ph.classList.add('is-missing');
        const sk = $('.photo-sketch', ph);
        const v = new BouquetView(sk, { static: true });
        v.update(expand(r), r.wrap, r.ribbon);
        ui.realViews.push(v);
      };
      if (img.complete && img.naturalWidth === 0) fail();
      else { img.addEventListener('error', fail, { once: true }); img.addEventListener('load', () => ph.classList.add('is-ready'), { once: true }); }
    });
  }
  function expand(r) {
    const out = [];
    r.items.forEach(([f, c, n]) => { for (let i = 0; i < n; i++) out.push({ uid: r.id + f + c + i, f, c }); });
    return out;
  }
  function renderReal() {
    ui.realViews.forEach(v => v.destroy()); ui.realViews = [];
    const sig = currentSig();
    const match = D.recipes.find(r => recipeSig(r) === sig);
    $('.real-now').innerHTML = match
      ? `<p class="real-label">지금 꽃다발은 <b>‘${esc(match.name)}’</b> 조합이에요</p>${photoHTML(match, 'photo-lg')}<p class="note">AI로 만든 이미지라 실제 꽃과 색·모양이 조금 다를 수 있어요.</p>`
      : `<div class="real-mine"><p><b>직접 만든 조합이라 실사 미리보기가 아직 없어요.</b></p><p>아래 대표 조합 중 하나를 불러오면 실제 꽃으로 만든 모습을 볼 수 있어요. 불러온 다음 다시 마음대로 바꿀 수 있어요.</p></div>`;
    $('.real-list').innerHTML = D.recipes.map(r =>
      `<li class="real-item${match === r ? ' is-current' : ''}">${photoHTML(r)}<div class="real-meta"><h3>${esc(r.name)}</h3><p>${esc(recipeLine(r))}</p>` +
      (match === r ? `<span class="tag">지금 꽃다발</span>` : `<button type="button" class="pill pill-ghost pill-sm" data-load="${r.id}">불러오기</button>`) +
      `</div></li>`).join('');
    wirePhotos($('[data-pane="real"]'));
  }
  $('.real-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-load]');
    if (b) loadRecipe(b.dataset.load, null, () => renderReal());
  });
  function recipeLine(r) { return r.items.map(([f, , n]) => `${flowersById[f].name} ${n}`).join(' · '); }

  /* ---------- recipes ---------- */
  let loading = null;
  function loadRecipe(id, mood, done) {
    const r = D.recipes.find(x => x.id === id);
    if (!r) return;
    const before = JSON.stringify(state);
    clearTimeout(loading);
    state.stems = []; state.wrap = null; state.ribbon = null;
    state.mood = mood || r.moods[0];
    state.edited = false;
    refresh();
    // one stem at a time, so each one lands with its own little "톡"
    const queue = [];
    r.items.forEach(([f, c, n]) => { for (let i = 0; i < n; i++) queue.push([f, c]); });
    const step = () => {
      if (!queue.length) {
        state.wrap = r.wrap; state.ribbon = r.ribbon;
        refresh();
        if (done) done();
        return;
      }
      const [f, c] = queue.shift();
      ui.color[f] = c;
      state.stems.push({ uid: 's' + (++state.seq), f, c });
      refresh({ keepList: true });
      loading = setTimeout(step, 90);
    };
    loading = setTimeout(step, 120);
    toast(`‘${r.name}’ 조합을 불러왔어요`, '되돌리기', () => { clearTimeout(loading); restore(before); });
  }
  function restore(json) {
    state = Object.assign(fresh(), JSON.parse(json));
    refresh();
    go(state.step);
  }

  /* ---------- recommend sheet ---------- */
  const sheet = $('#recommend');
  $('[data-open-recommend]').addEventListener('click', () => {
    renderRecMoods();
    renderRecList();
    sheet.showModal();
  });
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
  });
  sheet.addEventListener('close', () => { ui.recViews.forEach(v => v.destroy()); ui.recViews = []; });
  function renderRecMoods() {
    $('#rec-moods').innerHTML = D.moods.map(m =>
      `<button type="button" class="mood" aria-pressed="${ui.recMood === m.id}" data-mood="${m.id}"><span class="mono">${esc(m.en || '')}</span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></button>`).join('');
  }
  function renderRecList() {
    ui.recViews.forEach(v => v.destroy()); ui.recViews = [];
    const list = $('#rec-list');
    if (!ui.recMood) { list.innerHTML = ''; return; }
    const recipes = D.recipes.filter(r => r.moods.includes(ui.recMood)).slice(0, 3);
    const warn = state.stems.length ? `<p class="note">지금 담은 ${state.stems.length}송이는 비워져요. 불러온 뒤 되돌릴 수 있어요.</p>` : '';
    list.innerHTML = recipes.map(r =>
      `<li class="rec-item"><div class="rec-art" data-rec="${r.id}"></div><div class="rec-meta">` +
      `<h3>${esc(r.name)}</h3><p class="rec-note">${esc(r.note)}</p>` +
      `<p class="rec-flowers">${r.items.map(([f, c, n]) => `<span><i style="--dot:${colorHex(c)}"></i>${esc(flowersById[f].name)} ${n}</span>`).join('')}</p>` +
      `<button type="button" class="pill pill-dark" data-pick="${r.id}">이 조합으로 시작하기</button>${warn}</div></li>`).join('');
    $$('.rec-art', list).forEach(el => {
      const r = D.recipes.find(x => x.id === el.dataset.rec);
      const v = new BouquetView(el, { static: true });
      v.update(expand(r), r.wrap, r.ribbon);
      ui.recViews.push(v);
    });
  }
  $('#rec-moods').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mood]');
    if (!b) return;
    ui.recMood = b.dataset.mood;
    renderRecMoods();
    renderRecList();
  });
  $('#rec-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    sheet.close();
    enterApp();
    go('flowers');
    loadRecipe(b.dataset.pick, ui.recMood);
  });

  /* ---------- 4. postcard ---------- */
  function composeMessage() {
    if (!state.stems.length) return '';
    const seen = new Set(), picks = [];
    bunches().forEach(b => {
      if (seen.has(b.f) || picks.length >= 3) return;
      seen.add(b.f);
      picks.push({ name: flowersById[b.f].name, meaning: meaningOf(b.f, b.c) });
    });
    const last = picks[picks.length - 1].meaning;
    const line = picks.map(p => `${p.name}에는 ‘${p.meaning}’`).join(', ') + (hasBatchim(last) ? '이라는' : '라는') + ' 꽃말이 있대요.';
    const mood = moodsById[state.mood];
    return `${line}\n${D.postcard.closing}\n\n${mood ? mood.letter : D.postcard.defaultLetter}`;
  }

  let stampView = null;
  function renderPostcard() {
    if (!state.edited) state.message = composeMessage();
    $('#card-to').value = state.to;
    $('#card-from').value = state.from;
    $('#card-message').value = state.message;
    $('.postmark-date').textContent = today();
    if (!stampView) stampView = new BouquetView($('#stamp'), { static: true });
    stampView.update(state.stems, state.wrap, state.ribbon);
    const list = bunches();
    $('.postcard-meanings').innerHTML = [...new Map(list.map(b => [b.f, b])).values()].slice(0, 5).map(b =>
      `<li><span>${esc(flowersById[b.f].name)}</span>${esc(meaningOf(b.f, b.c))}</li>`).join('');
    // a faint watercolour wash in the colours of the flowers themselves
    const hues = list.filter(b => flowersById[b.f].group !== 'leaf').slice(0, 3).map(b => colorHex(b.c));
    const spots = ['12% 18%', '88% 86%', '78% 12%'];
    $('.postcard-wash').style.backgroundImage = hues.map((h, i) => `radial-gradient(circle at ${spots[i]}, ${h}1f, transparent 46%)`).join(',') || 'none';
    $('#card-moods').innerHTML = D.moods.map(m =>
      `<button type="button" class="chip" aria-pressed="${state.mood === m.id}" data-mood="${m.id}">${esc(m.name)}</button>`).join('');
    autosize();
  }
  function autosize() {
    const ta = $('#card-message');
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }
  $('#card-message').addEventListener('input', (e) => { state.message = e.target.value; state.edited = true; autosize(); save(); });
  $('#card-to').addEventListener('input', (e) => { state.to = e.target.value; save(); });
  $('#card-from').addEventListener('input', (e) => { state.from = e.target.value; save(); });
  $('#card-moods').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mood]');
    if (!b) return;
    state.mood = state.mood === b.dataset.mood ? null : b.dataset.mood;
    if (state.edited) {
      toast('마음을 바꿨어요. 문구에 넣으려면 ‘꽃말로 다시 쓰기’를 눌러 주세요');
    }
    renderPostcard();
    save();
  });
  $('[data-rewrite]').addEventListener('click', () => {
    const before = state.message;
    state.edited = false;
    renderPostcard();
    save();
    if (before && before !== state.message) toast('꽃말로 문구를 다시 썼어요', '되돌리기', () => { state.message = before; state.edited = true; renderPostcard(); save(); });
  });

  /* ---------- 5. final card ---------- */
  let finalView = null;
  function renderFinal() {
    if (!state.edited) state.message = composeMessage();
    if (!finalView) finalView = new BouquetView($('#final-bouquet'), { static: true });
    finalView.update(state.stems, state.wrap, state.ribbon);
    $('.final-date').textContent = today();
    $('.final-no').textContent = 'No.' + pad(state.seq, 4);
    const parts = [`${pad(state.stems.length)} STEMS`];
    if (state.wrap) parts.push(wrapsById[state.wrap].name + ' 포장');
    if (state.ribbon) parts.push(ribbonsById[state.ribbon].name);
    $('.final-sum').textContent = parts.join(' · ');
    $('.final-flowers').innerHTML = bunches().map((b, i) => {
      const fl = flowersById[b.f];
      return `<li><span class="mono ff-no">${pad(i + 1)}</span><span class="chip-dot" style="--dot:${colorHex(b.c)}"></span><span class="ff-name">${esc(fl.name)}${fl.colors.length > 1 ? ' <small>' + esc(colorName(b.c)) + '</small>' : ''} <small>× ${b.n}</small></span><span class="ff-meaning">${esc(meaningOf(b.f, b.c))}</span></li>`;
    }).join('');
    $('.final-to').textContent = `To. ${state.to || D.postcard.defaultTo}`;
    $('.final-message').textContent = state.message;
    $('.final-from').textContent = state.from ? `${state.from} 드림` : '';
  }
  $('[data-print]').addEventListener('click', () => window.print());
  $('[data-restart]').addEventListener('click', () => {
    const before = JSON.stringify(state);
    const seq = state.seq;
    state = fresh(); state.seq = seq;
    refresh();
    go('flowers');
    toast('새 꽃다발을 시작해요', '되돌리기', () => restore(before));
  });

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(text, action, fn) {
    const el = $('.toast');
    $('.toast-text', el).textContent = text;
    const btn = $('.toast-action', el);
    btn.hidden = !action;
    btn.textContent = action || '';
    btn.onclick = () => { el.hidden = true; if (fn) fn(); };
    el.hidden = false;
    el.classList.remove('is-in');
    void el.offsetWidth;
    el.classList.add('is-in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 6000 : 3200);
  }

  /* ---------- intro: a slow ring of flower cards around the name ---------- */
  const CARD_TINTS = ['#DCE7F6', '#F6E3A6', '#F3D3DC', '#CFE6DC', '#E4DAF4', '#F7D9C6', '#C9E0E6', '#EDEFE0', '#F0C9C2', '#D7DCF2'];
  function buildRing() {
    const picks = [];
    const pool = D.flowers.filter(fl => fl.group !== 'leaf');
    for (let i = 0; i < 24; i++) {
      const fl = pool[(i * 7) % pool.length];
      picks.push({ fl, c: fl.colors[i % fl.colors.length].id });
    }
    $('.ring-spin').innerHTML = picks.map((p, i) => {
      const a = (360 / picks.length) * i;
      return `<button type="button" class="ring-card" tabindex="-1" data-f="${p.fl.id}" data-c="${p.c}" style="--a:${a}deg;--i:${i};--tint:${CARD_TINTS[i % CARD_TINTS.length]}" aria-label="${esc(p.fl.name)}로 시작하기"><span class="ring-face">${artHTML(p.fl, p.c)}</span></button>`;
    }).join('');
    $('.intro-foot').textContent = D.groups.map(g => `${pad(D.flowers.filter(fl => fl.group === g.id).length)} ${g.id === 'main' ? 'FLOWERS' : g.id === 'filler' ? 'FILLERS' : 'GREENS'}`).join('  ·  ');
  }
  function enterApp() {
    document.body.dataset.view = 'app';
    $('.app').removeAttribute('aria-hidden');
    $('.intro').setAttribute('aria-hidden', 'true');
    window.scrollTo({ top: 0 });
  }
  function showIntro() {
    document.body.dataset.view = 'intro';
    $('.app').setAttribute('aria-hidden', 'true');
    $('.intro').removeAttribute('aria-hidden');
    $('[data-start] .mono').textContent = state.stems.length ? 'CONTINUE' : 'START';
  }
  $('[data-start]').addEventListener('click', enterApp);
  $('[data-home]').addEventListener('click', showIntro);
  // a card on the ring starts the bouquet with that very flower
  $('.ring-spin').addEventListener('click', (e) => {
    const b = e.target.closest('.ring-card');
    if (!b) return;
    enterApp();
    go('flowers');
    ui.group = flowersById[b.dataset.f].group;
    ui.color[b.dataset.f] = b.dataset.c;
    renderSegment();
    setTimeout(() => addStem(b.dataset.f, b.dataset.c), 260);
  });

  /* ---------- start ---------- */
  buildRing();
  renderSegment();
  refresh();
  go(state.step);
  showIntro();
})();
