# Qubit Studio — Product & Technical Design

Working name, not a final brand decision.

**Status:** Proposed hackathon design. No implementation, deployment, simulation benchmark, or scientific validation has been completed for this project. This document authorizes none of those actions by itself.

**Event:** HackCMU 2026. Approximately one day; two builders plus a reviewer/demo lead.

**Primary track:** Optimization. Design-award opportunity through direct manipulation and understandable comparison.

**Goal:** Make the trade-offs in a superconducting-qubit model visible, interactive, and optimizable, so a user can identify promising designs and understand how sensitive they are to uncertain parameters.

**Architecture:** A browser-based instrument workspace controls a bounded Python scientific model. The same calculation pipeline powers individual evaluations, parameter sweeps, and candidate comparison. The frontend owns interaction and presentation; the backend owns numerical results, constraints, and provenance.

**Proposed stack:** Next.js, TypeScript, Tailwind CSS, Motion, SVG, Zustand, TanStack Query; FastAPI, Pydantic, scqubits, NumPy, SciPy; Vercel frontend and a containerized Python service on Railway.

This is a vision and design document, not a detailed task-by-task implementation plan. Deep physics research, final noise-model choices, dependency versions, and visual reference research are intentionally deferred.

---

## 1. Product thesis

### Binding scope clarification from the team

**This is an interactive simulation, not an accurate predictor of real-world quantum hardware.** Its purpose is to let people explore a simplified model, manipulate its assumptions, and optimize outcomes inside that model. Real-device accuracy, experimental calibration, manufacturing validation, and demonstrated laboratory cost savings are not acceptance requirements for this hackathon prototype.

Validate the implementation against the chosen model: controls must affect actual calculations, optimization must use those calculations, and results must be internally consistent and reproducible. This is different from validating predictions against fabricated chips. Keep the distinction explicit without allowing research-grade validation to consume the build.

Any references below to research users, coherence, fabrication variation, or screening designs describe modeled exploration or possible future applications—not real-world predictive claims. "Better" means better under the selected simulation model and assumptions, not a proven improvement to an actual device. Expert input is helpful for avoiding misleading explanations, not a prerequisite for claiming the simulator predicts reality, because that claim is out of scope.

### The one-line pitch

**Explore a qubit design. Change its parameters. Find alternatives that satisfy your goals—even when the parameters are uncertain.**

### The user problem

Quantum-device design involves competing requirements. Improving one property can worsen another, and a design that looks promising at nominal settings may be sensitive to variation. Existing scientific tools can calculate these effects, but exploring assumptions, comparing alternatives, and explaining the resulting decision can require substantial scripting and domain fluency.

Our hypothesis: an interactive, model-backed workspace can shorten that exploration loop and make its reasoning easier to inspect.

### Initial audience

- Students learning superconducting-qubit design.
- Researchers or lab members exploring a known, simplified model.
- An instructor demonstrating why an apparent optimum is not automatically the best candidate.

This is not yet a production tool for selecting fabrication materials or authorizing chip manufacture. Research-lab usefulness and cost savings require validation with actual users.

### Intended benefit

Help a user shortlist candidates for deeper analysis or experimentation. The user leaves with a reproducible comparison: parameters, assumptions, constraints, predicted behavior, and reasons for the recommendation.

Do not claim that the prototype replaces fabrication experiments, predicts arbitrary material properties, or proves that a manufactured chip will work.

## 2. What the judges should experience

The product opens directly into a working instrument, not a marketing page.

A stylized qubit schematic sits in the center. Controls float beside the parts they affect. A junction control, capacitor control, and environment control are visibly connected to the same model.

The judge changes a parameter. Energy levels and response charts update from actual calculations. They introduce parameter variation and see the distribution of possible outcomes widen. They ask the optimizer to satisfy a design target under those assumptions. Candidate designs appear, with differences and constraint violations made visible.

The memorable reveal is:

> A design can perform well at its nominal values while being fragile under parameter variation. Optimization should consider both.

