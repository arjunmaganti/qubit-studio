# Qubit Studio — Pre-Hack Research Sprint

## Purpose

**Team clarification: this is an explicitly simplified interactive simulation, not a real-world quantum-hardware predictor.** Research should establish a coherent model, interesting optimization, and correct implementation—not require experimental calibration, accurate manufacturing prediction, expert certification, or proof of material-cost savings. Interpret all validation gates below as validation against the selected model unless explicitly labeled future work. Material/process uncertainty may be a clearly labeled illustrative assumption; it must not be advertised as empirically representative. A domain reviewer is helpful, not a prerequisite to building the simplified simulator.

Resolve the few scientific and engineering uncertainties that can break the project before implementation starts. More output is not the goal. The output is a source-backed, implementable model contract and a credible demo decision.

Context: HackCMU 2026; user reports hacking starts at 9 PM. Local clock checked at 8:07 PM EDT. Team has two builders plus a reviewer/demo lead and access to ChatGPT Pro, Claude, and Grok Super Heavy. Main concept: `docs/quantum-design-lab-design.md`.

**Competition boundary:** Check the organizers' rules before preparing implementation assets. Before the permitted start, limit this sprint to allowed reading, research, and planning. Do not install prototype dependencies, implement the app, generate reusable application code, or execute an experimental prototype unless explicitly permitted. Research prompts below ask for documentation and a post-start test specification, not app code.

## 1. What must be decided before building

1. Is a single-transmon model the correct bounded starting point?
2. Which inputs and output definitions will we actually support, with what units and ranges?
3. What objective and constraints create a meaningful optimization problem rather than a trivial slider maximum?
4. Which uncertainty assumptions are defensible? What can we truthfully call the resulting statistic?
5. Can one existing Python library provide the needed calculations without a multi-tool simulation stack?
6. What exact result would prove the model and search work after hacking starts?
7. What can the judge change that produces a useful, understandable comparison?
8. What does our interface contribute beyond the existing library GUI/explorer?

Do not broaden into quantum algorithms, all qubit modalities, new fabrication processes, or arbitrary materials discovery.

## 2. Parallel assignments

Use different tools for complementary evidence, not as a vote on scientific truth. Provider assignments are logistical defaults, not claims that one model is intrinsically authoritative.

### Lane A — Physics contract

Suggested: ChatGPT Deep Research.

Deliverable: a compact specification for the bounded model, supported by primary documentation/papers, with units, assumptions, valid ranges, and one reproducible published/library example.

### Lane B — Numerical/library feasibility

Suggested: Claude with browsing/research enabled. If using Claude Code, keep it strictly read-only until the authorized start.

Deliverable: exact documented library capability, relevant API signatures, dependency/hosting hazards, and the first execution test to run at 9. No claims of performance from unrun code.

### Lane C — Scientific usefulness and adversarial novelty check

Suggested: Grok research with primary-source browsing.

Deliverable: whether the optimization has a nontrivial trade-off, how researchers/students could use it, nearest existing products, and the strongest reasons not to build it as currently framed.

### Lane D — Integration and source verification

Suggested: Hermes/main team chat plus reviewer/demo lead.

Do not start another general research report. Track unresolved claims, inspect primary sources behind decisions, check organizer rules, and synthesize the other lanes into one contract.

The reviewer can also ask an available quantum/ECE student or organizer a few targeted questions in person. Do not automatically send messages or claim expert review occurred.

## 3. Timeline

These are planned checkpoints, not task-duration guarantees.

### Now–8:15 PM: launch and scope

- Confirm what research/planning is allowed before 9.
- Dispatch A, B, and C in parallel using the prompts below.
- Give each the design doc or its context block, not the entire ideation history.
- Assign one human to collect outputs in a single location.

### 8:15–8:30 PM: first evidence checkpoint

Ask each lane for interim conclusions if the full research run is slow:

- Strongest finding.
- Most dangerous unresolved assumption.
- Primary source link supporting the finding.
- What the other lanes must know now.

Do not let a long-running research mode consume the entire window without an actionable checkpoint. Keep model tasks narrow and use ordinary browsing for missing facts.

