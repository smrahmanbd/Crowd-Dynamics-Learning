/* Simulation challenges: predict, then steer a small model to a goal, with animated feedback.
   Also adds progress bars, animations and a celebration to every multiple-choice quiz on the page.
   Challenge data: window.CHALLENGES[module] = [{title, level, icon, model, fixed, controls[], metric, op, target, tol, view, gmin, gmax, unit,
   goal, predict:{q, options[], answer}, hint, explain, solution}]. All numbers are teaching toys. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (x, d = 0) => (isFinite(x) ? Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c))); return e; };
  const sv = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${(window.GCAM_ICONS || {})[name] || ""}"/></svg>`;
  const range = (a, b, s = 1) => { const r = []; for (let x = a; x <= b + 1e-9; x += s) r.push(+x.toFixed(6)); return r; };
  const logit = (costs, lam) => { const w = costs.map((c) => Math.pow(Math.max(c, 1e-6), lam)); const s = w.reduce((a, b) => a + b, 0); return w.map((x) => x / s); };

  // ------------------------------------------------------------------ toy models: (params) -> {value, line?, bars?}
  const vW = (r, p) => { p = p || { v0: 1.34, g: 1.913, rmax: 5.4 }; return r <= 0 ? p.v0 : r >= p.rmax ? 0 : p.v0 * (1 - Math.exp(-p.g * (1 / r - 1 / p.rmax))); };
  const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const M = {
    fd(p) { // Weidmann fundamental diagram
      const rs = range(0.1, 5.3, 0.1), v = vW(p.rho), j = p.rho * v;
      return { value: { v, j }, line: { xs: rs, series: [{ name: "Flow (per m per s)", values: rs.map((r) => r * vW(r)) }], yTitle: "per m per s", xTitle: "Density (per m²)", vline: { x: p.rho, label: "you" } } };
    },
    los(p) { // space per person in an area
      const m2 = p.area / p.n;
      return { value: { m2, dens: p.n / p.area }, bars: { labels: ["Space each (m²)", "Density (per m²)"], values: [m2, p.n / p.area], digits: 2 } };
    },
    bottleneck(p) { // queue in front of a door
      const cap = p.w * (p.js || 1.3), q10 = Math.max(0, (p.lam - cap) * 600), clr = (p.N || 2000) / cap / 60;
      return { value: { cap, q10, clr }, bars: { labels: ["Arrivals per s", "Door capacity per s"], values: [p.lam, cap], digits: 1 } };
    },
    accum(p) { // arrivals bell curve vs gate capacity
      const ts = range(0, 120); let q = 0; const Q = ts.map((t) => (q = Math.max(0, q + p.arr * Math.exp(-Math.pow((t - 45) / 20, 2)) - p.gate)));
      return { value: { peak: Math.max(...Q), dens: Math.max(...Q) / (p.area || 500) }, line: { xs: ts, series: [{ name: "People waiting", values: Q }], yTitle: "people", xTitle: "Minutes" } };
    },
    familiar(p) { const N = 1200, a = N * p.f / 100, b = N - a, ta = a / 3 + 20, tb = b / 3 + 25; return { value: { t: Math.max(ta, tb) / 60 }, bars: { labels: ["Main entrance", "Side exit"], values: [ta / 60, tb / 60], digits: 1, suffix: " min" } }; },
    danger(p) { const pr = p.rho * p.sd * p.sd; return { value: { press: pr }, bars: { labels: ["Crowd pressure × 1000"], values: [pr * 1000], digits: 1 } }; },
    egress(p) { const t = p.N / (p.rate * p.W), need = p.N / (p.rate * (p.T || 8)); return { value: { t, need }, bars: { labels: ["Target (min)", "Your design (min)"], values: [p.T || 8, t], digits: 1 } }; },
    route(p) { const N = 2000, s = p.share / 100, b = N * s, a = N - b, T = Math.max(a / 4 + 30 / 1.2, b ? b / 4 + 90 / 1.2 : 0) / 60; return { value: { T }, bars: { labels: ["Near exit (min)", "Far exit (min)"], values: [(a / 4 + 25) / 60, b ? (b / 4 + 75) / 60 : 0], digits: 1 } }; },
    rset(p) { const move = Math.max(50, p.N / (1.3 * p.wd)), r = p.det + p.warn + p.pre + move; return { value: { rset: r, margin: p.aset - r }, bars: { labels: ["Detection", "Warning", "Pre-movement", "Movement", "ASET"], values: [p.det, p.warn, p.pre, move, p.aset] } }; },
    calib(p) {
      const R = seeded(11), truth = { v0: 1.1, g: 1.4, rmax: 7 }, data = Array.from({ length: 40 }, () => { const r = 0.2 + R() * 5.5; return [r, Math.max(0, vW(r, truth) + (R() - 0.5) * 0.18)]; }).sort((a, b) => a[0] - b[0]);
      const q = { v0: p.v0, g: p.g, rmax: p.rmax }, e = Math.sqrt(data.reduce((a, [r, v]) => a + (vW(r, q) - v) ** 2, 0) / data.length);
      return { value: { rmse: e }, line: { xs: data.map((d) => d[0]), series: [{ name: "Your curve", values: data.map((d) => vW(d[0], q)) }, { name: "Data", values: data.map((d) => d[1]), dash: "1 7" }], yTitle: "m/s", xTitle: "Density (per m²)", yMax: 1.8 } };
    },
    cfsm(p) { const s = 26 / p.N, v = Math.min(1.3, Math.max(0, (s - 0.3) / p.T)); return { value: { v, j: (p.N / 26) * v }, bars: { labels: ["Speed (m/s)", "Flow (per s)"], values: [v, (p.N / 26) * v], digits: 2 } }; },
    tafweej(p) {
      const d = new Array(24).fill(0), per = p.N / p.slots;
      for (let k = 0; k < p.slots; k++) d[Math.round((k * 18) / p.slots) + 2] += per * p.comp / 100;
      const off = p.N * (1 - p.comp / 100); [3, 4, 5].forEach((hk) => (d[hk] += off / 3));
      let q = 0, mq = 0; d.forEach((x) => { q = Math.max(0, q + x - 60000); mq = Math.max(mq, q); });
      return { value: { peak: Math.max(...d), q: mq }, bars: { labels: d.map((_, i) => (i % 3 ? "" : String(i))), values: d.map((x) => x / 1000), digits: 0 } };
    },
    jacobs(p) { const est = 12000 * p.d1 + 18000 * p.d2 + 30000 * p.d3, tr = 12000 * 3.1 + 18000 * 1.6 + 30000 * 0.45; return { value: { err: (100 * (est - tr)) / tr, abserr: Math.abs((100 * (est - tr)) / tr) }, bars: { labels: ["Your estimate (k)", "True size (k)"], values: [est / 1000, tr / 1000], digits: 0 } }; },
    pressure(p) { const pr = p.rho * p.sd * p.sd; return { value: { p: pr }, bars: { labels: ["Peak crowd pressure × 1000"], values: [pr * 1000], digits: 1 } }; },
    metering(p) {
      const ts = range(0, 120); let qo = 0, pl = 0, md = 0, mq = 0;
      ts.forEach((t) => { qo += 320 * Math.exp(-(((t - 40) / 22) ** 2)); const inn = Math.min(qo, p.m); qo -= inn; pl += inn; pl -= Math.min(pl, 180); md = Math.max(md, pl / 1200); mq = Math.max(mq, qo); });
      return { value: { dens: md, queue: mq }, bars: { labels: ["Peak plaza density (per m²)"], values: [md], digits: 2 } };
    },
    sens(p) {
      const R = seeded(21), res = []; for (let k = 0; k < 800; k++) { const pre = 120 * (1 + (R() * 2 - 1) * p.pu / 100), js = 1.3 * (1 + (R() * 2 - 1) * p.fu / 100); res.push(pre + 3000 / (js * (p.w || 8))); }
      res.sort((a, b) => a - b); const p95 = res[Math.floor(0.95 * 799)] / 60, p50 = res[400] / 60;
      return { value: { p95, p50 }, bars: { labels: ["Median (min)", "95th percentile (min)"], values: [p50, p95], digits: 1 } };
    },
  };
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  window.IAMToyModels = M;

  // ------------------------------------------------------------------ gauge view
  function gauge(box, v, c) {
    const lo = c.gmin, hi = c.gmax, ang = (x) => Math.PI * (1 - (Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo));
    let s = box.querySelector("svg.ch-gauge");
    if (!s) {
      box.innerHTML = ""; s = sv("svg", { viewBox: "0 0 320 190", class: "ch-gauge", role: "img" }, box);
      const arc = (a0, a1, r) => { const p = (a) => [160 + r * Math.cos(a), 150 - r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`; };
      sv("path", { d: arc(Math.PI, 0, 110), stroke: css("--line"), "stroke-width": 22, fill: "none" }, s);
      let t0 = c.op === "<=" ? lo : c.op === ">=" ? c.target : c.target - c.tol, t1 = c.op === "<=" ? c.target : c.op === ">=" ? hi : c.target + c.tol;
      sv("path", { d: arc(ang(t0), ang(t1), 110), stroke: css("--land"), "stroke-width": 22, fill: "none", opacity: 0.55 }, s);
      [lo, (lo + hi) / 2, hi].forEach((x) => { const a = ang(x), t = sv("text", { x: 160 + 140 * Math.cos(a), y: 154 - 140 * Math.sin(a) + 4, "text-anchor": "middle", style: `font:12px var(--body);fill:${css("--muted")}` }, s); t.textContent = fmt(x, hi - lo < 10 ? 1 : 0); });
      const n = sv("g", { class: "needle" }, s);
      sv("line", { x1: 160, y1: 150, x2: 260, y2: 150, stroke: css("--ink"), "stroke-width": 5, "stroke-linecap": "round" }, n);
      sv("circle", { cx: 160, cy: 150, r: 10, fill: css("--ink") }, s);
      const lab = sv("text", { x: 160, y: 182, "text-anchor": "middle", style: `font:600 13px var(--body);fill:${css("--ink-soft")}` }, s); lab.textContent = "green band = goal";
    }
    $(".needle", s).style.transform = `rotate(${-(ang(v) * 180) / Math.PI}deg)`;
  }

  function hit(c, v) { return c.op === "<=" ? v <= c.target + 1e-9 : c.op === ">=" ? v >= c.target - 1e-9 : Math.abs(v - c.target) <= c.tol; }
  function burst(card) {
    if (reduce) return; const fx = h("div", { class: "ch-fx" }); card.append(fx);
    const cols = [css("--water"), css("--energy"), css("--land"), css("--economy"), css("--climate")];
    for (let i = 0; i < 36; i++) { const a = (Math.PI * 2 * i) / 36, r = 120 + Math.random() * 160; const p = h("i"); p.style.background = cols[i % cols.length]; p.style.setProperty("--x", Math.cos(a) * r + "px"); p.style.setProperty("--y", Math.sin(a) * r + "px"); p.style.animationDelay = Math.random() * 0.15 + "s"; fx.append(p); }
    setTimeout(() => fx.remove(), 1500);
  }
  const KEY = "crowd-challenges";
  const store = { load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }, save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } } };

  function countUp(el, to, d, unit) {
    const from = parseFloat(el.dataset.v || to); el.dataset.v = to;
    if (reduce || !isFinite(from)) { el.firstChild.textContent = fmt(to, d) + unit; return; }
    const t0 = performance.now(); const tick = (n) => { const t = Math.min(1, (n - t0) / 350); el.firstChild.textContent = fmt(from + (to - from) * t, d) + unit; if (t < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  }

  function card(c, idx, mid, onScore) {
    const st = store.load(), key = `${mid}:${idx}`;
    const live = h("div", { class: "ch-live" }, h("span", {}, "–"), h("small", {}, c.metricLabel || ""));
    const view = h("div", { class: "ch-view" }), fb = h("div", { class: "ch-fb", "aria-live": "polite" });
    const params = Object.assign({}, c.fixed || {});
    let tries = 0, solved = !!st[key], predicted = !c.predict;
    const ctrls = c.controls.map((k) => {
      params[k.id] = k.value;
      if (k.type === "toggle") { const cb = h("input", { type: "checkbox" }); cb.checked = !!k.value; params[k.id] = cb.checked; cb.addEventListener("change", () => { params[k.id] = cb.checked; draw(); }); return h("div", { class: "ctrl" }, h("label", {}, cb, " " + k.label)); }
      const out = h("output"), inp = h("input", { type: "range", min: k.min, max: k.max, step: k.step || 1, value: k.value, "aria-label": k.label });
      const show = () => (out.textContent = fmt(+inp.value, k.digits || 0) + (k.unit || ""));
      inp.addEventListener("input", () => { params[k.id] = +inp.value; show(); draw(); }); show();
      const w = h("div", { class: "ctrl" }, h("label", {}, h("span", {}, k.label), out), inp, k.hint ? h("div", { class: "hint" }, k.hint) : null);
      w.inp = inp; w.k = k; return w;
    });
    const lockable = h("div", {}, ctrls);
    function draw() {
      const r = M[c.model](params), v = r.value[c.metric];
      countUp(live, v, c.digits || 0, c.unit || ""); live.classList.toggle("hit", hit(c, v));
      if (c.view === "gauge") gauge(view, v, c);
      else if (r.line && window.IAMChart) window.IAMChart.lineChart(view, Object.assign({ xTitle: c.xTitle || "", label: c.title }, r.line));
      else if (r.bars && window.IAMChart) window.IAMChart.barChart(view, Object.assign({ label: c.title }, r.bars));
      return v;
    }
    const stars = h("span", { class: "ch-stars", "aria-label": "stars" }, solved ? "★".repeat(st[key]) + "☆".repeat(3 - st[key]) : "");
    const check = h("button", { class: "btn", type: "button" }, "Check my answer");
    const hintB = h("button", { class: "btn quiet", type: "button", hidden: "" }, "Hint");
    const solB = h("button", { class: "btn quiet", type: "button", hidden: "" }, "Show a solution");
    const el = h("article", { class: "ch-card" + (solved ? " won" : "") },
      h("header", { class: "ch-head" }, h("span", { class: "ch-badge", html: icon(c.icon || "target") }), h("h4", {}, `Challenge ${idx + 1}: ${c.title}`), h("span", { class: "ch-level" }, c.level || "Core"), stars),
      h("div", { class: "ch-body" },
        h("div", {}, h("p", { class: "ch-goal", html: "<b>Goal:</b> " + c.goal }), lockable, h("div", { class: "ch-actions" }, check, hintB, solB), fb),
        h("div", {}, live, view)));
    // predict-first step
    if (c.predict) {
      lockable.style.opacity = 0.35; lockable.style.pointerEvents = "none"; check.disabled = true;
      const pq = h("div", { class: "q ch-predict" }, h("p", {}, h("b", {}, "Predict first: "), c.predict.q));
      const opts = h("div", { class: "opts" });
      c.predict.options.forEach((o, i) => opts.append(h("button", { class: "opt", type: "button", onclick: (e) => {
        if (predicted) return; predicted = true; $$(".opt", opts).forEach((b, j) => { b.disabled = true; if (j === c.predict.answer) b.classList.add("right"); });
        if (i !== c.predict.answer) e.currentTarget.classList.add("wrong");
        pq.append(h("p", { class: "small muted" }, (i === c.predict.answer ? "Good instinct. " : "Not quite, but now test it. ") + "Now use the sliders to check it with the model."));
        lockable.style.opacity = 1; lockable.style.pointerEvents = "auto"; check.disabled = false;
      } }, o)));
      pq.append(opts); lockable.before(pq);
    }
    check.addEventListener("click", () => {
      const v = draw(); tries++;
      if (hit(c, v)) {
        const s = Math.max(1, 4 - tries); if (!solved || s > (store.load()[key] || 0)) { const d = store.load(); d[key] = Math.max(s, d[key] || 0); store.save(d); }
        solved = true; el.classList.add("won"); stars.textContent = "★".repeat(store.load()[key]) + "☆".repeat(3 - store.load()[key]);
        fb.className = "ch-fb ok"; fb.innerHTML = `<b>Goal reached${tries === 1 ? " on the first try" : ""}.</b> ${c.explain}`; burst(el); onScore();
      } else {
        el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
        const dir = c.op === "<=" ? "too high" : c.op === ">=" ? "too low" : v > c.target ? "too high" : "too low";
        fb.className = "ch-fb no"; fb.innerHTML = `<b>Not yet:</b> ${c.metricLabel || "the result"} is ${fmt(v, c.digits || 0)}${c.unit || ""}, ${dir}. ${tries >= 1 && c.hint ? "Try the hint." : ""}`;
        if (c.hint) hintB.hidden = false; if (tries >= 3 && c.solution) solB.hidden = false;
      }
    });
    hintB.addEventListener("click", () => { fb.className = "ch-fb no"; fb.innerHTML = `<b>Hint:</b> ${c.hint}`; });
    solB.addEventListener("click", () => {
      Object.entries(c.solution).forEach(([k, val]) => { const w = ctrls.find((x) => x.k && x.k.id === k); if (w) { w.inp.value = val; w.inp.dispatchEvent(new Event("input")); } });
      fb.className = "ch-fb no"; fb.innerHTML = "<b>One solution is set on the sliders.</b> Press Check to confirm it, then try to find another.";
    });
    draw();
    return el;
  }

  function mountChallenges() {
    $$(".challenges[data-module]").forEach((root) => {
      const mid = root.dataset.module, list = (window.CHALLENGES || {})[mid]; if (!list) return;
      const ring = h("div", { class: "ch-score" }), cards = [];
      const upd = () => {
        const d = store.load(), got = list.reduce((a, _, i) => a + (d[`${mid}:${i}`] || 0), 0), max = list.length * 3, frac = got / max, C = 2 * Math.PI * 26;
        ring.innerHTML = `<svg class="ch-ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/><text x="32" y="37" text-anchor="middle">${got}/${max}</text></svg><div><b>Your simulation score</b><br><span class="small muted">${list.length} challenges · three stars for a first-try solve, fewer after misses. Saved in this browser.</span></div>`;
      };
      upd(); root.append(ring); list.forEach((c, i) => { const el = card(c, i, mid, upd); cards.push(el); root.append(el); });
    });
  }

  // ------------------------------------------------------------------ every quiz: progress bar, animations, celebration
  function quizFx() {
    $$(".quiz").forEach((qz) => {
      const items = $$(".q", qz); if (!items.length || qz.querySelector(".quiz-progress")) return;
      const bar = h("div", { class: "quiz-progress", "aria-hidden": "true" }, h("span")); qz.prepend(bar);
      const upd = () => { const n = items.filter((q) => q.dataset.done).length; bar.firstChild.style.width = (100 * n) / items.length + "%"; };
      qz.addEventListener("click", (e) => {
        const b = e.target.closest(".opt"); if (!b) return;
        setTimeout(() => {
          b.classList.add(b.classList.contains("wrong") ? "fx-wrong" : "fx-right"); upd();
          const res = $(".quiz-result", qz); if (res && !res.hidden && items.every((q) => q.dataset.done === "right")) { qz.style.position = "relative"; burst(qz); }
        }, 0);
      });
      const again = $(".quiz-again", qz); again && again.addEventListener("click", () => { setTimeout(upd, 0); $$(".opt", qz).forEach((o) => o.classList.remove("fx-right", "fx-wrong")); });
    });
  }

  // ------------------------------------------------------------------ concept-thread recall buttons and figure pause
  function misc() {
    $$(".thread-recall button").forEach((b) => b.addEventListener("click", () => { const r = b.closest(".thread-recall"); r.classList.toggle("open"); b.textContent = r.classList.contains("open") ? "Hide" : "Show answer"; }));
    $$(".figure-card .fig-play").forEach((b) => b.addEventListener("click", () => { const f = b.closest(".figure-card"); const p = f.classList.toggle("paused"); b.textContent = p ? "Play animation" : "Pause animation"; const s = f.querySelector("svg"); if (s && s.pauseAnimations) p ? s.pauseAnimations() : s.unpauseAnimations(); }));
  }
  function init() { mountChallenges(); quizFx(); misc(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
