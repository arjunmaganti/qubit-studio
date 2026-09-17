# Test-only findings: nominal transmon interaction

## Scope

Executed only the numerical experiment and numerical tests. No API imports or HTTP tests, no server, no frontend edits, no production-code changes, no deployment. Existing `engine.py` was used without modification as the calculation under test. The previously created `api.py` remains untouched and unverified. Nothing here certifies a website or production backend.

Command: `simulation/.venv/bin/python -m pytest -q simulation/test_numeric_only.py` (or run from simulation with local paths).

Result: **7 passed**, one scqubits SyntaxWarning in the unrelated zeropi module. The initial test process took 38.63 seconds, including startup/import overhead; that is not the per-interaction latency.

Evidence: `numerical-evidence.json` and `nominal-tradeoff.png` in this directory. These are executed-test artifacts, not fabricated frontend fixtures.

## What works inside the selected model

At nominal 5 GHz, with at least 200 MHz anharmonicity magnitude, a 401-ratio search produced:

| Dispersion requirement | Selected dispersion | Retained transition-spacing difference | Feasible candidates |
|---|---:|---:|---:|
| at most 10 kHz | 9.9920 kHz | 302.4154 MHz | 203 / 401 |
| at most 1 kHz | 0.96225 kHz | 261.6013 MHz | 149 / 401 |

Tightening the charge-dispersion requirement reduced retained transition-spacing difference by **40.8141 MHz**, approximately **13.496%**. Both selected candidates satisfied the same target nominal frequency and minimum anharmonicity.

This supports a visible cost-of-requirements interaction. It does not establish better gates, a real-device improvement, or manufacturing robustness.

Requesting at least **300 MHz** while keeping the **1 kHz** dispersion ceiling yielded **no feasible candidate in the evaluated grid**. That is a useful real failure state rather than a forced successful redesign.

## Numerical checks

- Published reference fixture reproduced; largest discrepancy from the rounded published levels: about 3.57e-9 GHz.
- Independently assembled dense Hamiltonian matched scqubits for three tested configurations.
- Every candidate in the nominal search retained the selected target frequency within the test tolerance.
- Selected candidates maximized the declared objective among eligible evaluated points.
- Tightening the constraint produced a nested feasible subset on the same grid.
- Finalists checked at charge cutoffs 30, 40, and 50. Largest observed changes in reported frequency, alpha, and dispersion were below 0.001 Hz. These are observed numerical differences, not a rigorous global error bound.
- Explicit 101-point offset-charge sweeps agreed with the endpoint dispersion calculation for the tested finalists.
- Invalid/non-finite/out-of-bounds numerical requests were rejected.

A denser **non-nested** 1001-point grid changed the selected anharmonicity by -0.1868 MHz (10 kHz limit) and +0.3695 MHz (1 kHz limit). The coarse and dense grids do not contain exactly the same candidates, so a slightly worse maximum on the denser grid is possible. The substantive trade-off persisted. Do not claim continuous/global optimality or a fully refined final solution.

## Measured local calculation latency

Five repeated calculations after import/warm-up, on this arm64 macOS environment:

- 401-candidate search: median **129.33 ms**, observed roughly 128–131 ms.
- Device evaluation including a 101-point charge-response curve: median **7.91 ms**, observed roughly 7.57–7.97 ms.

These measurements exclude frontend rendering, browser/network latency, server concurrency, and deployment cold starts. They support the plausibility of responsive interaction but do not establish a production SLA or end-to-end latency.

Versions recorded by the experiment: Python 3.12.13, scqubits 4.3.1, NumPy 2.2.6, SciPy 1.13.1.

## Product interpretation

The proposed interaction has actual model substance: stricter charge sensitivity reduces retained transition-spacing difference and narrows feasible choices. A movable constraint boundary can show that consequence. The search itself remains a simple one-dimensional constrained choice, not a novel optimization algorithm.

This test supports continuing product/design discussion with measured behavior. It does not settle whether the broader site is sufficiently useful, ambitious, or understandable, and does not authorize or begin additional product development.

Not tested: electrical stress scenarios, probability/yield, lifetime/coherence, real-device accuracy, full-range mathematical certification, hosted performance, UI comprehension, or actual frontend/backend integration.