### 8:30–8:45 PM: targeted cross-review

- Give A's model contract to B: can the documented library implement it?
- Give B's proposed outputs to A: are their units/interpretations correct?
- Give A+B summaries to C: is the optimization real and does it preserve a useful differentiator?
- Resolve only high-impact disagreements with source inspection.

### 8:45–8:55 PM: freeze a research contract

Produce `docs/research/model-contract.md` when evidence is sufficient. It should identify one model, objective, unit system, uncertainty model, library path, and validation example.

Coherence gets a yes/no/deferred decision here. Do not leave it as a vague central promise.

### 8:55–9:00 PM: handoff

- Summarize the approved loop in plain language.
- Identify the exact first execution test and the person who owns it.
- Choose the judge-controlled parameter and constraint.
- List blockers and the stop decision if a blocker remains unresolved.
- Do not start implementation before the permitted time.

### After 9: first executable gate

Only after authorization/rules permit: install the selected dependency, reproduce the reference example, run a small sweep/search, and time it on the actual development/deployment path. Research confidence is not a substitute for this test.

Do not polish an interface around an unverified core. The other builder can start the agreed UI shell after the start while the numerical gate runs, without encoding invented physics.

## 4. Shared output contract for every research lane

Use this structure:

1. Recommendation in one paragraph.
2. Decision table: claim; exact source URL/section; what it establishes; limitation; implication for this build.
3. A concrete supported example, or explicitly `NOT FOUND`.
4. Three biggest risks or contradictions.
5. Specific changes required to the design doc.
6. Questions another lane must answer.
7. What was inspected versus executed. Do not call an unrun proposal tested.

Keep the main answer short enough to compare. Put optional supporting material in an appendix. Evidence quality matters more than citation count.

No fabricated measurements, runtime benchmarks, material parameters, API signatures, researcher quotes, or validation results. If access to a source fails, say so. A model's explanation is not a citation.

## 5. Copy-paste prompt: Lane A / Physics contract

```text
We are preparing a 24-hour HackCMU project. Hacking begins at 9 PM; this task is research/planning only, not application implementation or prototype execution. We have two builders plus a reviewer/demo lead, Macs, and a proposed Python scientific backend.

Project: Qubit Studio. An interactive schematic with floating controls lets a user change a superconducting-qubit model, inspect energy levels and operating metrics, set constraints, and compare candidate parameters under explicit uncertainty assumptions. Optimization is the track. We do NOT claim to replace fabrication experiments, discover arbitrary materials, predict manufacturing yield, or infer chip physics from a photo.

Research the smallest scientifically defensible model contract for this project. Begin with a single transmon and effective electrical parameters; do not broaden into a survey of quantum computing.

Answer:
1. Which Hamiltonian/model and parameterization should we use? Explain at a high level, but supply exact units and conventions needed by implementers: energy versus energy divided by h, ordinary versus angular frequency, transition definitions, and anharmonicity sign/magnitude.
2. What bounded parameter regime is appropriate for a documented example, and why? Separate source-supported values from proposed exploratory bounds.
3. Which objectives and constraints form a nontrivial optimization? Specifically audit target transition frequency, anharmonicity, charge sensitivity, and optional coherence. Flag cases where the proposed objective simply runs to a search boundary or is underconstrained.
4. What variation model could be used honestly? Distinguish effective-parameter uncertainty, manufacturing variation, measured yield, correlations, and unsupported independent distributions.
5. Is a coherence objective feasible without inventing noise amplitudes? If not, explicitly recommend deferring it and define a useful alternative.
6. Provide one exact official library example or primary-source result we can reproduce after the start. State inputs, expected outputs only when actually sourced, numerical caveats, and how to check convergence.

Prefer official scqubits documentation/source and primary papers. Do not invent constants or assert that calculations were executed. Link the exact source section for each decision-driving claim. Return a concise model contract, risks, and changes to the proposed product. Clearly distinguish well-supported physics, proposed modeling assumptions, and unanswered questions.

At the first checkpoint, give your strongest conclusion and biggest unresolved risk even if research is incomplete.
```

