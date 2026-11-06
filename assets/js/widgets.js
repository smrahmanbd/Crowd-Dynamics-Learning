/* Crowd dynamics explorers. All numbers are teaching toys unless a source is stated. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (x, d = 0) => (isFinite(x) ? Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  };
  function slider(label, { min, max, step = 1, value, unit = "", digits = 0, hint }, onChange) {
    const out = h("output");
    const inp = h("input", { type: "range", min, max, step, value, "aria-label": label });
    const show = () => (out.textContent = fmt(+inp.value, digits) + unit);
    inp.addEventListener("input", () => { show(); onChange(); });
    show();
    const wrap = h("div", { class: "ctrl" }, h("label", {}, h("span", {}, label), out), inp, hint ? h("div", { class: "hint" }, hint) : null);
    wrap.get = () => +inp.value; wrap.set = (v) => { inp.value = v; show(); };
    return wrap;
  }
  function select(label, options, value, onChange) {
    const s = h("select", { "aria-label": label }, options.map(([v, t]) => h("option", { value: v }, t)));
    s.value = value; s.addEventListener("change", onChange);
    const wrap = h("div", { class: "ctrl" }, h("label", {}, h("span", {}, label)), s);
    wrap.get = () => s.value; return wrap;
  }
  function readout(items) {
    const box = h("div", { class: "readout" });
    const cells = items.map(([k, label]) => { const b = h("b"); const d = h("div", {}, b, h("span", {}, label)); box.append(d); return [k, b, d]; });
    box.set = (k, v, hot) => { const c = cells.find((x) => x[0] === k); if (c) { c[1].textContent = v; c[2].classList.toggle("hot", !!hot); } };
    return box;
  }
  function layout(el, controls, view, intro) {
    el.innerHTML = "";
    const w = h("div", { class: "widget" });
    if (intro) w.append(h("p", { class: "muted" }, intro));
    w.append(h("div", { class: "wgrid" }, h("div", {}, controls), h("div", {}, view)));
    el.append(w);
    return w;
  }
  // ---- SVG charts ----
  function svg(w, hgt) { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", `0 0 ${w} ${hgt}`); s.setAttribute("class", "chart"); s.setAttribute("role", "img"); return s; }
  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; }
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function colors() { return [css("--c1"), css("--c2"), css("--c3"), css("--c4")]; }
  /** line chart: xs numeric, series [{name, values, color, dash}] */
  function lineChart(target, { xs, series, xTitle, yTitle, yMax, yMin = 0, label, vline, hline, area }) {
    const W = 640, H = 340, L = 58, R = 16, T = 16, B = 46;
    const s = svg(W, H); if (label) s.setAttribute("aria-label", label);
    const all = series.flatMap((x) => x.values).filter(isFinite);
    const top = yMax != null ? yMax : niceMax(Math.max(...all, hline ? hline.y : 0) * 1.05);
    const x0 = xs[0], x1 = xs[xs.length - 1];
    const X = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R), Y = (y) => T + (1 - (y - yMin) / (top - yMin)) * (H - T - B);
    const g = el("g", { class: "grid" }, s);
    for (let i = 0; i <= 4; i++) { const v = yMin + ((top - yMin) * i) / 4; el("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, g); const t = el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end" }, s); t.textContent = fmt(v, top - yMin < 5 ? 1 : 0); }
    const ticks = 6; for (let i = 0; i <= ticks; i++) { const v = x0 + ((x1 - x0) * i) / ticks; const t = el("text", { x: X(v), y: H - B + 18, "text-anchor": "middle" }, s); t.textContent = x0 >= 1800 && x1 <= 2300 ? String(Math.round(v)) : fmt(v, Math.abs(x1 - x0) < 10 ? 1 : 0); }
    el("line", { x1: L, x2: W - R, y1: Y(yMin), y2: Y(yMin), class: "axis" }, s);
    if (xTitle) { const t = el("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", class: "ttl" }, s); t.textContent = xTitle; }
    if (yTitle) { const t = el("text", { x: 14, y: (T + H - B) / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${(T + H - B) / 2})`, class: "ttl" }, s); t.textContent = yTitle; }
    const cs = colors();
    if (hline) { el("line", { x1: L, x2: W - R, y1: Y(hline.y), y2: Y(hline.y), stroke: css("--orange"), "stroke-dasharray": "6 5", "stroke-width": 2 }, s); const t = el("text", { x: W - R - 4, y: Y(hline.y) - 6, "text-anchor": "end" }, s); t.textContent = hline.label; t.style.fill = css("--orange"); }
    if (vline) { el("line", { x1: X(vline.x), x2: X(vline.x), y1: T, y2: H - B, stroke: css("--muted"), "stroke-dasharray": "4 4" }, s); const t = el("text", { x: X(vline.x) + 4, y: T + 12 }, s); t.textContent = vline.label; }
    series.forEach((se, i) => {
      const c = se.color || cs[i % 4];
      const pts = xs.map((x, j) => [X(x), Y(Math.max(yMin, Math.min(top, se.values[j])))]).filter((p, j) => isFinite(se.values[j]));
      if (area && i === 0) el("path", { d: `M${pts[0][0]},${Y(yMin)} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${pts[pts.length - 1][0]},${Y(yMin)} Z`, fill: c, opacity: 0.15 }, s);
      el("path", { d: pts.map((p, k) => (k ? "L" : "M") + p[0] + "," + p[1]).join(" "), fill: "none", stroke: c, "stroke-width": 3, "stroke-dasharray": se.dash || "", "stroke-linejoin": "round" }, s);
    });
    target.innerHTML = "";
    if (series.length > 1) target.append(legend(series));
    target.append(s);
  }
  function barChart(target, { labels, values, colorsFor, yTitle, yMax, digits = 0, label, suffix = "" }) {
    const W = 640, H = 300, L = 58, R = 16, T = 24, B = 40;
    const s = svg(W, H); if (label) s.setAttribute("aria-label", label);
    const top = yMax != null ? yMax : niceMax(Math.max(...values, 0) * 1.1);
    const Y = (y) => T + (1 - y / top) * (H - T - B);
    const g = el("g", { class: "grid" }, s);
    for (let i = 0; i <= 4; i++) { const v = (top * i) / 4; el("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, g); const t = el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end" }, s); t.textContent = fmt(v, top < 5 ? 1 : 0); }
    const n = values.length, bw = ((W - L - R) / n) * 0.62, cs = colors();
    values.forEach((v, i) => {
      const cx = L + ((i + 0.5) * (W - L - R)) / n, vv = Math.max(0, Math.min(top, v));
      el("rect", { x: cx - bw / 2, y: Y(vv), width: bw, height: Y(0) - Y(vv), rx: 4, fill: colorsFor ? colorsFor(i, v) : cs[0] }, s);
      const t = el("text", { x: cx, y: Y(vv) - 6, "text-anchor": "middle" }, s); t.textContent = fmt(v, digits) + suffix; t.style.fill = css("--ink"); t.style.fontWeight = 600;
      const l = el("text", { x: cx, y: H - B + 18, "text-anchor": "middle" }, s); l.textContent = labels[i];
    });
    el("line", { x1: L, x2: W - R, y1: Y(0), y2: Y(0), class: "axis" }, s);
    if (yTitle) { const t = el("text", { x: 14, y: (T + H - B) / 2, "text-anchor": "middle", transform: `rotate(-90 14 ${(T + H - B) / 2})`, class: "ttl" }, s); t.textContent = yTitle; }
    target.innerHTML = ""; target.append(s);
  }
  function legend(series) {
    const cs = colors();
    return h("div", { class: "legend" }, series.map((se, i) => h("span", {}, h("i", { style: `background:${se.color || cs[i % 4]}` }), se.name)));
  }
  const range = (a, b, step = 1) => { const r = []; for (let x = a; x <= b + 1e-9; x += step) r.push(+x.toFixed(6)); return r; };

  // ======================= CROWD WIDGETS =======================
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = {};
  // Weidmann (1993) fundamental diagram: v = v0 (1 − exp(−γ (1/ρ − 1/ρmax)))
  const WEID = { v0: 1.34, g: 1.913, rmax: 5.4 };
  const vW = (r, p = WEID) => (r <= 0 ? p.v0 : r >= p.rmax ? 0 : p.v0 * (1 - Math.exp(-p.g * (1 / r - 1 / p.rmax))));
  const jW = (r, p = WEID) => r * vW(r, p);
  const LOS = [["A", 3.25], ["B", 2.32], ["C", 1.39], ["D", 0.93], ["E", 0.46], ["F", 0]]; // Fruin walkway, m² per person (35, 25, 15, 10, 5 ft²)
  const losOf = (m2) => LOS.find((l) => m2 >= l[1])[0];
  const losText = { A: "free choice of speed and path", B: "minor conflicts, speed still chosen", C: "speed and passing restricted", D: "most people's speed restricted, frequent conflicts", E: "shuffling, flow near capacity", F: "shuffling, frequent contact, flow breaks down" };
  W.__crowd = { vW, jW, WEID, LOS, losOf };
  // seeded random numbers so explorers are reproducible
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  function dots(target, n, w, h0, opts = {}) { // draw n people in a w×h metre box
    const S = 30, s = svg(w * S + 20, h0 * S + 20), R = rng(opts.seed || 7);
    el("rect", { x: 10, y: 10, width: w * S, height: h0 * S, rx: 6, fill: "none", stroke: css("--line"), "stroke-width": 2 }, s);
    const pts = []; let tries = 0;
    while (pts.length < n && tries < 20000) { tries++; const x = 10 + 6 + R() * (w * S - 12), y = 10 + 6 + R() * (h0 * S - 12); const minD = Math.max(5, Math.min(14, S / Math.sqrt(n / (w * h0)) * 0.7)); if (pts.every((p) => Math.hypot(p[0] - x, p[1] - y) > minD) || tries > 15000) pts.push([x, y]); }
    pts.forEach((p) => el("circle", { cx: p[0], cy: p[1], r: Math.max(3, Math.min(7, 0.23 * S * 0.9)), fill: opts.color || css("--economy"), opacity: 0.85 }, s));
    if (opts.label) { const t = el("text", { x: 14 + w * S / 2, y: h0 * S + 18, "text-anchor": "middle", class: "ttl" }, s); t.textContent = opts.label; }
    target.innerHTML = ""; target.append(s);
  }

  // 1.1 Stocks and flows: arrivals vs gate capacity
  W.accum = (root) => {
    const chart = h("div"), out = readout([["peak", "Most people waiting"], ["when", "Longest wait reached at"], ["dens", "Density in a 500 m² forecourt"]]);
    const arr = slider("Peak arrivals", { min: 20, max: 160, value: 90, unit: " per min" }, draw);
    const gate = slider("Gate capacity", { min: 20, max: 160, value: 70, unit: " per min" }, draw);
    function draw() {
      const ts = range(0, 120, 1), a = ts.map((t) => arr.get() * Math.exp(-Math.pow((t - 45) / 20, 2)));
      let q = 0; const Q = ts.map((t, i) => (q = Math.max(0, q + a[i] - gate.get())));
      const mx = Math.max(...Q), im = Q.indexOf(mx);
      out.set("peak", fmt(mx)); out.set("when", mx > 0 ? `minute ${ts[im]}` : "no queue"); out.set("dens", fmt(mx / 500, 1) + " per m²", mx / 500 > 2);
      lineChart(chart, { xs: ts, series: [{ name: "Arrivals per minute", values: a }, { name: "People waiting", values: Q, color: css("--climate") }], hline: { y: gate.get(), label: "gate capacity" }, xTitle: "Minutes after doors open", yTitle: "people", label: "arrivals and queue" });
    }
    layout(root, [arr, gate, h("div", { class: "explain" }, "The queue is a stock: it fills while arrivals exceed what the gate lets through, and empties afterwards. The peak of the queue comes after the peak of arrivals.")], [out, chart, h("p", { class: "note" }, "Toy arrival profile (a bell curve peaking 45 minutes after opening). Real profiles come from ticket scans and counts.")]);
    draw();
  };

  // 1.2 Space per person and level of service
  W.los = (root) => {
    const pic = h("div"), out = readout([["d", "Density"], ["m2", "Space each"], ["los", "Fruin level of service"]]);
    const n = slider("People in a 4 m × 3 m area", { min: 1, max: 70, value: 12 }, draw);
    function draw() {
      const d = n.get() / 12, m2 = 12 / n.get(), l = losOf(m2);
      out.set("d", fmt(d, 2) + " per m²"); out.set("m2", fmt(m2, 2) + " m²"); out.set("los", `${l}: ${losText[l]}`, l >= "E");
      dots(pic, n.get(), 4, 3, { label: "4 m × 3 m = 12 m²", color: l >= "E" ? css("--climate") : l >= "D" ? css("--energy") : css("--land") });
    }
    layout(root, [n, h("div", { class: "explain" }, "Density = people ÷ area. Its upside-down twin, space per person, is what Fruin used for levels of service A (more than 3.25 m² each) to F (under 0.46 m²).")], [out, pic, h("p", { class: "note" }, "Walkway levels from Fruin (1971): 35, 25, 15, 10 and 5 square feet per person, converted to m². Queuing and stair levels use other thresholds.")]);
    draw();
  };

  // 1.3 Fundamental diagram (Weidmann 1993)
  W.fd = (root) => {
    const c1 = h("div"), c2 = h("div"), out = readout([["v", "Walking speed"], ["j", "Flow per metre of width"], ["cap", "Capacity (maximum flow)"]]);
    const rho = slider("Density", { min: 0.1, max: 5.3, step: 0.1, value: 1, unit: " per m²", digits: 1 }, draw);
    const rs = range(0.05, 5.4, 0.05), jm = Math.max(...rs.map((r) => jW(r))), rc = rs[rs.map((r) => jW(r)).indexOf(jm)];
    function draw() {
      const r = rho.get();
      out.set("v", fmt(vW(r), 2) + " m/s"); out.set("j", fmt(jW(r), 2) + " per m per s", r > rc); out.set("cap", `${fmt(jm, 2)} at ${fmt(rc, 1)} per m²`);
      lineChart(c1, { xs: rs, series: [{ name: "Speed (m/s)", values: rs.map((x) => vW(x)) }], xTitle: "Density (people per m²)", yTitle: "m/s", vline: { x: r, label: "you" }, label: "speed-density" });
      lineChart(c2, { xs: rs, series: [{ name: "Flow (people per m per s)", values: rs.map((x) => jW(x)), color: css("--c2") }], xTitle: "Density (people per m²)", yTitle: "per m per s", vline: { x: r, label: "you" }, label: "flow-density" });
    }
    layout(root, [rho, h("div", { class: "explain" }, "Flow = density × speed. On the left of the peak, more people means more flow. On the right, people slow so much that flow falls: the corridor is congested.")], [out, c1, c2, h("p", { class: "note" }, "Weidmann (1993): v = 1.34 × (1 − exp(−1.913 × (1/ρ − 1/5.4))) m/s. Measured diagrams differ with culture, purpose and direction of flow.")]);
    draw();
  };

  // 1.4 Bottlenecks
  W.bottleneck = (root) => {
    const chart = h("div"), out = readout([["cap", "Door capacity"], ["q", "Queue after 10 minutes"], ["clr", "Time to empty 2,000 people"]]);
    const w = slider("Door width", { min: 0.8, max: 6, step: 0.1, value: 2, unit: " m", digits: 1 }, draw);
    const js = slider("Specific flow through the door", { min: 1, max: 2, step: 0.1, value: 1.3, unit: " per m per s", digits: 1, hint: "Experiments find roughly 1.3 to 1.9 per metre per second (Seyfried et al. 2009)." }, draw);
    const lam = slider("Arrivals", { min: 0.5, max: 8, step: 0.1, value: 3.5, unit: " per s", digits: 1 }, draw);
    function draw() {
      const cap = w.get() * js.get(), ts = range(0, 900, 15), Q = ts.map((t) => Math.max(0, (lam.get() - cap) * t));
      out.set("cap", fmt(cap, 2) + " per s"); out.set("q", fmt(Q[ts.indexOf(600)]) + " people", Q[ts.indexOf(600)] > 0); out.set("clr", fmt(2000 / cap / 60, 1) + " min");
      lineChart(chart, { xs: ts.map((t) => t / 60), series: [{ name: "People queuing", values: Q }], xTitle: "Minutes", yTitle: "people", area: true, label: "queue at bottleneck" });
    }
    layout(root, [w, js, lam, h("div", { class: "explain" }, "Capacity = width × specific flow. If people arrive faster than that, a queue grows at the difference, every second, until arrivals fall.")], [out, chart, h("p", { class: "note" }, "Linear width–capacity rule as used in most guidance; experiments show it holds roughly, with small steps at narrow widths (Hoogendoorn and Daamen 2005).")]);
    draw();
  };

  // 1.5 Self-organisation: counterflow lanes (toy agent rule)
  W.lanes = (root) => {
    const cv = h("canvas", { width: 640, height: 220, class: "simcanvas", "aria-label": "counterflow simulation" }), out = readout([["lanes", "Lanes formed (direction changes across)"], ["v", "Average speed"]]);
    const noise = slider("Randomness (impatience)", { min: 0, max: 1, step: 0.05, value: 0.2, digits: 2 }, reset);
    const n = slider("People", { min: 20, max: 160, value: 90 }, reset);
    let P = [], raf, t = 0;
    function reset() { const R = rng(3); P = Array.from({ length: n.get() }, (_, i) => ({ x: R() * 40, y: 0.3 + R() * 7.4, d: i % 2 ? 1 : -1 })); t = 0; }
    function step() {
      const nz = noise.get();
      P.forEach((p) => {
        let ahead = 0, side = [0, 0];
        P.forEach((q) => { if (q === p) return; let dx = (q.x - p.x) * p.d; if (dx < -20) dx += 40; if (dx > 20) dx -= 40; const dy = q.y - p.y; if (dx > 0 && dx < 1.6 && Math.abs(dy) < 0.5) ahead += q.d === p.d ? 0.3 : 1; if (dx > 0 && dx < 3 && q.d !== p.d) { if (dy > 0 && dy < 1.2) side[1]++; if (dy < 0 && dy > -1.2) side[0]++; } });
        const v = 1.2 / (1 + 2 * ahead); p.x = (p.x + p.d * v * 0.12 + 40) % 40;
        let dy = 0; if (ahead > 0.5) dy = side[0] < side[1] ? -0.12 : 0.12; dy += (Math.random() - 0.5) * nz * 0.4;
        p.y = Math.max(0.3, Math.min(7.7, p.y + dy)); p.v = v;
      });
      t++;
    }
    function render() {
      const g = cv.getContext("2d"), W0 = cv.width / 40, H0 = cv.height / 8; g.clearRect(0, 0, cv.width, cv.height);
      g.fillStyle = css("--paper"); g.fillRect(0, 0, cv.width, cv.height);
      P.forEach((p) => { g.fillStyle = p.d > 0 ? css("--water") : css("--energy"); g.beginPath(); g.arc(p.x * W0, p.y * H0, 5, 0, 7); g.fill(); });
      const bins = Array.from({ length: 16 }, (_, i) => P.filter((p) => Math.floor(p.y / 0.5) === i).reduce((a, p) => a + p.d, 0));
      let changes = 0, last = 0; bins.forEach((b) => { const s = Math.sign(b); if (s && last && s !== last) changes++; if (s) last = s; });
      out.set("lanes", String(changes + 1)); out.set("v", fmt(P.reduce((a, p) => a + (p.v || 0), 0) / P.length, 2) + " m/s");
    }
    function loop() { for (let k = 0; k < 2; k++) step(); render(); raf = requestAnimationFrame(loop); }
    const go = h("button", { class: "btn", type: "button", onclick: () => { cancelAnimationFrame(raf); if (reduce) { for (let k = 0; k < 400; k++) step(); render(); } else loop(); } }, "▶ Run");
    const stop = h("button", { class: "btn quiet", type: "button", onclick: () => cancelAnimationFrame(raf) }, "Pause");
    layout(root, [n, noise, h("div", { class: "btnrow" }, go, stop), h("div", { class: "explain" }, "Blue walks right, orange walks left. Each person sidesteps away from oncoming walkers. Nobody plans lanes, yet lanes appear: self-organisation. Raise the randomness and they break up.")], [out, cv, h("p", { class: "note" }, "Toy rule for teaching, not a calibrated model. Lane formation is reproduced by many published models, for example the social force model (Helbing and Molnár 1995).")]);
    reset(); for (let k = 0; k < 5; k++) step(); render();
  };

  // 1.6 People, not particles: familiar exit bias
  W.familiar = (root) => {
    const chart = h("div"), out = readout([["t", "Everyone out after"], ["tb", "If people used both exits evenly"], ["q", "Queue at the main entrance"]]);
    const f = slider("People heading for the entrance they came in by", { min: 50, max: 100, value: 80, unit: "%" }, draw);
    const N = 1200, cap = [3, 3]; // per second, two equal exits
    function draw() {
      const a = N * f.get() / 100, b = N - a, ta = a / cap[0] + 20, tb = b / cap[1] + 25;
      out.set("t", fmt(Math.max(ta, tb) / 60, 1) + " min", Math.max(ta, tb) > (N / 2 / 3 + 25) * 1.2); out.set("tb", fmt((N / 2 / 3 + 25) / 60, 1) + " min"); out.set("q", fmt(Math.max(0, a - 3 * 60)) + " after 1 minute");
      barChart(chart, { labels: ["Main entrance", "Side exit"], values: [ta / 60, tb / 60], digits: 1, suffix: " min", yTitle: "minutes to empty", colorsFor: (i) => (i ? css("--land") : css("--climate")) });
    }
    layout(root, [f, h("div", { class: "explain" }, "1,200 people, two equal exits of 3 people per second each. People tend to leave the way they came in, even when another exit is free: familiarity beats distance.")], [out, chart, h("p", { class: "note" }, "Toy numbers. Exit choice studies (for example Sime 1985 on affiliation; Kinateder and colleagues on familiarity) show many people head for known routes.")]);
    draw();
  };

  // 1.7 When crowds become dangerous
  W.danger = (root) => {
    const pic = h("div"), out = readout([["d", "Density"], ["p", "Crowd pressure ρ·Var(V)"], ["s", "What it feels like"]]);
    const d = slider("Density", { min: 0.5, max: 9, step: 0.5, value: 3, unit: " per m²", digits: 1 }, draw);
    const sd = slider("Spread of local speeds (standard deviation)", { min: 0, max: 0.2, step: 0.01, value: 0.03, unit: " m/s", digits: 2 }, draw);
    function draw() {
      const r = d.get(), p = r * sd.get() * sd.get();
      const feel = r < 2 ? "free movement" : r < 4 ? "touching is rare, speed reduced" : r < 5.5 ? "frequent contact, little choice of where to go" : r < 7 ? "pushed by others, cannot move independently" : "forces pass through bodies: compressive asphyxia possible";
      out.set("d", fmt(r, 1) + " per m²", r >= 5.5); out.set("p", fmt(p, 3) + " per s²", p >= 0.02); out.set("s", feel, r >= 5.5);
      dots(pic, Math.round(r * 4), 2, 2, { label: "a 2 m × 2 m patch", color: r >= 5.5 ? css("--climate") : r >= 4 ? css("--energy") : css("--land") });
    }
    layout(root, [d, sd, h("div", { class: "explain" }, "Danger comes from density plus irregular motion. Helbing and colleagues defined crowd pressure as density × variance of local velocity; at the Jamarat Bridge in 2006, turbulence and falls followed when it rose above about 0.02 per s².")], [out, pic, h("p", { class: "note" }, "Density descriptions follow Fruin (1993) and Still (2014). The 0.02 s⁻² figure is from one site's data (Helbing, Johansson and Al-Abideen 2007), not a universal limit.")]);
    draw();
  };

  // 1.8 Exit width from a flow rate (Green Guide style)
  W.egress = (root) => {
    const out = readout([["w", "Exit width needed"], ["t", "Egress time with your width"], ["ok", "Meets the target time?"]]), chart = h("div");
    const N = slider("People to leave this section", { min: 500, max: 20000, step: 250, value: 6000 }, draw);
    const kind = select("Route type", [["82", "Level route: 82 people per metre per minute"], ["66", "Stepped route: 66 people per metre per minute"]], "82", draw);
    const T = slider("Target egress time", { min: 2.5, max: 8, step: 0.5, value: 8, unit: " min", digits: 1 }, draw);
    const Wd = slider("Exit width you provide", { min: 1, max: 30, step: 0.5, value: 9, unit: " m", digits: 1 }, draw);
    function draw() {
      const rate = +kind.get(), need = N.get() / (rate * T.get()), t = N.get() / (rate * Wd.get());
      out.set("w", fmt(need, 1) + " m"); out.set("t", fmt(t, 1) + " min", t > T.get()); out.set("ok", t <= T.get() ? "Yes" : "No: widen or add exits", t > T.get());
      barChart(chart, { labels: ["Target", "Your design"], values: [T.get(), t], digits: 1, suffix: " min", yTitle: "egress time", colorsFor: (i) => (i && t > T.get() ? css("--climate") : css("--land")) });
    }
    layout(root, [N, kind, T, Wd, h("div", { class: "explain" }, "Width = people ÷ (flow rate × time). Halve the time and you need double the width.")], [out, chart, h("p", { class: "note" }, "Flow rates of 82 (level) and 66 (stepped) people per metre per minute, and egress times of up to 8 minutes, as in the Guide to Safety at Sports Grounds (Green Guide, 6th edition). Real assessments also need routes, stewarding, emergency and fire considerations.")]);
    draw();
  };

  // 2.1 Measuring density: classical vs Voronoi
  W.voronoi = (root) => {
    const cv = h("canvas", { width: 420, height: 420, class: "simcanvas", "aria-label": "Voronoi density" }), out = readout([["c", "Classical density (count ÷ area)"], ["v", "Voronoi density"], ["n", "People inside the box"]]);
    const n = slider("People in the 10 m × 10 m area", { min: 10, max: 300, value: 120 }, draw);
    const sd = slider("Seed (a different snapshot)", { min: 1, max: 20, value: 4 }, draw);
    function draw() {
      const R = rng(sd.get() * 97), P = Array.from({ length: n.get() }, () => [R() * 10, R() * 10]), g = cv.getContext("2d"), S = 42, G = 0.1;
      const owner = [], area = new Array(P.length).fill(0);
      for (let x = G / 2; x < 10; x += G) for (let y = G / 2; y < 10; y += G) { let b = 0, bd = 1e9; P.forEach((p, i) => { const dd = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (dd < bd) { bd = dd; b = i; } }); owner.push([x, y, b]); area[b] += G * G; }
      g.clearRect(0, 0, 420, 420);
      const pal = [css("--economy-t"), css("--energy-t"), css("--land-t"), css("--water-t"), css("--climate-t"), css("--policy-t")];
      owner.forEach(([x, y, b]) => { g.fillStyle = pal[b % 6]; g.fillRect((x - G / 2) * S, (y - G / 2) * S, G * S + 0.5, G * S + 0.5); });
      g.strokeStyle = css("--ink"); g.lineWidth = 2; g.strokeRect(3 * S, 3 * S, 4 * S, 4 * S);
      P.forEach((p) => { g.fillStyle = css("--ink"); g.beginPath(); g.arc(p[0] * S, p[1] * S, 3, 0, 7); g.fill(); });
      const inside = P.filter((p) => p[0] > 3 && p[0] < 7 && p[1] > 3 && p[1] < 7).length;
      const inS = owner.filter(([x, y]) => x > 3 && x < 7 && y > 3 && y < 7), vd = inS.reduce((a, [, , b]) => a + 1 / area[b], 0) / inS.length;
      out.set("c", fmt(inside / 16, 2) + " per m²"); out.set("v", fmt(vd, 2) + " per m²"); out.set("n", String(inside));
    }
    layout(root, [n, sd, h("div", { class: "explain" }, "The black box is the 4 m × 4 m measurement area. Classical density jumps by 1/16 each time one person steps in or out. Voronoi density gives each person the patch of floor closer to them than to anyone else, and averages 1 ÷ patch area: smoother and fairer.")], [out, cv, h("p", { class: "note" }, "Voronoi method as in Steffen and Seyfried (2010) and the PedPy library; here computed on a 10 cm grid. Patches at the outer edge are cut by the area boundary.")]);
    draw();
  };

  // 2.2 Macroscopic model: 1-D corridor with a bottleneck (Godunov / cell transmission with Weidmann)
  W.lwr = (root) => {
    const chart = h("div"), out = readout([["q", "People stored in front of the bottleneck"], ["back", "Queue reaches back to"], ["out", "Outflow"]]);
    const inflow = slider("Inflow into the corridor", { min: 0.2, max: 1.2, step: 0.05, value: 0.9, unit: " per m per s", digits: 2 }, draw);
    const bw = slider("Bottleneck width as a share of the corridor", { min: 0.3, max: 1, step: 0.05, value: 0.5, digits: 2 }, draw);
    const tEnd = slider("Time", { min: 10, max: 300, step: 10, value: 120, unit: " s" }, draw);
    const rs = range(0.01, 5.39, 0.01), jmax = Math.max(...rs.map((r) => jW(r))), rcrit = rs[rs.map((r) => jW(r)).indexOf(jmax)];
    const D = (r, w) => w * (r <= rcrit ? jW(r) : jmax), Su = (r, w) => w * (r <= rcrit ? jmax : jW(r));
    function sim(T) {
      const L = 60, dx = 1, dt = 0.5, n = L / dx, w = Array.from({ length: n }, (_, i) => (i >= 40 && i < 45 ? bw.get() : 1));
      let r = new Array(n).fill(0); let outF = 0;
      for (let t = 0; t < T; t += dt) {
        const f = new Array(n + 1).fill(0);
        f[0] = Math.min(inflow.get(), Su(r[0], w[0]));
        for (let i = 1; i < n; i++) f[i] = Math.min(D(r[i - 1], w[i - 1]), Su(r[i], w[i]));
        f[n] = D(r[n - 1], w[n - 1]); outF = f[n];
        r = r.map((x, i) => Math.max(0, x + (dt / dx) * (f[i] - f[i + 1]) / w[i]));
      }
      return { r, outF, xs: range(0.5, L - 0.5, 1) };
    }
    function draw() {
      const s = sim(tEnd.get()), stored = s.r.slice(0, 40).reduce((a, x) => a + x, 0), back = s.r.slice(0, 40).findIndex((x) => x > rcrit);
      out.set("q", fmt(stored) + " per m of width", stored > 50); out.set("back", back >= 0 ? `${back} m from the start` : "no queue"); out.set("out", fmt(s.outF, 2) + " per m per s");
      lineChart(chart, { xs: s.xs, series: [{ name: "Density along the corridor (per m²)", values: s.r }], xTitle: "Position along the corridor (m); bottleneck at 40–45 m", yTitle: "per m²", yMax: 5.4, hline: { y: rcrit, label: "density at capacity" }, area: true, label: "density profile" });
    }
    layout(root, [inflow, bw, tEnd, h("div", { class: "explain" }, "The corridor is cut into 1 m cells. Each step, flow between cells is the smaller of what the upstream cell can send (demand) and what the downstream cell can take (supply), both from the fundamental diagram. A jam forms at the bottleneck and its tail moves backwards.")], [out, chart, h("p", { class: "note" }, "First-order macroscopic model (LWR, Godunov scheme, cell transmission) with Weidmann's fundamental diagram. Teaching version: no route choice, single direction.")]);
    draw();
  };

  // 2.6 Route (exit) choice: share people between two exits
  W.routechoice = (root) => {
    const chart = h("div"), out = readout([["tn", "Everyone out: all use the nearest exit"], ["ty", "Everyone out: your split"], ["best", "Best possible split"]]);
    const share = slider("Share sent to the far exit", { min: 0, max: 100, value: 0, unit: "%" }, draw);
    const N = 2000, dA = 30, dB = 90, cA = 4, cB = 4, v = 1.2;
    const T = (s) => { const b = N * s, a = N - b; return Math.max(a / cA + dA / v, b ? b / cB + dB / v : 0); };
    function draw() {
      let bs = 0, bt = 1e9; for (let s = 0; s <= 1; s += 0.01) { const t = T(s); if (t < bt) { bt = t; bs = s; } }
      out.set("tn", fmt(T(0) / 60, 1) + " min"); out.set("ty", fmt(T(share.get() / 100) / 60, 1) + " min", T(share.get() / 100) > bt * 1.05); out.set("best", `${fmt(bs * 100)}% far → ${fmt(bt / 60, 1)} min`);
      const ss = range(0, 100, 2); lineChart(chart, { xs: ss, series: [{ name: "Time for everyone to get out (min)", values: ss.map((x) => T(x / 100) / 60) }], xTitle: "Share sent to the far exit (%)", yTitle: "minutes", vline: { x: share.get(), label: "you" }, label: "exit split" });
    }
    layout(root, [share, h("div", { class: "explain" }, "2,000 people. Exit A is 30 m away, exit B 90 m; each lets 4 people through per second. Sending some to the far exit costs walking time but saves queueing time. The best split equalises the two exits' finishing times.")], [out, chart, h("p", { class: "note" }, "Toy calculation: walk time = distance ÷ 1.2 m/s, queue time = people ÷ capacity. Simulators add dynamic route choice and congestion feedback.")]);
    draw();
  };

  // 2.7 RSET vs ASET
  W.rset = (root) => {
    const chart = h("div"), out = readout([["r", "RSET (required)"], ["m", "Safety margin (ASET − RSET)"], ["ok", "Verdict"]]);
    const det = slider("Detection", { min: 10, max: 180, step: 10, value: 60, unit: " s" }, draw);
    const warn = slider("Alarm and warning", { min: 0, max: 120, step: 10, value: 30, unit: " s" }, draw);
    const pre = slider("Pre-movement (people deciding, gathering things)", { min: 30, max: 600, step: 15, value: 120, unit: " s" }, draw);
    const N = slider("People", { min: 200, max: 4000, step: 100, value: 1500 }, draw);
    const wd = slider("Total exit width", { min: 2, max: 20, step: 0.5, value: 6, unit: " m", digits: 1 }, draw);
    const aset = slider("ASET (available, from fire modelling)", { min: 300, max: 1500, step: 30, value: 900, unit: " s" }, draw);
    function draw() {
      const walk = 60 / 1.2, flowt = N.get() / (1.3 * wd.get()), move = Math.max(walk, flowt), r = det.get() + warn.get() + pre.get() + move, m = aset.get() - r;
      out.set("r", fmt(r) + " s (" + fmt(r / 60, 1) + " min)"); out.set("m", fmt(m) + " s", m < 0); out.set("ok", m < 0 ? "Unsafe" : m < 0.5 * r ? "Margin may be too small" : "Adequate margin (toy)", m < 0);
      barChart(chart, { labels: ["Detection", "Warning", "Pre-movement", "Movement", "ASET"], values: [det.get(), warn.get(), pre.get(), move, aset.get()], yTitle: "seconds", colorsFor: (i) => (i === 4 ? css("--climate") : css("--water")) });
    }
    layout(root, [det, warn, pre, N, wd, aset, h("div", { class: "explain" }, "RSET = detection + warning + pre-movement + movement. Movement is the longer of walking 60 m at 1.2 m/s and queuing through the exits at 1.3 people per metre per second.")], [out, chart, h("p", { class: "note" }, "Hydraulic method as in the SFPE Handbook and PD 7974-6, with toy values. Pre-movement time is usually the largest and most uncertain part.")]);
    draw();
  };

  // 2.8 Calibrate a fundamental diagram to data
  W.calibrate = (root) => {
    const chart = h("div"), out = readout([["e", "Error (RMSE, m/s)"], ["fit", "Best fit found so far"]]);
    const v0 = slider("Free speed v₀", { min: 0.8, max: 1.8, step: 0.02, value: 1.34, unit: " m/s", digits: 2 }, draw);
    const g = slider("Shape γ", { min: 0.5, max: 4, step: 0.05, value: 1.913, digits: 2 }, draw);
    const rm = slider("Jam density ρmax", { min: 4, max: 10, step: 0.1, value: 5.4, unit: " per m²", digits: 1 }, draw);
    const R = rng(11), truth = { v0: 1.1, g: 1.4, rmax: 7 }, data = Array.from({ length: 40 }, () => { const r = 0.2 + R() * 5.5; return [r, Math.max(0, vW(r, truth) + (R() - 0.5) * 0.18)]; }).sort((a, b) => a[0] - b[0]);
    let best = 9;
    function draw() {
      const p = { v0: v0.get(), g: g.get(), rmax: rm.get() }, e = Math.sqrt(data.reduce((a, [r, v]) => a + (vW(r, p) - v) ** 2, 0) / data.length);
      best = Math.min(best, e); out.set("e", fmt(e, 3), e > 0.08); out.set("fit", fmt(best, 3));
      const xs = data.map((d) => d[0]);
      lineChart(chart, { xs, series: [{ name: "Your curve", values: xs.map((r) => vW(r, p)) }, { name: "Measured speeds (dots)", values: data.map((d) => d[1]), dash: "1 7", color: css("--climate") }], xTitle: "Density (per m²)", yTitle: "m/s", yMax: 1.8, label: "calibration" });
    }
    layout(root, [v0, g, rm, h("div", { class: "explain" }, "These 'measurements' come from a crowd unlike Weidmann's. Move the sliders until the curve passes through the dots and the error is below 0.06 m/s. That is calibration by hand.")], [out, chart, h("p", { class: "note" }, "Synthetic data with noise. Real calibration fits several observables at once (fundamental diagram, bottleneck flow, travel times) and checks the result on data not used in fitting.")]);
    draw();
  };

  // 3.2 DIM-ICE scoring
  W.dimice = (root) => {
    const grid = h("div", { class: "dimice" }), out = readout([["top", "Highest-risk cell"], ["sum", "Overall score"]]);
    const rows = ["Design", "Information", "Management"], cols = ["Ingress", "Circulation", "Egress"];
    const vals = {}; const sels = [];
    const tbl = h("table", { class: "tbl" }, h("thead", {}, h("tr", {}, h("th", {}, ""), cols.map((c) => h("th", {}, c)))), h("tbody", {}, rows.map((r) => h("tr", {}, h("th", {}, r), cols.map((c) => { const s = h("select", { "aria-label": `${r} × ${c}` }, [["1", "1 low"], ["2", "2 medium"], ["3", "3 high"]].map(([v, t]) => h("option", { value: v }, t))); s.value = "1"; s.addEventListener("change", draw); sels.push([r, c, s]); return h("td", {}, s); })))));
    grid.append(tbl);
    const preset = select("Load a case", [["none", "Blank"], ["lp", "Love Parade 2010 (single ramp in and out)"], ["it", "Itaewon 2022 (narrow sloping alley, no event plan)"]], "none", () => {
      const P = { lp: [3, 2, 3, 2, 2, 2, 3, 3, 2], it: [3, 3, 3, 3, 3, 2, 3, 3, 2], none: [1, 1, 1, 1, 1, 1, 1, 1, 1] }[preset.get()];
      sels.forEach((x, i) => (x[2].value = String(P[i]))); draw();
    });
    function draw() {
      let top = null, sum = 0; sels.forEach(([r, c, s]) => { const v = +s.value; sum += v; s.parentElement.style.background = v === 3 ? css("--climate-t") : v === 2 ? css("--energy-t") : ""; if (!top || v > top[2]) top = [r, c, v]; });
      out.set("top", `${top[0]} × ${top[1]}`, top[2] === 3); out.set("sum", `${sum} of 27`, sum >= 20);
    }
    layout(root, [preset, h("div", { class: "explain" }, "Still's DIM-ICE model crosses what you control (Design, Information, Management) with the phase of the event (Ingress, Circulation, Egress). Score each cell, then look for clusters of high risk.")], [out, grid, h("p", { class: "note" }, "Scores for the cases are this course's teaching judgement from published accounts, not official findings.")]);
    draw();
  };

  // 3.3 Scheduling (tafweej-style time slots)
  W.tafweej = (root) => {
    const chart = h("div"), out = readout([["peak", "Peak demand on the route"], ["q", "Largest queue"], ["ok", "Within capacity?"]]);
    const N = slider("Pilgrims to move to the site today", { min: 100000, max: 800000, step: 25000, value: 450000 }, draw);
    const slots = slider("Number of time slots used", { min: 2, max: 12, value: 6 }, draw);
    const comp = slider("Groups keeping to their slot", { min: 40, max: 100, value: 85, unit: "%" }, draw);
    const cap = 60000; // people per hour, toy route capacity
    function draw() {
      const hrs = range(0, 23), d = hrs.map(() => 0), per = N.get() / slots.get();
      for (let k = 0; k < slots.get(); k++) { const hk = Math.round((k * 18) / slots.get()) + 2; d[hk] += per * comp.get() / 100; }
      const off = N.get() * (1 - comp.get() / 100); [3, 4, 5].forEach((hk) => (d[hk] += off / 3)); // non-compliant groups go early, at the popular time
      let q = 0, mq = 0; d.forEach((x) => { q = Math.max(0, q + x - cap); mq = Math.max(mq, q); });
      const pk = Math.max(...d);
      out.set("peak", fmt(pk) + " per hour", pk > cap); out.set("q", fmt(mq) + " people", mq > 0); out.set("ok", pk <= cap ? "Yes" : "No: queues build", pk > cap);
      barChart(chart, { labels: hrs.map((x) => (x % 3 ? "" : String(x))), values: d.map((x) => x / 1000), yTitle: "thousand people per hour", colorsFor: (i, v) => (v * 1000 > cap ? css("--climate") : css("--water")) });
    }
    layout(root, [N, slots, comp, h("div", { class: "explain" }, "Each group is given a time slot. More slots spread the demand; groups that ignore their slot pile up at the popular early hours. The route here carries at most 60,000 people per hour (toy number).")], [out, chart, h("p", { class: "note" }, "Toy model of time-slot scheduling of pilgrim groups, as used for the stoning ritual at the Jamarat. Real capacities and schedules are set by the Hajj authorities.")]);
    draw();
  };

  // 3.4 Estimating crowd size: Jacobs' method
  W.jacobs = (root) => {
    const chart = h("div"), out = readout([["est", "Your estimate"], ["true", "True size (hidden in reality)"], ["err", "Error"]]);
    const A = [12000, 18000, 30000]; // m² dense / medium / light zones
    const d1 = slider("Density you assume in the dense zone (12,000 m²)", { min: 1, max: 6, step: 0.25, value: 4, unit: " per m²", digits: 2 }, draw);
    const d2 = slider("…in the medium zone (18,000 m²)", { min: 0.5, max: 4, step: 0.25, value: 2, unit: " per m²", digits: 2 }, draw);
    const d3 = slider("…in the light zone (30,000 m²)", { min: 0.1, max: 2, step: 0.1, value: 1, unit: " per m²", digits: 1 }, draw);
    const truth = 12000 * 3.1 + 18000 * 1.6 + 30000 * 0.45;
    function draw() {
      const est = A[0] * d1.get() + A[1] * d2.get() + A[2] * d3.get(), e = (est - truth) / truth;
      out.set("est", fmt(est)); out.set("true", fmt(truth)); out.set("err", (e > 0 ? "+" : "") + fmt(e * 100) + "%", Math.abs(e) > 0.2);
      barChart(chart, { labels: ["Dense", "Medium", "Light"], values: [A[0] * d1.get(), A[1] * d2.get(), A[2] * d3.get()].map((x) => x / 1000), digits: 0, yTitle: "thousand people", suffix: "k" });
    }
    layout(root, [d1, d2, d3, h("div", { class: "explain" }, "Jacobs' method: split the area into zones, multiply each zone's area by its density, and add. The answer is only as good as the densities you assume, which is why counts from images and sensors matter.")], [out, chart, h("p", { class: "note" }, "Herbert Jacobs devised the method for counting crowds in the 1960s. Densities above about 4 per m² across a whole zone are rare; overestimates are common in reports of large gatherings.")]);
    draw();
  };

  // 3.5 Crowd pressure map
  W.pressure = (root) => {
    const cv = h("canvas", { width: 420, height: 300, class: "simcanvas", "aria-label": "crowd pressure map" }), out = readout([["max", "Highest crowd pressure"], ["share", "Area above the warning level"], ["alarm", "Alert"]]);
    const rho = slider("Density in the dense zone", { min: 2, max: 9, step: 0.5, value: 6, unit: " per m²", digits: 1 }, draw);
    const sd = slider("Irregular motion in the dense zone (speed SD)", { min: 0.01, max: 0.15, step: 0.005, value: 0.05, unit: " m/s", digits: 3 }, draw);
    const thr = slider("Warning level", { min: 0.005, max: 0.03, step: 0.001, value: 0.02, unit: " per s²", digits: 3 }, draw);
    function draw() {
      const g = cv.getContext("2d"), nx = 21, ny = 15, cw = 20, R = rng(5); let mx = 0, hot = 0;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const dz = Math.exp(-(((i - 14) / 5) ** 2 + ((j - 7) / 4) ** 2)), r = 1 + (rho.get() - 1) * dz, s = 0.01 + (sd.get() - 0.01) * dz * (0.7 + 0.6 * R()), p = r * s * s;
        mx = Math.max(mx, p); if (p > thr.get()) hot++;
        const k = Math.min(1, p / (2 * thr.get())); g.fillStyle = `rgba(${Math.round(60 + 190 * k)},${Math.round(160 - 120 * k)},${Math.round(120 - 80 * k)},0.9)`; g.fillRect(i * cw, j * cw, cw - 1, cw - 1);
      }
      out.set("max", fmt(mx, 3) + " per s²", mx > thr.get()); out.set("share", fmt((100 * hot) / (nx * ny)) + "%"); out.set("alarm", mx > thr.get() ? "Act now: stop inflow, open relief routes" : mx > 0.6 * thr.get() ? "Watch closely" : "Normal", mx > thr.get());
    }
    layout(root, [rho, sd, thr, h("div", { class: "explain" }, "Each cell is a 1 m² patch seen by a camera. Crowd pressure = local density × variance of local speed. Dense but orderly crowds stay green; dense and irregular crowds turn red.")], [out, cv, h("p", { class: "note" }, "Synthetic field for teaching. Real systems estimate density and velocity from video (for example optical flow) and must handle measurement noise and camera perspective.")]);
    draw();
  };

  // 3.6 Sensitivity: Monte Carlo egress time
  W.sensitivity = (root) => {
    const chart = h("div"), out = readout([["m", "Median egress time"], ["p95", "95th percentile"], ["spread", "Spread (95th − 5th)"]]);
    const pu = slider("Uncertainty in pre-movement time (± share)", { min: 0, max: 100, step: 5, value: 50, unit: "%" }, draw);
    const fu = slider("Uncertainty in specific flow (± share)", { min: 0, max: 50, step: 5, value: 20, unit: "%" }, draw);
    function draw() {
      const R = rng(21), res = [];
      for (let k = 0; k < 800; k++) { const pre = 120 * (1 + (R() * 2 - 1) * pu.get() / 100), js = 1.3 * (1 + (R() * 2 - 1) * fu.get() / 100); res.push(pre + 3000 / (js * 8)); }
      res.sort((a, b) => a - b); const q = (p) => res[Math.floor(p * (res.length - 1))];
      out.set("m", fmt(q(0.5) / 60, 1) + " min"); out.set("p95", fmt(q(0.95) / 60, 1) + " min", q(0.95) > 1.3 * q(0.5)); out.set("spread", fmt((q(0.95) - q(0.05)) / 60, 1) + " min");
      const bins = range(0, 19), lo = res[0], hi = res[res.length - 1], bw = (hi - lo) / 20 || 1, cnt = bins.map((b) => res.filter((x) => x >= lo + b * bw && x < lo + (b + 1) * bw).length);
      barChart(chart, { labels: bins.map((b) => (b % 4 ? "" : fmt((lo + b * bw) / 60, 1))), values: cnt, yTitle: "runs (of 800)", colorsFor: () => css("--water") });
    }
    layout(root, [pu, fu, h("div", { class: "explain" }, "3,000 people leave through 8 m of exits. Pre-movement time and specific flow are uncertain, so we sample them 800 times and look at the spread, not one number.")], [out, chart, h("p", { class: "note" }, "Uniform uncertainty ranges for teaching. In research, choose distributions from data and report percentiles.")]);
    draw();
  };

  // 3.7 Metering at the gates
  W.metering = (root) => {
    const chart = h("div"), out = readout([["d", "Highest density in the plaza"], ["q", "Longest queue outside"], ["ok", "Plaza stays below 2 per m²?"]]);
    const m = slider("Gate inflow allowed (metering)", { min: 50, max: 400, step: 10, value: 400, unit: " per min" }, draw);
    const A = 1200, outCap = 180; // plaza area m², exit to venue per minute
    function draw() {
      const ts = range(0, 120), arr = ts.map((t) => 320 * Math.exp(-(((t - 40) / 22) ** 2)));
      let qo = 0, pl = 0; const D = [], Q = [];
      ts.forEach((t, i) => { qo += arr[i]; const inn = Math.min(qo, m.get()); qo -= inn; pl += inn; const o = Math.min(pl, outCap); pl -= o; D.push(pl / A); Q.push(qo); });
      const md = Math.max(...D), mq = Math.max(...Q);
      out.set("d", fmt(md, 2) + " per m²", md > 2); out.set("q", fmt(mq) + " people"); out.set("ok", md <= 2 ? "Yes" : "No", md > 2);
      lineChart(chart, { xs: ts, series: [{ name: "Plaza density (per m²)", values: D, color: css("--climate") }, { name: "Queue outside (thousands)", values: Q.map((x) => x / 1000) }], xTitle: "Minutes", yTitle: "per m² / thousands", hline: { y: 2, label: "2 per m²" }, label: "metering" });
    }
    layout(root, [m, h("div", { class: "explain" }, "A 1,200 m² plaza feeds the venue at 180 people per minute. Metering the gates moves the waiting from the enclosed plaza to the open approach, where it is safer and easier to manage.")], [out, chart, h("p", { class: "note" }, "Toy numbers. Metering only helps if the space outside can hold the queue safely; it moves risk, it does not delete it.")]);
    draw();
  };

  window.IAMWidgets = W;
  window.IAMChart = { lineChart, barChart };
})();
