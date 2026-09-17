# Qubit Studio — Design Document

This document walks through the core features of Qubit Studio and how each is implemented in
the codebase. It is derived from reading the repository at
`github.com/arjunmaganti/qubit-studio` (a fork of `itsvaibhav2k-alt/qubit-studio`).

Qubit Studio is a CAD-style workspace for exploring a simplified, isolated-transmon qubit
model and designing within explicit frequency / charge-noise / anharmonicity requirements.
The project is explicit throughout its code and docs that it is a **teaching and exploration
tool**, not a calibrated predictor of real fabricated-device behavior (no coherence, T1/T2,
yield, or fabrication modeling).

## 1. System architecture

Qubit Studio is two services plus a documentation/QA layer:

```
ui/            Next.js 16 / React 19 app — UI, state machines, same-origin API proxy routes
simulation/    FastAPI service — the only place that runs scqubits calculations
docs/          Build contracts, research notes, team handoffs
qa/            Cross-cutting test runners (unit, python, browser/E2E)
design/        Reference visual/design artifacts
research/      Background research and model-limitation notes
```

**Why a separate Python service instead of doing physics in the browser/Node:** the numerical
diagonalization is done with [`scqubits`](https://scqubits.readthedocs.io/), a Python package,
via `simulation/engine.py`. The Next.js server never calls scqubits directly — every UI
component that needs a number POSTs to a same-origin Next.js API route
(`ui/app/api/<endpoint>/route.ts`), which forwards the request to the FastAPI backend at
`QUBIT_API_URL` (defaulting to `http://127.0.0.1:8000`) and streams the response back. This
means:

- The browser never talks to the solver directly (see the comment in `ui/app/api/evaluate/route.ts`).
- All physics bounds (EJ/EC ranges, `ncut`, etc.) are enforced twice: once by lightweight
  hand-written validation in the Next.js route, and authoritatively by Pydantic models in
  `simulation/engine.py`.
- Local development runs both processes side by side (`uvicorn` on :8000, `next dev` on :3100).

## 2. The simulation engine (`simulation/engine.py`, `simulation/api.py`)

This is the authoritative physics layer. It's a single FastAPI app (`api.py`) with a thin
routing layer over pure functions in `engine.py`. Every endpoint follows the same pattern:
Pydantic request model → pure calculation function → Pydantic-validated response, wrapped by a
`calculation_response()` helper that turns any exception into a generic `500` (never leaking
NaNs, tracebacks, or internal exception state to the client — see the custom
`RequestValidationError`/`ResponseValidationError` handlers in `api.py`).

### 2.1 Core model: isolated transmon (`/evaluate`)

`levels(ej, ec, ng, ncut, count)` builds an `scq.Transmon(EJ=ej, EC=ec, ng=ng, ncut=ncut)` and
diagonalizes it for the lowest eigenvalues, raising if any are non-finite. `metrics()` uses this
to derive the device's headline numbers:

- `f01_ghz`, `f12_ghz` — transition frequencies (differences of eigenvalues).
- `alpha_mhz` / `anharmonicity_mhz` — `f12 - f01` and its negative, reported in MHz.
- **Charge dispersion**: evaluated by diagonalizing at `ng=0` and `ng=0.5` and taking the
  difference in `f01`, in kHz. A `DISPERSION_RESOLUTION_KHZ = 0.001` (1 Hz) floor is applied —
  if the dispersion is below that, the engine reports `dispersion_status:
  'below_reporting_floor'` and `dispersion_khz: null` rather than a possibly-meaningless small
  number, while still exposing a conservative `dispersion_upper_khz` (`max(dispersion, floor)`)
  for selection logic.
- **Derived hardware quantities**: `critical_current_na` and `total_capacitance_ff`, back-solved
  from EJ and EC using the standard Josephson relations (`EJ = ħ·Ic / 2e`, `EC = e²/2C`).

`evaluate()` wraps `metrics()` and additionally sweeps `ng` over 101 points from 0 to 1 to
produce the `charge_response` curve used for the charge-dispersion plot in the UI.

### 2.2 Frequency-targeted design search (`/search`)

This is the "Design" mode's core solver. Instead of a general multi-parameter optimizer, it
uses a **1-D frequency-locked line search over the EJ/EC ratio**:

1. For each ratio `r` in `linspace(ratio_min, ratio_max, points)`, it solves the *unit* problem
   `EJ=r, EC=1` to find the level gap, then rescales `EC = target_ghz / gap`, `EJ = r·EC` so the
   resulting device's `f01` locks exactly onto the requested target frequency (within
   `FREQUENCY_TOLERANCE_GHZ = 1e-9`).
