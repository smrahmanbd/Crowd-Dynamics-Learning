"""Lab 2.2: first-order macroscopic model (LWR / cell transmission) of a corridor with a bottleneck.
Weidmann's fundamental diagram supplies demand (what a cell can send) and supply (what a cell can receive)."""
import numpy as np

v0, g, rmax = 1.34, 1.913, 5.4
def speed(r):
    r = np.clip(r, 1e-6, rmax)
    return v0 * (1 - np.exp(-g * (1 / r - 1 / rmax)))
rs = np.linspace(0.01, rmax - 0.01, 2000)
J = rs * speed(rs)
jmax, rcrit = J.max(), rs[J.argmax()]
def demand(r, w): return w * np.where(r <= rcrit, r * speed(r), jmax)
def supply(r, w): return w * np.where(r <= rcrit, jmax, r * speed(r))

L, dx, dt = 60, 1.0, 0.5                      # metres, cell size, time step (CFL: v0*dt <= dx)
n = int(L / dx)
w = np.ones(n); w[40:45] = 0.5                # bottleneck: half the width
rho = np.zeros(n)
inflow = 0.9                                   # per metre per second
for step in range(int(300 / dt)):
    f = np.zeros(n + 1)
    f[0] = min(inflow, supply(rho[0], w[0]))
    f[1:n] = np.minimum(demand(rho[:-1], w[:-1]), supply(rho[1:], w[1:]))
    f[n] = demand(rho[-1], w[-1])
    rho = np.maximum(0, rho + dt / dx * (f[:-1] - f[1:]) / w)
    if (step + 1) % 120 == 0:
        q = np.where(rho[:40] > rcrit)[0]
        print(f"t = {(step + 1) * dt:5.0f} s: queue tail at {q[0] if len(q) else '-'} m, outflow {f[n]:.2f} per s, max density {rho.max():.2f}")
print(f"capacity of the bottleneck: {0.5 * jmax:.2f} per s per metre of corridor width")
