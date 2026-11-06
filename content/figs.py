"""Animated teaching SVGs for the model atlas (assets/img/fig/model-*.svg). SMIL motion, so pauseAnimations() works."""
import math, os, random
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "fig")
STY = """<style>.fg-t{font-family:"Atkinson Hyperlegible Next",Arial,sans-serif;font-size:15px;fill:var(--ink,#14283a)}
.fg-h{font-family:Archivo,"Arial Narrow",Arial,sans-serif;font-weight:700;font-size:18px;fill:var(--ink,#14283a)}
.fg-s{font-family:"Atkinson Hyperlegible Next",Arial,sans-serif;font-size:12.5px;fill:var(--muted,#5d6f7d)}
.wall{fill:var(--ink,#14283a)}.cell{fill:none;stroke:var(--line,#d5dde3);stroke-width:1}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>"""
C = dict(p="var(--economy,#8f3520)", f="var(--energy,#0b3954)", s="var(--land,#2f5a1c)", d="var(--water,#04505a)", r="var(--climate,#7a4412)", m="var(--policy,#3f3266)")


def svg(key, title, sub, body):
    s = f'<svg class="fig-anim" viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{title}"><title>{title}</title>{STY}'
    s += f'<text class="fg-h" x="24" y="34">{title}</text><text class="fg-s" x="24" y="54">{sub}</text>{body}</svg>'
    open(os.path.join(OUT, f"model-{key}.svg"), "w").write(s)


def dot(path, dur, begin, col, r=7, extra=""):
    return f'<circle r="{r}" fill="{col}" opacity="0"><animateMotion path="{path}" dur="{dur}s" begin="{begin:.2f}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="{dur}s" begin="{begin:.2f}s" repeatCount="indefinite"/>{extra}</circle>'


def room(x0=80, y0=80, w=520, h=240, door=(170, 230), xd=None):
    xd = xd or x0 + w
    b = f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="none" stroke="var(--ink,#14283a)" stroke-width="0"/>'
    b += f'<rect class="wall" x="{x0}" y="{y0 - 6}" width="{w}" height="6"/><rect class="wall" x="{x0}" y="{y0 + h}" width="{w}" height="6"/>'
    b += f'<rect class="wall" x="{xd}" y="{y0 - 6}" width="8" height="{door[0] - y0 + 6}"/><rect class="wall" x="{xd}" y="{door[1]}" width="8" height="{y0 + h - door[1] + 6}"/>'
    return b


random.seed(4)
# 1 hydraulic: steady stream through a door, rate label
b = room() + '<text class="fg-t" x="640" y="190">flow = 1.3 per m per s</text><text class="fg-t" x="640" y="214">× door width</text><text class="fg-t" x="640" y="250">time = N ÷ (flow × width)</text>'
for i in range(28):
    y = random.uniform(100, 300); b += dot(f"M{random.uniform(90, 200):.0f},{y:.0f} L560,{y:.0f} L604,{200 + (y - 200) * 0.15:.0f} L880,{200 + (y - 200) * 0.15:.0f}", 7, i * 0.25, C["f"])
svg("hydraulic", "Hydraulic method: a steady flow per metre of width", "Like water in a pipe: no behaviour, just width, flow rate and walking speed", b)

# 2 macro: density field as moving bands
b = '<defs><linearGradient id="mg" x1="0" x2="1"><stop offset="0" stop-color="var(--climate,#7a4412)" stop-opacity=".85"><animate attributeName="offset" values="0;0.6;0" dur="6s" repeatCount="indefinite"/></stop><stop offset="0.5" stop-color="var(--energy,#0b3954)" stop-opacity=".35"><animate attributeName="offset" values="0.3;0.9;0.3" dur="6s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="var(--energy,#0b3954)" stop-opacity=".08"/></linearGradient></defs>'
b += '<rect x="80" y="100" width="720" height="140" rx="8" fill="url(#mg)"/><rect class="wall" x="80" y="94" width="720" height="6"/><rect class="wall" x="80" y="240" width="720" height="6"/>'
b += '<line x1="300" y1="92" x2="300" y2="250" stroke="var(--ink,#14283a)" stroke-width="3" stroke-dasharray="6 6"><animate attributeName="x1" values="200;520;200" dur="6s" repeatCount="indefinite"/><animate attributeName="x2" values="200;520;200" dur="6s" repeatCount="indefinite"/></line>'
b += '<text class="fg-t" x="80" y="290">density ρ(x, t): dark = dense. The dashed line is a queue front (shock wave).</text><text class="fg-t" x="80" y="314">∂ρ/∂t + ∂(ρ·v(ρ))/∂x = 0, with v(ρ) from the fundamental diagram</text>'
svg("macro", "Macroscopic model: density waves, not individuals", "Conservation of people plus a fundamental diagram; fast enough for whole sites", b)