This is a hypothesis the implemented model must demonstrate honestly, not a scripted conclusion. If the validated model produces a different result, show that result and adjust the narrative.

## 3. Scientific scope: high-level only

### Starting model

One established superconducting-qubit family: a transmon. Start with effective model parameters rather than converting arbitrary drawn geometry or material names into electrical behavior.

Candidate controls:

- Josephson energy associated with the junction.
- Charging energy associated with capacitance.
- A documented environment/noise configuration, if validated.
- Assumed parameter-variation ranges.

All editable fields must have units and supported bounds. The research pass must choose one internal unit convention and explicit conversions before coding the model adapter.

### Outputs

Core model outputs:

- Transition frequency.
- Anharmonicity, with a stated sign/magnitude convention.
- Low-lying energy levels.
- Whether frequency and anharmonicity constraints are satisfied.
- Sensitivity and sampled feasibility under assumed parameter variation.

Conditional output:

- Modeled coherence, only if the selected noise mechanisms and parameters can be justified and tested early.

Do not invent a coherence score to complete the screen. If coherence is not validated, retain the product's central simulation-and-optimization loop using frequency, anharmonicity, and robustness. Show unsupported capabilities as absent, not convincing placeholders.

### Meaning of the chip drawing

The central drawing is an interactive schematic, not a fabrication-ready layout or an electromagnetic field solution. Label it "Schematic representation — not to scale."

A capacitor highlight can identify the control's location. It must not imply that dragging arbitrary physical pad dimensions automatically computes capacitance. Physical geometry-to-model conversion is outside the initial scope.

### Assumptions are part of the interface

Every result is tied to the circuit model, parameter values, noise assumptions if applicable, variation assumptions, solver settings, and software/model version.

Fabrication variation is user-specified or sourced later. Sampled feasibility is not measured manufacturing yield. Never label it simply "yield."

## 4. What exactly gets optimized

### Default objective that does not depend on speculative coherence modeling

Find effective model parameters that minimize deviation from a target transition frequency while satisfying an anharmonicity constraint. Evaluate candidate robustness under the same specified parameter-variation distribution.

Show the trade-off between nominal target error and robustness rather than hiding it in an arbitrary combined score.

### Conditional coherence objective

If a supported coherence model passes validation, offer a second objective: maximize a named modeled coherence metric subject to the same operating constraints and robustness evaluation.

The research pass must define the metric, channels, and aggregation explicitly. Do not conflate relaxation, pure dephasing, and total coherence.

### Candidate search

For the hackathon, prefer a bounded grid/coarse-to-fine parameter search over a small parameter space. Vectorize/cache where possible. A simple, inspectable search is better than integrating a fashionable optimizer that obscures behavior.

Evaluate candidate variation using a seeded sampling procedure. Use matched sample draws across candidates for comparison, and a separate validation sample to recheck finalists. Display the sample count and distribution assumptions. Do not claim a globally optimal or statistically certain answer.

### Results

Return a small set of useful alternatives, such as:

- Best nominal target match.
- Strongest sampled constraint satisfaction.
- A balanced trade-off selected by an explicit rule.

These labels must follow calculated results. Do not manufacture three distinct winners if the same candidate wins multiple criteria.

An empty feasible set is a valid result. Highlight conflicting constraints and let the user revise them; do not silently relax requirements.

## 5. Main product loop

1. **Start:** Open a documented example configuration. No account required.
2. **Explore:** Select a schematic element and edit a supported parameter.
3. **Inspect:** See the resulting energy levels and performance metrics.
4. **Challenge:** Turn on assumed variation and inspect outcome distributions.
5. **Constrain:** Set the target frequency band and required anharmonicity.
6. **Optimize:** Search a bounded parameter space and compare feasible alternatives.
7. **Decide:** Apply a candidate or retain the baseline.
8. **Export:** Download the model inputs, assumptions, and computed comparison.

