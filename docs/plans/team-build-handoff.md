# Qubit Studio — Team Build Handoff

**Status: proposed implementation assignment, awaiting team approval.**

This document is for sharing with the team. Writing it does not authorize agent messages, coding, commits, worktree creation, or deployment. No agents were launched or steered to produce it.

## 1. What we are building next

Extend the existing Qubit Studio explorer into a constrained-design workspace:

**Explore → set requirements → find designs → inspect a candidate → compare the consequence of a tighter requirement.**

This is an explicitly simplified transmon simulation, not an accurate predictor of fabricated hardware. Its calculations must be consistent with the selected model; experimentally calibrated hardware accuracy is not a project requirement.

Keep the existing light CAD-style workspace, 3D/schematic/split views, component selection, assembly inspection, parameter evaluation, and baseline overlays. Do not restart the app.

### What already exists

- Next.js UI under `ui/`.
- Python/scqubits calculation service under `simulation/`.
- Browser → Next.js `/api/evaluate` → Python `/evaluate` connection.
- Python `/search` calculation, not yet connected to the requirements UI at the last inspected checkpoint.
- Seven passing numerical tests from the test-only pass.

At nominal 5 GHz, the recorded 401-candidate experiment returned approximately 302.4 MHz retained transition-spacing difference under a 10 kHz charge-dispersion ceiling, versus 261.6 MHz under a 1 kHz ceiling. A 1 kHz ceiling with a 300 MHz minimum had no qualifying candidate in that grid. These are test observations, not values to hard-code into the application.

## 2. Team assignments

| Lane | Owner | Deliverable | Must not touch |
|---|---|---|---|
| Search integration | Codex / GPT Astra session | Reliable search API, decision state, baseline assessment, comparison semantics, tests | Page composition, UI components, CSS, 3D rendering |
| Design workspace | Claude terminal session | Requirements controls, candidate plot/inspection, comparison presentation, bounded layout fixes | Numerical engine, API routes, search hook/reducer, scoring logic |
| Integration and verification | Hermes in the coordinating chat, after approval | Shared-contract review, checkpoint/worktrees, controlled integration, independent verification | No competing third feature implementation lane |
| Product and visual direction | Vaibhav + separate UI/UX session | Decide whether the experience is compelling; explore the later signature interaction | No uncoordinated edits in either implementation lane |
| Demo/comprehension review | Team reviewer/demo lead | Exercise the live decision workflow, identify confusing explanations, rehearse honest outcomes | No new scientific requirements or scope expansion |

## 3. Codex: search integration and decision state

### Main responsibility

Make the existing search accessible to the website and define exactly what each result/state means. Python is authoritative for metrics, eligibility, margins, and recommendation. Frontend helpers may classify comparisons from returned evidence but must not independently invent physics.

### Files owned

Existing files, only where necessary:
- `simulation/engine.py`
- `simulation/api.py`

Proposed new files:
- `simulation/test_search_contract.py`
- `ui/app/api/search/route.ts`
- `ui/lib/search-types.ts`
- `ui/lib/search-params.ts`
- `ui/lib/search-state.ts`
- `ui/lib/search-baseline.ts`
- `ui/lib/search-comparison.ts`
- `ui/lib/useDesignSearch.ts`
- Corresponding `ui/lib/search-*.test.ts` files.

Final exported names must be frozen in the shared contract before Claude wires them in. Existing evaluation types/hook remain dependencies, not casually editable shared files.

### Work items

