"""Lab 3.1: build a scenario design matrix for a mass-gathering study and count the runs it needs."""
from itertools import product

factors = {
    "demand": ["normal day", "peak day (+30%)"],
    "schedule": ["as planned", "20% of groups early"],
    "layout": ["current", "one-way ramp", "extra holding area"],
    "management": ["no metering", "gate metering"],
}
seeds = 10                                    # repeats per scenario for stochastic models
rows = list(product(*factors.values()))
print(f"{len(rows)} scenarios x {seeds} seeds = {len(rows) * seeds} runs")
for i, r in enumerate(rows[:6], 1):
    print(i, dict(zip(factors, r)))
print("... a one-factor-at-a-time design would need only", 1 + sum(len(v) - 1 for v in factors.values()), "scenarios, but misses interactions")
