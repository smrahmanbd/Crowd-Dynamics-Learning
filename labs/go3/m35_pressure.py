"""Lab 3.5: crowd pressure P = rho * Var(V) on a grid of 1 m2 cells from a synthetic velocity field, with alert levels."""
import numpy as np

rng = np.random.default_rng(4)
nx, ny, frames = 20, 12, 50
X, Y = np.meshgrid(np.arange(nx), np.arange(ny), indexing="ij")
hot = np.exp(-(((X - 14) / 4) ** 2 + ((Y - 6) / 3) ** 2))        # a dense zone near a bottleneck
rho = 1 + 6 * hot                                                # people per m2
sd = 0.01 + 0.09 * hot                                           # irregular motion grows with density
v = 0.5 * (1 - hot)[..., None] + sd[..., None] * rng.standard_normal((nx, ny, frames))
P = rho * v.var(axis=2)                                          # variance over time in each cell
warn, act = 0.01, 0.02
print(f"max pressure {P.max():.3f} per s2 in cell {np.unravel_index(P.argmax(), P.shape)}")
print(f"cells above warning ({warn}): {(P > warn).sum()}, above action ({act}): {(P > act).sum()} of {P.size}")
print("alert:", "ACT" if (P > act).any() else "WATCH" if (P > warn).any() else "normal")
