# Testing and UI integration

This tooling package starts from commit `78157f8ab0727b489767372d4cc85b8d347226be`
plus the 31 verified, previously uncommitted cleanup files. That commit alone is
not the tested application. The cleanup source must accompany these tooling
changes when an integration checkpoint is prepared.

The initial tooling handoff was **prepared and locally verified**. Local results
do not establish GitHub CI status. Check the repository’s Verification workflow
for the published commit; only a successful GitHub run establishes CI green.

## Clean setup

Use Node **22** (`.nvmrc` currently pins `22.17.1`, compatible with the manifest's
`>=22.6.0 <23` engine), npm 10, and Python **3.12**. The simulation lock was
produced for Python 3.12; do not use the macOS system Python. CI uses Node 22,
Python 3.12, and Ubuntu 24.04. The portable browser tier uses the Chromium
revision installed by the exactly locked Playwright 1.63.0 dev dependency.
No globally installed browser, existing server, Gemini credentials, or environment
file is needed. Do not copy an environment file into the verification checkout.

From a complete repository checkout, on macOS or Linux:

```sh
nvm install
nvm use
python3.12 -m venv .venv
.venv/bin/python -m pip install -r simulation/requirements.txt
cd ui
npm ci
./node_modules/.bin/playwright install chromium
npm run check
cd ..
MPLBACKEND=Agg .venv/bin/python qa/run-python.py
```

On a clean Linux machine, replace the browser install command with
`./node_modules/.bin/playwright install --with-deps chromium`. It installs the
browser's OS dependencies as well. Use the local executable after `npm ci`;
do not let `npx` download an unpinned test runner. Windows-specific setup has not
been verified in this wave.

`npm run check` runs frontend tests → lint → **one** production build → explicit
typecheck → browser journeys. Build comes before typecheck because a clean
checkout does not contain `next-env.d.ts` or generated Next route types. Do not
prepend another build, reuse `.next` from another checkout, or change the script
back to running typecheck first. For a typecheck-only iteration before any build,
run `./node_modules/.bin/next typegen` in `ui`, then `npm run typecheck`.

## Required tiers

| Tier | Command | What actually executes |
| --- | --- | --- |
| Frontend unit/contract | `cd ui && npm test` | Existing `ui/lib/*.test.ts` through Node's test runner; currently 64 tests. The wrapper rejects zero tests, skipped tests, TODOs, or failures and writes TAP plus a summary. |
| Static/build | `cd ui && npm run lint`; `npm run build`; `npm run typecheck` | ESLint on the frontend, production compilation, and TypeScript over the actual application. `npm run check` orders these for clean checkout use. |
| React/browser | `cd ui && npm run test:browser` | 16 grouped journeys mounting the actual Page, Inspector, DesignLab, MaterialSensitivity, AskLlm and hooks in React StrictMode with installed ReactDOM and Chromium. |
| Python | `MPLBACKEND=Agg .venv/bin/python qa/run-python.py` | Real simulation and in-process API tests; currently 17. The wrapper requires nonzero execution, no skips, no errors, and writes JUnit plus a summary. |

These tiers run on every PR targeting `main`, every push to `main`, and manual
dispatch in `.github/workflows/verification.yml`. There are no path filters that
could bypass required verification, no deployment job, no repository secrets,
and no `pull_request_target`. Checkout credentials are not persisted, and token
permissions are limited to `contents: read`. Dependency or browser installation
failures fail the job. Evidence uploads also fail when their expected files are
missing. The dormant `docs/ci/github-actions.yml` is historical; the active
workflow and this document are the verification command references.

## Browser harness maintenance

`qa/browser/journeys.tsx` imports production modules through an alias resolving
to this checkout's `ui/`. Its small fixture hosts expose actual hook actions to
the test driver; they do not reimplement reducers, freshness decisions, Apply,
or export logic. The Page journey clicks the real export button and captures
the actual JSON Blob sent to its download anchor.

