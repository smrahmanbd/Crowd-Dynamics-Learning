"""Lab 3.2: risk exposure. Turn a density time series into person-minutes above thresholds, not just a peak value."""
import numpy as np

t = np.arange(0, 180)                                  # minutes
area = 600.0                                           # m2 of a ramp or alley
rho = 1.0 + 5.5 * np.exp(-((t - 95) / 18) ** 2)       # synthetic density curve (per m2)
for thr in [2, 4, 5, 6]:
    above = rho > thr
    exposure = (rho[above] * area).sum()               # people x minutes spent above the threshold
    print(f"above {thr} per m2: {above.sum():3d} min, exposure {exposure:,.0f} person-minutes")
print(f"peak density {rho.max():.1f} per m2 at minute {t[rho.argmax()]}")
