"""Lab 2.8: calibrate Weidmann's speed-density relation to data by least squares (grid search, NumPy only)."""
import numpy as np

def speed(rho, v0, g, rmax):
    rho = np.asarray(rho)
    return np.where(rho >= rmax, 0, v0 * (1 - np.exp(-g * (1 / rho - 1 / rmax))))

rng = np.random.default_rng(11)
rho = rng.uniform(0.2, 5.7, 60)
data = np.clip(speed(rho, 1.1, 1.4, 7.0) + rng.normal(0, 0.06, rho.size), 0, None)   # 'measured' speeds
train, test = np.arange(60) < 40, np.arange(60) >= 40                              # keep 20 points for validation

best = (9, None)
for v0 in np.arange(0.8, 1.61, 0.02):
    for g in np.arange(0.5, 3.01, 0.05):
        for rmax in np.arange(5.0, 9.01, 0.1):
            e = np.sqrt(np.mean((speed(rho[train], v0, g, rmax) - data[train]) ** 2))
            if e < best[0]: best = (e, (v0, g, rmax))
e, (v0, g, rmax) = best
print(f"fitted v0 = {v0:.2f} m/s, gamma = {g:.2f}, rho_max = {rmax:.1f} per m2, training RMSE {e:.3f} m/s")
print(f"validation RMSE {np.sqrt(np.mean((speed(rho[test], v0, g, rmax) - data[test]) ** 2)):.3f} m/s")
print(f"Weidmann's default curve on the same data: RMSE {np.sqrt(np.mean((speed(rho, 1.34, 1.913, 5.4) - data) ** 2)):.3f} m/s")
