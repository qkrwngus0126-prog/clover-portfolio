/* The recommender behind "추천 받기". Each answer adds the points in its `tags` (data.js → quiz);
   every flower+colour gets the sum of the points for its moods, vibes, colour tones and its own id.
   Three bouquets come out, each led by a different top flower, with a partner flower, a filler and
   a green chosen to share its colour family, plus the signature recipe that scores best. */
(function () {
  'use strict';

  const D = window.HANSONGI;
  const flowersById = Object.fromEntries(D.flowers.map(fl => [fl.id, fl]));
  const MOOD_IDS = D.moods.map(m => m.id);

  function hash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return ((h >>> 0) % 1000) / 1000; }
  function hasBatchim(word) {
    const ch = word.trim().slice(-1).charCodeAt(0);
    if (ch < 0xac00 || ch > 0xd7a3) return false;
    return (ch - 0xac00) % 28 !== 0;
  }
  const tones = cid => (D.colors[cid] || {}).tones || [];

  function tagsOf(fid, cid) {
    const fl = flowersById[fid];
    const c = fl.colors.find(x => x.id === cid);
    const moods = c && c.moods ? c.moods : fl.moods || [];
    return [...moods, ...(fl.vibes || []), ...tones(cid), fid];
  }

  /* the chosen option of every answered question, and the points they add up to */
  function picks(answers) {
    const out = [];
    D.quiz.forEach(q => {
      const id = answers[q.id];
      if (!id) return;
      let opt;
      if (q.id === 'mood') {
        const m = D.moods.find(x => x.id === id);
        if (m) opt = { id: m.id, name: m.name, tags: { [m.id]: 3 } };
      } else {
        opt = (q.options || []).find(o => o.id === id);
      }
      if (opt) out.push({ q, opt });
    });
    return out;
  }
  function weightsOf(list) {
    const w = {};
    list.forEach(({ opt }) => Object.entries(opt.tags || {}).forEach(([k, v]) => { w[k] = (w[k] || 0) + v; }));
    return w;
  }
  const scoreTags = (tags, w) => tags.reduce((sum, t) => sum + (w[t] || 0), 0);

  // every flower+colour with its score; a hair of fixed noise keeps ties from always going the same way
  function scoredPairs(w) {
    const out = [];
    D.flowers.forEach(fl => fl.colors.forEach(c => {
      out.push({ f: fl.id, c: c.id, fl, s: scoreTags(tagsOf(fl.id, c.id), w) + hash(fl.id + c.id) * 0.3 });
    }));
    return out;
  }

  // shares a colour family with the lead flower; white and cream sit with anything
  function harmony(lead, cid) {
    const a = tones(lead), b = tones(cid);
    let h = b.some(t => a.includes(t)) ? 1.5 : 0;
    if (b.includes('white')) h += 0.6;
    return h;
  }

  function best(list, rate) {
    let top = null, topScore = -Infinity;
    list.forEach(x => { const v = rate(x); if (v > topScore) { top = x; topScore = v; } });
    return top;
  }

  function stemsFor(fl, role) {
    if (role === 'hero') return fl.size >= 1.4 ? 2 : fl.size >= 1.2 ? 3 : 4;
    if (role === 'partner') return fl.art === 'tall' || fl.size >= 1.2 ? 2 : 3;
    if (role === 'filler') return fl.id === 'gypsophila' ? 5 : 4;
    return 2;
  }

  function meaningOf(fid, cid) {
    const fl = flowersById[fid];
    const c = fl.colors.find(x => x.id === cid);
    return (c && c.meaning) || fl.meaning;
  }

  function recommend(answers) {
    const chosen = picks(answers);
    const w = weightsOf(chosen);
    const pairs = scoredPairs(w);
    const mains = pairs.filter(p => p.fl.group === 'main' && p.s > -5);
    const fillers = pairs.filter(p => p.fl.group === 'filler' && p.s > -5);
    const leaves = pairs.filter(p => p.fl.group === 'leaf' && p.s > -5);

    // message for the postcard: the mood they picked, or the one their answers lean to most
    let mood = answers.mood || null;
    if (!mood) {
      const lean = best(MOOD_IDS, m => w[m] || 0);
      if (lean && (w[lean] || 0) > 0) mood = lean;
    }

    // lead flowers: the best colour of each of the three best-scoring flowers
    const byFlower = new Map();
    mains.slice().sort((a, b) => b.s - a.s).forEach(p => { if (!byFlower.has(p.f)) byFlower.set(p.f, p); });
    const heroes = [...byFlower.values()].slice(0, 3);

    const used = {};   // flower id -> times used so far, so the three bouquets don't all share a filler
    const bump = id => { used[id] = (used[id] || 0) + 1; };
    const fresh = (id, k = 2) => (used[id] || 0) * k;
    const vibeAnswer = chosen.find(x => x.q.id === 'vibe');

    const suggestions = heroes.map((hero, k) => {
      const partner = best(mains.filter(p => p.f !== hero.f),
        p =>p.s + harmony(hero.c, p.c) - fresh(p.f) - (heroes.some(h => h.f === p.f) ? 0.8 : 0));
      const filler = best(fillers, p => p.s + harmony(hero.c, p.c) - fresh(p.f));
      const leaf = best(leaves, p => p.s + harmony(hero.c, p.c) * 0.5 - fresh(p.f, 1.2));
      [partner, filler, leaf].forEach(p => p && bump(p.f));

      const items = [[hero.f, hero.c, stemsFor(hero.fl, 'hero')]];
      if (partner) items.push([partner.f, partner.c, stemsFor(partner.fl, 'partner')]);
      if (filler) items.push([filler.f, filler.c, stemsFor(filler.fl, 'filler')]);
      if (leaf) items.push([leaf.f, leaf.c, stemsFor(leaf.fl, 'leaf')]);

      const look = [...(hero.fl.vibes || []), ...tones(hero.c)];
      const wrap = best(D.wraps, x => scoreTags(x.tags || [], w) + (x.tags || []).filter(t => look.includes(t)).length * 0.8 - fresh('wrap-' + x.id, 3) + hash(x.id + k) * 0.2);
      const ribbon = best(D.ribbons, x => scoreTags(x.tags || [], w) + (x.tags || []).filter(t => look.includes(t)).length * 0.8 - fresh('ribbon-' + x.id, 3) + hash(x.id + k) * 0.2);
      bump('wrap-' + wrap.id); bump('ribbon-' + ribbon.id);

      const adj = vibeAnswer ? vibeAnswer.opt.adj : D.vibeWords[(hero.fl.vibes || [])[0]] || '';
      const name = `${adj} ${hero.fl.name} 다발`.trim();
      const mA = meaningOf(hero.f, hero.c);
      let note = `${hero.fl.name}의 ‘${mA}’`;
      if (partner) {
        const mB = meaningOf(partner.f, partner.c);
        note += `에 ${partner.fl.name}의 ‘${mB}’${hasBatchim(mB) ? '을' : '를'} 더했어요.`;
      } else {
        note += `${hasBatchim(mA) ? '을' : '를'} 담았어요.`;
      }

      // which answers this bouquet answers to, for the "왜 이 조합?" line
      const own = new Set([...tagsOf(hero.f, hero.c), ...(partner ? tagsOf(partner.f, partner.c) : [])]);
      const reasons = chosen.filter(({ opt }) => Object.entries(opt.tags || {}).some(([t, v]) => v > 0 && own.has(t))).map(({ opt }) => opt.name).slice(0, 4);

      return { id: 'auto-' + (k + 1), name, note, items, wrap: wrap.id, ribbon: ribbon.id, moods: mood ? [mood] : [], reasons };
    });

    // the signature recipe whose flowers score best for these answers
    const signature = best(D.recipes, r => {
      const avg = r.items.reduce((sum, [f, c]) => sum + scoreTags(tagsOf(f, c), w), 0) / r.items.length;
      return avg + (mood && r.moods.includes(mood) ? 3 : 0);
    });

    return { mood, suggestions, signature, answered: chosen.length };
  }

  window.HansongiRecommend = recommend;
})();
