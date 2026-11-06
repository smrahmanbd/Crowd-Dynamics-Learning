"""Lab 2.3: floor-field cellular automaton (after Burstedde et al. 2001) for a room evacuation.
Cells are 0.4 m; one step is about 0.3 s. Change kS (static field) and kD (dynamic field)."""
import numpy as np

def evacuate(N=150, kS=2.0, kD=0.5, exit_w=2, nx=30, ny=20, seed=1, max_steps=3000, q_exit=1.0):
    """q_exit: probability that a person standing on an exit cell leaves in a step (1 = always)."""
    rng = np.random.default_rng(seed)
    e0 = ny // 2 - exit_w // 2
    exits = [(nx - 1, j) for j in range(e0, e0 + exit_w)]
    I, Jg = np.meshgrid(np.arange(nx), np.arange(ny), indexing="ij")
    S = np.min([np.hypot(ex - I, ey - Jg) for ex, ey in exits], axis=0)   # distance to the nearest exit cell
    D = np.zeros((nx, ny)); occ = np.zeros((nx, ny), bool)
    free = [(i, j) for i in range(nx - 4) for j in range(ny)]
    people = [free[k] for k in rng.choice(len(free), N, replace=False)]
    for i, j in people: occ[i, j] = True
    for t in range(1, max_steps):
        for idx in rng.permutation(len(people)):
            p = people[idx]
            if p is None: continue
            i, j = p
            if (i, j) in exits and rng.random() < q_exit:
                occ[i, j] = False; people[idx] = None; D[i, j] += 1; continue
            cand = [(i, j)] + [(i + a, j + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))
                               if 0 <= i + a < nx and 0 <= j + b < ny and not occ[i + a, j + b]]
            w = np.array([np.exp(-kS * S[u, v] + kD * min(D[u, v], 5)) for u, v in cand])
            u, v = cand[rng.choice(len(cand), p=w / w.sum())]
            if (u, v) != (i, j):
                occ[i, j] = False; occ[u, v] = True; D[i, j] += 1; people[idx] = (u, v)
        D *= 0.8                                  # decay of the dynamic field
        if all(p is None for p in people):
            return t
    return None

if __name__ == "__main__":
    for kS in [0.5, 1, 2, 4]:
        steps = evacuate(kS=kS)
        print(f"kS = {kS}: {steps} steps = {steps * 0.3:.0f} s")