# 3 CA: grid, squares hop discretely
b = ""; cs = 30; gx, gy = 120, 80
for i in range(16):
    for j in range(8): b += f'<rect class="cell" x="{gx + i * cs}" y="{gy + j * cs}" width="{cs}" height="{cs}"/>'
b += f'<rect class="wall" x="{gx + 16 * cs}" y="{gy}" width="6" height="{3 * cs}"/><rect class="wall" x="{gx + 16 * cs}" y="{gy + 5 * cs}" width="6" height="{3 * cs}"/>'
for k in range(14):
    i, j = random.randint(0, 9), random.randint(0, 7); xs, ys = [], []
    while i < 17:
        xs.append(gx + i * cs + 4); ys.append(gy + j * cs + 4); i += 1
        if j < 3 and random.random() < 0.5: j += 1
        elif j > 4 and random.random() < 0.5: j -= 1
    n = len(xs); dur = n * 0.45; beg = random.uniform(0, 3)
    b += f'<rect width="22" height="22" rx="4" fill="{C["s"]}"><animate attributeName="x" values="{";".join(map(str, xs))}" dur="{dur:.2f}s" begin="{beg:.2f}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="y" values="{";".join(map(str, ys))}" dur="{dur:.2f}s" begin="{beg:.2f}s" calcMode="discrete" repeatCount="indefinite"/></rect>'
b += '<text class="fg-t" x="640" y="120">0.4 m cells, one person each</text><text class="fg-t" x="640" y="150">hop to a neighbour cell with</text><text class="fg-t" x="640" y="172">probability ∝ exp(kS·S + kD·D)</text><text class="fg-s" x="640" y="200">S: static field (distance to exit)</text><text class="fg-s" x="640" y="220">D: dynamic field (others\' traces)</text>'
svg("ca", "Cellular automaton: hops on a grid towards the exit", "Floor fields guide each step; very fast, but speeds come in whole cells", b)

# 4 SFM: dots converge on door with jiggle, force arrows on one agent
b = room(door=(180, 220)) + '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="var(--ink,#14283a)"/></marker></defs>'
for i in range(26):
    y = random.uniform(100, 300); x = random.uniform(100, 420); jit = " ".join(f"L{x + (560 - x) * t:.0f},{y + (200 - y) * t + random.uniform(-8, 8):.0f}" for t in (0.3, 0.55, 0.75, 0.9, 0.97))
    b += dot(f"M{x:.0f},{y:.0f} {jit} L604,200 L700,{200 + random.uniform(-30, 30):.0f}", 6, random.uniform(0, 6), C["p"])
b += '<circle cx="400" cy="150" r="9" fill="var(--ink,#14283a)"/><line x1="400" y1="150" x2="470" y2="170" stroke="var(--land,#2f5a1c)" stroke-width="3" marker-end="url(#ah)"/><line x1="400" y1="150" x2="380" y2="110" stroke="var(--climate,#7a4412)" stroke-width="3" marker-end="url(#ah)"/>'
b += '<text class="fg-t" x="640" y="120">m·dv/dt =</text><text class="fg-t" x="660" y="146">driving force (to goal)</text><text class="fg-t" x="660" y="170">+ social repulsion</text><text class="fg-t" x="660" y="194">+ contact forces</text><text class="fg-s" x="640" y="230">green: towards goal; brown: push from neighbour</text>'
svg("sfm", "Social force model: pulls and pushes like springs", "Newton's law for pedestrians; clogging and faster-is-slower at the door", b)