1. Preserve the current search objective and tested model.
2. Add stable evaluated-candidate IDs, explicit tolerance metadata, and optional frozen-baseline assessment.
3. Reuse one backend scoring function for grid candidates and baseline assessment, with appropriate reasons for generated mapping errors versus a baseline missing a new target.
4. Add a Next.js search proxy using the current configuration pattern, bounded timeout, validation, and normalized errors.
5. Build explicit search state: no run yet/dirty, running, current feasible, current infeasible, error; historical output is clearly stale.
6. Invalidate pending requests immediately when inputs change. Older responses must never become current.
7. Preserve baseline parameters, numerical settings, source result, originating requirements, and whether it was a recommendation or arbitrary selection.
8. Re-score the baseline at its saved parameters without scaling it to a new target. Return it separately from grid candidates/counts.
9. Classify comparisons: comparable requirement-tightening cost, unchanged result, infeasible result, ordinary candidate comparison, changed-context comparison, or pending/unresolved assessment.
10. Separate candidate-result freshness from baseline-assessment freshness. Pin/Clear must not destroy an otherwise-current candidate set; stale baseline assessments must not attach to a replacement baseline.
11. Provide real calculated response examples and tests for Claude's integration.

### Done when

Valid searches, empty results, invalid inputs, solver/backend errors, rapid edits, baseline replacement, changed targets, and stale responses have explicit tested behavior. The existing evaluation flow still works. No result is invented, silently relaxed, or called globally optimal beyond the evaluated grid.

## 4. Claude: requirements workspace and interaction

### Main responsibility

Make the decision workflow understandable and usable inside the existing workspace. Consume Codex's shared contract instead of creating a parallel state/model implementation.

### Files owned

Existing:
- `ui/app/page.tsx`
- `ui/app/globals.css`
- `ui/components/Inspector.tsx`
- `ui/components/ResultsDock.tsx`
- `ui/components/Schematic.tsx`
- `ui/components/Viewport3D.tsx`

Proposed new:
- `ui/components/RequirementsPanel.tsx`
- `ui/components/TradeoffPlot.tsx`
- `ui/components/DesignComparison.tsx`
- `ui/lib/camera-fit.ts` and test, only if still needed after inspecting current fixes.
- `ui/lib/plot-scale.ts` and test.
- `ui/lib/design-copy.ts` and test, for wording/labels only, not eligibility or comparison classification.

### Work items

1. Add Explore / Design modes. Explore retains current independent parameter editing.
2. Add target frequency, dispersion ceiling, minimum transition-spacing difference, and explicit Find designs action.
3. Use logarithmic slider positioning for the wide dispersion range, plus exact numeric entry. Consume shared bounds rather than duplicate validation rules.
4. Show linked EJ/EC values when inspecting a locked-frequency search candidate. Do not display a lock badge on an unrelated applied Explore device before a valid path exists.
5. Replace the charge-response plot with the trade-off plot in Design mode instead of adding another permanent dashboard panel.
6. Display feasible/rejected points, requirement boundaries, recommendation, inspected point, and baseline where meaningful.
7. Support point click/keyboard/path-stepper inspection. Distinguish recommendation, preview, application, and baseline.
8. Show metrics/energy levels for the same candidate named in labels. While evaluation catches up, explicitly show loading/stale state.
9. Offer Apply qualifying design only for a fresh feasible inspected candidate. Applying copies full-precision parameters, ng=0, and that run's ncut into the working device.
10. Present baseline assessment and comparison classifications from Codex. Do not infer “cost of tightening” merely because a number decreased.
11. Handle never-searched, dirty, running, feasible, infeasible, and error states without fake success.
12. Recheck and narrowly fix short-window scene collapse and split/exploded clipping if still present. Preserve the existing camera interaction and visual direction.

### Done when

A user can complete the full live requirements/search/comparison flow, understand why a candidate qualifies or fails, and return to the unchanged Explore experience. The interface does not mix parameters/results from different candidates or runs. Relevant frontend tests, typecheck, lint, build, and coordinated browser checks pass.

## 5. Shared contract decisions to freeze before implementation

These reconcile the two proposed plans. Both owners must acknowledge them.

