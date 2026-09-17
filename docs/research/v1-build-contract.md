# Qubit Studio — Recommended V1 Build Contract

Status: research synthesis and proposed implementation contract, pending team approval and executable validation. Not a claim that code, dependencies, benchmark, or deployment exists. This narrower contract supersedes the original design doc's proposed primary Monte Carlo/coherence story if approved. It does not override UI decisions in the separate design session.

## Evidence intake

Read in full:
- `research/quantum/chatgpt-physics.md`
- `research/quantum/chatgpt-demo-decision.md`
- `docs/research/lane-c-adversarial-audit.md`
- `research/quantum/claude-feasibility.md`
- `research/quantum/gemini-quantum-background.pdf` (all nine pages extracted/read)

Claude and Gemini originals were preserved byte-for-byte with matching SHA-256 hashes. Raw reports are evidence inputs, not implementation instructions. See `docs/research/interim-a-c-reconciliation.md` for independently inspected primary-source checks.

## Decisions proposed for V1

**Promise:** Explore a simplified qubit simulation, set competing requirements, and see which effective designs satisfy them and what a tighter requirement costs.

**Audience:** students, curious technical users, and instructors. No asserted laboratory adoption.

**Track:** optimization through an explicit constrained choice; no claim of a novel optimizer or new physics.

**Model:** isolated fixed transmon in scqubits. No fabrication/materials, coupled resonators, full processor, or time evolution.

**Outputs:** energy levels, transition frequencies, signed anharmonicity, transition charge dispersion, feasible choices, and constraint margins.

**First objective:** at an exact selected nominal transition frequency, maximize retained negative-anharmonicity magnitude while respecting a charge-dispersion ceiling and declared minimum magnitude. Reject unexpected sign/domain conditions rather than optimizing an indiscriminate absolute value.

**First search:** one-dimensional energy-ratio sweep with refinement. A constraint-boundary optimum is acceptable. No visual knee is required. A user specification must meaningfully change feasible choices or reveal infeasibility; don't imply the search algorithm itself is novel.

**Optional next milestone:** explicitly hypothetical electrical stress scenarios. Not required for the primary demo. No probability/yield label on deterministic scenario counts.

**Deferred:** coherence/lifetimes, gate speeds/fidelity, physical materials selection, manufacturing yield, noise-driven animations, black-box AI recommendations, multi-qubit extensions.

## Mathematical/interaction contract

Use internal `EJ_GHz = EJ/h` and `EC_GHz = EC/h`, ordinary-frequency GHz, not angular frequency. `ng` is dimensionless offset charge in Cooper-pair units. Numerical cutoff is an advanced solver setting, not a physical component.

Calculate low-lying levels through diagonalization. Derive f01 and f12 from adjacent levels, alpha = f12 - f01, and A = -alpha in the supported negative-alpha regime. Do not use alpha = -EC as the result generator.

Transition dispersion is the change of f01 over offset charge, not the shift of one energy level. Use the documented endpoint shortcut only after checking finalists against an explicit offset-charge sweep. Values below validated resolution cannot become zero-valued perfect winners.

For locked nominal frequency f*, let r = EJ/EC. At EC=1 in consistent units, evaluate the dimensionless first gap g01(r, ng=0), then EC = f*/g01 and EJ = r*EC. This is the proposed exact scaling for the selected model; verify it numerically before integration.

The target lock means EJ and EC are linked. The UI must not imply both are independent while frequency remains fixed. Free exploration may expose them independently with the lock off.

Preserve baseline parameters and original requirements. When requirements change, reevaluate baseline eligibility under the new requirements and distinguish that from its original result.

## Proposed demo settings — not calculated yet

Nominal frequency: 5 GHz. Tighten dispersion ceiling from 10 kHz to 1 kHz, keeping the other requirements fixed. Retain a minimum-anharmonicity requirement from Astra's proposed scenario only if it yields a useful, interpretable example in the actual run.

Search ranges and tolerances in Astra's contract are starting proposals, not universal physical limits. Report active search bounds. Do not automatically adopt the full electrical stress scenario or perturbed frequency-band constraint in the first nominal implementation.

Do not promise that both budgets are feasible or that the new candidate improves every metric. The comparison is the cost of tightening a requirement, not universal superiority.

## Technology path

