# Qubit Studio — Lane C adversarial audit

*HackCMU 2026 research/planning only. No implementation, no prototype execution.*
*Inspected: official docs, API pages, arXiv HTML, GitHub source. Not executed.*

**Evidence labels used below:** `SOURCE` = inspected primary text. `INTERP` = this report’s reading. `UNVERIFIED` = not established here. `NEEDS TEST` = requires a post-start numerical run.

---

## A. Verdict: **CONDITIONAL**

Build only as an **educational constrained-decision instrument** for the Koch transmon trade-off (anharmonicity vs charge dispersion at a target frequency).

Do **not** build the current pitch as “which design remains useful when its parameters vary,” a manufacturing-robustness optimizer, or a research-grade engineering tool.

**Strongest reason:** the inverse problem “pick \(E_J,E_C\) to hit a frequency and anharmonicity” is already a library call, and independent \(E_J\)/\(E_C\) sampling is not a defensible yield model. The only nontrivial, honest one-day problem is making the **known** charge-dispersion vs anharmonicity Pareto inspectable, constraint-driven, and exportable.

If the team will not drop the manufacturing-robustness headline and will not treat a constraint-boundary solution as the correct answer, this is **NO-GO**.

---

## B. Recommended user problem and formulation

**User.** A student or instructor exploring a single transmon Hamiltonian. Not a fabrication engineer. Not a claim of researcher adoption.

**What they do before.** They already know they want a qubit near some \(f_{01}\) with enough anharmonicity to remain addressable, and they have heard that large \(E_J/E_C\) kills charge noise. They do not yet see those as one constrained family.

**What they do inside.** Set a frequency window and two competing requirements: a minimum \(|\alpha|\) and a maximum charge dispersion. Inspect energy levels. Search a bounded \((E_J,E_C)\) grid. See the feasible set and the Pareto front. Change a constraint and watch the selected point move or the set empty.

**Artifact they leave with.** A JSON/CSV comparison: model, units, \(n_\mathrm{cut}\), constraints, evaluated candidates, selection rule, and the statement that this is an effective-parameter model, not a layout.

### Formulation (one problem)

| Field | Contract |
|---|---|
| Model | Cooper-pair box / transmon Hamiltonian \(H=4E_C(\hat n-n_g)^2-E_J\cos\hat\varphi\) (`SOURCE`: Koch 2007 eq. 1; scqubits Transmon docs). |
| Decision variables | \(E_J\), \(E_C\) in scqubits default units (energy as **ordinary frequency**, default GHz). Optional display of \(r=E_J/E_C\). |
| Offset charge | Evaluate at \(n_g=0\) and \(n_g=0.5\) for dispersion; do not treat \(n_g\) as a free design variable unless the judge is exploring charge sensitivity. |
| Objective | **Maximize \(|\alpha|\)** among candidates that meet the constraints. \(\alpha \equiv E_{12}-E_{01}=(E_2-E_1)-(E_1-E_0)\). In the transmon regime this is negative; report the signed value and optimize \(\lvert\alpha\rvert\). |
| Constraints | (1) \(f_{01}=(E_1-E_0)\) inside a judge-set window. (2) \(\lvert\alpha\rvert \ge \alpha_\min\). (3) Charge dispersion \(\varepsilon_{01}=\lvert E_{01}(n_g=1/2)-E_{01}(n_g=0)\rvert \le \varepsilon_\max\). |
| Search | Bounded grid or coarse-to-fine over \((E_J,E_C)\). Re-evaluate the selected point independently. Fixed \(n_\mathrm{cut}\). No claim of global optimality outside the grid. |
| Uncertainty | **Offset charge \(n_g\)**, which Koch treats as the environmental parameter whose effect is exponentially suppressed. **Not** i.i.d. fabrication noise on \(E_J\) and \(E_C\). |
| Coherence | **Deferred.** |
| Useful output | Feasible set, Pareto of \(\lvert\alpha\rvert\) vs \(\varepsilon_{01}\), one selected point under an explicit rule, infeasible if the set is empty. |