No photo upload, OCR, chat, live camera tracking, or generative chip imagery is required to prove this loop.

## 6. Visual vision: a precision instrument you can touch

### Desired character

Precise, tactile, calm, technically credible, and visually striking at projector distance.

The hero is the working schematic and its behavior. It should feel like an approachable scientific instrument, not a SaaS dashboard with quantum terminology.

This is a proposed original direction. No completed visual-reference hunt or rendered mockup is being claimed. Before production styling, inspect a small set of scientific-instrument, chip-micrograph, and interactive-explanation references; borrow principles, not branded layouts.

### Composition

```text
┌────────────────────────────────────────────────────────────────────┐
│ Qubit Studio   Transmon / model version      status   reset export │
├────────────────────────────────────────────────────────────────────┤
│ Goal + constraints       │                       │ Model results   │
│ Target frequency        │   QUBIT SCHEMATIC      │ Frequency       │
│ Anharmonicity limit      │                       │ Anharmonicity   │
│ Variation assumptions   │ [capacitor control]    │ Constraint state│
│                         │        [junction]      │                 │
│ Optimize                │     [environment]      │ Energy levels   │
├────────────────────────────────────────────────────────────────────┤
│ Baseline vs candidate · distributions · parameter-space comparison │
└────────────────────────────────────────────────────────────────────┘
```

Desktop-first for the judges. On narrow screens, show the schematic first and expose controls/results in a bottom sheet or stacked sections. Do not squeeze the desktop three-column arrangement onto a phone.

### Color and typography

Proposed palette:

- Deep graphite workspace: `#10151B`.
- Slightly lighter instrument surfaces: `#1B232C`.
- Warm silver chip/schematic shapes: `#D8D9D2`.
- Cyan for the active candidate and active controls: `#65D4D0`.
- Amber for uncertainty/constraint warnings: `#E8B86D`.
- Muted coral for violated constraints: `#E98B7B`.
- Quiet neutral styling for baseline/reference data.

Use a legible sans serif such as locally bundled Inter for the interface and IBM Plex Mono for units, numerical readouts, and parameter names. Large, readable chart labels matter more than decorative headline typography.

Verify contrast rather than assuming these tokens pass accessibility checks. Never encode validity only with color.

### Floating controls: core interaction, not decoration

- Anchor each control to the schematic element it affects with a fine leader line.
- Show compact value chips when inactive; open one detailed editor at a time.
- Pair each slider with an exact numeric input and units.
- On focus, highlight the affected schematic region and the related output traces.
- Allow panels to move only if their anchor relationship remains obvious; draggable panels are not a milestone-one requirement.
- Keep controls out of important chart and schematic regions.
- Environment/variation controls sit outside the device, visually distinct from device parameters.
- Provide keyboard access and a non-spatial parameter inspector.

Do not use constantly bobbing cards, decorative particle clouds, or "quantum energy" animations. Floating means spatially anchored interface components, not perpetual movement.

### Charts and animation

- Energy-level diagram linked to actual numerical levels.
- Baseline/candidate comparison with shared axes and units.
- Distribution plot or interval view for sampled outcomes.
- Feasible-region plot showing evaluated candidates and the selected point.
- No decorative sparkline without a meaningful axis.
- Never color unexplored design-space regions as known feasible.
- Transition visuals smoothly between completed results, but distinguish animation from intermediate physics.
- Respect reduced motion.

## 7. Proposed technology stack