## 6. Copy-paste prompt: Lane B / Library feasibility

```text
Research-only preparation for a 24-hour HackCMU project; hacking starts at 9 PM. Do not implement application code, install the prototype, or run a prototype before permitted. Inspect official documentation and source read-only.

Project: a Next.js/TypeScript visual qubit-design workspace with a Python FastAPI/scqubits backend. One transmon model, a small parameter search, constraint checking, and reproducible parameter-variation comparisons. User controls attach to an SVG schematic. No physical chip-photo extraction, electromagnetic solver, fabrication simulation, or LLM-generated numerical results.

Determine whether scqubits provides the minimum reliable implementation path. Return:
1. Exact documented class/method signatures for model creation, low-lying energy evaluation, transition calculations, parameter sweeps, and any appropriate noise/coherence support. Include source URLs and version context. Do not guess APIs.
2. Dependency and numerical-convergence requirements. Distinguish necessary packages from optional QuTiP/GUI dependencies. Flag headless/container constraints and any deployment integration unknowns.
3. One official example to reproduce after hacking starts, with a short test specification and observable pass/fail conditions. Do not write our application code or pretend the test has run.
4. A bounded search strategy appropriate for a small model; separate nominal screening from robust evaluation of finalists. Address fixed seeds, matched comparisons, rechecking finalists, invalid states, and CPU budget limits.
5. A minimal frontend/backend data contract: typed fields, explicit units, model version, solver settings, uncertainties, constraints, provenance, failures. Stay high-level where the physics lane must decide.
6. Whether Vercel frontend + one containerized CPU Python service is reasonable, and which current hosting/dependency facts must be verified. Do not invent latency, cost, or memory benchmarks.
7. Existing scqubits GUI/Explorer features that overlap our proposal. State what we should reuse conceptually and what our product must contribute beyond a reskin.

Prioritize integration blockers over a long technology shopping list. Source every decision-driving API/dependency claim. Label documentation-backed versus personally executed evidence; no execution is requested here.
```

## 7. Copy-paste prompt: Lane C / Adversarial product and optimization audit

```text
We are considering a 24-hour HackCMU optimization-track project called Qubit Studio. Before 9 PM, research/planning only; do not implement the application.

Concept: one superconducting-transmon model, visual schematic with floating component controls, real calculated energy levels/frequency/anharmonicity, explicit constraints, and candidate comparison under assumed parameter variation. Coherence is optional and must be supported by a defensible noise model. Proposed stack is Next.js plus Python/scqubits. Two builders and a reviewer, Macs, one day.

We are not claiming new physics, arbitrary material discovery, accurate chip-photo reconstruction, experimentally measured yield, or replacement of fabrication experiments.

Your job is to challenge the idea constructively, not hype it:
1. Inspect actual existing capabilities in scqubits GUI/Explorer, Quantum Metal, and the closest relevant design/optimization tools. What already does the proposed loop? Use official docs or primary research rather than listicles.
2. What specific user task could this improve for a student or researcher? Separate an educational instrument from a research-grade optimizer. Do not fabricate interviews or demand.
3. Is the proposed optimization genuinely nontrivial? Identify objectives that reduce to pushing a slider to a boundary, redundant constraints, or uncertainty assumptions that predetermine the winner.
4. Recommend ONE defensible, small optimization problem with a clearly explainable trade-off and plausible overnight implementation. If no credible one is supported, say so rather than manufacturing a story.
5. Propose a judge-controlled demonstration that proves a useful capability, with an honest failure/infeasible outcome. Do not guarantee an improvement percentage or a baseline-versus-robust-winner reversal without evidence.
6. Name the smallest meaningful differentiation achievable in one day. Visual polish alone is not a research contribution, but interaction/education can be a legitimate product contribution if framed correctly.
7. Give a GO / CONDITIONAL / NO-GO recommendation, the strongest reason, and exactly which claim we must not make.

Keep the report concise and source-backed. Return nearest alternatives, decision-driving evidence, specific risks, and changes to the product brief. A search result or model opinion is not proof. Distinguish source inspection from execution.
```