**Why the trade-off is nontrivial (physics, not search):** Koch (2007, abstract and §§II.2–II.3) establishes that charge dispersion falls **exponentially** in \(\sqrt{E_J/E_C}\) while relative anharmonicity falls only as a **weak power law**. Absolute anharmonicity \(\alpha\simeq -E_C\) (`SOURCE`: Koch eq. 12). At roughly fixed \(f_{01}\approx \sqrt{8E_J E_C}-E_C\), raising \(r=E_J/E_C\) improves charge insensitivity and **reduces** \(\lvert\alpha\rvert\). That is a real two-metric conflict.

**Why it is still a boundary solution (`INTERP`):** maximizing \(\lvert\alpha\rvert\) subject to \(\varepsilon_{01}\le\varepsilon_\max\) at fixed frequency selects the **smallest** \(r\) that still meets the dispersion ceiling. That is scientifically the right answer (keep as much anharmonicity as charge noise allows). It is **not** an interior optimum and must be pitched as “the optimizer walks a known Pareto front,” not as a newly discovered robust design.

**Why a library makes this feasible:** scqubits already diagonalizes the transmon, plots dispersion vs parameters, and even inverts \((f_{01},\alpha)\to(E_J,E_C)\). The one-day work is the **decision UI and constraint loop**, not a new solver.

**Do not use this objective:** minimize \(\lvert f-f^\star\rvert\) subject to \(\lvert\alpha\rvert\ge\alpha_\min\). That is exactly `Transmon.find_EJ_EC` and Quantum Metal `Hcpb.params_from_spectrum`. Two variables, two spectral targets: unique point or empty. Search is unnecessary.

---

## C. Nearest alternatives (inspected)

### What already exists of the proposed loop