- Next.js/TypeScript frontend; SVG/HTML anchored controls; charts from returned numerical arrays.
- Python 3.12 is the proposed starting interpreter; verify actual package compatibility.
- scqubits v4.3.1 is a source-inspected candidate pin, not an asserted latest version or successful install.
- NumPy/SciPy through a tested locked dependency set; FastAPI/Pydantic for the service.
- No GUI/ipywidgets dependency in the app interaction path. Scientific runtime transitive dependencies remain installed normally; do not break package requirements by deleting imports based on guesses.
- Explicit headless plotting configuration is sensible; frontend renders arrays, not backend plot windows.
- Browser calls containerized Python backend directly over HTTPS with allowed CORS origins. Long searches use bounded jobs and polling if the actual benchmark requires it.
- Vercel hosts the frontend; proposed container host Railway remains subject to account/settings/resource verification. No assumed free-tier limits or automatic spend authorization.
- Use bounded computation and limited concurrency; do not introduce distributed infrastructure for a small search.
- Preserve a local same-contract execution path for the demo.

## First authorized execution milestone

No broad app implementation before this numerical gate has an owner and clear output.

1. Create an isolated numerical environment and install the selected compatible library set after permission/start rules allow it.
2. Reproduce the paired official Basics + Energy spectrum fixture: EJ=30.0, EC=1.2, ng=0.3, ncut=31. The published first three raw levels are -21.82665096, -6.16372350, 8.01931750 GHz. Do not substitute overview EJ=30.02.
3. Check units, signs, and convergence using the report's proposed tolerances; document actual differences rather than weakening tests silently.
4. Run a nominal iso-frequency sweep; calculate A and transition dispersion.
5. Apply both proposed dispersion ceilings. Report selected candidate, active constraints, infeasible outcomes, or unresolved numerical results.
6. Reevaluate finalists with a larger basis and explicit ng sweep. Record calculation timings on the actual machine.
7. Export the calculated arrays and a concise result report. These become real integration fixtures, not invented UI data.

Proceed if the calculation is consistent and the trade-off is understandable. Lack of an interior optimum or dramatic curve bend is not a failure. A broken numerical result or no meaningful constraint-driven interaction requires resolving the specific problem before building around it.

## Claude report triage

Retain: use a scientific library instead of asymptotics, bounded work, headless service, explicit unit conventions, early integration, reproducible export.

Do not inherit:
- Its old claim that matched-sample Monte Carlo must be our differentiator or that no free tool combines the workflow. The comparative evidence is incomplete and Qubit-Discovery is relevant prior art.
- Its Vercel proxy timeout as a binding architecture limit. Our direct browser-to-backend/polled-job design need not hold a Vercel function open.
- Its specific hosting-tier numbers, latest-version claims, or source-main dependency pins as verified environment facts. Check the selected release and actual service configuration.
- Its use of "exact" diagonalization as a substitute for checking finite-basis/numerical convergence.
- Its recommendation to automatically label a non-finite coherence result as a sweet spot. Non-finite results require model-specific interpretation, and coherence is deferred anyway.
- Its proposed distributions as physically validated defaults. They can be assumptions only if an optional stress feature is implemented.

## Gemini PDF triage

Treat as a broad secondary synthesis and source-discovery aid, not Google Scholar data or a validated specification. It expands far beyond the selected simulation and does not trace each numerical claim to a precise inspected source.

Do not incorporate its new materials, higher Josephson harmonics, multi-qubit crosstalk, Purcell filters, or annealing controls into V1.

Concrete reasons not to copy its formulas/defaults blindly:
- Its p.7 table says high EJ lowers frequency, conflicting with the fixed-EC leading-order frequency relation described elsewhere in the reports.
- It alternates energy-defined alpha and alpha/2pi frequency labels without a consistent conversion contract.
- Its generic ncut >= 30 statement is not a convergence guarantee for every parameter domain or tiny spectral difference.
- Its annealing-direction narrative differs from Claude's; this is outside scope and should not be resolved by picking the more confident text.
- Its mandatory Monte Carlo/manufacturing language contradicts the team's explicitly simplified simulation scope.

No broad Gemini claim or quoted material-performance number has been independently verified in this intake. Archive for later research, not the implementation critical path.

## Remaining input needed from the team

1. Approval to begin the bounded numerical feasibility milestone once competition rules permit.
2. The selected UI/UX direction when that session reaches a decision; numerical work need not wait for final styling.
3. Approved hosting account/spending only when deployment is actually undertaken.

No additional general research report is needed before the first execution gate.