The Page journey verifies High detail is the default, then selects Balanced
through the real toolbar for software WebGL. It waits for actual mesh bounds
before testing interactions. Both Blob reads allow 15 seconds; the overall
browser deadline is 120 seconds to include initial shader compilation. These
are correctness checks, not GPU performance benchmarks. High-detail appearance,
orbiting, exploded separation, and narrow-pane framing are checked separately
against the real app. Geometry-bound unit tests cover current world transforms,
hidden groups, hit volumes, empty scenes, and viewport proportions.

`run.cjs` owns a temporary Chromium profile and an ephemeral loopback static
server. It does not start Next or FastAPI, touch another browser, or connect to
the running UI previews. Only its generated local asset files may reach the
network. API responses are explicitly controlled in the browser, and unknown
requests fail. Aborted requests can still be resolved by the fixture driver;
this deliberately tests application freshness guards when transport ignores
cancellation. Actual Tab and Escape key input goes through Playwright.

Coverage includes:

- First edited render immediately invalidates actions; reversed successes and
  late failures cannot override the current evaluation; wrong-result identity,
  invalid inputs, retries, and unmount cancellation.
- Fresh search never applies automatically. Explicit Apply preserves full
  precision `EJ`, `EC`, candidate `ng=0`, and the producing cutoff. Goal/ranking
  edits and same-event edit/Apply races invalidate stale recommendations.
- Actual Inspector tab changes preserve search, stress, flux, and material
  controls/results. Flux stays a separate model. Material labels and invalid
  factors cannot acquire stale scenario provenance.
- Actual Page export inputs match completed results; Save baseline stays frozen
  across subsequent edits; old experiment provenance remains labeled outdated;
  selected visual materials remain separate from electrical solver inputs.
- Dialog opening/reopening does not request AI. Ask and Retry are deliberate;
  duplicate requests are blocked; Cancel, Close, Escape, context changes, and
  unmount reject obsolete answers. Baseline, goals, material, experiment, cutoff,
  and readiness changes invalidate explanation evidence. Opening moves focus
  into the modal, Tab stays inside it, and Close/Escape restore the actual opener.
- Search and material Compare expose stable accessible names, disabled states,
  and `aria-busy` while running.

Numerical payloads live in `fixtures/solver.json`; provider replies are clearly
mocked in `fixtures/provider.json`. `fixtures/provenance.json` binds the numerical
payloads to the engine and requirements hashes. This is a deterministic wiring
tier, not an independent solver accuracy test or live HTTP/provider test. A hash
change fails before browser execution. After an approved engine/lock change,
review the numerical differences and regenerate with:

```sh
MPLBACKEND=Agg .venv/bin/python qa/browser/generate-fixtures.py
```

Do not regenerate fixtures just to hide a regression. Python tests remain the
separate check of actual numerical/API behavior.

The bundler and TypeScript transpiler reuse the versions already locked by Next
and the frontend. `build.cjs` intentionally depends on Next's compiled webpack
entry; a Next upgrade must rerun this tier and repair any incompatibility rather
than skipping it. This kept the dependency addition to Playwright and its core
package; existing lock entries and application versions were preserved.

`contract.json` declares 16 journeys. The runner rejects a missing report,
timeouts, duplicate/missing journeys, render identity errors, wrong Apply/export
counts, page errors, and unexpected network requests. Keep assertions coupled to
observable behavior. When approved UI controls move or change accessible names,
adapt the journeys to those actual controls; do not lower the expected count or
replace Page/Inspector with stubs to make integration pass.

## Separate maintenance and integration tiers

Run `cd ui && npm run test:browser:negative` when changing the harness itself.
Alternatively, manually dispatch the Verification workflow with
`negative_controls` enabled to run the same maintenance tier on Ubuntu.
Two builds remove Search or Compare accessibility attributes **in memory only**.
Each must fail at its specific component assertion. Compilation failure, a
missing browser, or a timeout is not a passing negative control. Their individual
reports deliberately say `FAILED`; the parent command exits zero only when both
expected regressions were caught. These controls are a maintenance tier outside
the normal PR workflow, so normal CI does not manufacture failures in its report.