# 5 OSM: step circle, candidate points, chosen step moves
b = '<circle cx="820" cy="200" r="12" fill="none" stroke="var(--land,#2f5a1c)" stroke-width="3"/><text class="fg-s" x="790" y="235">goal</text>'
b += '<circle cx="520" cy="170" r="14" fill="var(--economy,#8f3520)" opacity=".7"/><text class="fg-s" x="500" y="150">other</text>'
steps = [(160, 220), (230, 215), (300, 205), (370, 220), (440, 235), (510, 232), (580, 222), (650, 212), (720, 205)]
xs = ";".join(str(p[0]) for p in steps); ys = ";".join(str(p[1]) for p in steps); dur = len(steps) * 0.9
for k in range(16):
    a = 2 * math.pi * k / 16
    b += f'<circle r="4" fill="var(--energy,#0b3954)" opacity=".55"><animate attributeName="cx" values="{";".join(str(round(p[0] + 70 * math.cos(a))) for p in steps)}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="cy" values="{";".join(str(round(p[1] + 70 * math.sin(a))) for p in steps)}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/></circle>'
b += f'<circle r="70" fill="none" stroke="var(--energy,#0b3954)" stroke-dasharray="4 5"><animate attributeName="cx" values="{xs}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="cy" values="{ys}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/></circle>'
b += f'<circle r="11" fill="var(--ink,#14283a)"><animate attributeName="cx" values="{xs}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="cy" values="{ys}" dur="{dur}s" calcMode="discrete" repeatCount="indefinite"/></circle>'
b += '<text class="fg-t" x="80" y="310">Each step: test points on the step circle, pick the one with the best utility</text><text class="fg-t" x="80" y="334">(closer to the goal, but keeping personal space from others and walls)</text>'
svg("osm", "Optimal steps model: the best next step on a circle", "Discrete steps, no overlaps; implemented in Vadere", b)

# 6 CFSM: ring with headway
cx, cy, R = 330, 205, 120
b = f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="var(--line,#d5dde3)" stroke-width="28"/>'
for k in range(14):
    b += f'<circle r="9" fill="{C["f"]}"><animateMotion path="M{cx + R},{cy} A{R},{R} 0 1 1 {cx + R - 0.01},{cy - 0.5}" dur="12s" begin="{-k * 12 / 14:.2f}s" repeatCount="indefinite" keyPoints="0;0.3;0.38;1" keyTimes="0;0.4;0.6;1" calcMode="linear"/></circle>'
b += '<text class="fg-t" x="520" y="120">speed = min(v0, (s − ℓ) ÷ T)</text><text class="fg-s" x="520" y="146">s: distance to the person in front</text><text class="fg-s" x="520" y="166">ℓ: body size; T: time gap</text><text class="fg-t" x="520" y="210">Never closer than the time gap,</text><text class="fg-t" x="520" y="234">so people never collide.</text><text class="fg-s" x="520" y="268">Slow-downs travel backwards as stop-and-go waves.</text>'
svg("cfsm", "Collision-free speed model: keep a safe time gap", "First-order, few parameters, overlap-free; JuPedSim's default model", b)

# 7 heuristics: vision fan sweeping, person walks
b = '<rect x="560" y="120" width="40" height="70" rx="6" fill="var(--climate,#7a4412)" opacity=".7"/><text class="fg-s" x="548" y="110">obstacle</text><circle cx="820" cy="180" r="12" fill="none" stroke="var(--land,#2f5a1c)" stroke-width="3"/><text class="fg-s" x="795" y="215">goal</text>'
b += '<g><animateTransform attributeName="transform" type="translate" values="0,0;250,0;360,70;470,60;560,10" keyTimes="0;0.35;0.6;0.8;1" dur="8s" repeatCount="indefinite"/>'
b += '<path d="M200,180 L370,90 A190,190 0 0 1 370,270 Z" fill="var(--water,#04505a)" opacity=".14"><animateTransform attributeName="transform" type="rotate" values="-12 200 180;12 200 180;-12 200 180" dur="2s" repeatCount="indefinite"/></path>'
b += '<line x1="200" y1="180" x2="330" y2="180" stroke="var(--water,#04505a)" stroke-width="3" stroke-dasharray="6 5"/><circle cx="200" cy="180" r="11" fill="var(--ink,#14283a)"/></g>'
b += '<text class="fg-t" x="80" y="310">Heuristic 1: head where you can walk furthest towards the goal without a collision.</text><text class="fg-t" x="80" y="334">Heuristic 2: keep a safe time to collision with what is ahead.</text>'
svg("heur", "Cognitive heuristics: look, then choose a free direction", "Vision-based decisions (Moussaïd et al. 2011); turbulence with contact forces", b)
print("ok")
