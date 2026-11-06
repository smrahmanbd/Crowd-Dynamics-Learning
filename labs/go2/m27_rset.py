"""Lab 2.7: RSET by the hydraulic method, and its uncertainty by Monte Carlo sampling."""
import numpy as np

def rset(detect=60, warn=30, pre=120, people=1500, width=6.0, js=1.3, dist=60, speed=1.2):
    walk = dist / speed
    queue = people / (js * width)
    return detect + warn + pre + max(walk, queue)

print(f"deterministic RSET: {rset():.0f} s")
rng = np.random.default_rng(5)
samples = [rset(pre=rng.lognormal(np.log(120), 0.5), js=rng.uniform(1.0, 1.6), speed=rng.uniform(0.9, 1.4)) for _ in range(5000)]
p5, p50, p95 = np.percentile(samples, [5, 50, 95])
aset = 900
print(f"RSET 5th / 50th / 95th percentile: {p5:.0f} / {p50:.0f} / {p95:.0f} s; ASET {aset} s")
print(f"share of runs with RSET > ASET: {np.mean(np.array(samples) > aset):.1%}")