## 8. Cross-review prompt

Use after the first reports arrive. Attach only the relevant reports and citations.

```text
Audit these research outputs for a one-day Qubit Studio build. Do not write another general report.

Identify only contradictions or omissions that could cause: wrong numerical output, misleading scientific claims, a trivial optimization, a failed integration, or a dishonest demo.

For each issue return:
- Exact conflicting claims.
- Primary source needed to resolve it (inspect it if accessible).
- Binding proposed decision.
- Confidence and remaining uncertainty.
- Whether it blocks implementation or can be deferred.

Pay special attention to units/h versus hbar, ordinary versus angular frequency, anharmonicity sign, effective parameter versus physical fabrication variable, noise assumptions, uncertainty correlations, sampled feasibility versus manufacturing yield, objective degeneracy, convergence, and whether documented library Explorer features already cover our intended differentiation.

Do not resolve a disagreement by majority vote among models. Prefer a source, derivation, or a clearly specified post-start execution test.
```

## 9. Source quality and synthesis rules

- Primary library docs/source establish supported APIs, not end-to-end runtime performance.
- Primary papers establish their reported model/results under their conditions, not applicability to arbitrary devices.
- Reviews help orient the topic but should not be the only basis for exact numerical choices.
- Vendor/hosting documentation establishes advertised constraints, not actual cold-start or search latency for our app.
- Agreement among ChatGPT, Claude, and Grok is not independent evidence if they repeat the same unsupported claim.
- Code-looking output is not a tested implementation.
- Do not copy research prose or example code without checking provenance/license where relevant.
- Preserve uncertainty rather than turning every blank field into a confident default.

## 10. Decision ledger template

| Question | Proposed decision | Primary source | Evidence state | Blocker? | Owner |
|---|---|---|---|---|---|
| Model/parameterization | Unresolved | — | Pending research | Yes | A |
| Units/conventions | Unresolved | — | Pending research | Yes | A+B |
| Nontrivial objective | Unresolved | — | Pending research | Yes | A+C |
| Variation assumptions | Unresolved | — | Pending research | Yes for robustness claims | A |
| Coherence support | Unresolved | — | Pending research | No if explicitly deferred early | A+B |
| Library/API path | Unresolved | — | Pending research | Yes | B |
| Novelty/usefulness | Unresolved | — | Pending research | Yes for pitch | C |
| Reference validation test | Unresolved | — | Pending research | Yes | A+B |
| Hosting path | Proposed container backend | — | Not deployed/benchmarked | Yes before cloud reliance | B |
| Pre-start activity rules | User reports 9 PM start | Organizer confirmation needed | Unverified details | Yes for pre-start execution | Reviewer |

Evidence states: source inspected; inferred/proposed; conflicting; requires execution; executed and verified. Do not mark anything executed based on a generated report alone.

## 11. Final research contract template

Create only after synthesis; do not fill missing decisions with plausible numbers.

```text
Product promise:
Primary user:
Track justification:
Supported model and source:
Inputs, units, conventions, bounds:
Outputs and definitions:
Objective and constraints:
Why the optimization is nontrivial:
Uncertainty assumptions and their provenance:
Noise/coherence included or explicitly deferred:
Library/API version and source:
Numerical convergence checks:
Reference reproduction test:
Search and finalist recheck strategy:
Performance/hosting tests still required:
Frontend controls and linked outputs:
Judge intervention:
Honest success and infeasible outcomes:
Differentiation from existing tools:
Forbidden claims:
Remaining blockers and owners:
GO / CONDITIONAL / NO-GO:
```

## 12. Stop conditions

Stop expanding research when the contract is source-backed and the remaining uncertainty requires execution rather than more prose.

Do not commit to a fabricated scientific claim just to meet the clock. If a useful model and nontrivial objective cannot be specified, the team must decide before investing in the UI whether to narrow the promise or reject the quantum direction.

The target at 9 is not "we know quantum computing." It is:

**We know exactly what we will calculate, why it matters, what assumptions it needs, and how the first real run can prove us wrong.**
