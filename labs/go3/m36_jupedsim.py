"""Lab 3.6: a gate scenario in JuPedSim (open source, https://www.jupedsim.org). pip install jupedsim
A 20 m x 10 m forecourt empties through a gate. Compare gate widths and repeat with several seeds:
report the mean and spread of the evacuation time, not one run."""
import statistics
import jupedsim as jps
from shapely import Polygon

def run(gate=1.2, n=150, seed=1, v0=1.2):
    y0, y1 = 5 - gate / 2, 5 + gate / 2
    area = Polygon([(0, 0), (20, 0), (20, y0), (22, y0), (22, y1), (20, y1), (20, 10), (0, 10)])
    sim = jps.Simulation(model=jps.CollisionFreeSpeedModel(), geometry=area)
    exit_id = sim.add_exit_stage([(21.5, y0), (22, y0), (22, y1), (21.5, y1)])
    jid = sim.add_journey(jps.JourneyDescription([exit_id]))
    start = Polygon([(0.5, 0.5), (15, 0.5), (15, 9.5), (0.5, 9.5)])
    for p in jps.distribute_by_number(polygon=start, number_of_agents=n, distance_to_agents=0.5, distance_to_polygon=0.3, seed=seed):
        sim.add_agent(jps.CollisionFreeSpeedModelAgentParameters(journey_id=jid, stage_id=exit_id, position=p, desired_speed=v0))
    while sim.agent_count() > 0 and sim.elapsed_time() < 600:
        sim.iterate()
    return sim.elapsed_time()

if __name__ == "__main__":
    for gate in [1.0, 1.6, 2.4]:
        times = [run(gate=gate, seed=s) for s in range(5)]
        print(f"gate {gate} m: evacuation {statistics.mean(times):.1f} s (min {min(times):.1f}, max {max(times):.1f}), "
              f"flow {150 / statistics.mean(times) / gate:.2f} per m per s")