2. `score_candidate()` computes margins against every constraint (charge-budget in kHz,
   anharmonicity floor, EJ/EC bounds, ratio bounds, frequency lock) using a `bound_margin()`
   helper that treats differences within 4 ULPs as exactly zero, so floating-point roundoff
   never spuriously passes or fails a boundary case. Any negative margin becomes a named
   `Violation` in the response (`charge_budget_khz`, `anharmonicity_floor_mhz`, `ratio_lower`,
   etc.) — the API always returns *why* a candidate failed, never just a pass/fail bit.
3. Among all feasible candidates, `search()` selects the one with the **largest anharmonicity
   magnitude** (`selection_rule` is stated explicitly in the response).
4. `selection_evidence()` explains *why* that particular candidate won: it counts how many
   candidates with even higher anharmonicity were rejected and for what reasons, and records
   whether the winner sits at a ratio-grid boundary. This turns the search from a black box into
   an auditable result — the UI's "evaluated/rejected candidate inspection" feature (see §4.2)
   is built directly on this evidence.
5. An optional `baseline` (a previously pinned device) can be scored against the *same* search
   constraints without being folded into the candidate grid, so the UI can show "how does my
   pinned baseline compare to this search" as a separate, clearly-labeled assessment.

Every numeric candidate gets a stable `candidate_id` (`sha256` of hex-encoded EJ/EC/ng + model
version + ncut) so the frontend can de-duplicate and track candidates across renders without
relying on floating-point equality or array order.

### 2.3 Sensitivity and comparison endpoints

- **`/stress`** (`stress_test`): a deterministic 3×3 grid over `EJ × EC` at `±variation_percent`
  (default 5%) plus nominal, explicitly documented as *not* a probability/yield model. Returns
  per-corner metrics plus `min/max/span` ranges for `f01`, anharmonicity, and dispersion.
- **`/material-scenario`** (`material_scenario`): compares a baseline device to a "modified"
  one where the user supplies explicit `junction_critical_current_factor` and
  `total_capacitance_factor` multipliers (validated to keep EJ/EC inside the supported domain
  via a `model_validator`). This is a sensitivity tool, not a materials database — the response
  spells out its assumptions in plain text (`assumptions: [...]`) so the UI/LLM never overstate
  what it means.
- **`/evaluate-tunable`** (`evaluate_tunable`): a *separate* physical model, `scq.TunableTransmon`
  (asymmetric SQUID loop), parameterized by `EJmax`, asymmetry `d`, and flux. Returns a full
  51-point flux sweep (`flux_response`) alongside the requested single-flux point, and computes
  the effective EJ(flux) in closed form to compare against scqubits' numeric result. This model
  is explicitly kept independent from the main isolated-transmon device (`scope` string says so)
  so a flux experiment never silently reinterprets the main device's parameters.

## 3. API contract and validation

Each Next.js route under `ui/app/api/*/route.ts` either:

- Fully re-validates and coerces fields itself (`evaluate`, `material-scenario` — checking type,
  finiteness, and numeric bounds field-by-field, returning `400` with a specific message), or
