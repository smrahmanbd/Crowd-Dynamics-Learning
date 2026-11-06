"""Lab 2.5: the same evacuation three ways: a hydraulic hand calculation, a macroscopic estimate and the cellular automaton of lab 2.3."""
from m23_ca import evacuate

N, width, dist, v = 150, 0.8, 10.0, 1.3       # people, exit width (m), mean distance to exit (m), free speed (m/s)
js = 1.3                                      # specific flow through the exit (per m per s)
t_hyd = dist / v + N / (js * width)           # walk to the exit, then queue through it
print(f"hydraulic estimate: {t_hyd:.0f} s")
for q in [1.0, 0.3, 0.2]:
    steps = evacuate(N=N, kS=2.0, kD=0.5, exit_w=2, q_exit=q)   # 2 cells of 0.4 m = 0.8 m
    print(f"cellular automaton, exit probability {q}: {steps} steps = {steps * 0.3:.0f} s, "
          f"exit flow {N / (steps * 0.3) / width:.2f} per m per s")
print("Experiments: about 1.3 to 1.9 per m per s. The plain CA lets one person leave per exit cell every step;")
print("an exit probability (a crude stand-in for friction, Kirchner et al. 2003) brings it into the measured range.")