- **State ownership:** `useDesignSearch` owns design draft, search lifecycle, inspected candidate, and frozen-baseline decision state. Claude must not duplicate these stores in `page.tsx`. The page owns the applied device and visual-only state.
- **Search completion:** a fresh feasible search automatically inspects the recommendation, but never applies it or replaces the baseline. Infeasible searches have no recommendation.
- **Evaluation reuse:** feed the selected display parameters to the existing single `useEvaluate` pipeline. Search summaries are not full `DeviceResult` objects. The full result may be fetched without displaying a charge-response panel in Design.
- **No parameter/result mismatch:** candidate B labels must not appear with candidate A levels as though current.
- **Numerical settings:** Design ncut can initialize from Explore but thereafter belongs to the Design draft. Only Apply changes the working device.
- **Baseline:** frozen parameters are never retuned. Its originating requirements are not replaced by a newer dirty draft. Current eligibility is assessed independently; an empty grid does not automatically prove the baseline fails.
- **Comparison semantics:** arbitrary pinned candidates and changed-context runs are not automatically “cost of tightening.” Store provenance and consume Codex's classification.
- **Rejected candidates:** inspectable for explanation, not applicable as a qualifying design. Pin/Apply need explicit fresh-state guards.
- **Units:** EJ/h, EC/h, and f01 in GHz; signed alpha and positive A=-alpha in MHz; dispersion in kHz; ng dimensionless. Dispersion is the magnitude of transition-frequency variation, not a signed endpoint difference or a lifetime.
- **Unresolved values:** null dispersion is not zero and not a perfect candidate. Use returned status/buffer semantics.
- **Bounds and explanations:** do not compare raw margins across incompatible units to guess a binding constraint. Explain why better-A evaluated choices fail or identify the relevant search bound.
- **Export names:** Codex publishes the final types/hook names and Claude explicitly adopts them. No competing hook contracts.

## 6. Isolation and Git setup

At the last inspection, `/Users/vaibhav/hackcmu` was an initialized repository with no commits; app files were untracked. Recheck before setup because other sessions may change state.

### Proposed worktrees

| Path | Branch | Owner |
|---|---|---|
| `/Users/vaibhav/hackcmu` | Current checkpoint/main | Preserve existing preview; no parallel writers |
| `/Users/vaibhav/hackcmu-worktrees/search` | `feat/design-search` | Codex |
| `/Users/vaibhav/hackcmu-worktrees/workspace` | `feat/design-workspace` | Claude |
| `/Users/vaibhav/hackcmu-worktrees/integration` | `integration/design-wave` | Integration owner, created when useful |

Paths/branches are proposed, not created by this document.

### Setup sequence after approval

1. Confirm existing writers have reached a stable stop and identify live preview processes.
2. Review root/subdirectory instructions and current source changes.
3. Add appropriate ignore rules before staging: virtual environments, dependencies, Next build output, caches, local env/secrets, runtime logs, and unrelated research dumps must not accidentally enter a baseline.
4. Stage an explicit reviewed allowlist of app source, dependency manifests/lockfile, tests, and necessary project instructions. Do not blindly `git add .`.
5. Commit the shared working baseline locally after approval. No push or publication.
6. Commit/freeze the agreed interface definitions and contract, with no duplicate owners, before both writers depend on them. If definitions are not code-ready, keep dependent UI work paused until the contract checkpoint exists.
7. Create both worktrees from the same agreed checkpoint. Give each session its exact working directory and allowlist.
8. Use separate local dependency/build directories; do not share `.next`, Python environments, or symlink external node_modules into a Turbopack worktree. Use the UI lockfile and a compatible recorded numerical environment.
9. Discover unused preview ports before starting anything. Do not stop/restart the current 3100/8000 services or reuse their build directories while preserving the existing preview.

Separate windows are not isolation. Both agents must verify their cwd/branch before writing. Worktrees prevent file collisions, not semantic conflicts.

## 7. Execution order and ownership discipline

