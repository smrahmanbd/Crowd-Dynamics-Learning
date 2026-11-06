/* Agent-based crowd simulators for modules 2.3–2.5 and the model atlas. Teaching versions of published ideas:
   floor-field cellular automaton (Burstedde et al. 2001), social force (Helbing and Molnár 1995; Helbing, Farkas and Vicsek 2000),
   optimal steps (Seitz and Köster 2012), collision-free speed model (Tordeux, Chraibi and Seyfried 2016), cognitive heuristics (Moussaïd, Helbing and Theraulaz 2011).
   Parameters are simplified; numbers are illustrative. */
(function () {
  "use strict";
  const W = window.IAMWidgets = window.IAMWidgets || {};
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (x, d = 0) => (isFinite(x) ? Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c))); return e; };
  function slider(label, { min, max, step = 1, value, unit = "", digits = 0, hint }, onChange) {
    const out = h("output"), inp = h("input", { type: "range", min, max, step, value, "aria-label": label });
    const show = () => (out.textContent = fmt(+inp.value, digits) + unit);
    inp.addEventListener("input", () => { show(); onChange && onChange(); }); show();
    const w = h("div", { class: "ctrl" }, h("label", {}, h("span", {}, label), out), inp, hint ? h("div", { class: "hint" }, hint) : null);
    w.get = () => +inp.value; w.set = (v) => { inp.value = v; show(); }; return w;
  }
  function readout(items) {
    const box = h("div", { class: "readout" });
    const cells = items.map(([k, label]) => { const b = h("b"); const d = h("div", {}, b, h("span", {}, label)); box.append(d); return [k, b, d]; });
    box.set = (k, v, hot) => { const c = cells.find((x) => x[0] === k); if (c) { c[1].textContent = v; c[2].classList.toggle("hot", !!hot); } };
    return box;
  }
  function layout(el, controls, view, intro) { el.innerHTML = ""; const w = h("div", { class: "widget" }); if (intro) w.append(h("p", { class: "muted" }, intro)); w.append(h("div", { class: "wgrid" }, h("div", {}, controls), h("div", {}, view))); el.append(w); return w; }
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

  // ---------------------------------------------------------------- shared room: 12 m × 8 m, door in the right wall
  const RW = 12, RH = 8;
  function arena(root, { title, params, makeStep, note, explain, n0 = 60, door0 = 1.2, dtDraw = 0.1 }) {
    const cv = h("canvas", { width: 600, height: 400, class: "simcanvas", "aria-label": title }), out = readout([["t", "Time"], ["out", "People out"], ["rate", "Flow through the door"]]);
    const N = slider("People", { min: 10, max: 150, value: n0 }, reset), dw = slider("Door width", { min: 0.6, max: 3, step: 0.1, value: door0, unit: " m", digits: 1 }, reset);
    const ps = params.map((p) => { const s = slider(p.label, p, reset); s.id = p.id; return s; });
    let A = [], t = 0, outN = 0, raf, stepFn, times = [];
    function reset() {
      cancelAnimationFrame(raf); const R = rng(9); A = [];
      let tries = 0; while (A.length < N.get() && tries < 5000) { tries++; const x = 0.4 + R() * 7.2, y = 0.4 + R() * (RH - 0.8); if (A.every((a) => Math.hypot(a.x - x, a.y - y) > 0.5)) A.push({ x, y, vx: 0, vy: 0, r: 0.22 + R() * 0.06, v0: 1, id: A.length }); }
      t = 0; outN = 0; times = []; const P = {}; ps.forEach((s) => (P[s.id] = s.get())); P.door = dw.get(); stepFn = makeStep(P, A); render();
    }
    function render() {
      const g = cv.getContext("2d"), S = 50, d = dw.get(); g.clearRect(0, 0, 600, 400);
      g.fillStyle = css("--paper"); g.fillRect(0, 0, 600, 400);
      g.strokeStyle = css("--ink"); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(RW * S, 0); g.lineTo(RW * S, (RH / 2 - d / 2) * S); g.moveTo(RW * S, (RH / 2 + d / 2) * S); g.lineTo(RW * S, RH * S); g.lineTo(0, RH * S); g.closePath(); g.stroke();
      A.forEach((a) => { if (a.out) return; g.fillStyle = css("--economy"); g.globalAlpha = 0.85; g.beginPath(); g.arc(a.x * S, a.y * S, a.r * S, 0, 7); g.fill(); g.globalAlpha = 1; });
      out.set("t", fmt(t, 1) + " s"); out.set("out", `${outN} of ${A.length}`);
      const rec = times.filter((x) => x > t - 10); out.set("rate", t > 3 ? fmt(rec.length / Math.min(10, t), 2) + " per s (" + fmt(rec.length / Math.min(10, t) / dw.get(), 2) + " per m)" : "–");
    }
    function advance(T) { while (T > 1e-9) { const dt = stepFn.dt; const k = stepFn(dt); t += dt; T -= dt; A.forEach((a) => { if (!a.out && a.x > RW + 0.3) { a.out = true; outN++; times.push(t); } }); if (outN >= A.length) return true; } return false; }
    function loop() { const done = advance(dtDraw); render(); if (!done && t < 400) raf = requestAnimationFrame(loop); }
    const go = h("button", { class: "btn", type: "button", onclick: () => { cancelAnimationFrame(raf); if (reduce) { advance(400); render(); } else loop(); } }, "▶ Run"), rs = h("button", { class: "btn quiet", type: "button", onclick: reset }, "Reset");
    layout(root, [N, dw, ...ps, h("div", { class: "btnrow" }, go, rs), h("div", { class: "explain" }, explain)], [out, cv, h("p", { class: "note" }, note)]);
    reset();
  }
  const DOOR = (P) => ({ x: RW, y: RH / 2, w: P.door });
  // wall repulsion helper: nearest points on the walls of the room (with door gap)
  function wallPoints(a, P) {
    const pts = [[a.x, 0], [a.x, RH], [0, a.y]], d = P.door, y0 = RH / 2 - d / 2, y1 = RH / 2 + d / 2;
    if (a.x < RW + 0.5) { if (a.y < y0) pts.push([RW, a.y]); else if (a.y > y1) pts.push([RW, a.y]); else { pts.push([RW, y0]); pts.push([RW, y1]); } }
    return a.x > RW + 0.05 ? [[RW, y0], [RW, y1]].filter((p) => Math.abs(a.x - RW) < 1) : pts;
  }
  const goal = (a, P) => { const y = Math.max(RH / 2 - P.door / 2 + 0.25, Math.min(RH / 2 + P.door / 2 - 0.25, a.y)); return a.x < RW - 0.3 ? [RW, y] : [RW + 3, RH / 2]; };

  // ---------------------------------------------------------------- social force
  W.sfm = (root) => arena(root, {
    title: "social force simulation", n0: 80, door0: 1.0,
    params: [{ id: "v0", label: "Desired speed v₀", min: 0.6, max: 4, step: 0.1, value: 1.2, unit: " m/s", digits: 1, hint: "Try 1.0, then 3: faster can be slower when people press into the door." }, { id: "A", label: "Social repulsion A", min: 500, max: 3000, step: 100, value: 2000, unit: " N" }],
    explain: "Each person is pulled towards the door at their desired speed and pushed away from walls and others. When bodies touch, a body force and sliding friction act too. Press Run and watch arches form at the door.",
    note: "Helbing, Farkas and Vicsek (2000) parameters (mass 80 kg, τ = 0.5 s, B = 0.08 m, k = 1.2×10⁵ kg/s², κ = 2.4×10⁵ kg/(m s)), simplified walls. Teaching version, not calibrated.",
    makeStep(P, A) {
      const m = 80, tau = 0.5, B = 0.08, k = 1.2e5, kap = 2.4e5;
      const f = (dt) => {
        const F = A.map(() => [0, 0]);
        A.forEach((a, i) => {
          if (a.out) return; const [gx, gy] = goal(a, P), dx = gx - a.x, dy = gy - a.y, dn = Math.hypot(dx, dy) || 1;
          F[i][0] += m * ((P.v0 * dx) / dn - a.vx) / tau; F[i][1] += m * ((P.v0 * dy) / dn - a.vy) / tau;
          for (let j = i + 1; j < A.length; j++) {
            const b = A[j]; if (b.out) continue; const ex = a.x - b.x, ey = a.y - b.y, d = Math.hypot(ex, ey); if (d > 2.5 || d === 0) continue;
            const nx = ex / d, ny = ey / d, rr = a.r + b.r, ov = rr - d, g = ov > 0 ? ov : 0, rep = P.A * Math.exp((rr - d) / B) + k * g;
            const tx = -ny, ty = nx, dvt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty, fr = kap * g * dvt;
            const fx = rep * nx + fr * tx, fy = rep * ny + fr * ty; F[i][0] += fx; F[i][1] += fy; F[j][0] -= fx; F[j][1] -= fy;
          }
          wallPoints(a, P).forEach(([wx, wy]) => {
            const ex = a.x - wx, ey = a.y - wy, d = Math.hypot(ex, ey); if (d > 1.5 || d === 0) return; const nx = ex / d, ny = ey / d, g = Math.max(0, a.r - d), rep = P.A * Math.exp((a.r - d) / B) + k * g;
            const tx = -ny, ty = nx, vt = a.vx * tx + a.vy * ty; F[i][0] += rep * nx - kap * g * vt * tx; F[i][1] += rep * ny - kap * g * vt * ty;
          });
        });
        A.forEach((a, i) => { if (a.out) return; a.vx += (F[i][0] / m) * dt; a.vy += (F[i][1] / m) * dt; const sp = Math.hypot(a.vx, a.vy), vm = Math.max(1.3 * P.v0, 1.5); if (sp > vm) { a.vx *= vm / sp; a.vy *= vm / sp; } a.x += a.vx * dt; a.y += a.vy * dt; a.y = Math.max(a.r * 0.5, Math.min(RH - a.r * 0.5, a.y)); });
      };
      f.dt = 0.004; return f;
    } });

  // ---------------------------------------------------------------- floor-field cellular automaton
  W.ca = (root) => {
    const cv = h("canvas", { width: 600, height: 400, class: "simcanvas", "aria-label": "cellular automaton" }), out = readout([["t", "Time steps (0.3 s each)"], ["left", "People still inside"], ["T", "Evacuation time"]]);
    const N = slider("People", { min: 20, max: 300, value: 150 }, reset), ks = slider("kS: how strongly people head for the exit", { min: 0, max: 5, step: 0.5, value: 2, digits: 1 }, reset);
    const kd = slider("kD: how strongly people follow others' trails", { min: 0, max: 3, step: 0.5, value: 0.5, digits: 1 }, reset), ex = slider("Exit width (cells of 0.4 m)", { min: 1, max: 6, value: 2 }, reset);
    const nx = 30, ny = 20; let grid, S, D, ppl, t, raf, done;
    function reset() {
      cancelAnimationFrame(raf); grid = Array.from({ length: nx }, () => new Array(ny).fill(0)); D = Array.from({ length: nx }, () => new Array(ny).fill(0));
      const e0 = Math.floor(ny / 2 - ex.get() / 2), exits = range2(e0, e0 + ex.get()); S = Array.from({ length: nx }, (_, i) => Array.from({ length: ny }, (_, j) => Math.min(...exits.map((ey) => Math.hypot(nx - 1 - i, ey - j)))));
      const R = rng(4); ppl = []; let k = 0; while (ppl.length < Math.min(N.get(), nx * ny * 0.6) && k++ < 20000) { const i = Math.floor(R() * (nx - 4)), j = Math.floor(R() * ny); if (!grid[i][j]) { grid[i][j] = 1; ppl.push([i, j]); } }
      t = 0; done = null; draw();
    }
    const range2 = (a, b) => { const r = []; for (let i = a; i < b; i++) r.push(i); return r; };
    function step() {
      const order = ppl.map((_, i) => i).sort(() => Math.random() - 0.5), e0 = Math.floor(ny / 2 - ex.get() / 2);
      order.forEach((idx) => {
        const p = ppl[idx]; if (!p) return; const [i, j] = p;
        if (i === nx - 1 && j >= e0 && j < e0 + ex.get()) { grid[i][j] = 0; ppl[idx] = null; D[i][j] += 1; return; }
        const cand = [[i, j]]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const u = i + a, v = j + b; if (u >= 0 && u < nx && v >= 0 && v < ny && !grid[u][v]) cand.push([u, v]); });
        const w = cand.map(([u, v]) => Math.exp(-ks.get() * S[u][v] + kd.get() * Math.min(D[u][v], 5))), sw = w.reduce((a, b) => a + b, 0);
        let r = Math.random() * sw, c = 0; while (r > w[c] && c < cand.length - 1) { r -= w[c]; c++; }
        const [u, v] = cand[c]; if (u !== i || v !== j) { grid[i][j] = 0; grid[u][v] = 1; D[i][j] += 1; ppl[idx] = [u, v]; }
      });
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) D[i][j] *= 0.8;
      t++; if (!done && ppl.every((p) => !p)) done = t;
    }
    function draw() {
      const g = cv.getContext("2d"), c = 600 / nx; g.clearRect(0, 0, 600, 400); const e0 = Math.floor(ny / 2 - ex.get() / 2);
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const dd = Math.min(1, D[i][j] / 3); g.fillStyle = dd > 0.05 ? `rgba(184,121,15,${dd * 0.5})` : css("--paper"); g.fillRect(i * c, j * c, c - 1, c - 1); if (grid[i][j]) { g.fillStyle = css("--economy"); g.beginPath(); g.arc(i * c + c / 2, j * c + c / 2, c * 0.4, 0, 7); g.fill(); } }
      g.fillStyle = css("--land"); g.fillRect(600 - 4, e0 * c, 4, ex.get() * c);
      const left = ppl.filter(Boolean).length; out.set("t", String(t)); out.set("left", String(left)); out.set("T", done ? `${done} steps ≈ ${fmt(done * 0.3)} s` : "–");
    }
    function loop() { step(); draw(); if (!done && t < 3000) raf = requestAnimationFrame(loop); }
    const go = h("button", { class: "btn", type: "button", onclick: () => { cancelAnimationFrame(raf); if (reduce) { while (!done && t < 3000) step(); draw(); } else loop(); } }, "▶ Run"), rs = h("button", { class: "btn quiet", type: "button", onclick: reset }, "Reset");
    layout(root, [N, ks, kd, ex, h("div", { class: "btnrow" }, go, rs), h("div", { class: "explain" }, "The room is a grid of 0.4 m cells; each holds at most one person. Each step, people choose a free neighbour cell with probability ∝ exp(−kS × distance to exit) × exp(kD × trail). Brown shows the dynamic floor field: the trail others leave behind.")], [out, cv, h("p", { class: "note" }, "Floor-field model after Burstedde et al. (2001) and Kirchner and Schadschneider (2002), with random sequential update and von Neumann neighbourhood. One step ≈ 0.3 s, so the free speed is 0.4 m ÷ 0.3 s ≈ 1.3 m/s.")]);
    reset();
  };

  // ---------------------------------------------------------------- optimal steps model (simplified)
  W.osm = (root) => arena(root, {
    title: "optimal steps simulation", n0: 60, door0: 1.2, dtDraw: 0.2,
    params: [{ id: "q", label: "Directions tested per step", min: 4, max: 32, step: 4, value: 16 }, { id: "mu", label: "Personal space weight", min: 1, max: 20, step: 1, value: 8 }],
    explain: "Each person takes a step of fixed length on a circle around them, choosing the point with the best utility: closer to the door, and not too close to others or walls. Everyone steps once per 0.4 s, in random order.",
    note: "After Seitz and Köster (2012), simplified: one step length (0.5 m), utility = distance to target + personal-space penalty. Vadere implements the full optimal steps model.",
    makeStep(P, A) {
      const f = () => {
        A.filter((a) => !a.out).sort(() => Math.random() - 0.5).forEach((a) => {
          const [gx, gy] = goal(a, P), L = 0.5; let best = null, bu = 1e9;
          for (let k = -1; k < P.q; k++) {
            const ang = (2 * Math.PI * k) / P.q, x = k < 0 ? a.x : a.x + L * Math.cos(ang), y = k < 0 ? a.y : a.y + L * Math.sin(ang);
            if (y < 0.2 || y > RH - 0.2 || x < 0.2) continue; if (x > RW - 0.2 && x < RW + 0.2 && Math.abs(y - RH / 2) > P.door / 2 - 0.2) continue;
            let u = Math.hypot(gx - x, gy - y);
            A.forEach((b) => { if (b === a || b.out) return; const d = Math.hypot(b.x - x, b.y - y); if (d < 0.45) u += 1000; else if (d < 1) u += P.mu * Math.exp(-4 * (d - 0.45)) * 0.2; });
            if (u < bu) { bu = u; best = [x, y]; }
          }
          if (best) { a.x = best[0]; a.y = best[1]; }
        });
      };
      f.dt = 0.4; return f;
    } });

  // ---------------------------------------------------------------- cognitive heuristics (simplified)
  W.heur = (root) => arena(root, {
    title: "cognitive heuristics simulation", n0: 60, door0: 1.2, dtDraw: 0.1,
    params: [{ id: "v0", label: "Comfortable speed", min: 0.6, max: 2, step: 0.1, value: 1.3, unit: " m/s", digits: 1 }, { id: "tau", label: "Time gap kept to obstacles τ", min: 0.3, max: 1.5, step: 0.1, value: 0.5, unit: " s", digits: 1 }],
    explain: "Each person scans their field of view and picks the direction that takes them closest to their goal before they would hit someone (heuristic 1), then walks at a speed that keeps a time gap τ to the first obstacle (heuristic 2).",
    note: "After Moussaïd, Helbing and Theraulaz (2011), simplified: 31 directions over ±75°, horizon 8 m, no body-contact forces.",
    makeStep(P, A) {
      const f = (dt) => {
        A.forEach((a) => {
          if (a.out) return; const [gx, gy] = goal(a, P), a0 = Math.atan2(gy - a.y, gx - a.x), dmax = Math.min(8, Math.hypot(gx - a.x, gy - a.y) + 0.5); let best = a0, bd = 1e9, fh = dmax;
          for (let k = -15; k <= 15; k++) {
            const al = a0 + (k / 15) * (75 * Math.PI / 180), ux = Math.cos(al), uy = Math.sin(al); let fa = dmax;
            A.forEach((b) => { if (b === a || b.out) return; const rx = b.x - a.x, ry = b.y - a.y, proj = rx * ux + ry * uy; if (proj <= 0) return; const perp = Math.abs(rx * uy - ry * ux), rr = a.r + b.r; if (perp < rr) fa = Math.min(fa, proj - Math.sqrt(rr * rr - perp * perp)); });
            if (uy !== 0) { const ty = uy > 0 ? (RH - a.r - a.y) / uy : (a.r - a.y) / uy; if (ty > 0) fa = Math.min(fa, ty); }
            if (ux > 0 && a.x < RW) { const tx = (RW - a.r - a.x) / ux, yy = a.y + uy * tx; if (Math.abs(yy - RH / 2) > P.door / 2 - a.r) fa = Math.min(fa, tx); }
            fa = Math.max(0, fa); const d2 = dmax * dmax + fa * fa - 2 * dmax * fa * Math.cos(a0 - al);
            if (d2 < bd) { bd = d2; best = al; fh = fa; }
          }
          const v = Math.min(P.v0, fh / P.tau); a.vx += (v * Math.cos(best) - a.vx) * Math.min(1, dt / 0.5); a.vy += (v * Math.sin(best) - a.vy) * Math.min(1, dt / 0.5);
        });
        A.forEach((a) => { if (a.out) return; a.x += a.vx * dt; a.y = Math.max(a.r, Math.min(RH - a.r, a.y + a.vy * dt)); });
      };
      f.dt = 0.05; return f;
    } });

  // ---------------------------------------------------------------- collision-free speed model, single file on a ring
  W.cfsm = (root) => {
    const cv = h("canvas", { width: 420, height: 420, class: "simcanvas", "aria-label": "single-file ring" }), out = readout([["d", "Line density"], ["v", "Mean speed"], ["j", "Flow"]]);
    const N = slider("People on a 26 m ring", { min: 2, max: 70, value: 30 }, reset), T = slider("Time gap T", { min: 0.3, max: 2, step: 0.1, value: 1, unit: " s", digits: 1 }, null);
    const L = 26, ell = 0.3; let x = [], raf, vbar = 0;
    function reset() { const R = rng(2); x = Array.from({ length: N.get() }, (_, i) => (i * L) / N.get() + R() * 0.05); x.sort((a, b) => a - b); }
    function step(dt) { const n = x.length, v = x.map((xi, i) => { const s = ((x[(i + 1) % n] - xi + L) % L) || L; return Math.min(1.3, Math.max(0, (s - ell) / T.get())); }); x = x.map((xi, i) => (xi + v[i] * dt) % L); vbar = v.reduce((a, b) => a + b, 0) / n; }
    function draw() {
      const g = cv.getContext("2d"); g.clearRect(0, 0, 420, 420); g.strokeStyle = css("--line"); g.lineWidth = 18; g.beginPath(); g.arc(210, 210, 160, 0, 7); g.stroke();
      x.forEach((xi) => { const a = (2 * Math.PI * xi) / L; g.fillStyle = css("--economy"); g.beginPath(); g.arc(210 + 160 * Math.cos(a), 210 + 160 * Math.sin(a), 7, 0, 7); g.fill(); });
      const rho = x.length / L; out.set("d", fmt(rho, 2) + " per m"); out.set("v", fmt(vbar, 2) + " m/s"); out.set("j", fmt(rho * vbar, 2) + " per s");
    }
    function loop() { for (let k = 0; k < 4; k++) step(0.05); draw(); raf = requestAnimationFrame(loop); }
    const go = h("button", { class: "btn", type: "button", onclick: () => { cancelAnimationFrame(raf); if (reduce) { for (let k = 0; k < 600; k++) step(0.05); draw(); } else loop(); } }, "▶ Run"), st = h("button", { class: "btn quiet", type: "button", onclick: () => cancelAnimationFrame(raf) }, "Pause");
    layout(root, [N, T, h("div", { class: "btnrow" }, go, st), h("div", { class: "explain" }, "People walk in single file around a ring. Each picks speed v = min(v₀, (gap − 0.3 m) ÷ T): the largest speed that will not cause a collision within T seconds. Add people and the speed falls, tracing the fundamental diagram.")], [out, cv, h("p", { class: "note" }, "Speed rule of the collision-free speed model (Tordeux, Chraibi and Seyfried 2016) in one dimension; the original also steers in 2-D. Compare with Jülich single-file experiments (Seyfried et al. 2005).")]);
    reset(); for (let k = 0; k < 200; k++) step(0.05); draw();
  };

  // ---------------------------------------------------------------- model comparison (module 2.5)
  W.modelcompare = (root) => {
    const Q = [["size", "Size exits for a building or stand (code check)"], ["queue", "Find where queues form in a large network"], ["door", "Study pushing and clogging at a door"], ["fast", "Run thousands of what-ifs quickly"], ["behav", "Explore how individual decisions shape the crowd"], ["data", "Reproduce measured trajectories closely"]];
    const MOD = [["Hydraulic calculation", { size: 3, queue: 1, door: 0, fast: 3, behav: 0, data: 0 }], ["Macroscopic (fluid)", { size: 2, queue: 3, door: 0, fast: 3, behav: 0, data: 1 }], ["Cellular automaton", { size: 2, queue: 2, door: 1, fast: 2, behav: 1, data: 1 }], ["Social force", { size: 1, queue: 1, door: 3, fast: 1, behav: 2, data: 2 }], ["Optimal steps", { size: 1, queue: 1, door: 2, fast: 1, behav: 2, data: 2 }], ["Collision-free speed", { size: 1, queue: 2, door: 2, fast: 2, behav: 1, data: 3 }], ["Cognitive heuristics", { size: 1, queue: 1, door: 1, fast: 1, behav: 3, data: 2 }]];
    const sel = h("select", { "aria-label": "Your question" }, Q.map(([k, t]) => h("option", { value: k }, t))), box = h("div");
    function draw() {
      const k = sel.value, rows = MOD.slice().sort((a, b) => b[1][k] - a[1][k]);
      box.innerHTML = ""; box.append(h("table", { class: "tbl" }, h("thead", {}, h("tr", {}, h("th", {}, "Model"), h("th", {}, "Fit for this question"))), h("tbody", {}, rows.map(([n, s]) => h("tr", {}, h("td", {}, h("b", {}, n)), h("td", {}, ["Poor", "Possible", "Good", "Best suited"][s[k]] + " " + "●".repeat(s[k]) + "○".repeat(3 - s[k])))))));
    }
    sel.addEventListener("change", draw);
    layout(root, [h("div", { class: "ctrl" }, h("label", {}, h("span", {}, "Your question")), sel), h("div", { class: "explain" }, "No crowd model is best for everything. Pick a question to see which family suits it.")], [box, h("p", { class: "note" }, "This course's teaching judgement from the literature (for example Duives, Daamen and Hoogendoorn 2013; Chraibi et al. 2018 reviews), not a ranking of products.")]);
    draw();
  };
})();