| Layer | Choice | Role |
|---|---|---|
| Web application | Next.js + TypeScript | Product shell, routing, deployment |
| Styling | Tailwind CSS + CSS variables | Consistent tokens and responsive layout |
| Motion | Motion | Restrained transitions and anchored-panel interactions |
| Central workspace | SVG + HTML overlays | Sharp schematic, selectable elements, accessible controls |
| Charts | SVG with D3 scales/shapes | Precise axes, energy levels, candidate/distribution plots |
| Local UI state | Zustand | Selection, draft parameters, pinned baseline, comparison state |
| Server state | TanStack Query | Requests, caching, loading/error handling |
| Frontend validation | Zod | Validate API input/output shapes |
| Scientific API | FastAPI + Pydantic | Typed endpoints and bounded request validation |
| Model library | scqubits | Established transmon calculations |
| Numerics/search | NumPy + SciPy | Parameter search and sampled variation evaluation |
| Optional later physics | QuTiP | Open-system dynamics only if needed and validated |
| Frontend host | Vercel | Public web application |
| Backend host | Railway, containerized | Python scientific dependencies and bounded jobs |
| Verification | pytest; Vitest; Playwright | Numerical contracts, UI logic, browser demo loop |

Pin compatible versions after installation and an actual smoke test. No exact version or package compatibility has been verified for this repository.

### Deliberate omissions

- No Three.js/WebGL dependency for the first version. An SVG schematic can still feel spatial and premium without adding 3D picking and camera-control work.
- No Quantum Metal/electromagnetic solver integration on the critical path.
- No database, authentication, team accounts, or billing.
- No LLM in the numerical decision path.
- No runtime inference API needed for the core project.

An optional plain-language explanation can be generated from structured results later, but deterministic explanatory templates are enough for the demo. Coding subscriptions support development; the application does not depend on them at runtime.

## 8. Data flow and correctness

```text
Parameter control
  → draft UI state
  → validated typed request
  → FastAPI model adapter
  → scqubits / numerical evaluation
  → structured result + provenance
  → charts, readouts, constraint indicators

Optimize
  → bounded search request
  → candidate evaluations
  → constraint filtering + robustness checks
  → ranked/trade-off results
  → user selects candidate
  → selected parameters enter the same evaluation path
```

### Interaction behavior

Update the control immediately. Request evaluation after a short debounce or pointer release; the exact timing follows a real benchmark. Never run an expensive search on every slider movement.

Keep the previous computed output visible while a new request runs, explicitly marked "Updating — previous result." Track request IDs so older responses cannot overwrite newer edits. Cancel or ignore obsolete requests.

Changing assumptions invalidates affected comparisons. A baseline retains its original parameters and assumptions; show a mismatch warning before comparing runs under different environments.

### Suggested endpoints

- `GET /health`: service/process readiness.
- `GET /models`: supported model/version, controls, bounds, units, and output definitions.
- `POST /evaluate`: one configuration and its metrics/levels/constraints.
- `POST /optimize`: create a bounded search job; return a job ID.
- `GET /jobs/{id}`: status, completed evaluation count, and final result or structured failure.

A simple single-instance, bounded worker is sufficient initially. CPU-heavy searches must not block the API event loop. Jobs may be in memory for the hackathon; service restart expires them, and the UI must report that clearly. No claim of durable job persistence.

Use opaque job IDs, a queue/concurrency limit, and server-enforced bounds on parameter grids, sample counts, and compute duration. Do not accept arbitrary Python, model expressions, or uploaded executable code.

### Result contract

Every completed result includes:

- Run ID and model/version.
- Exact input parameters and units.
- Constraints and variation/noise assumptions.
- Metrics and energy levels.
- Feasible/infeasible status plus violated constraints.
- Sample count and seed when sampling is used.
- Warnings, calculation duration, and solver settings.

Pydantic generates an OpenAPI contract; frontend types should be generated or checked against it. JSON exports include the same provenance so a visual comparison can be reproduced.

## 9. Deployment plan

### Primary architecture

**Vercel hosts the Next.js frontend. Railway hosts one Python backend container.**

The browser calls the backend over HTTPS through a public API URL. Set backend CORS to explicitly permitted frontend origins, including an intentional preview-development policy. CORS is not abuse prevention; enforce request limits server-side.

The backend container installs pinned dependencies and starts the API on the platform-provided port. It is CPU-only. Keep health checks fast and separate from a full simulation test.

Do not run the scientific worker inside short-lived frontend serverless functions. Do not introduce Redis or distributed orchestration unless the bounded single-instance design demonstrably needs them.