1. Final contract amendments acknowledged by both agents.
2. Shared baseline/contract checkpoint and worktree setup approved and completed.
3. Codex implements search integration/state; Claude implements presentation against the frozen interface and verified response examples.
4. Each lane runs focused gates in its own worktree and returns a stable checkpoint, exact diff/file list, tests, remaining limitations, and commit IDs if local commits are authorized.
5. Integration owner reviews Codex's completed change first, then Claude's. Resolve contract conflicts explicitly rather than accepting both variants.
6. Combine in the integration worktree and run the complete workflow.
7. Return one bounded correction batch to the appropriate owner, re-integrate, and reverify the affected behavior.
8. Share the integrated preview for team approval. Deployment is a separate authorization.

Agents may not edit outside their allowlist, opportunistically redesign the app, change each other's contracts, publish code, or continue into another feature wave. A needed cross-lane change is a coordination request, not permission to cross ownership.

## 8. Verification and acceptance

### Numerical/integration lane

From its worktree, using its own environment:

```sh
simulation/.venv/bin/python -m pytest -q simulation/test_search_contract.py simulation/test_engine.py simulation/test_numeric_only.py
```

The new test file is planned; this command is for after implementation. Cover:
- Candidate ID stability and selected membership.
- Frozen baseline preservation and changed-target mismatch.
- Independent baseline assessment during grid infeasibility.
- Negative-alpha enforcement, dispersion floor/buffer, bounds, and invalid inputs.
- Comparison provenance and changed-context cases.
- Request invalidation on edit, late responses, pin/clear race conditions.

### Frontend gates

In each applicable worktree and again after integration:

```sh
npm --prefix ui test
npm --prefix ui run typecheck
npm --prefix ui run lint
npm --prefix ui run build
```

Component-interaction testing must cover more than pure label helpers. If extra test tooling is needed, propose the smallest addition and assign one dependency/lockfile owner before editing shared manifests. Browser checks remain necessary.

### Combined live acceptance

- Existing Explore selection/edit/evaluate/pin/reset interactions still work.
- A fresh 5 GHz search displays linked parameters and consistent outputs.
- Tightening the ceiling from 10 to 1 kHz shows the actual returned comparison and re-scores the baseline.
- A 1 kHz ceiling with 300 MHz minimum reports no qualifying candidate in the tested grid.
- Changing target frequency remaps the path; no old 5 GHz result appears current.
- Inspecting does not apply or change the baseline.
- Applying a fresh feasible candidate updates Explore correctly.
- Rapid edits and candidate changes cannot display mismatched current labels/results.
- Dirty/running/error states cannot enable invalid actions.
- Empty, unchanged, and unresolved states are understandable.
- Short-window and split/exploded framing remain usable.

Recorded numerical examples guide regressions but do not replace current execution. Browser rendering, successful interaction, numerical correctness, and deployment readiness are separate claims.

## 9. What the team can do while the two lanes build

- Vaibhav/UI-UX session: explore a design-only storyboard for “pull apart the device, reveal anchored controls.” Keep artifacts separate; no implementation changes in this wave.
- Reviewer/demo lead: prepare a short explanation and rehearse requirement changes with actual outcomes. Test whether a newcomer understands what is held fixed and what is sacrificed.
- Other teammates: review the workflow and identify comprehension problems, rather than launch additional overlapping coding agents.

## 10. Deferred scope

Anchored floating editors, broader visual polish, undo/redo, saved projects, accounts, database, public deployment, additional physics, coherence/lifetimes, fabrication/yield, Monte Carlo, materials, multi-qubit models, and novel optimizer algorithms are outside this implementation wave.

These are not blanket prohibitions on the eventual project. They require a separate decision after this complete workflow is working.

## Approval checklist

- [ ] Team agrees with scope and lane ownership.
- [ ] Codex final contract includes the amendments in section 5.
- [ ] Claude adopts the final contract and does not duplicate decision state.
- [ ] Shared checkpoint and worktree setup are explicitly approved.
- [ ] Each agent receives implementation approval for its own worktree only.
- [ ] Integration owner and reviewer are identified.

**Finish line:** one integrated, test-backed decision workflow the team can operate and explain—not two independently finished branches.
