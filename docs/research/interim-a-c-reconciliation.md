# Qubit Studio — Interim A/C Research Reconciliation

Status: interim synthesis, not final model approval. Lane B and Astra's demo follow-up remain pending. No numerical execution or application implementation occurred in this reconciliation.

## Inputs read in full

- `research/quantum/chatgpt-physics.md` — Astra physics report.
- `docs/research/lane-c-adversarial-audit.md` — Grok/adversarial report, including appendix A8.

The team's binding scope remains an explicitly simplified simulation. Internal model correctness matters; real-device accuracy, calibrated yield, and expert certification are not requirements.

## Current recommendation

Make the core experience **Explore → Set requirements → Find feasible designs → Compare**.

Provisional headline: "Explore a simulated qubit, set competing requirements, and see which designs satisfy them—and why others cannot."

Primary candidate objective: at a selected nominal frequency, retain as much negative-anharmonicity magnitude as possible while respecting a charge-dispersion ceiling and any declared requirement floor. Compute metrics through the model, not asymptotic illustrations.

Favor Astra's iso-frequency one-dimensional formulation as the initial candidate for implementation: a simpler inspectable search is not intrinsically worse than a two-dimensional grid. A frequency-window formulation differs from exact-frequency matching and should be a deliberate later choice, not silently mixed with it.

Treat electrical parameter stress testing as optional modeled exploration, not the headline or a prerequisite for success. Defer coherence, materials, and yield metrics in the proposed first contract unless later team decisions explicitly change scope.

## Findings independently checked against primary sources

1. scqubits Basics initializes `Transmon(EJ=30.0, EC=1.2, ng=0.3, ncut=31)`.
   Source: https://scqubits.readthedocs.io/en/latest/guide/basics/basics.html
2. The adjacent spectrum page prints the raw eigenvalue array beginning `[-21.82665096, -6.1637235, 8.0193175, ...]` and explicitly requires the user to check cutoff convergence.
   Source: https://scqubits.readthedocs.io/en/latest/guide/basics/basics-spectra.html
   These are published reference values, not our execution results. Use the paired Basics fixture; do not combine its expected array with the separate overview's `EJ=30.02` input.
3. Pinned v4.3.1 source has `find_EJ_EC(E01, anharmonicity, ng=0, ncut=30)`. It minimizes the sum of squared errors for two target quantities using calculated eigenvalues. This supports the equality-target inversion claim.
   Source: https://raw.githubusercontent.com/scqubits/scqubits/v4.3.1/scqubits/core/transmon.py
4. Qubit-Discovery's README describes optimization of qubit metrics and a dedicated transmon notebook for T2, frequency, and anharmonicity. General quantum-circuit optimization is established prior art.
   Source: https://raw.githubusercontent.com/stanfordLINQS/Qubit-Discovery/main/README.md
   This reconciliation did not inspect its sampled-error implementation or notebook cell by cell. Do not elevate that narrower claim to personally verified evidence here.

## Corrections to overly strong audit conclusions

### No visual knee is not automatically NO-GO

A smooth monotonic Pareto curve can support a meaningful constrained choice. A knee depends on axis scaling and is not a mathematical requirement for optimization. The post-start gate should be: do calculations resolve a trade-off, do constraints meaningfully affect feasible choices, and can the user understand the consequence? A numerical mess or uninformative parameter window needs investigation; absence of a dramatic bend alone does not invalidate the project.

### Hypothetical stress tests are permitted by this product's scope

Grok correctly rejects sampled electrical noise as calibrated manufacturing yield. That does not prohibit a clearly labeled simulation experiment under assumed perturbations. Its priority should depend on whether it adds an understandable decision and fits implementation time, not whether the toy distribution matches a fab.

### Inequalities are not the same as two target equalities

The inspected inversion helper fits frequency AND anharmonicity targets. Minimizing frequency error with only an anharmonicity lower bound is not literally that same problem; it may instead be underdetermined. The recommended dispersion-constrained trade-off is more purposeful, but keep this mathematical distinction accurate.

### Prior art narrows novelty claims, not automatically project eligibility

Do not claim to invent qubit optimization or robustness analysis. The intended contribution is an accessible constraint-driven simulation interface. Existing functionality makes usefulness/differentiation an open product question; it does not by itself prove a hackathon prototype is worthless.

## Stable UI requirements to share with the design chat

- Keep the central equivalent-circuit schematic and anchored parameter editors.
- Couple controls to calculated energy levels and named outputs.
- Give target constraints direct manipulation, not only form inputs.
- Show feasible versus infeasible candidates and why a constraint fails.
- Show the selected point on the trade-off visualization, with baseline comparison.
- Do not lock the hero experience to lifetime decay, manufacturing yield, or a guaranteed baseline/robust ranking reversal.
- A physical-looking drawing does not imply geometry-to-physics conversion.

## Next action for Lane B

Confirm the minimal library path for frequency, signed anharmonicity, transition charge dispersion, and the proposed iso-frequency ratio sweep. Use the `EJ=30.0` Basics reference for the published spectrum regression. Distinguish numerical cutoff from returned level count. Specify the executable first test, latency measurement, and search-bound/constraint checks. Do not add a new framework or implement before permitted.

## Remaining questions

- Does the proposed demo range yield an understandable feasible trade-off? Requires execution.
- Can the library path run quickly enough for interactive evaluation and a bounded search? Requires execution.
- Can the UI make the constrained decision understandable to a nonexpert? Requires design/user testing.
- Does the team prefer exact target frequency or a frequency window? Proposed default: exact nominal frequency.

No final scientific settings, benchmark, successful simulation, or global-optimality claim is established by this memo.

## Astra demo follow-up received

Read in full and preserved unchanged at `research/quantum/chatgpt-demo-decision.md`; copy SHA-256 matches its original. No simulations were executed in the report.

The report supplies a useful concrete judge interaction: hold nominal frequency at a proposed 5 GHz, tighten a proposed charge-dispersion budget from 10 kHz to 1 kHz, and display the cost in retained anharmonicity or show infeasibility. All challenge settings and the size of the effect remain numerically untested.

Important framing: a candidate chosen under the tighter budget is solving a different requirement. This is a cost-of-requirement comparison, not proof that the new candidate is universally better or more robust.

Recommended minimum remains the nominal constrained trade-off first. Astra's 25 electrical stress scenarios are a second milestone, not a mandatory dependency of the first demo. Its proposed editorial effect-size threshold is not an acceptance requirement until actual outputs and presentation have been reviewed.

Strong UI implications:
- Frequency lock visibly links EJ and EC controls; do not present them as independently adjustable while promising to hold frequency fixed.
- A movable charge-dispersion limit on the trade-off plot can change feasible choices and the selected design.
- An energy ladder with annotated transition-spacing difference explains the cost.
- An offset-charge response curve is static parameter dependence, not time evolution or a noise waveform.
- Preserve baseline parameters; explicitly reevaluate baseline feasibility under the new requirement and distinguish that from its original acceptance state.

Research status: Astra's broad and demo passes are now sufficient for this stage. Await Lane B, then freeze the minimal contract and execute the reference/sweep tests only when permitted. More general physics research is not the next action.