### Configuration

Frontend:
- `NEXT_PUBLIC_API_BASE_URL`.

Backend:
- Allowed origins.
- Model configuration/version.
- Maximum search size, sample count, job duration, queue size, and worker concurrency.

No secret belongs in a `NEXT_PUBLIC_` variable. Core execution needs no external model API key.

### Deployment sequence

1. Prove the calculation and API locally.
2. Build and deploy the Python container early.
3. Verify HTTPS health, one calculation, and one search job on the deployed backend.
4. Deploy the frontend with its API URL and test the full browser path.
5. Test from a second device/network, not just the developer laptop.
6. Warm the demo configuration before judging and verify the service is not asleep.

Hosting accounts, billing/credits, service limits, and cold-start behavior are unverified prerequisites. Use an approved host with sufficient CPU and avoid depending on an untested sleeping free tier. No deployment is performed by this document.

### Fallback that preserves honesty

Maintain a local frontend/backend setup with the same API contract. Cache a real computed example and export it as a recovery artifact. Cached output must be labeled "Previously computed," not presented as a new live optimization.

If cloud access fails, use the live local stack. A recorded demo can document a previous working run, but must not masquerade as the live judge interaction.

## 10. Delivery scope and team split

### Must ship

- One verified model/configuration family.
- Central interactive schematic and anchored parameter controls.
- Real numerical evaluation with units and clear status.
- Explicit target constraints.
- Bounded candidate search.
- Baseline/candidate comparison.
- Assumed-variation evaluation with honest labels.
- Reproducible JSON export.
- Public deployment plus local recovery path.

### Stretch, only after the full loop works

- Validated coherence/noise mode.
- Additional plot views and polished comparison transitions.
- Plain-language explanations from structured numerical facts.
- More documented example configurations.

### Out of scope

Arbitrary materials prediction, fabrication-ready chip layout, actual experimental yield prediction, full-chip optimization, image-to-chip reconstruction, multi-qubit processors, hardware control, and accounts/collaboration.

### Ownership

**Builder A — product/UI:** workspace composition, SVG schematic, floating controls, chart rendering, loading/error states, export, responsive behavior.

**Builder B — scientific service:** model adapter, units/validation, search, variation sampling, provenance, API, deployment.

**Reviewer/demo lead:** reference-example checking, assumption review, user comprehension, adversarial input tests, demo rehearsal, evidence capture. A domain-competent reviewer is still needed; the role title does not establish physics expertise.

Agree on request/response examples first so both builders can work in parallel. Development fixtures must be visibly labeled and removed from live-result paths before judging.

## 11. Build order and gates

This is milestone order, not a promise that every item has been timed or benchmarked.

### Gate A — scientific and hosting feasibility

Reproduce one documented model example. Vary a parameter and verify its effect. Define units and output conventions. Run one bounded search. Prove the Python service can run on the chosen host.

Resolve coherence support here. Do not discover late that the headline metric is unsupported.

### Gate B — thin end-to-end instrument

One real control → deployed API → real output → schematic/chart update. No elaborate art direction before this works.

### Gate C — meaningful optimization

User changes a target → feasible search results → candidate selection → independent reevaluation through the same model adapter. Include infeasible and failed-run states.

### Gate D — robustness and comparison

Evaluate baseline/candidates under documented matched assumptions, recheck finalists, and show limitations. Validate that the selected demo actually has an understandable trade-off; do not invent one.

### Gate E — polish and rehearsal

Finish the floating-control layout, projection readability, export, and recovery flow. Freeze features before final rehearsals. Deepening the rendering is lower priority than numerical correctness and a reliable explanation.

## 12. Judge demo: under three minutes

### Opening: the decision

"Before choosing a design to investigate further, you need to know not only how it behaves ideally, but how sensitive that behavior is to variation. We make that trade-off interactive."

Open the working example immediately. Briefly identify the schematic as a model, not an image of a fabricated chip.