- Delegates to the shared `proxySimulation()` helper (`ui/lib/proxySimulation.ts`) for endpoints
  whose payload shape is complex enough to trust the FastAPI-side Pydantic validation
  (`search`, `stress`, `evaluate-tunable`).

All proxy calls set a 30s timeout (`AbortSignal.any([request.signal, AbortSignal.timeout(30_000)])`)
and translate network failures into a `502` with a retry-friendly message, rather than letting a
downed backend hang the UI.

The `/api/explain` route (§6) uses a dedicated hand-rolled reader (`explain-handler.ts`) with a
32 KB body cap and manual streaming read — it doesn't trust `request.json()` on an
externally-reachable LLM-touching endpoint the way the numeric routes do.

## 4. Frontend state architecture

The UI is a single `page.tsx` composing a large tree of hooks and a `LayoutWorkbench` shell
(§5). Two state machines matter most:

### 4.1 Live "Explore" evaluation (`ui/lib/useEvaluate.ts`)

A debounced (140 ms) hook that re-POSTs `/api/evaluate` whenever `params` (EJ, EC, ng, ncut)
change. It guards against race conditions with a monotonically increasing `seqRef`: any
in-flight response whose sequence number isn't the latest is discarded, so rapid slider drags
never let a stale response overwrite a newer one. It also cross-checks that the returned result's
params match the request (`sameParams`) before accepting it — protecting against a backend/network
bug silently mismatching inputs and outputs. `evalReducer` (`evaluate-state.ts`) tracks
`idle/loading/ready/error`, and the hook derives a `stale` flag whenever the currently displayed
result doesn't match the live params (e.g., between an edit and the debounce firing).

### 4.2 "Design" experiments (`ui/lib/experiment-session.ts`)

This is the most complex piece of frontend logic in the repo: a hand-written reactive store
(class-based, not Redux/Zustand) backing the four experiment kinds — `search`, `stress`,
`tunable`, `material`. Key design choices:

- **One cell per experiment kind**, each tracking `status`, `result`, the exact `snapshot` of
  inputs that *produced* that result, and a `generation` counter used to discard results from
  superseded requests (mirroring the race-condition guard in `useEvaluate`, but per-experiment).
