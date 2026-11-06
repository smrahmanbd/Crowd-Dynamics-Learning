# Crowd Dynamics in three goes

An open, interactive course on crowd dynamics and the safety of mass gatherings, built the same way as [GCAM-Learning](https://github.com/smrahmanbd/GCAM-Learning): you go through the whole subject three times, each time in more depth.

| Go | Level | Modules | Focus |
|---|---|---|---|
| 1 · Foundations | Introductory | 8 | Density, speed and flow; bottlenecks; self-organisation; behaviour; danger; planning |
| 2 · Build and Implement | Intermediate | 8 | Measurement, macroscopic, cellular-automaton and social-force models, route choice, evacuation (RSET/ASET), calibration |
| 3 · Research Frontier | Advanced | 8 | Mass gatherings: the Hajj, stadiums and festivals; disaster lessons; sensing; monitoring; simulation with JuPedSim; interventions; open questions |

Each module page has:
- spoken narration in English and Arabic
- an interactive diagram with a guided tour
- an explorer widget and simulation challenges
- Python you can run in the browser (Pyodide)
- a zooming mind map, a memory-palace stop and a quiz

The site also includes:
- go-level mind maps
- a question bank with spaced repetition
- a concept spiral of 11 threads
- a model atlas of 7 crowd-model families, each with an animation, a simulator and a mind map
- a toolkit, a glossary of 114 terms, PDF handbooks and lab kits

## Build

```bash
cd content && python3 make.py && python3 validate.py m*.json && cd ..
python3 content/figs.py          # model-atlas animations
python3 content/handbooks.py     # handbooks, mind-map PDFs, lab kits (needs Playwright)
python3 build.py                 # static site
python3 -m http.server           # open http://localhost:8000
```

`.github/workflows/deploy.yml` publishes the site to GitHub Pages.

## Labs

`labs/go2` and `labs/go3` hold the scripts behind each module; each one prints the numbers quoted on its page. `m36_jupedsim.py` needs `pip install jupedsim`. All data are synthetic teaching data.

## Note

This course is for teaching. The simulators are teaching toys, not validated engineering tools. Crowd safety decisions need qualified professionals, site-specific data and current guidance, such as the Green Guide (SGSA) and HSE HSG154.