| Proposed step | Already exists | Source |
|---|---|---|
| Change \(E_J,E_C,n_g\); see energies | scqubits GUI (`scq.GUI()`), `Transmon.create()`, `plot_evals_vs_paramvals` | [scqubits GUI](https://scqubits.readthedocs.io/en/latest/guide/gui/ipynb/gui.html); [paper](https://arxiv.org/html/2107.08552) §2, Fig. 1 |
| Energy levels, transitions, anharmonicity of coupled systems | scqubits Explorer on a `ParameterSweep` | [Explorer docs](https://scqubits.readthedocs.io/en/latest/guide/explorer/ipynb/explorer.html); paper §6: bare spectra, wavefunctions, dressed spectrum, n-photon transitions |
| Charge dispersion vs a parameter | `plot_dispersion_vs_paramvals('ng', 'EJ', ...)` | [Basics](https://scqubits.readthedocs.io/en/v3.1_a/guide/ipynb/basics.html) |
| Invert \(f_{01}\) and \(\alpha\) to \(E_J,E_C\) | `Transmon.find_EJ_EC(E01, anharmonicity)` | [API](https://scqubits.readthedocs.io/en/v4.0/api-doc/_autosummary/scqubits.core.transmon.Transmon.html); source `transmon.py` (`minimize` on spectral error) |
| Same inverse in Metal | `Hcpb.params_from_spectrum(f01, anharm)`, `params_from_freq_fixEC` | [Hcpb API](https://qiskit-community.github.io/qiskit-metal/apidocs/qiskit_metal.analyses.Hcpb.html) |
| Geometry parametric compare | Metal tutorial 1.5: sweep pad width / CPW length, side-by-side render, PNG export | [1.5](https://qiskit-community.github.io/qiskit-metal/tut/1-Overview/1.5-Parametric-design---iterate-and-compare.html) |
| Geometry → \(f,\alpha\), charge dispersion, Purcell \(T_1\) | Metal LOM example reports `f_Q`, `EC`, `EJ`, `alpha`, `dispersion`, `T1` | [4.11](https://qiskit-community.github.io/qiskit-metal/tut/4-Analysis/4.11-Analyze-and-tune-a-transmon.html) |
| Coherence vs parameter, with default noise amplitudes | `plot_coherence_vs_paramvals`, `t1_effective`, `t2_effective`; docs warn assumptions are the user’s | [Coherence](https://scqubits.readthedocs.io/en/v3.2/guide/noise/guide-noise.html); [visualization](https://scqubits.readthedocs.io/en/v4.1/guide/noise/ipynb/visualization.html) |
| Layout lookup from Hamiltonian targets | SQuADDS uses scqubits to get \(E_J\), then searches a pre-simulated geometry DB | [arXiv:2312.13483](https://arxiv.org/html/2312.13483v3) |
| Gradient opt of \(T_2\), frequency, anharmonicity | Qubit-Discovery + SQcircuit; dedicated transmon tutorial notebook | [repo](https://github.com/stanfordLINQS/Qubit-Discovery); [arXiv:2408.12704](https://arxiv.org/abs/2408.12704) |
| Geometry optimizer (HFSS + EPR + Metal) | QDesignOptimizer | [Optimizer 101](https://202Q-lab.github.io/QDesignOptimizer/optimizer.html) |

**Not found in inspected pages:** a browser instrument that treats **frequency window + \(|\alpha|_\min\) + \(\varepsilon_\max\)** as live constraints, shows the **feasible set / Pareto**, and exports a reproducible decision record. Absence from inspected pages is not proof it does not exist anywhere.

### Closest educational/research tools, not a catalog

- **scqubits GUI** is the closest *single-qubit* explorer. Jupyter widgets, energy plots vs one parameter. No constraint solver, no feasible-set, no decision export.
- **scqubits Explorer** is the closest *coupled-system* explorer. Precomputed sweep → interactive panels. Official examples are fluxonium–resonator and two transmons–resonator, not “optimize a lone transmon under constraints.”
- **Quantum Metal** is a *geometry* design-as-code stack. LOM already prints frequency, anharmonicity, **dispersion**, and a Purcell \(T_1\). Hcpb already inverts spectrum → \(E_J,E_C\). Tutorial 1.5 already does side-by-side parametric comparison of **layouts**, not Hamiltonian robustness.
- **SQuADDS / QDesignOptimizer / Qubit-Discovery** are the actual “find a design” tools. They operate on geometry, EM, or gradient circuit search. Out of one-day scope and not the right comparison if we stay on effective parameters.

---

## D. Judge-controlled live demo

**Must be live diagonalization + live search. Do not cache the judge’s answer.**

1. Open a documented example, labeled as a schematic / effective model. Recommended start (docs, not executed here): `Transmon(EJ=30.02, EC=1.2, ng=0.3, ncut=31)` ([Transmon page](https://scqubits.readthedocs.io/en/latest/guide/qubits/transmon.html)). Note the paper uses `EC=0.2`, `ncut=101` for a different example ([arXiv:2107.08552](https://arxiv.org/html/2107.08552)). Pick one and freeze it.
2. Judge moves one anchored control (\(E_J\) or \(E_C\)). Energy ladder, \(f_{01}\), signed \(\alpha\), and \(\varepsilon_{01}\) update from the backend.
3. Judge sets **frequency window** and **\(\alpha_\min\)** (or \(\varepsilon_\max\)).
4. Run a bounded search live. Show evaluated points, feasible (meet all three constraints) vs infeasible, and the selected point under the stated rule: *maximum \(\lvert\alpha\rvert\) among feasible grid points*.
5. Judge **tightens** \(\alpha_\min\) or the frequency window.
6. Export the comparison.

### Honest failure

| Outcome | What to show | What not to say |
|---|---|---|
| Empty feasible set | “No grid point meets these constraints.” Highlight which constraint is binding. Offer to relax it. | Silent constraint softening; “almost feasible.” |
| Selected point on a bound | “The best anharmonicity still allowed by the charge-dispersion (or frequency) ceiling.” Show the Pareto. | “We found a robust interior optimum.” |
| Same point wins every criterion | Show one point with multiple labels, not three fake winners. | Manufactured ranking reversal. |
| Search does not beat the starting example | Keep the baseline. “No improvement on this grid.” | A promised percent gain. |
| Backend down | Use a labeled previously computed run, or local stack. Never pass a recording off as the judge’s live query. | |

**Do not promise** a nominal-vs-robust ranking reversal. Koch’s trade-off does not require one, and `NEEDS TEST` whether any EJ/EC sampling even reorders candidates.

---

## E. Smallest meaningful differentiation

**Interface contribution, not a new scientific method.**

Worth one day, if executed:

1. **Direct manipulation** of an equivalent-circuit schematic with units, bounds, and linked outputs.
2. **Constraint-first decision:** feasible set and binding constraint, not a spectrum gallery.
3. **Pareto of \(\lvert\alpha\rvert\) vs \(\varepsilon_{01}\)** at a frequency window — Koch made visible.
4. **Reproducible export** of inputs, units, \(n_\mathrm{cut}\), constraints, selection rule.

That is smaller than a new optimizer and larger than CSS on `scq.GUI()`.

### What makes judges reasonably call this a reskin

- Sliders → energy levels → pretty schematic, no constraints.
- “Optimize” that only calls `find_EJ_EC` or walks \(E_C\) to a bound.
- Side-by-side plots that Metal 1.5 / Explorer already do.
- A “robustness” band from i.i.d. \(E_J,E_C\) noise labeled yield.
- Coherence numbers from scqubits defaults presented as device prediction.
- Schematic that looks like a chip photo / Metal layout while only \(E_J,E_C\) change.

---

## F. Three strongest reasons not to build the current version

1. **The headline robustness story is the wrong physics.** Leading-order \(f_{01}\approx\sqrt{8E_J E_C}-E_C\) is homogeneous in the energies. Independent *relative* errors in \(E_J\) and \(E_C\) give \(\delta f/f \approx \tfrac12(\delta E_J/E_J+\delta E_C/E_C)\) (`INTERP` from Koch eq. 11). Frequency fragility is then nearly **the same along the iso-frequency contour**. Charge-offset sensitivity is the quantity that actually changes exponentially (`SOURCE`: Koch §II.2). Mixing those two is the fastest way to a scientifically embarrassing demo. Confirming the near-invariance of \(\delta f/f\) is `NEEDS TEST`.

2. **The obvious optimization is already implemented.** `Transmon.find_EJ_EC` and `Hcpb.params_from_spectrum` solve “hit \(f_{01}\) and \(\alpha\).” A grid search that rediscovers that point is not an optimization-track contribution.

3. **Existing tools already cover explore / sweep / invert / even print dispersion.** scqubits GUI+Explorer, Metal LOM (`dispersion` in kHz plus \(\alpha\) and \(f_Q\)), SQuADDS, Qubit-Discovery. A browser reskin of the GUI loses originality and usefulness unless the **constraint/Pareto/export** loop is the product.

---

## G. Required pitch and scope changes

| Current design-doc language | Required change |
|---|---|
| “Which remains useful when its parameters vary” | “Which \((E_J,E_C)\) stay inside a frequency window with enough anharmonicity and little enough charge dispersion.” Variation means **offset charge**, named as such. |
| Nominal vs robust ranking reversal as the reveal | Drop. The reveal is: **tightening \(\alpha_\min\) or \(\varepsilon_\max\) moves or empties the feasible set.** |
| Optional coherence if “defensible” | **Defer.** scqubits uses literature default amplitudes (`A_ng=1e-4`, \(Q_\mathrm{cap}(\omega)\), \(T=15\,\mathrm{mK}\)) and tells the user to check assumptions ([noise.py](https://github.com/scqubits/scqubits/blob/main/scqubits/core/noise.py); [guide-noise](https://scqubits.readthedocs.io/en/v3.2/guide/noise/guide-noise.html)). |
| Sampled feasibility under parameter variation | Do not ship as a primary metric. If kept, label “user-specified \(E_J,E_C\) perturbation, not yield.” Prefer \(n_g\) sweep. |
| Research-lab / student+researcher audience equally | Primary: **education / demonstration.** Researcher exploration is a possible secondary use, not a need we have evidence for. |
| Schematic as the hero | Keep, but label **“equivalent-circuit schematic — not a layout, not EM.”** |
| Optimization track justification | “Constrained search on a documented trade-off, with a judge-moved constraint.” Not “AI finds a robust qubit.” |

---

## H. Forbidden claims

Already excluded by the brief, restated:

- New quantum physics; materials discovery; replacement for fabrication; experimental yield; photo-to-physics; lab adoption; cost savings.

Add:

- “Increasing \(E_J/E_C\) makes the device robust to parameter variation” (it suppresses **charge dispersion**; it does not generally suppress \(E_J\)/\(E_C\) error).
- “We discovered the anharmonicity–charge-noise trade-off” (Koch 2007).
- “Sample pass rate is manufacturing yield.”
- “Globally optimal” outside the evaluated grid.
- “Higher \(\lvert\alpha\rvert\) means better gates / higher fidelity.”
- Coherence, \(T_1\), \(T_2\) as a product promise without a named, justified noise model.
- “Geometry-optimized” or Metal-class layout analysis.
- “Existing tools cannot compute these spectra / invert \(E_J,E_C\) / plot dispersion.”
- Any improvement percentage or ranking reversal without a run.

---

## Real user task (task 3)

| Role | Credible in 24h? | Before / inside / artifact |
|---|---|---|
| Educational instrument for trade-offs | **Yes** | Course/notebook context → set constraints, see Pareto, export a worked example |
| Researcher model-exploration UI | **Maybe as a prototype**, not as a need | They can already do this in a notebook in minutes (`find_EJ_EC`, dispersion plots) |
| Research-grade engineering optimizer | **No** | Would need process statistics, geometry, EM, calibrated noise — none in scope |

---

## Optimization audit (task 2)

| Proposed piece | Audit |
|---|---|
| Frequency targeting | With \(E_J\) and \(E_C\) free, \(\min\lvert f-f^\star\rvert\) is underconstrained. The iso-frequency curve is one-dimensional. Adding \(\alpha\) as equality recovers `find_EJ_EC`. |
| Anharmonicity constraint | \(\alpha\simeq -E_C\) (`SOURCE`: Koch eq. 12). Maximizing \(\lvert\alpha\rvert\) **without** a dispersion/frequency constraint just **maximizes \(E_C\)** (search bound). |
| Parameter uncertainty on \(E_J,E_C\) | Independent relative noise does not obviously rank iso-frequency designs differently (`INTERP`; `NEEDS TEST`). Not fabrication variation (`SOURCE` gap: no process model). |
| Charge sensitivity | The real competing metric. Use \(\varepsilon_{01}\) from \(n_g=0\) vs \(1/2\), matching Koch eq. 4 and scqubits’ `ng` dispersion helper. |
| Coherence | scqubits will return numbers from **default** \(A_\lambda\), \(Q_\mathrm{cap}\), \(T\). Using them as an objective mostly pushes \(E_J/E_C\) up until \(\alpha\) binds. Unsupported as a device prediction. |
| Redundant constraints | \(\alpha\simeq -E_C\) and a lower bound on \(E_C\) are the same constraint. Do not add both. |
| Predetermined winner | Any scalar “robustness score” with hand-tuned weights. Any objective that is monotonic in \(r\). |

---

## Strongest objections

### Quantum-device researcher

- “Your \(E_J,E_C\) clouds are not my junction process.” **Fatal** to yield/fabrication claims; **fixable** by using \(n_g\) and labeling effective parameters.
- “The schematic looks like a device.” **Fixable** with labeling; **fatal** if the UI implies pad-drag = capacitance.
- “Tiny \(\varepsilon_{01}\) differences may be cutoff artifacts.” **Fixable** with \(n_\mathrm{cut}\) convergence on the demo point (`NEEDS TEST`); **fatal** if ignored when claiming charge-noise ranking.

### Optimization judge

- “This is `find_EJ_EC` plus charts.” **Fatal** if the demo is frequency targeting. **Fixable** if the demo is Pareto + judge-moved constraints + infeasible.
- “The optimum is on a bound.” **Not fatal** if that is the explanation. **Fatal** if sold as clever robust search.
- “Monte Carlo ≠ robust.” **Fatal** to guaranteed-robust language. **Fixable** by reporting evaluated samples / \(n_g\) endpoints only.

### Product/design judge

- “Who is this for?” Answer: learner/demo, not a lab. **Fatal** if pitched as unmet researcher demand (`UNVERIFIED`).
- “I cannot tell what ‘better’ means.” **Fixable:** lead with constraints and the binding one.
- “Looks like a quantum GUI skin.” **Fatal** without the decision/Pareto loop; that is the whole differentiator.

---

## Questions for other lanes

- **Lane A:** Freeze units (ordinary GHz vs Koch’s \(\omega/2\pi\)), signed \(\alpha\) definition, and one reference \((E_J,E_C,n_g,n_\mathrm{cut})\) with expected levels if sourced. Confirm \(\varepsilon_{01}\) definition vs Koch \(\epsilon_m\).
- **Lane B:** Confirm `find_EJ_EC` signature/return, `plot_dispersion_vs_paramvals` / `_compute_dispersion` for `ng`, headless scqubits on Mac, and that Explorer is **not** required. Do not wrap GUI/ipywidgets in the product path.
- **Reviewer:** If A+B cannot implement frequency + \(\alpha\) + \(\varepsilon_{01}\) from one scqubits `Transmon` object with a documented example, **stop** rather than invent metrics.

---

## Inspected vs executed

**Inspected:** scqubits GUI, Explorer, Transmon, units, coherence visualization, Transmon API/`find_EJ_EC` source; Groszkowski & Koch arXiv:2107.08552; Koch et al. arXiv:cond-mat/0703002v2; Quantum Metal 1.5, 4.11, Hcpb API; SQuADDS paper; Qubit-Discovery README; QDesignOptimizer Optimizer 101; scqubits `noise.py` defaults via search snippet (full file not fully walked).

**Not executed:** no `import scqubits`, no diagonalization, no timing, no grid, no confirmation that relative \(E_J,E_C\) noise is ranking-invariant.

---

## Appendix — additional evidence

### A1. Units and \(\alpha\) (decision-critical)

- scqubits: energies are **frequencies, not angular frequencies**; default GHz (`SOURCE`: [units](https://scqubits.readthedocs.io/en/v4.1/guide/settings/guide-units.html); paper §2.4). Coherence times then in ns when units are GHz.
- Koch \(\alpha \equiv E_{12}-E_{01}\), \(\alpha_r=\alpha/E_{01}\); asymptotic \(\alpha\simeq -E_C\), \(\alpha_r\simeq -(8E_J/E_C)^{-1/2}\) (eqs. 10, 12).
- scqubits `find_EJ_EC`: anharmonicity = `(E2-E1)-(E1-E0)` (`SOURCE`: API + source).
- Metal `Hcpb.anharm()`: `E12-E01`. LOM prints `alpha -374.55 MHz` (signed).
- Koch plasma frequency is \(\omega_p=\sqrt{8E_C E_J}/\hbar\) (angular). Do not feed Koch \(\omega\) into scqubits as if it were \(f\).

### A2. Koch numbers (for intuition, not demo promises)

- Typical transmon \(E_J/E_C\) “several tens up to several hundreds”; WKB dispersion formula good for lowest two levels when \(E_J/E_C\ge 20\) (Koch §II.2).
- Example in Koch §II.3: \(\omega_{01}/2\pi\approx 10\,\mathrm{GHz}\), \(E_J/E_C=100\) → absolute anharmonicity \(260\,\mathrm{MHz}\) (different paper section / later review; treat as Koch-regime illustration, check the exact paragraph before quoting in the demo).
- Fig. 5c: pulse duration vs charge-noise \(T_2\) as function of \(E_J/E_C\) — the pedagogical plot this product should make interactive.

### A3. scqubits coherence defaults (`SOURCE` snippets)

From `scqubits/core/noise.py`: `A_flux=1e-6` (Φ0), `A_ng=1e-4` (e), `A_cc=1e-7`, `T` default 0.015 K in t1 methods, \(Q_\mathrm{cap}(\omega)=10^6(2\pi\cdot 6\,\mathrm{GHz}/|\omega|)^{0.7}\). Paper: “sensible default values … based on the literature.” Guide: “It is up to the user to ensure the assumptions are consistent.”

Metal LOM `T1` in tutorial 4.11 is **Purcell / bus coupling**, not a full decoherence model.

### A4. Why frequency-targeting search is unnecessary

`find_EJ_EC` (source): start `[EJ, EC] = [10, 0.1]`, `scipy.optimize.minimize` on \((E_{01}-E_{01}^\star)^2+(\alpha-\alpha^\star)^2\). That **is** the optimization. Reimplementing it as a hackathon grid is a reskin of a library helper.

### A5. Explorer overlap (do not overclaim panels)

Official Explorer page: interactive multi-panel display from a stored `ParameterSweep`. Paper Fig. 6 lists bare spectra, wavefunctions, dressed spectrum, n-photon transitions (and further panels in the figure). Third-party DeepWiki lists `display_anharmonicity`; **not treated as primary** here. Even without that name, Explorer is an interactive spectral dashboard. Constraint optimization is not documented there.

### A6. Numerical tests to run after 9 PM (not done)

1. Reproduce docs `Transmon(EJ=30.02, EC=1.2, ng=0.3, ncut=31)` eigenvalues; repeat at `ncut=41` and `51`.
2. Compute \(f_{01}\), \(\alpha\), \(\varepsilon_{01}\) on an iso-frequency slice; plot \(\lvert\alpha\rvert\) vs \(\varepsilon_{01}\). Confirm a visible knee, not a numerical mess.
3. Perturb \(E_J,E_C\) by the same relative \(\sigma\) along that slice; test whether frequency-window pass rates actually differ (`NEEDS TEST` for the discarded robustness headline).
4. Time a ~30×30 grid of 3-level diagonalizations on the demo Mac.
5. Tighten \(\alpha_\min\) until the feasible set is empty; save that constraint pair as the judge’s “failure” move.

If test 2 fails (no visible trade-off in the allowed window), **NO-GO** the quantum idea rather than invent a robustness story.

### A7. Hermes second opinion (not evidence)

Hermes independently recommended **CONDITIONAL**, warned that robustness may collapse to a monotonic \(E_J/E_C\) bound, and listed reskin criteria consistent with this audit. Agreement among assistants is **not** a source. Primary-source inspection above is the basis of the verdict.

### A8. Follow-up workflow cross-check (partial; not a second verdict)

A later bounded research run (`docs` workflow scratch `report.md`, status **Partial**) agreed on the core facts: `(f_{01},\alpha)\to(E_J,E_C)` is inversion; charge sensitivity is the 1-D Koch ratio; wrapping Explorer/Metal sweeps is a reskin. It does **not** change CONDITIONAL.

Additional tools it surfaced (inspect if pitching “nobody does constrained search”):

- **Qubit-Discovery** README/arXiv:2408.12704: gradient optimization of transmon frequency, anharmonicity, charge sensitivity, and **sampled fabrication-error sensitivity** (hinge losses). The transmon notebook was **not** read cell-by-cell. This is closer prior art to a robustness optimizer than scqubits GUI is. Strengthens: do not claim sampled-variation comparison as new science.
- **QFit** (scqubits org): interactive fit of measured spectroscopy to a HilbertSpace. Different task (measurement → parameters), not our loop.
- **CircuitQ / pyEPR**: analysis of frequency/anharmonicity (CircuitQ also sweeps offset charge). No inspected schematic-to-constraint product.
- **Papič et al.** arXiv:2309.17168: charge-parity switching and transmon parameter optimization in the literature, not a UI.

Judging-rubric caution: 2026 Devpost names technological complexity; the “vs ChatGPT wrapper” phrasing is from 2025 / the team’s photographed slide (`idea-research.md`), not independently confirmed as 2026 weights.

The workflow also noted SQuADDS: for \(E_J/E_C\lesssim 50\), \(\alpha\) can differ from \(-E_C\) by as much as ~10%, so use numerical \(\alpha\) from diagonalization, not the asymptotic formula, in the app. That is already implied by using scqubits.
