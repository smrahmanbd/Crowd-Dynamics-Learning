"""Lab 3.4: crowd size from zone areas and densities (Jacobs' method), with uncertainty by Monte Carlo."""
import numpy as np

zones = {"dense": (12000, 3.0, 0.5), "medium": (18000, 1.6, 0.3), "light": (30000, 0.5, 0.15)}   # area m2, density mean, sd
rng = np.random.default_rng(1)
N = 20000
total = np.zeros(N)
for name, (A, mu, sd) in zones.items():
    total += A * np.clip(rng.normal(mu, sd, N), 0, None)
print(f"point estimate: {sum(A * mu for A, mu, _ in zones.values()):,.0f} people")
lo, mid, hi = np.percentile(total, [5, 50, 95])
print(f"90% interval: {lo:,.0f} to {hi:,.0f} (median {mid:,.0f})")
print("largest share of the uncertainty comes from the zone with the largest area x sd:",
      max(zones, key=lambda z: zones[z][0] * zones[z][2]))
