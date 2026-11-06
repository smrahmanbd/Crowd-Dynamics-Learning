"""Lab 3.3: schedule pilgrim groups into time slots to keep the hourly flow on a route below capacity (greedy, largest first)."""
import numpy as np

rng = np.random.default_rng(7)
groups = rng.integers(2000, 15000, 60)                  # people per group (toy numbers)
slots, cap = 12, 60000                                  # time slots (hours) and route capacity per hour
load = np.zeros(slots)
plan = {}
for g in np.argsort(-groups):                           # largest groups first
    k = int(np.argmin(load))                            # put it in the least-loaded slot
    load[k] += groups[g]; plan[g] = k
print("people per slot:", [int(x) for x in load])
print(f"peak {load.max():,.0f} per hour vs capacity {cap:,}: {'OK' if load.max() <= cap else 'over capacity'}")
# what if 20% of groups ignore their slot and come in the first slot?
late = rng.choice(60, 12, replace=False)
load2 = load.copy()
for g in late:
    load2[plan[g]] -= groups[g]; load2[0] += groups[g]
print(f"with 12 groups arriving in slot 0: peak {load2.max():,.0f} per hour ({'OK' if load2.max() <= cap else 'over capacity'})")
