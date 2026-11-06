"""Concept threads: the same idea met three times, once per go, each time deeper.
Each stop: (module id, what you learn at this depth, a recall question, its answer)."""

THREADS = [
    dict(id="density", name="Density", icon="grid4", sys="space", stops=[
        ("1.2", "Density is people per square metre; space per person is its inverse, graded by levels of service.", "What is level of service C in space per person?", "About 1.39 to 2.32 m² per person (Fruin)."),
        ("2.1", "Measure density properly: Voronoi cells give each person their own area, smooth in time and space.", "Why use Voronoi density rather than counting in a box?", "It gives a smooth, local value per person and avoids jumps when people cross the box edge."),
        ("3.4", "Estimate crowd size from density by zone (Jacobs' method) and from video counting, with uncertainty.", "How does Jacobs' method estimate a crowd's size?", "Split the area into zones, estimate density in each, multiply by area and add up.")]),
    dict(id="fd", name="The fundamental diagram", icon="gauge", sys="flow", stops=[
        ("1.3", "Speed falls as density rises; flow peaks near 1.75 per m² at about 1.2 per m per s.", "Where does Weidmann's flow peak?", "Near 1.75 per m², at about 1.22 per m per s."),
        ("2.8", "Calibrate the diagram to local data; it differs by culture, purpose and direction.", "Why calibrate the fundamental diagram locally?", "Speeds and capacities vary with culture, purpose, age and flow direction."),
        ("3.6", "Feed calibrated relations into simulations and vary them in sensitivity analysis.", "Which uncertain inputs did the sensitivity analysis vary?", "Pre-movement time and specific flow.")]),
    dict(id="bottleneck", name="Bottlenecks and capacity", icon="door", sys="flow", stops=[
        ("1.4", "Capacity = width × specific flow; queues grow at arrivals minus capacity.", "How fast does a queue grow?", "At the arrival rate minus the capacity."),
        ("2.4", "In the social force model, pushing clogs the door: faster is slower.", "What is faster-is-slower?", "When people push harder to get out, clogging lowers the flow and evacuation takes longer."),
        ("3.6", "JuPedSim reproduces bottleneck flows of about 1.1 per m per s for different gate widths.", "What flow per metre did the JuPedSim gate lab give?", "About 1.05 to 1.18 per m per s.")]),
    dict(id="pressure", name="Danger and crowd pressure", icon="siren", sys="risk", stops=[
        ("1.7", "Above about 5 to 6 per m², stop-and-go and turbulence can lead to falls and crushes.", "What is crowd turbulence?", "Irregular, wave-like mass movements in a very dense crowd that push people off their feet."),
        ("3.2", "Disasters (Hillsborough, Love Parade, Mina, Itaewon) show design, information and management failing together.", "What does DIM-ICE stand for?", "Design, Information, Management over Ingress, Circulation and Egress."),
        ("3.5", "Crowd pressure ρ·Var(V) maps feed watch and action levels in a control room.", "What is the formula for crowd pressure?", "Local density times the variance of local velocity.")]),
    dict(id="selforg", name="Self-organisation", icon="arrows", sys="people", stops=[
        ("1.5", "Lanes, stripes and oscillations form without anyone planning them.", "Name two self-organised crowd patterns.", "Lanes in counterflow, stripes at crossings, oscillations at narrow doors, stop-and-go waves."),
        ("2.4", "Social force: simple attraction and repulsion reproduce lanes and clogging.", "What forces act on a person in the social force model?", "A pull towards the goal and pushes from neighbours and walls."),
        ("3.7", "One-way systems use self-organisation: separating flows prevents head-on conflicts.", "Why use one-way systems at mass gatherings?", "They separate opposing flows, avoiding conflicts and lowering density at crossings.")]),
    dict(id="behaviour", name="People, not particles", icon="brain", sys="people", stops=[
        ("1.6", "Familiarity, groups and social identity shape what people do; panic is rare.", "Why is 'mass panic' a misleading idea?", "People usually behave reasonably and help each other; danger comes from density and design."),
        ("2.6", "Route and exit choice: shortest path, familiarity and information, and the system optimum.", "Why is everyone using the nearest exit not optimal?", "It overloads that exit; spreading people over exits ends sooner."),
        ("3.8", "Research combines pedestrian physics with social psychology.", "Which research front links norms and identity to crowd models?", "Combining pedestrian dynamics with social psychology (e.g. Sieben et al. 2017).")]),
    dict(id="models", name="Models and their scale", icon="cpu", sys="data", stops=[
        ("1.8", "Hand calculations (hydraulic method) give a first answer for exit widths.", "What does the hydraulic method assume?", "A fixed flow per metre of width, so time = people ÷ (rate × width)."),
        ("2.5", "Seven model families from hand calculations to cognitive heuristics, each for a scale.", "When would you use a macroscopic model?", "For a whole site or network where individual detail is not needed."),
        ("3.6", "Couple macro models for the site with micro models at hot spots.", "What is multi-scale coupling?", "Linking a fast macro model of the whole site with detailed micro models at critical spots.")]),
    dict(id="egress", name="Egress and safety margins", icon="timer", sys="manage", stops=[
        ("1.8", "The Green Guide sets flow rates (82 level, 66 stepped per m per min) and egress times.", "What flow rate does the Green Guide use for level routes?", "82 people per metre per minute."),
        ("2.7", "RSET = detection + warning + pre-movement + movement, compared with ASET.", "Which part of RSET is often largest?", "Pre-movement time."),
        ("3.6", "Report egress as a distribution; design for the 95th percentile.", "Why design for the 95th percentile?", "Safety depends on the slow tail, not the median.")]),
    dict(id="timing", name="Timing and arrivals", icon="clock", sys="manage", stops=[
        ("1.1", "Crowds build up when arrivals exceed what gates can process.", "What makes a crowd accumulate at a gate?", "Arrivals faster than the gate's capacity."),
        ("2.2", "Macroscopic queue models track waiting as arrivals and capacity change over time.", "When does the queue reach its peak?", "When arrivals fall back to capacity, at the end of the overload."),
        ("3.3", "Hajj scheduling (tafweej) spreads groups over time slots; compliance decides success.", "Why does compliance matter for tafweej?", "Non-compliant groups crowd into the preferred hours, recreating the peak.")]),
    dict(id="data", name="Data and validation", icon="camera", sys="data", stops=[
        ("1.2", "Counts and areas give density; cameras and counters are the raw data.", "What two things do you need to compute density?", "A count of people and the area they occupy."),
        ("2.8", "Calibrate on one data set, validate on another, and report errors.", "Why validate on data you did not use for calibration?", "To test whether the model predicts, not just fits."),
        ("3.5", "Live data feeds monitoring, forecasts and digital twins.", "What is a digital twin of a venue?", "A model kept continuously in step with live data from the site.")]),
    dict(id="interventions", name="Interventions", icon="cone", sys="manage", stops=[
        ("1.8", "Planning: space, routes, stewarding and information before the event.", "Name two parts of a crowd management plan.", "Capacity and space, routes and exits, stewarding, information, contingency plans."),
        ("2.7", "Evacuation models test interventions such as better warning and wider exits.", "Which intervention cuts RSET most cheaply?", "Shortening pre-movement through warning and staff action."),
        ("3.7", "Metering, holding areas and scheduling move risk as well as reduce it.", "What does metering a plaza do to the queue outside?", "It makes it longer: waiting moves upstream.")]),
]