Run `.venv/bin/python qa/check-empty-guards.py` from the repository root when
changing test discovery or wrappers (Node 22 must also be on PATH). It creates
temporary empty suites, executes the actual wrappers, and verifies that both
fail for empty execution. Node's synthetic passing file test must not count as
registered tests. Probe logs and summaries go to `test-results/guards/`.

Rendering/visual acceptance of the integrated 3D and Layout work is a separate
checkpoint. This CSS-free component harness does not establish production Next
hydration, responsive styling, GPU compatibility, chip appearance, or all future
Layout interactions. Run a real built-app browser check after both approved UI
checkpoints are integrated. Live Gemini verification, authentication, and rate
limiting remain explicit deployment follow-ups; this package does not implement
or validate account infrastructure.

## Evidence and failure diagnosis

All generated artifacts go under ignored, repository-relative `test-results/`:

- `unit/results.tap` and `unit/summary.json` for the most recent unit run.
- `python/junit.xml` and `python/summary.json` for the most recent Python run.
- `browser/regression-*/` (or `search-*` / `compare-*`) for each browser run:
  bundle build log, structured report, execution metadata, diagnostics, DOM,
  screenshot, Playwright trace, and the two actual Page exports on success.
  A setup/assertion failure writes `failure.json`; artifacts that require a
  running page cannot exist if browser launch fails. Browser runs use unique
  directories, preserving previous failure evidence.

To inspect a trace, run from `ui`:
`./node_modules/.bin/playwright show-trace ../test-results/browser/<run>/trace.zip`.
Treat screenshots as failure diagnostics, not visual acceptance evidence.

| Failure | Diagnosis |
| --- | --- |
| Missing Next types | Use the documented `check` order or `next typegen`; do not copy generated files from an active checkout. |
| Browser executable/OS library missing | Rerun the locked Playwright browser install command. Do not point at a personal browser profile or skip the tier. |
| Fixture provenance changed | Inspect engine/requirements/fixture diff and get any production change approved before regeneration. |
| Timeout or stale-action assertion | Read `report.json`, the last completed journey, controlled request records, trace, and diagnostics. Reproduce against real components before assigning blame to transport. |
| Unexpected network or page exception | Treat as a failure. Do not add a provider allowlist or disable error collection. |
| React `NaN` warning | The negative-input journey deliberately supplies an invalid number; its assertions verify that no solver request or Apply can use it. Dependency/WebGL deprecation messages are preserved separately from uncaught page errors. |
| Zero tests/skipped verification | Repair discovery or setup. Both wrappers and the browser completion contract reject an empty success. |
| Production behavior defect | Preserve the reproduction and stop for approval before modifying UI, physics, optimizer, or API behavior in this tooling wave. |

## Integration checklist after both UI checkpoints are ready

Use the **cleaned merged application behavior as the functional foundation** and
preserve the approved visual work from Fable and Layout. Do not integrate while
either writer is active. Checkpoints must include each writer's source diff,
new files, base/provenance, and verification evidence, not only branch tips.

Likely conflict areas:

| Shared files | Review responsibility |
| --- | --- |
| `ui/app/page.tsx` | Highest-risk composition conflict: one applied-device owner, evaluation freshness, experiment lifetime, explanation snapshot, frozen baseline, and actual export handler. |
| `ui/components/Inspector.tsx`, `ParamField.tsx`, `ResultsDock.tsx`, `PartsTree.tsx`, `DesignLab.tsx`, `MaterialSensitivity.tsx` | Selection/editor wiring, numeric drafts, event handlers, retained tabs, and action guards. Layout may move these into its own components. |
| `ui/app/globals.css`, `ui/app/layout.tsx`, new Layout CSS/components | Resolve approved appearance and shell composition without overwriting state fixes. This tooling wave changes none of them. |
| `ui/components/Viewport3D.tsx`, `Schematic.tsx`, `ui/lib/parts.ts`, `params.ts`, `chip-geometry.ts`, `camera-fit.ts` | Coordinate part IDs, selection, visibility, camera handles, and effective-parameter mapping across 3D and Layout. Preserve each UI owner's approved work. |
| `ui/lib/useEvaluate.ts`, `evaluate-state.ts`, `device-snapshot.ts`, `experiment-session.ts`, `useExperimentSession.ts`, `useExplain.ts`, `export-report.ts` | Preserve verified functional contracts; avoid restoring older copies incidentally through a UI merge. |
| `ui/package.json`, `ui/package-lock.json`, `.github/workflows/verification.yml`, `qa/browser/journeys.tsx` | Combine only necessary dependencies/scripts; retain locked install and clean-check ordering. Adapt actual UI selectors/imports to the approved shell and rerun. |

