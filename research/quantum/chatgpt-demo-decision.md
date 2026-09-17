# Qubit Studio demo decision

This is a focused planning follow-up. No application, prototype, simulation, or numerical sweep was executed. **Proposed** means an illustrative product choice; **expected** means an analytical inference, not an observed result.

## A. Verdict

**Conditional GO as an interactive trade-off explorer; weak as a demonstration of a sophisticated optimizer.** At fixed frequency, the problem is one-dimensional. If the curve is monotonic and charge dispersion is the active constraint, selecting the optimum is essentially finding a threshold crossing. That is legitimate constrained optimization, but its value is explaining the consequence of a requirement—not making the search look difficult.

The scientific trade-off is established: the transmon regime suppresses charge sensitivity while sacrificing relative anharmonicity. At a fixed target frequency, this creates a choice between absolute anharmonicity and charge dispersion. The latter statement follows from the fixed-frequency scaling in the model contract. [Koch et al., §§II.B–C](https://arxiv.org/pdf/cond-mat/0703002)

A slider can show direction. The linked calculation can quantify what a tenfold tighter charge-dispersion budget costs, keep frequency fixed while coordinating two electrical parameters, identify the binding requirement, and show which declared variations break a candidate. Those are useful discoveries. If the first sweep offers only an imperceptible change or an arbitrary endpoint, the interface cannot supply missing substance.

## B. One concrete scenario

**Demo question:** “Keep the qubit at 5 GHz. How much separation between its first two transition frequencies can we retain when we require ten times less charge-induced frequency variation?”

All challenge numbers below are **proposed and numerically untested**.

| Element | Specific choice |
|---|---|
| Starting configuration | Source-backed scqubits default: `EJ=15`, `EC=0.3`, `ng=0`, `ncut=30`, with energies divided by h in GHz. This is an orientation preset, not a claim of a 5 GHz or feasible design. |
| Enter the challenge | Lock nominal `f01=5.000 GHz`. Keep the initial ratio 50 and calculate the corresponding electrical parameters using the contract's exact scaling. Those mapped values have not been calculated here. |
| User controls | Target frequency and constraint budgets; one independent design ratio when frequency is locked. Junction `EJ/h` and capacitance-associated `EC/h` controls remain linked. The environment panel declares stress settings. |
| Initial requirements | Full-offset-charge frequency range inside 4.900–5.100 GHz; charge dispersion at most 10 kHz; anharmonicity magnitude at `ng=0` at least 200 MHz. |
| Electrical stresses | The same 25 combinations of fractional critical-current changes ±2% and total-capacitance changes ±1% from the contract. These are deterministic hypothetical scenarios, not measured distributions. |
| Search | Nominal `EJ/h=5–35 GHz`, `EC/h=0.15–0.45 GHz`, ratio 20–120. Apply the contract's perturbed-domain checks without clipping samples to nominal sliders. |
| Objective | Maximize the smallest anharmonicity magnitude at `ng=0` across those scenarios, while all evaluated scenarios meet the requirements. |
| Baseline | Freeze the best verified candidate under the original 10 kHz budget. Retain its numerical results and scenario margins. |
| Exact judge intervention | Change **only** the charge-dispersion ceiling: **10 kHz → 1 kHz**. Keep frequency, minimum anharmonicity, stresses, and search domain fixed. |
| Comparison | Reassess the frozen candidate under the new requirement, then compare it with the newly selected candidate: electrical parameters, nominal and minimum-scenario anharmonicity, maximum-scenario dispersion, frequency envelope, and limiting scenario/constraint. |
| Useful result | A numerically resolved cost of the stricter requirement, or a clear demonstration that the requested combination is infeasible within the searched domain. |
| No improvement/change | If the old candidate already satisfies 1 kHz and remains best, show that; the tighter budget may be inactive. If differences are unresolved, report a tie at the tested resolution. |
| No feasible candidate | Keep the old candidate visible as failing the new request. Show the violated requirement; present possible requirement changes without silently applying them. |

The source default is inspectable in [`Transmon.default_params`](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/transmon.py). Baseline and new candidate intentionally answer different user requirements; call their difference a **cost of tightening the specification**, not a robustness improvement.

A nominal-versus-scenario comparison is secondary. If shown, solve both under the **same current budget** and compare them on the same stress set. A robust winner differing from the nominal winner is not required for the primary demo.

## C. Explanation and UI vocabulary

**One sentence:** “Qubit Studio helps you choose the electrical parameters of a simplified qubit model and see what you give up when you tighten its requirements.”

**Trade-off:** “The model has several energy levels. Its first two transitions respond to different frequencies. We want those frequencies sufficiently separated, while also limiting how much changing offset charge moves the first transition. At the same target frequency, improving one of those properties generally costs some of the other.”

**Why care:** “You can see whether your requirements fit together and what must change if they do not—before moving to a more detailed model.”

| Plain-language UI label | Exact scientific quantity |
|---|---|
| Target transition frequency | Nominal `f01=(E1−E0)/h`, GHz |
| Separation of the first two transition frequencies | Anharmonicity magnitude `A=−alpha`, MHz; expose signed `alpha=f12−f01` |
| Charge-induced frequency range | Transition charge dispersion `D01`, kHz |
| Junction energy | Josephson energy divided by h, `EJ/h`, GHz |
| Charging energy | `EC/h`, GHz; determined by effective total capacitance |
| Electrical stress assumptions | Declared variations in critical current and total capacitance |
| Smallest separation in tested scenarios | `min_s A_s` at `ng=0`, MHz |
| Passes tested scenarios | Every evaluated scenario meets the stated constraints; no yield claim |

Avoid “qubit quality,” “stability score,” and “gate accuracy.” Offset charge is difficult to compress into a familiar analogy without conflating distinct effects. Show its frequency curve and describe it as an environmental charge parameter; do not call the horizontal axis time or an experimentally sampled noise signal.

## D. Three linked visualizations

| View | Axes and units | What changes it | Decision and status |
|---|---|---|---|
| **Trade-off curve** | x: maximum-scenario `D01`, kHz, logarithmic; y: minimum-scenario `A` at `ng=0`, MHz | Target/stress changes reshape the calculated curve; tightening the budget moves a vertical limit; selecting a point updates the schematic | Shows the price of a requirement and eligible candidates. Calculated model quantities, with frequency/range failures marked ineligible. |
| **Transition-spacing diagram** | y: ground-relative `Em/h`, GHz; horizontal position is categorical, with no spatial or time meaning. Annotate arrows `f01` and `f12`, and their difference `alpha` | Selecting or moving a candidate updates levels and arrows | Explains what anharmonicity measures. Level positions are calculated; arrows are explanatory annotations. Use a spacing annotation/inset because the MHz difference is small on a GHz scale. |
| **Charge-response and stress envelope** | x: offset charge `ng`, dimensionless Cooper-pair units, 0–1; y: `f01−f*`, MHz. Show nominal curve, evaluated scenario curves/envelope, and allowed frequency band | Candidate and stress changes update the curves; the frozen and new candidates can be compared | Reveals frequency-band failures and the scenario responsible. Calculated static responses, not time traces or probabilities. |

For view 3, use a clearly labeled **kHz-scale inset** showing `f01(ng)−f01(0)` for a selected scenario. This prevents a tiny charge ripple disappearing inside an MHz-scale electrical-stress envelope. Subtracting a reference for that inset must not conceal absolute frequency errors in the main plot.

The device schematic is an **illustrative circuit**, not a spatial simulation. Anchor junction energy to the junction, charging energy to the effective capacitance, and offset charge/stress assumptions to the environment. With target frequency locked, show that changing one electrical parameter derives the other; two independent controls would violate the one-dimensional contract. No quantum animation is needed.

## E. Minimal post-start execution gate

### A. Essential before trusting the first demo

1. **One source fixture and unit check.** Use `EJ=30.0`, `EC=1.2`, `ng=0.3`, `ncut=31`, GHz. The published first three eigenvalues are `−21.82665096`, `−6.16372350`, `8.01931750`. Match within proposed `10^-6 GHz`, compute positive transition gaps and negative signed alpha, and check GHz/MHz/kHz conversion. Do not substitute the different overview example's `30.02`. [Official inputs](https://scqubits.readthedocs.io/en/latest/guide/basics/basics.html#example-transmon), [published outputs](https://scqubits.readthedocs.io/en/latest/guide/basics/basics-spectra.html)
2. **One nominal design curve.** Apply exact frequency scaling across the proposed ratio domain. Verify the mapped frequency and identify feasible regions for both 10 and 1 kHz. Use the same offset-charge frequency-band condition for nominal and scenario problems.
3. **Converge the quantities that drive selection.** At candidate optima and relevant boundaries, compare `ncut=30` and 40. Proposed limits: changes in `f01` and alpha below 100 Hz; change in `D01` below `max(1 Hz, 1% of D01)`. Escalate to 50 only if needed. These tolerances are engineering gates, not error proofs.
4. **Independently check the charge shortcut.** Compare endpoint dispersion with an explicit 101-point `ng` sweep for those candidates. Increasing the library dispersion helper's `point_count` does not refine its Transmon special case. Check that the frequency envelope is consistent too. [Inspected implementation](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/transmon.py)
5. **Run the fixed 25-scenario comparison.** Derive `EJ'=EJ(1+delta_I)` and `EC'=EC/(1+delta_C)`. Select/recheck the finalists at both budgets using steps 3–4. Report margins, failures, and unresolved values; select with a numerical buffer rather than certifying a threshold equality beyond the available precision.

This gate needs no Monte Carlo, coherence calculation, full phase diagram, or experimental calibration. All timing remains unmeasured.

### B. Before stronger numerical claims

Refine the ratio search and charge sweeps, expand the numerical search bounds, and compare 5×5 with 9×9 stress grids for finalists. Check that the selected trade-off and active constraints persist. A grid comparison supports the evaluated result; it does not certify the continuous uncertainty region. Claiming sampled feasibility requires separately declared IID sampling and its uncertainty. None of this is necessary to label an initial result “best among these evaluated designs and scenarios.”

### C. Optional beyond the hackathon

Independent solver comparisons, rigorous continuum bounds, calibrated joint process distributions, geometry-to-parameter extraction, and noise/dynamics validation. They are separate scientific projects, not prerequisites for the simplified demo claim.

## F. First-sweep decisions and honest failure outcomes

**Biggest demo risk:** the simulation is internally correct but produces too little interpretable change to justify an optimization story. Missing experimental calibration is outside this scope; missing useful behavior inside the model is not.

| First executable finding | Decision |
|---|---|
| Both budgets have converged feasible candidates; the tighter budget causes a visible loss of retained anharmonicity; a user constraint sets the solution | **Proceed.** Show the cost of tightening requirements. Proposed editorial threshold: at least 5 MHz change and at least 10× estimated numerical uncertainty. This is a demo-selection rule, not a physics standard. |
| The stricter budget is infeasible, or it makes little difference | **Keep the model; change the framing.** Explain incompatible requirements or an inactive constraint. Do not script a successful redesign. |
| Nominal and scenario-qualified candidates are essentially identical, or the stress result adds no useful margin/failure explanation | **Drop robustness from the headline and automatic recommendation if needed.** Keep nominal constrained selection. An optional stress view can remain if it is informative. |
| Both example budgets fail across the initial tested range, selections follow arbitrary bounds, or dispersion cannot be resolved reliably | **Reconsider the specific optimization demo.** Diagnose once after the start; change the illustrative scenario transparently if justified. Do not add unrelated parameters to manufacture an interesting optimizer. |

If the result changes materially when numerical settings change, pause optimization claims and fix the calculation. If it remains a clean threshold crossing, accept that honestly: the product must earn its value through transparent decisions and linked explanations.

## Appendix: implementation-facing clarifications

The fixed-frequency relation `c=f*/g01(r,0)`, `j=r*c` follows exactly from factoring `c` out of the charge-basis Hamiltonian. When electrical stresses are applied, **do not remap each scenario back to 5 GHz**; that would erase the effect under examination.

The anharmonicity objective and floor are evaluated at `ng=0`. Dispersion and frequency-band checks cover the charge period through validated endpoint/sweep calculations. Do not label the former a minimum over offset charge. Full-period mathematical statements remain subject to the numerical verification limits of the evaluated model.

Charge-dispersion values under the verified numerical floor should display as unresolved/below resolution. Do not put an exact zero on a log axis or reward it as infinitely good. The ±2%/±1% stress envelope is a declared scenario assumption; its grid fraction is not a probability.

No novel optimization algorithm is required. The proposed intervention tests whether a simple, established calculation supports a useful user decision. Existing-tool differentiation and production integration remain with their assigned parallel workstreams.
