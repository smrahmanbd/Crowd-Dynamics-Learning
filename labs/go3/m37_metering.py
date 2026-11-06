"""Lab 3.7: gate metering in front of an enclosed plaza, with random arrivals. Sweep the metering rate."""
import numpy as np

def run(meter, area=1200, out_cap=180, seed=0):
    rng = np.random.default_rng(seed)
    outside = plaza = 0.0; peak_d = peak_q = 0.0
    for t in range(150):                                     # minutes
        outside += rng.poisson(320 * np.exp(-((t - 40) / 22) ** 2))
        inn = min(outside, meter); outside -= inn; plaza += inn
        plaza -= min(plaza, out_cap)
        peak_d = max(peak_d, plaza / area); peak_q = max(peak_q, outside)
    return peak_d, peak_q

for meter in [400, 300, 250, 200, 180]:
    d = [run(meter, seed=s) for s in range(20)]
    pd, pq = np.mean([x[0] for x in d]), np.mean([x[1] for x in d])
    print(f"metering {meter}/min: plaza peak {pd:.2f} per m2, queue outside {pq:,.0f}")