- **`experimentSnapshot()`** captures the full producing context (device params, goals, materials,
  the experiment's own controls like `variation`/`flux`/`materialPriority`) so that a result can
  always be traced back to exactly what inputs generated it — this underpins "current" vs.
  "outdated" badges in the UI (a `current()` check hashes the live context and snapshot's context
  and compares them, via a `decisionKey()` helper that explicitly excludes the baseline from the
  comparison, since baseline-only changes shouldn't invalidate a running search).
- **`getApply(kind)`** returns device params ready to "Apply" from a search or material result,
  but only if the record is still `current` and (for search) the selected candidate is feasible —
  Apply is deliberately impossible to trigger on stale or infeasible data.
- **Chosen candidate/material**: search can return many feasible candidates; the user can
  override the solver's automatic pick (`chooseCandidate`) or a suggested material stack
  (`chooseMaterial`), each re-validated against the *current* search result before being
  accepted.
- **`evidence`**: flattens all four experiment cells into a uniform array of
  `{kind, status, current, model, scope, inputs, summary}` records — this is what feeds both the
  exported JSON report (§7) and the LLM snapshot (§6), so "what did the user actually run and
  what did it return" has one canonical representation used everywhere.

### 4.3 Params, parts, and material domain models

- `ui/lib/params.ts` — canonical min/max bounds per `ParamKey` (`ej_ghz`, `ec_ghz`, `ng`,
  `ncut`) and a `clampParam` helper reused by every entry point (sliders, URL parsing, presets)
  so out-of-range values can never reach the backend.
- `ui/lib/parts.ts` — the fixed list of physical parts (`junction`, `capacitor`, `gate`,
  `substrate`, `ground`, `board`, `package`), each flagged `modeled: true/false` — i.e., whether
  selecting it actually maps to a solver input, or is drawn for visual context only. This drives
  both the 3D selection UI and the Myla explanation topics (§6).
- `ui/lib/material-records.ts` / `material-ranking.ts` — a small catalog of real materials (Al,
  Nb, Si, sapphire, etc.) with measured-loss-adjacent properties used to rank candidate
  substrate/film stacks after a search, and `component-materials.ts` tracks *per-part* material
  assignment independent from the solver (materials are explicitly documented as visual/quality
  evidence, never electrical solver inputs — see the Myla system prompt in §6).

## 5. 3D / Layout / Split workspace

`ui/components/layout/LayoutWorkbench.tsx` is the shell that owns cross-cutting UI state: which
view is active (`3d`, `layout`, or `split` with a draggable ratio), tour state, layer visibility
(`LayerDisplay`), an "inspection focus" state machine (`layout-inspection.ts`) for zooming into a
single part, and saved inspection views.

- **`Viewport3D.tsx`** — the 3D scene, built on `@react-three/fiber` + `@react-three/drei`
  (dynamically imported with `ssr: false` since WebGL needs a browser). It receives `selected`,
  `hiddenParts`, `explode` (0–1 assembled/exploded interpolation), and per-part material
  assignments, and exposes an imperative `ViewportHandle` (e.g., `resetView()`) via `handleRef`
  so the workbench chrome (outside the R3F tree) can still command the camera.
- **`layout/LayoutViewport.tsx`** — the 2D/SVG chip-layout rendering counterpart, sharing
  selection state with the 3D view ("linked selection" from the README).
- **`layout/LayoutInspector.tsx` / `Inspector.tsx`** — Model/Appearance/Geometry tabs for the
  selected part; electrical-parameter sliders live here and call back into `page.tsx`'s
  `changeParam`.
- **`ResultsDock.tsx` / `TradeoffChart.tsx`** — live results and the anharmonicity-vs-ratio /
  frequency-vs-ratio chart used to visualize search candidates, recommended/applied/frozen-
  baseline markers, and rejected candidates.

Material appearance flows through `materialColor()`/`resolveMaterial()` and is deliberately kept
downstream of, and independent from, the physics — changing a part's rendered material never
touches `params`.

## 6. Myla: local + LLM-backed explanations

"Myla" is the in-app teaching assistant, implemented as a two-tier system so that useful
explanation is available with zero external dependency, and a richer one is available on
explicit request.

### 6.1 Snapshot construction (`ui/lib/insight-snapshot.ts`)

`buildChipSnapshot()` assembles a single `ChipSnapshot` object from current params, the latest
device result, the pinned baseline, current UI selection state, goals, materials, and the
experiment evidence array from §4.2. This is validated both when built and when received
server-side (`parseChipSnapshot`), so a malformed or tampered snapshot is rejected before any
explanation logic touches it.

### 6.2 Local teaching (`ui/lib/explain-local.ts`)

`composeLocalMyla(topic, snapshot)` is pure, deterministic, and synchronous: a set of small
rule-based functions (`typicalF01`, `typicalAlpha`, `typicalRatio`, …) interpret the live numbers
against known transmon-design heuristics (e.g., "EJ/EC ≥ 20 is transmon territory") and render
LaTeX-flavored explanatory text via `RichMathText`/KaTeX. This is what powers "immediate anchored
local teaching" and requires no network call or API key — it's shown the instant a part is
selected.

### 6.3 Optional LLM explanation (`ui/lib/explain-llm.ts`, `/api/explain`)

On explicit "Ask Myla" request, the client posts selected topics + the full snapshot to
`/api/explain`, which is wired through `createExplainHandler()` (validates topics, parses/limits
the body, requires `readiness === 'ready'`) to `explainTopic()`, which calls the Gemini API
(`gemini-2.5-flash`) directly from the Next.js server (never exposing the API key to the
browser). Notable design points:

- **A carefully scoped system prompt** (`EXPLAIN_SYSTEM_PROMPT`) instructs the model to use
  *only* numbers present in the JSON snapshot, never invent T1/T2/yield/fabrication claims,
  correctly interpret `below_reporting_floor` as "smaller than the floor" rather than zero, and
  explicitly treat all snapshot text (including material labels and experiment context) as
  **untrusted data, never instructions** — a prompt-injection guard baked into the system prompt
  itself.
  - Multi-topic requests are merged into one call so Myla can connect e.g. a selected slider to
    its downstream result, and the response is constrained to strict JSON (`responseMimeType:
    'application/json'`) which `parseExplainJson()` re-validates (fenced-code stripping, type
    checks, length caps) before ever reaching the client.
  - `llmInsightsConfigured()` (`insight-llm.ts`) gates the feature on `GEMINI_API_KEY` being
    present; if unset, `/api/explain` returns a `503` and the UI falls back to local-only
    teaching — the LLM path is additive, never required.

### 6.4 `AskLlm.tsx`

The dialog component that ties this together: it shows the local explanation immediately,
optionally fires the LLM request when opened non-modally vs. modally (`modal` prop from
`page.tsx`), and supports retry/cancel with the same snapshot-invalidation semantics used
elsewhere (a stale snapshot can't be explained as current).

## 7. Chip Builder

`ui/components/ChipBuilder.tsx` + `ui/lib/chip-builder.ts` implement a small 2D CAD-like editor
independent of, but numerically connected to, the main device:

- **`BUILDER_TEMPLATES`** is a fixed library of reusable pieces (capacitor pads in several
  shapes, junctions, control/flux/charge lines, resonators, bond pads, airbridges, ground
  cutouts), each carrying its shape, role, default size, layer, material, port count, and a
  citation (`sourceName`/`sourceUrl`) to the real-world layout tool or paper it's modeled after
  (KQCircuits, Qiskit Metal, gdsfactory, the original transmon paper).
- **Replacement families** (`REPLACEMENT_FAMILIES`) group interchangeable templates (e.g., the
  four capacitor-pad shapes) so `replacementTemplatesForPart()` can offer "swap this piece for a
  compatible alternative" without the user hunting through the whole catalog.
- **Geometry → physics** (`ui/lib/geometry-model.ts`): placed junction/capacitor areas (µm²) are
  converted to EJ/EC using simple density assumptions
  (`criticalCurrentDensityAcm2`, `capacitanceDensityFfUm2`, both user-adjustable) via the standard
  relations `EJ = Ic/(4π·e)` and `EC = e²/(2·h·C)`. This lets a user draw a device by hand and get
  a numerically consistent EJ/EC pair to hand to the solver via "Apply" (wired through
  `onApplyElectrical` in `page.tsx`).
- **Import/export**: designs serialize to a versioned `ChipBuilderDesign` JSON
  (`{version, name, chipWidth, chipHeight, grid, parts, connections}`), can be imported back in,
  and export to SVG for use outside the app. Persistence for saved builder state, like saved
  devices, goes through browser storage (§8).
- **Multiple previews**: the same design model drives a 2D layout preview, a circuit-style
  preview, and feeds the 3D viewport — so editing a piece's geometry or material is reflected
  everywhere without duplicating state.

## 8. Persistence: saved designs, sharing, and export

- **`ui/lib/design-link.ts`**: encodes a full `ShareableDesign` (device params, goals, top/base
  materials, optional per-component materials) as URL query parameters
  (`createDesignShareUrl`/`parseDesignShareUrl`). Every value is re-validated and clamped on
  parse (`boundedGoal`, `clampParam`, material-catalog membership checks) — a shared link can
  never inject an out-of-domain or malformed device into the app, it just fails to parse.
- **`SavedDesigns.tsx`**: local saved-device list with restore/history, backed by browser storage
  (no server-side database — the README explicitly notes "No API key or database is needed").
- **`ui/lib/export-report.ts`**: builds a full JSON report (current device, goals, materials,
  baseline, and all current experiment evidence from §4.2) for download; `jspdf` is a dependency
  used elsewhere for PDF reporting per the unification doc.

## 9. Onboarding: guided tours and the Build Workshop

- **`GuidedTour.tsx`** with `guided-tour.ts` (short Myla tour) and `full-guided-tour.ts` (full
  feature tour) drive scripted walkthroughs that highlight UI targets (`tour-targets.ts`) and can
  reveal/hide parts and disclosures (`tour-disclosures.ts`) as they progress.
- **`BuildWorkshop.tsx`** with `ui/lib/build-workshop.ts` is a step-by-step guided build: each
  step in `WORKSHOP_STEPS` can require a choice (e.g., pick a metal or wafer material), drives
  which parts are hidden/shown and the explode/selection state (`workshopHidden`,
  `applyWorkshopScene` in `page.tsx`), and reads live solver results once available
  (`solverReady`), turning "build a transmon from scratch" into an interactive, physically
  grounded tutorial rather than a static walkthrough.

## 10. Testing and verification

The repo takes correctness seriously given the "no calibrated predictions" caveat — wrong
numbers would be worse than no numbers:

- **Python**: `simulation/test_engine.py`, `test_numeric_only.py`, `test_search_contract.py` —
  pytest suites over the calculation engine, run via `simulation/.venv/bin/python -m pytest -q
  simulation`.
- **Frontend unit tests**: co-located `*.test.ts` files next to nearly every `lib/` module
  (e.g., `experiment-session.test.ts`, `chip-builder.test.ts`, `design-link.test.ts`,
  `explain-safety.test.ts` — the last specifically testing the prompt-injection defenses in §6.3),
  run through a custom runner (`qa/run-unit.cjs`).
- **Browser/E2E**: `qa/browser/*.cjs` scripts (`unification.cjs`, `inspection-controls.cjs`,
  `render-consistency.cjs`, `full-feature-tour.cjs`, `search-parity.cjs`,
  `feature-discovery.cjs`) drive the real built app against a real backend on isolated ports,
  checking that journeys like the guided tour, search, and inspection controls render coherently
  end-to-end.
- **CI**: `.github/workflows/verification.yml` runs frontend, Python, and browser tiers on PRs
  and pushes to `main`; `scripts/check.sh` runs the full local sequence (unit → lint → build →
  typecheck → browser) in one command.
- Dependency pinning is explicit and intentional: `simulation/requirements.in` (direct deps) vs.
  `requirements.txt` (exact tested environment including NumPy/SciPy), and `ui/package-lock.json`
  is required for install (`npm ci`), so numerical results are reproducible across environments.

## 11. Summary of key design principles observed in the code

1. **One authoritative numeric source.** All physics goes through `simulation/engine.py`; the UI
   never re-derives or approximates a result it could instead ask the backend for.
2. **Provenance over convenience.** Every result (device evaluation, search candidate,
   experiment) carries the exact inputs that produced it and a freshness/currency check, so the
   UI can never silently present a stale or mismatched number as current.
3. **Explicit scope statements.** Nearly every response includes a `scope`/`assumptions` string
   in plain language stating what the model does *not* claim (no coherence, no fabrication yield,
   no probability model) — this repeats at the API layer, the LLM system prompt, and the UI copy.
4. **Numerical evidence over black-box selection.** The search endpoint doesn't just return a
   winner; it returns the full violation/margin breakdown and selection evidence so the choice is
   auditable.
5. **Two-tier assistance.** Local, deterministic, zero-dependency explanations are always
   available; a richer optional LLM tier is additive and explicitly guarded against acting on
   anything but the validated numeric snapshot.
