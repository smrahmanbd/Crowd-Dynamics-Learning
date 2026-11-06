"""Lab 2.1: density, speed and flow from trajectories (classical and Voronoi-style density).
Synthetic trajectories of a one-way corridor; replace them with real data (for example from the Juelich archive, read with PedPy)."""
import numpy as np

rng = np.random.default_rng(3)
fps, T, n = 10, 60, 120                       # frames per second, seconds, people
start = rng.uniform(-40, 0, n)                # x start (m), corridor 0..4 m wide
y = rng.uniform(0.3, 3.7, n)
v = rng.normal(1.2, 0.15, n).clip(0.6, 1.8)   # free speeds
t = np.arange(0, T, 1 / fps)
X = start[None, :] + v[None, :] * t[:, None]   # positions: frames x people

# measurement area: 10 m <= x <= 14 m (4 m x 4 m = 16 m2)
inside = (X >= 10) & (X <= 14)
rho_classic = inside.sum(1) / 16.0
speed = np.where(inside, v[None, :], np.nan)
with np.errstate(all="ignore"):
    v_mean = np.array([np.nanmean(s) if np.isfinite(s).any() else np.nan for s in speed])
# flow across the line x = 12 m: count crossings
cross = ((X[:-1] < 12) & (X[1:] >= 12)).sum()
print(f"people crossing x = 12 m: {cross} in {T} s -> flow {cross / T:.2f} per s, {cross / T / 4:.2f} per m per s")
ok = ~np.isnan(v_mean)  # frames with someone inside
print(f"mean classical density {rho_classic.mean():.2f} per m2 (all frames), mean speed {np.nanmean(v_mean):.2f} m/s")
print(f"check J = rho * v: {np.nansum(rho_classic[ok] * v_mean[ok]) / len(rho_classic):.2f} per m per s")

# Voronoi-style density at one frame (grid approximation of each person's cell)
f = 300
P = np.c_[X[f], y]
gx, gy = np.meshgrid(np.arange(0, 30, 0.1) + 0.05, np.arange(0, 4, 0.1) + 0.05)
pts = np.c_[gx.ravel(), gy.ravel()]
owner = ((pts[:, None, :] - P[None, :, :]) ** 2).sum(2).argmin(1)
area = np.bincount(owner, minlength=n) * 0.01
ma = (pts[:, 0] >= 10) & (pts[:, 0] <= 14)
rho_vor = (1 / area[owner[ma]]).mean()
print(f"frame {f}: classical {rho_classic[f]:.2f} per m2, Voronoi {rho_vor:.2f} per m2")
