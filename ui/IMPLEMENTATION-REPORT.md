# Qubit Studio UI — implementation report

Vertical slice of the CAD-style workbench over the existing FastAPI solver.
Sole writer scope: `/Users/vaibhav/hackcmu/ui/`. Nothing outside this directory was
created or modified. No commits, no deploys, no long-lived servers left running.

## How to start it

Backend (owned by the other session) must already be serving `http://127.0.0.1:8000`.

```bash
cd /Users/vaibhav/hackcmu/ui
npm run dev      # http://localhost:3100  (3000 is occupied by another service)
# or
npm run build && npm start    # production, also port 3100
```

Override the solver location with `QUBIT_API_URL` (default `http://127.0.0.1:8000`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server on 3100 (Turbopack) |
| `npm run build` | Production build — **passes** |
| `npm start` | Serve the production build on 3100 |
| `npm run typecheck` | `tsc --noEmit` — **clean** |
| `npm run lint` | ESLint (next config) — **clean** |
| `npm test` | 24 unit tests, Node's built-in runner — **24/24 pass** |
| `npm run check` | typecheck + test + build in one go |

## Architecture

```
app/page.tsx              workspace shell, all shared state
app/api/*                same-origin proxies to the simulation service on :8000
components/Viewport3D     react-three-fiber scene, orbit/pan/zoom, selectable meshes
components/Schematic      SVG circuit, same selection state
components/PartsTree      named hierarchy, visibility toggles
components/Inspector      selected-part properties, progressive technical detail
components/ResultsDock    metrics, energy levels, charge response, baseline compare
components/DesignLab      goals, optimizer, stress grid, tunable-transmon calculator
components/MaterialSensitivity free-form stack scenarios and imported evidence
components/ParamField     slider + exact numeric entry
lib/evaluate-state.ts     latest-edit-wins reducer (pure, tested)
lib/format.ts             number/dispersion/delta formatting (pure, tested)
lib/params.ts             bounds mirrored from engine.DeviceRequest
lib/parts.ts              part list; modeled vs illustrative
lib/useEvaluate.ts        debounced fetch (140 ms) wired to the reducer
```

No state library, no CSS framework, no test framework. Tests run on Node 22's
built-in runner with `--experimental-strip-types`, so there is no build step for them.

## Implemented interactions

**Loads ready.** First paint is the workspace with the transmon already on the canvas
and an automatic evaluate at the backend defaults (EJ 15 GHz, EC 0.3 GHz, ng 0, ncut 30).
No landing page, no wizard. One dismissible hint, which also selects the junction for you.

**Selection is shared three ways.** Clicking a part in the tree, a mesh in 3D, or a symbol
in the schematic selects it everywhere, plus the inspector and the stage-toolbar breadcrumb.
Selection is an outline *and* a text label, never colour alone. Empty space or `Esc` clears it.
Each part also has a visibility toggle in the tree, honoured by both views.

**Parts.** Modeled: Josephson junction (EJ), shunt capacitor pads (EC), charge gate line (ng).
Illustrative: ground plane, substrate — these open an inspector that explicitly says they have
no properties in this model, and they get no fabricated numbers.

**3D.** Genuine orbit / pan / zoom via OrbitControls, no auto-spin, no gimbal problems at the
poles. `Reset view` returns the camera. The camera refits its distance whenever the canvas
changes size (Split, window resize, narrow layouts), keeping the current orbit orientation —
this is what fixed the clipped-in-split report.

**Views.** 3D / Schematic / Split. Both viewports stay mounted and are toggled with CSS, so
switching views preserves the WebGL context, the camera, and the selection.

**Editing.** Slider plus exact numeric entry per parameter, with units and a per-parameter
reset. Out-of-range text is rejected with the accepted range rather than silently clamped;
the slider is clamped to the engine's own bounds. `ncut` is present but demoted into a
collapsed "Solver settings" section and labelled a solver setting, not a device property.
EJ and EC are independent — the frequency is an output, and nothing pretends to lock it.

**Live results.** Every edit debounces 140 ms and issues a numbered request. Only a response
answering the newest request can become current; anything older is dropped even if it lands
later. While a newer request is outstanding the previous values stay on screen, labelled
`Updating…`, and the dock header names the exact parameters those displayed values came from.

**Honest states.** Backend unreachable → `Disconnected`, an explanatory error box with Retry,
and every calculated field cleared. Nothing is estimated, interpolated or cached locally.
`dispersion_khz: null` renders as `< 0.001 kHz` with "below the reporting floor — not zero,
just unresolved" and is excluded from baseline deltas; it is never coerced to 0.

**Baseline compare.** `Pin baseline` is disabled unless a calculation has completed for the
current parameters (so in-flight and disconnected states cannot be pinned). Pinning freezes
the whole result, including its parameter snapshot; later edits never rewrite it. Deltas show
signed values in neutral colour — a rise or fall is not good or bad in free exploration.
Both charts overlay the baseline as a dashed series on the same scale.

**Charts.** Energy levels come from `levels_ghz` with the f01 and f12 gaps annotated. The
charge-response chart plots the *shift* of f01 in kHz from its own ng=0 value (naming that
reference value in GHz), because a few kHz of dispersion is invisible against a ~5 GHz
absolute axis. Both are drawn only from returned arrays; no points are synthesised.

**Exploded assembly.** One continuous Assembly slider separates the named meshes along the
stack with dashed connector guides. View-only: it changes no parameter and triggers no
request, and the label says so.

**Narrow widths.** Three-column at ≥1100px, two-column below, single column below 720px.
The dock and inspector reflow instead of overflowing.

## Verification performed

- `npm run build`, `npm run typecheck`, `npm run lint`: all clean.
- `npm test`: 24 tests over the two pure modules that carry the risky logic —
  latest-edit-wins ordering (including out-of-order responses, stale failures that must not
  blank a good result, and failures that must clear numbers), dispersion null handling,
  delta/baseline formatting, dash placeholders for missing values.
- Proxy exercised end to end against the live backend on a temporary 3100 server:
  valid request returns 101 charge points; EJ 40 / EC 0.15 returns
  `dispersion_khz: null, dispersion_status: below_reporting_floor`; out-of-range,
  missing-field and malformed-JSON requests return 400 with a specific message;
  a deliberately wrong backend URL returns 502 with the "no values are estimated locally" text.
- Server-rendered first paint contains the shell, tree, both viewports and the dock with
  em-dash placeholders and zero numeric results — confirming nothing is fabricated before
  the solver answers.
- Both temporary smoke-test servers were shut down; ports 3100 and 3101 are free.
- Visual verification was done by Hermes at 1440x1000, not by this session (Chrome here
  could not reach any local HTTP server, including the backend — an environment issue that
  was not pursued). The three defects Hermes reported (substrate clipping, over-zoomed
  initial camera, flat charge-response axis) and the split-frustum blocker are fixed above.

## Added design-lab workflow

- `/search` is wired to a goal-based optimizer with preview/apply and feasibility counts.
- A plain-language verdict checks frequency, anharmonicity, and charge-dispersion goals.
- A deterministic nine-corner stress grid sweeps independent EJ/EC variation.
- A scqubits TunableTransmon calculator adds flux and junction asymmetry.
- Critical current and effective total capacitance are derived from EJ and EC.
- Demo presets and local JSON report export support a short, repeatable presentation.
- The material sandbox accepts arbitrary pairings. Imported evidence is shown only for exact
  matches; all other combinations use explicit user-controlled sensitivity factors.

## Known gaps

- Geometry is still illustrative and is not mapped to Hamiltonian or loss parameters.
- Stress results are sensitivity corners, not a probability distribution or fabrication yield.
- Material scenarios do not predict a real device or a topological qubit.
- Undo/redo is not implemented. There is per-parameter reset, a global `Reset parameters`,
  and the pinned baseline, but no history stack — so the "one edit is one undo action" rule
  has nothing to violate yet.
- No view cube; `Reset view` is the single camera-recovery control.
- The camera refit on resize also resets a user's manual zoom when the panel size changes.
  Orientation is preserved; distance is not.
- Charts are hand-rolled SVG with no hover readout or tooltips.
- Tests cover the pure modules only. Component rendering, the r3f scene and the proxy route
  are verified by build, by the curl matrix above, and by Hermes's visual pass — there is no
  automated DOM or browser test.

## Next decisions

1. Undo/redo: one entry per committed edit, or skip it in favour of baseline compare?
2. Should `/search` come back as a constraints panel with preview/apply, now that the core
   loop is stable, or stay out?
3. Should resize refit preserve manual zoom (fit only when the object would clip) rather
   than always refitting distance?
4. Charge-response chart: keep the kHz-shift framing, or offer an absolute-GHz toggle?
5. Persistence — saving a design and reopening it — is not started and is not in this slice.
