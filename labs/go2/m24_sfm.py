"""Lab 2.4: social force model (Helbing and Molnar 1995; Helbing, Farkas and Vicsek 2000), a room with one door.
Explore 'faster is slower': raise the desired speed v0 and watch the evacuation time."""
import numpy as np

def run(v0=1.2, N=60, door=1.0, A=2000.0, B=0.08, k=1.2e5, kap=2.4e5, m=80.0, tau=0.5, dt=0.005, T=120, seed=2):
    rng = np.random.default_rng(seed)
    W, H = 12.0, 8.0
    pos = []
    while len(pos) < N:
        p = rng.uniform([0.5, 0.5], [8, H - 0.5])
        if all(np.hypot(*(p - q)) > 0.55 for q in pos): pos.append(p)
    x = np.array(pos); v = np.zeros_like(x); r = rng.uniform(0.25, 0.30, N); out = np.zeros(N, bool); t_out = []
    y0, y1 = H / 2 - door / 2, H / 2 + door / 2
    for step in range(int(T / dt)):
        idx = np.where(~out)[0]
        if len(idx) == 0: break
        X, V, R = x[idx], v[idx], r[idx]
        gy = np.clip(X[:, 1], y0 + 0.25, y1 - 0.25)
        goal = np.where((X[:, 0] < W - 0.3)[:, None], np.c_[np.full(len(idx), W), gy], np.c_[np.full(len(idx), W + 3), np.full(len(idx), H / 2)])
        e = goal - X; e /= np.linalg.norm(e, axis=1, keepdims=True)
        F = m * (v0 * e - V) / tau
        d = X[:, None, :] - X[None, :, :]; dist = np.linalg.norm(d, axis=2) + np.eye(len(idx))
        n_ = d / dist[..., None]; rr = R[:, None] + R[None, :]; g = np.clip(rr - dist, 0, None)
        rep = (A * np.exp((rr - dist) / B) + k * g) * (1 - np.eye(len(idx)))
        tvec = np.stack([-n_[..., 1], n_[..., 0]], -1); dvt = ((V[None, :, :] - V[:, None, :]) * tvec).sum(-1)
        F += (rep[..., None] * n_).sum(1) + ((kap * g * dvt)[..., None] * tvec).sum(1)
        for wy in (0.0, H):                                   # top and bottom walls
            dd = np.abs(X[:, 1] - wy); nn = np.sign(X[:, 1] - wy)[:, None] * np.array([0, 1])
            F += ((A * np.exp((R - dd) / B) + k * np.clip(R - dd, 0, None))[:, None]) * nn
        inwall = (np.abs(X[:, 0] - W) < 1) & ((X[:, 1] < y0) | (X[:, 1] > y1))   # wall with the door gap
        dd = np.abs(X[:, 0] - W); F[:, 0] += np.where(inwall, -(A * np.exp((R - dd) / B) + k * np.clip(R - dd, 0, None)), 0)
        V = V + F / m * dt; s = np.linalg.norm(V, axis=1, keepdims=True); V = np.where(s > 1.3 * v0 + 0.2, V / s * (1.3 * v0 + 0.2), V)
        x[idx] = X + V * dt; v[idx] = V
        left = idx[x[idx, 0] > W + 0.3]; out[left] = True; t_out += [step * dt] * len(left)
    return (max(t_out) if out.all() else None), len(t_out)

if __name__ == "__main__":
    # 100 people, 0.8 m door: with these settings 6 m/s is slower than 4 m/s ("faster is slower"). Takes a few minutes.
    for v0 in [1.0, 2.0, 4.0, 6.0]:
        T, n = run(v0=v0, N=100, door=0.8, T=200)
        print(f"v0 = {v0} m/s: {n} out, last after {T if T else '>200'} s")
