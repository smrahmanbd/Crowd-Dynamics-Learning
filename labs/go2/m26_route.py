"""Lab 2.6: exit choice. Nearest-exit, shortest-time (user optimum) and system optimum splits between two exits."""
N, dA, dB, cA, cB, v = 2000, 30.0, 90.0, 4.0, 4.0, 1.2      # people, distances (m), capacities (per s), speed (m/s)

def finish(share_b):
    b = N * share_b; a = N - b
    return max(a / cA + dA / v, b / cB + dB / v if b else 0)

print(f"all to the nearest exit: {finish(0) / 60:.1f} min")
best = min((finish(s / 100), s) for s in range(101))
print(f"best split: {best[1]}% to the far exit, everyone out after {best[0] / 60:.1f} min")
# a simple dynamic rule: each person picks the exit with the smaller expected time (walk + queue ahead of them)
qa = qb = 0
for i in range(N):
    ta, tb = dA / v + qa / cA, dB / v + qb / cB
    if ta <= tb: qa += 1
    else: qb += 1
print(f"people choosing by expected time: {qb / N:.0%} to the far exit -> {finish(qb / N) / 60:.1f} min")