### Interaction: change the device

Let the judge adjust one bounded parameter using the anchored control. Show the linked change in energy levels and target metrics. Explain one consequence in ordinary language.

### Challenge: change the assumptions

Introduce an assumed variation range. Show the distribution of outcomes and which samples violate the target constraints. State that this is modeled parameter uncertainty, not measured fabrication yield.

### Optimization: find alternatives

Set or tighten a target. Run the search live. Show the actual alternatives and constraint results. Let the judge select one and compare it against the pinned baseline.

No promised improvement percentage. Use whatever the actual validated calculation returns. An infeasible request should produce an understandable infeasible result.

### Close: useful artifact

Export the comparison with its parameters and assumptions.

"This does not replace fabrication. It gives a student or researcher an inspectable way to explore a model and shortlist designs for deeper analysis."

### Rehearsal rules

- Preload/warm libraries, not the judge's answer.
- Keep one trustworthy example and one alternate judge intervention.
- No tiny technical paragraphs during the live sequence.
- Clearly distinguish live results, cached results, and purely illustrative schematic animation.
- Do not claim research-lab adoption, cost savings, or experimentally validated predictions.

## 13. Acceptance criteria

### Product

- A newcomer can identify what is adjustable, what is calculated, and what is assumed.
- Floating controls clearly relate to the schematic rather than obscuring it.
- The user can set a goal, compare alternatives, and export a reproducible result.
- Optimization is genuinely decision-making under constraints, not an "AI recommendation" paragraph.

### Scientific/numerical

- Reproduce a documented reference example within a justified tolerance.
- Validate parameter units, supported ranges, level ordering, and constraint calculations.
- Reevaluate every selected candidate independently through the standard evaluation path.
- Test the small search against an exhaustive reference where practical.
- Use repeatable seeds and reject non-finite results.
- Never convert solver failure into a plausible number.
- Review the demo explanation for consistency with the selected model. Domain-expert feedback is desirable, but real-device validation and expert certification are not required for this explicitly simplified simulation.

### Software

- Frontend typecheck/build and relevant unit tests pass.
- Backend schema/model/search tests pass.
- Browser tests cover a parameter edit, optimization, comparison, export, and failure state.
- Delayed responses cannot overwrite newer edits.
- Compute requests are bounded and the API remains responsive during search.
- The deployed loop works on the demo machine and a second device.
- Keyboard access, reduced motion, readable axes, and non-color validity indicators work.

### Evidence

Preserve exact commands/results, a deployed URL, exported example runs, and screenshots or a recording of the real loop. None of these artifacts exists yet for this project.

## 14. Open decisions for the next research/implementation pass

1. Final transmon parameter ranges, unit conventions, and supported reference configuration.
2. Which variation assumptions are defensible and how they should be labeled.
3. Whether a coherence model is suitable for the first demo; if not, commit to spectral targets and robustness.
4. Domain reviewer availability.
5. Actual evaluation/search latency and resulting search/sample budgets.
6. Compatible scientific package versions and container build reliability.
7. Hosting account, spend approval, and cold-start behavior.
8. Final product name and visually inspected reference direction.
9. Confirm the organizers' detailed optimization-track rules; the fit here is substantive but their full wording remains unverified.

## 15. Existing technical references

These official project pages were inspected during ideation. They establish available capabilities, not that our exact integration is tested:

- scqubits: https://scqubits.readthedocs.io/en/latest/
- QuTiP: https://qutip.org/
- Quantum Metal: https://qiskit-community.github.io/qiskit-metal/

Quantum Metal and QuTiP are context/possible future tools, not required initial dependencies. Hosting plans, scientific defaults, and detailed API choices above remain proposed until verified.

---

## Final design principle

**Build an understandable, inspectable instrument—not a mysterious quantum oracle.**

The spectacle comes from touching a model, seeing its consequences, and finding a better-supported decision. The trust comes from showing exactly which assumptions produced that decision.
