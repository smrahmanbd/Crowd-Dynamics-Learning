"""Simulation challenges per module (rendered by assets/js/challenges.js). Every challenge has a 'solution' that is
checked at build time against the toy models in challenges.js (window.IAMToyModels). All numbers are teaching toys."""


def S(id, label, mn, mx, val, step=1, unit="", digits=0, hint=None):
    d = dict(id=id, label=label, min=mn, max=mx, value=val, step=step, unit=unit, digits=digits)
    if hint: d["hint"] = hint
    return d


def P(q, options, answer):
    return dict(q=q, options=options, answer=answer)


CH = {}
# ------------------------------------------------------------------ Go 1
CH["1.1"] = [
    dict(title="Room to move", level="Warm-up", icon="crowd", model="los", metric="m2", metricLabel="Space per person", unit=" m²", digits=2, view="bars",
         fixed=dict(area=600), controls=[S("n", "People in a 600 m² square", 50, 1500, 900, 10)],
         op=">=", target=1.39, goal="Keep at least <b>1.39 m² per person</b> (Fruin level of service C) in a 600 m² square. How many people can you admit?",
         predict=P("Doubling the people in the same square does what to space per person?", ["Doubles it", "Halves it", "Leaves it the same"], 1),
         hint="Space per person = area ÷ people. 600 ÷ 1.39 ≈ 430.", explain="Space per person is the inverse of density. Planning starts by deciding the space each person needs, then capping numbers.",
         solution=dict(n=430)),
]
CH["1.2"] = [
    dict(title="Hit a density of 2 per m²", level="Core", icon="grid4", model="los", metric="dens", metricLabel="Density", unit=" per m²", digits=2, view="gauge", gmin=0, gmax=6,
         fixed=dict(area=250), controls=[S("n", "People on a 250 m² concourse", 50, 1500, 200, 10)],
         op="=", target=2, tol=0.05, goal="Set the number of people so that density is <b>2.0 per m²</b> (± 0.05), level of service E/D boundary.",
         hint="Density = people ÷ area.", explain="At 2 per m² each person has 0.5 m²: walking is restricted and contact begins to be common.",
         solution=dict(n=500)),
]
CH["1.3"] = [
    dict(title="Find the capacity peak", level="Core", icon="gauge", model="fd", metric="j", metricLabel="Specific flow", unit=" per m per s", digits=2, view="line",
         fixed={}, controls=[S("rho", "Density (per m²)", 0.2, 5.2, 0.5, 0.05, digits=2)],
         op=">=", target=1.21, goal="Find a density that gives a specific flow of at least <b>1.21 per m per s</b>, near Weidmann's capacity.",
         predict=P("As density rises from 0.5 to 5 per m², flow…", ["Keeps rising", "Rises, peaks, then falls", "Keeps falling"], 1),
         hint="The peak of Weidmann's curve is near 1.75 per m².", explain="Flow is density times speed. Speed falls as density rises, so flow peaks at an intermediate density: the capacity.",
         solution=dict(rho=1.75)),
    dict(title="Keep people walking", level="Warm-up", icon="walk", model="fd", metric="v", metricLabel="Walking speed", unit=" m/s", digits=2, view="gauge", gmin=0, gmax=1.4,
         fixed={}, controls=[S("rho", "Density (per m²)", 0.2, 5.2, 3, 0.05, digits=2)],
         op=">=", target=1.0, goal="Find the highest density at which people still walk at <b>1.0 m/s or more</b>.",
         hint="Try densities around 1 per m².", explain="Speed stays near free-flow at low density and falls quickly above about 1 per m².",
         solution=dict(rho=1.0)),
]
CH["1.4"] = [
    dict(title="No queue at the door", level="Core", icon="door", model="bottleneck", metric="q10", metricLabel="Queue after 10 min", unit=" people", digits=0, view="bars",
         fixed=dict(lam=4, js=1.3, N=2000), controls=[S("w", "Door width (m)", 0.8, 5, 1.2, 0.1, digits=1)],
         op="<=", target=0, goal="People arrive at 4 per second. Choose the narrowest door with <b>no queue</b> after 10 minutes (specific flow 1.3 per m per s).",
         predict=P("If arrivals exceed capacity by 1 person per second, after 10 minutes the queue is about…", ["10", "60", "600"], 2),
         hint="Capacity = width × 1.3. You need at least 4 per s.", explain="A queue grows at arrivals minus capacity. Capacity is width times specific flow, so width is the design lever.",
         solution=dict(w=3.1)),
    dict(title="Clear 2,000 people in 8 minutes", level="Challenge", icon="timer", model="bottleneck", metric="clr", metricLabel="Clearance time", unit=" min", digits=1, view="bars",
         fixed=dict(lam=2, js=1.3, N=2000), controls=[S("w", "Door width (m)", 0.8, 5, 1.2, 0.1, digits=1)],
         op="<=", target=8, goal="2,000 people must leave through one door in <b>8 minutes or less</b>.",
         hint="Time = N ÷ (width × 1.3) seconds.", explain="2,000 ÷ (3.3 × 1.3) ≈ 466 s ≈ 7.8 min. This is the hydraulic method behind Green Guide calculations.",
         solution=dict(w=3.3)),
]
CH["1.5"] = [
    dict(title="Keep the ring moving", level="Core", icon="pulse", model="cfsm", metric="v", metricLabel="Speed", unit=" m/s", digits=2, view="bars",
         fixed=dict(T=1.0), controls=[S("N", "People on a 26 m ring", 5, 80, 60)],
         op=">=", target=0.5, goal="With a 1 s time gap, how many people can walk on a 26 m ring and still move at <b>0.5 m/s</b> or faster?",
         hint="Speed = (spacing − 0.3 m) ÷ time gap; spacing = 26 ÷ N.", explain="Each person keeps a time gap to the one in front; as the ring fills, spacing and speed fall together. Stop-and-go waves appear when spacing gets small.",
         solution=dict(N=32)),
]
CH["1.6"] = [
    dict(title="Use the unfamiliar exit", level="Core", icon="route", model="familiar", metric="t", metricLabel="Time to empty", unit=" min", digits=1, view="bars",
         fixed={}, controls=[S("f", "Share using the main entrance (%)", 30, 100, 90)],
         op="<=", target=3.8, goal="Most of 1,200 people head for the familiar main entrance. Find the share that empties the hall in <b>3.8 minutes or less</b>.",
         predict=P("People tend to leave by…", ["The nearest exit", "The way they came in", "Random exits"], 1),
         hint="Balance the two exits so they finish together.", explain="Familiarity drives exit choice. Signage and stewards that move people to the side exit balance the load.",
         solution=dict(f=50)),
]
CH["1.7"] = [
    dict(title="Calm the turbulence", level="Core", icon="siren", model="danger", metric="press", metricLabel="Crowd pressure", unit=" per s²", digits=3, view="gauge", gmin=0, gmax=0.06,
         fixed=dict(rho=6), controls=[S("sd", "Speed spread (m/s)", 0.02, 0.1, 0.09, 0.005, digits=3)],
         op="<=", target=0.02, goal="At 6 per m², how small must the irregular motion be to keep crowd pressure at <b>0.02 per s²</b> or below?",
         hint="Pressure = density × spread². √(0.02 ÷ 6) ≈ 0.058.", explain="Even at high density, orderly motion keeps pressure low; turbulence begins when movements become irregular.",
         solution=dict(sd=0.055)),
]
CH["1.8"] = [
    dict(title="Size the exits", level="Core", icon="ruler", model="egress", metric="t", metricLabel="Egress time", unit=" min", digits=1, view="bars",
         fixed=dict(N=12000, rate=82, T=8), controls=[S("W", "Total exit width (m)", 5, 40, 12, 0.5, digits=1)],
         op="<=", target=8, goal="12,000 spectators on level routes (82 per m per min). Choose total exit width for egress in <b>8 minutes or less</b>.",
         hint="Width = N ÷ (rate × 8).", explain="12,000 ÷ (82 × 8) ≈ 18.3 m. On stepped routes (66 per m per min) you would need about 22.7 m.",
         solution=dict(W=18.5)),
    dict(title="Stepped routes need more", level="Challenge", icon="stairs", model="egress", metric="t", metricLabel="Egress time", unit=" min", digits=1, view="bars",
         fixed=dict(N=12000, rate=66, T=8), controls=[S("W", "Total exit width (m)", 5, 40, 18.5, 0.5, digits=1)],
         op="<=", target=8, goal="The same stand now exits down stairs (66 per m per min). Widen the exits to meet <b>8 minutes</b>.",
         hint="12,000 ÷ (66 × 8).", explain="Stairs carry fewer people per metre, so the same crowd needs about a quarter more width.",
         solution=dict(W=23)),
]
# ------------------------------------------------------------------ Go 2
CH["2.1"] = [
    dict(title="Read the diagram", level="Warm-up", icon="ruler", model="fd", metric="v", metricLabel="Walking speed", unit=" m/s", digits=2, view="line",
         fixed={}, controls=[S("rho", "Density (per m²)", 0.2, 5.2, 1, 0.05, digits=2)],
         op="=", target=0.45, tol=0.02, goal="Your Voronoi measurement shows people walking at <b>0.45 m/s</b>. What density does Weidmann's curve predict?",
         hint="Look between 2.5 and 3 per m².", explain="Measured speeds and densities let you place a site on the fundamental diagram, or calibrate a new one.",
         solution=dict(rho=2.5)),
]
CH["2.2"] = [
    dict(title="Keep the forecourt queue short", level="Core", icon="waves", model="accum", metric="peak", metricLabel="Peak queue", unit=" people", digits=0, view="line",
         fixed=dict(arr=100, area=500), controls=[S("gate", "Gate capacity (people per min)", 20, 120, 40)],
         op="<=", target=1000, goal="Arrivals peak at 100 per minute. Choose a gate capacity that keeps the peak queue at <b>1,000 people</b> or fewer.",
         predict=P("If the gate capacity equals the peak arrival rate, the queue is…", ["Large", "Zero", "Negative"], 1),
         hint="The queue grows only while arrivals exceed capacity.", explain="A macroscopic queue model: waiting builds while demand exceeds capacity and drains afterwards.",
         solution=dict(gate=70)),
]
CH["2.3"] = [
    dict(title="A wider exit for the grid", level="Core", icon="grid4", model="bottleneck", metric="clr", metricLabel="Clearance time", unit=" min", digits=1, view="bars",
         fixed=dict(lam=1, js=1.3, N=600), controls=[S("w", "Exit width (m)", 0.4, 3, 0.6, 0.1, digits=1)],
         op="<=", target=4, goal="600 people leave through a single exit. A cellular automaton gives about 1.3 per m per s. Find the width for <b>4 minutes</b> or less.",
         hint="600 ÷ (w × 1.3) ≤ 240 s.", explain="Cell size (0.4 m) means CA exit widths come in steps of one cell; check the flow per metre against data.",
         solution=dict(w=2)),
]
CH["2.4"] = [
    dict(title="Slow down to get out faster", level="Challenge", icon="door", model="bottleneck", metric="clr", metricLabel="Clearance time", unit=" min", digits=1, view="bars",
         fixed=dict(lam=1, w=0.8, N=100), controls=[S("js", "Specific flow through the door (per m per s)", 0.6, 2, 0.8, 0.05, digits=2, hint="In the social force lab, pushing (high desired speed) lowered the flow")],
         op="<=", target=1.2, goal="In the social force lab, calm crowds kept a higher flow. Raise the specific flow until 100 people clear a 0.8 m door in <b>1.2 minutes</b>.",
         hint="100 ÷ (0.8 × js) ≤ 72 s.", explain="Faster-is-slower: pushing causes clogging that lowers the flow, so calm egress gives higher flow per metre.",
         solution=dict(js=1.75)),
]
CH["2.5"] = [
    dict(title="Tune the time gap", level="Core", icon="timer", model="cfsm", metric="j", metricLabel="Flow on the ring", unit=" per s", digits=2, view="bars",
         fixed=dict(N=30), controls=[S("T", "Time gap (s)", 0.3, 2, 1.5, 0.05, digits=2)],
         op=">=", target=1.3, goal="30 people on a 26 m ring. Choose the time gap (a collision-free speed model parameter) that gives a flow of <b>1.3 per s</b>.",
         hint="Smaller time gaps mean higher speeds at the same spacing.", explain="Every model has a few key parameters; in the collision-free speed model the time gap sets how closely people follow.",
         solution=dict(T=0.5)),
]
CH["2.6"] = [
    dict(title="Balance the exits", level="Core", icon="split", model="route", metric="T", metricLabel="Evacuation time", unit=" min", digits=1, view="bars",
         fixed={}, controls=[S("share", "Share sent to the far exit (%)", 0, 80, 0)],
         op="<=", target=5.0, goal="2,000 people choose between a near and a far exit. Send enough to the far one to finish in <b>5.0 minutes</b> or less.",
         predict=P("If everyone uses the nearest exit, evacuation is…", ["Fastest", "Slower than with a split", "Impossible"], 1),
         hint="Both exits should finish at about the same time.", explain="Shortest-path routing overloads the near exit; a system optimum uses both, even though some walk further.",
         solution=dict(share=45)),
]
CH["2.7"] = [
    dict(title="Find a safety margin", level="Core", icon="shield", model="rset", metric="margin", metricLabel="ASET − RSET", unit=" s", digits=0, view="bars",
         fixed=dict(det=60, warn=30, N=3000, aset=900), controls=[S("pre", "Pre-movement time (s)", 30, 600, 450, 10), S("wd", "Exit width (m)", 4, 20, 6, 0.5, digits=1)],
         op=">=", target=120, goal="Available safe egress time is 900 s. Reduce pre-movement and add exit width so that the margin is <b>at least 120 s</b>.",
         hint="RSET = detection + warning + pre-movement + movement.", explain="Pre-movement often dominates RSET; good warning and staff action can cut it more cheaply than building width.",
         solution=dict(pre=200, wd=6)),
]
CH["2.8"] = [
    dict(title="Fit the curve to data", level="Challenge", icon="sliders", model="calib", metric="rmse", metricLabel="RMSE", unit=" m/s", digits=3, view="line",
         fixed={}, controls=[S("v0", "Free speed v0 (m/s)", 0.8, 1.6, 1.34, 0.01, digits=2), S("g", "Shape γ", 0.8, 2.5, 1.9, 0.05, digits=2), S("rmax", "Jam density (per m²)", 4.5, 8, 5.4, 0.1, digits=1)],
         op="<=", target=0.06, goal="Weidmann's defaults do not fit this site. Adjust the parameters until the RMSE is <b>0.06 m/s</b> or less.",
         hint="Start with v0: this crowd walks slower than Weidmann's average.", explain="Calibration adjusts parameters to local data; then validate on data you did not use for fitting.",
         solution=dict(v0=1.1, g=1.4, rmax=7)),
]
# ------------------------------------------------------------------ Go 3
CH["3.1"] = [
    dict(title="State the question in numbers", level="Warm-up", icon="flag", model="egress", metric="t", metricLabel="Egress time", unit=" min", digits=1, view="bars",
         fixed=dict(N=40000, rate=82, T=8), controls=[S("W", "Total exit width (m)", 20, 100, 40, 1)],
         op="<=", target=8, goal="A study question: can a 40,000-seat stadium empty its stands in 8 minutes? Find the exit width that makes the answer <b>yes</b>.",
         hint="40,000 ÷ (82 × 8).", explain="A good study question names the outcome, the threshold and the conditions; then simple calculations set the scale before simulation.",
         solution=dict(W=61)),
]
CH["3.2"] = [
    dict(title="Spot the danger", level="Core", icon="siren", model="danger", metric="press", metricLabel="Crowd pressure", unit=" per s²", digits=3, view="gauge", gmin=0, gmax=0.06,
         fixed=dict(sd=0.06), controls=[S("rho", "Density (per m²)", 1, 9, 8, 0.1, digits=1)],
         op="<=", target=0.02, goal="Motion is irregular (spread 0.06 m/s). Bring density down until crowd pressure is <b>0.02 per s²</b> or below.",
         hint="0.02 ÷ 0.06² ≈ 5.5.", explain="In disasters such as Love Parade and Itaewon, density rose with nowhere to go; lowering density is the first line of defence.",
         solution=dict(rho=5.5)),
]
CH["3.3"] = [
    dict(title="Spread the groups", level="Core", icon="tent", model="tafweej", metric="q", metricLabel="Largest backlog", unit=" people", digits=0, view="bars",
         fixed=dict(N=600000), controls=[S("slots", "Number of time slots", 2, 18, 4), S("comp", "Schedule compliance (%)", 50, 100, 70)],
         op="<=", target=0, goal="600,000 pilgrims, ramp capacity 60,000 per hour. Choose slots and compliance so there is <b>no backlog</b>.",
         predict=P("Pilgrims who ignore their slot tend to go…", ["Spread evenly", "At the most favoured hours", "Not at all"], 1),
         hint="Non-compliant groups pile into the preferred hours.", explain="Scheduling (tafweej) only works with high compliance; the preferred hours fill up first.",
         solution=dict(slots=12, comp=100)),
]
CH["3.4"] = [
    dict(title="Count the crowd", level="Core", icon="camera", model="jacobs", metric="abserr", metricLabel="Error", unit=" %", digits=1, view="bars",
         fixed={}, controls=[S("d1", "Density, dense zone (12,000 m²)", 1, 5, 2, 0.05, digits=2), S("d2", "Density, middle zone (18,000 m²)", 0.5, 3, 1, 0.05, digits=2), S("d3", "Density, edge zone (30,000 m²)", 0.1, 1.5, 1, 0.05, digits=2)],
         op="<=", target=5, goal="Use Jacobs' method (area × density per zone). Sampled photos suggest about 3, 1.6 and 0.45 per m². Get the estimate within <b>5 %</b>.",
         hint="The edge zone is large, so its density matters most.", explain="Area × density by zone is quick and transparent; errors in the large low-density zone dominate.",
         solution=dict(d1=3.1, d2=1.6, d3=0.45)),
]
CH["3.5"] = [
    dict(title="Switch off the alert", level="Core", icon="radar", model="pressure", metric="p", metricLabel="Crowd pressure", unit=" per s²", digits=3, view="gauge", gmin=0, gmax=0.08,
         fixed=dict(rho=7), controls=[S("sd", "Irregular motion (m/s)", 0.02, 0.1, 0.08, 0.005, digits=3)],
         op="<=", target=0.02, goal="At 7 per m², how calm must movement be to stay under the <b>0.02 per s²</b> action level?",
         hint="√(0.02 ÷ 7) ≈ 0.053.", explain="Crowd pressure flags dense and irregular crowds. Calming measures such as stopping inflow reduce irregular motion.",
         solution=dict(sd=0.05)),
]
CH["3.6"] = [
    dict(title="Plan for the slow tail", level="Challenge", icon="gauge", model="sens", metric="p95", metricLabel="95th percentile", unit=" min", digits=1, view="bars",
         fixed=dict(pu=50, fu=20), controls=[S("w", "Exit width (m)", 6, 16, 8, 0.5, digits=1)],
         op="<=", target=6.7, goal="With uncertain pre-movement (± 50 %) and flow (± 20 %), find the exit width that keeps the <b>95th percentile</b> egress time at 6.7 minutes or less.",
         hint="Design for the 95th percentile, not the median.", explain="Uncertainty widens the spread; safety depends on the slow tail.",
         solution=dict(w=11)),
]
CH["3.7"] = [
    dict(title="Meter the plaza", level="Core", icon="cone", model="metering", metric="dens", metricLabel="Peak plaza density", unit=" per m²", digits=2, view="gauge", gmin=0, gmax=3,
         fixed={}, controls=[S("m", "Metering rate (per min)", 180, 400, 400, 10)],
         op="<=", target=1.5, goal="Arrivals peak at 320 per minute and the venue takes 180 per minute. Meter the gates so the plaza stays at <b>1.5 per m²</b> or below.",
         predict=P("Stricter metering makes the queue outside…", ["Shorter", "Longer", "Unchanged"], 1),
         hint="Lower rates keep the plaza emptier but grow the queue outside.", explain="Metering moves waiting to the approach; that space must be open and managed.",
         solution=dict(m=210)),
]
CH["3.8"] = [
    dict(title="Report a range", level="Core", icon="ruler", model="sens", metric="p95", metricLabel="95th percentile", unit=" min", digits=1, view="bars",
         fixed=dict(w=8, pu=50), controls=[S("fu", "Flow uncertainty (± %)", 0, 40, 40, 5)],
         op="<=", target=7.8, goal="Better data narrows uncertainty. How far must the uncertainty in specific flow shrink for the <b>95th percentile</b> to fall to 7.8 minutes?",
         hint="Flow uncertainty widens the tail more than pre-movement here.", explain="Reporting ranges shows decision makers where better data would change the answer.",
         solution=dict(fu=10)),
]