Contracts that must survive:

1. Results and actions must carry exact producing parameter identity, including
   cutoff. Invalidation must happen in the first changed render and inside event
   guards, not only in a later effect. Old successes and failures never win.
2. Page owns the applied device and visual state; experiment state must outlive
   tab content. Keep one owner per decision store. A fresh feasible search can
   inspect a recommendation but never Apply automatically. Apply is explicit
   and uses exact candidate coordinates and that search's cutoff.
3. Baseline data is immutable after capture. Exports contain current matching
   inputs/results and preserve each experiment's producing inputs and freshness.
   Candidate-result freshness and baseline-assessment freshness are distinct.
4. Explanation requests require completed evaluated evidence. Ask/Retry remain
   explicit, cancellation and full-context changes reject obsolete replies, and
   focus returns to the opening control.
5. Comparison classifications must distinguish a comparable recommendation
   change from an arbitrary candidate or changed-context comparison. Explain
   constraints/domain bounds using evaluated evidence; never use a hard-coded
   “closest to charge-variation limit” fallback.
6. If the earlier Design workspace contract is restored during approved UI
   integration, retain its `useDesignSearch` ownership, independent Design ncut
   after initialization, and candidate details through the shared guarded
   evaluation pipeline. The cleaned baseline currently uses
   `useExperimentSession`; this harness does not claim to verify a future,
   separately restored Design workspace or justify two competing stores.
7. Visual materials, chip geometry, Layout detail, and the separate tunable model
   must not silently change the fixed-transmon electrical model or acquire
   fabricated numerical evidence.

Proposed sequence:

1. Wait for both UI owners' ready checkpoints; record exact source manifests and
   preserve their approved screenshots/interaction evidence.
2. Create a new integration snapshot from the verified cleanup plus this tooling
   package. Do not use committed main alone or overwrite an active checkout.
3. Bring in Fable's chip/selection changes, then Layout's shell and linked views.
   Resolve shared composition and part contracts explicitly, keeping one state
   owner and the approved appearance. Freeze the combined interface before
   adapting tests.
4. Adapt selectors/imports to the actual integrated controls. Run all required
   tiers from clean dependencies, then the real built-app visual/keyboard checks
   covering 3D ↔ Layout, selection, camera behavior, editing, Apply, baseline,
   exports, and retained experiments. Preserve regressions as evidence.
5. Review the combined checkpoint. Commits, pushes, merges, GitHub execution,
   and any deployment require the user's later approval for that wave.

Runtime/setup references: [Node release support](https://github.com/nodejs/Release),
[Playwright browser installation](https://playwright.dev/docs/browsers),
[Playwright CI setup](https://playwright.dev/docs/ci), and
[setup-node runtime inputs](https://github.com/actions/setup-node).

## Layout interface follow-up

The actual Page journey uses the Layout shell: shared pad selection, capacitor inspection, Pin baseline, Design, the Device preset menu in Explore, and the material disclosures. Existing producing-result, frozen-baseline, stale-export and experiment-provenance assertions remain unchanged. The standalone browser bundle injects imported component CSS through `qa/browser/css-loader.cjs`; it still mounts the production components without stubs.

Four Layout unit tests cover whole-chip fitting, zoom semantics, inspection framing, and preserving the original return camera across part and pad-focus changes.
