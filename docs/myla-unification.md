# Myla unification

This integration combines backend commit `f9acff1` with `origin/main` at `6fa9c39`
in `/Users/vaibhav/hackcmu-worktrees/myla-unification`, branch
`integrate/myla-unification`. The original `/Users/vaibhav/hackcmu` working tree
and its local edits are retained separately.

## Preserved and combined behavior

| Area | Combined behavior |
| --- | --- |
| Hardware and Layout | Detailed packaged rendering, responsive fit, balanced/high quality, exploded assembly, linked selection/visibility, split resizing, layer palette/opacity, focus/restore, saved inspection views, and narrow-pane labels. WebGL loading/unavailable states remain usable alongside Layout. |
| Local UI polish | Model/Appearance/Geometry inspector tabs, compact view/assembly/result menus, keyboard tab navigation, and bundled Instrument Sans with its license. |
| Myla | Immediate anchored local teaching; automatic part notes allow CAD interactions. Explicit Ask Myla supports an optional provider request, Retry, Cancel, snapshot invalidation, and focus return. Opening notes never requests a provider. |
| Learning | Both the short Myla tour and the full feature tour, the interactive build workshop with required choices and current solver results, and technical Notes. |
| Builder | Existing component library, presets, compatible replacements, materials, layers, custom pieces, routing ports, layout/circuit/3D previews, browser save, JSON import and JSON/SVG export. Drag coordinates honor SVG scaling; rotated port positions agree with connection endpoints. |
| Builder numerical handoff | Positive finite physical areas feed the bounded teaching model. Range clamping is explicit and result identity matches applied values. Multiple-junction layouts retain their visual pieces and identify the first-junction fixed-model scope; the separate flux experiment remains available. |
| Design | Exact numeric goal input plus sliders, solver recommendation and explicit Apply, evaluated/rejected candidate inspection, recommended/applied/frozen-baseline chart markers, expanded graph, frozen baseline assessment and selection evidence. |
| Backend architecture | One Page-owned evaluation/session store; evaluate, search, material-scenario, stress, and tunable endpoints. Compatible search-branch evidence is added without introducing a competing decision store. Baseline-only changes do not stale candidate results; baseline assessment freshness is separate. |
| Persistence and evidence | Save/restore/history, share links, frozen baselines, JSON/PDF reporting, current-result guards, full-precision producing coordinates and cutoff, and retained experiment provenance. |

The original dirty rendering and inspection files already matched latest main.
Only the remaining interface polish and font assets were ported separately.
The feature-discovery branch was already included in backend. Unique useful
search/design-workspace capabilities were integrated into the existing architecture;
old duplicate hooks and page shells were not copied over the current owners.

## Verification

Evidence is written under ignored `test-results/`. The unified tree passes 161
frontend tests, 47 numerical/API tests, a production build, TypeScript, and ESLint
with no warnings. The controlled browser harness passes all 16 required journeys
with 32 controlled requests, two actual Page exports, and no incoherent renders.
Real-app checks additionally cover Myla, the chip builder, import/export, the build
workshop, detailed inspection, and the recovered search/learning interfaces.
Final real-app results are recorded in the user-facing handoff.

```sh
npm --prefix ui test
npm --prefix ui run lint
npm --prefix ui run build
npm --prefix ui run typecheck
npm --prefix ui run test:browser
MPLBACKEND=Agg simulation/.venv/bin/python qa/run-python.py
```

For real-app checks, start FastAPI and a production Next server on unused ports,
with `QUBIT_API_URL` pointing at that backend. This session uses UI port 3117 and
backend port 8017, leaving the original services alone.

```sh
node qa/browser/unification.cjs http://127.0.0.1:3117
node qa/browser/inspection-controls.cjs http://127.0.0.1:3117
node qa/browser/render-consistency.cjs http://127.0.0.1:3117
QUBIT_UI_URL=http://127.0.0.1:3117 node qa/browser/full-feature-tour.cjs
QUBIT_UI_URL=http://127.0.0.1:3117 node qa/browser/search-parity.cjs
QUBIT_UI_URL=http://127.0.0.1:3117 node qa/browser/feature-discovery.cjs
```

The unification smoke uses the real numerical service for evaluation and the
workshop, and explicitly mocked Gemini replies. Live provider credentials and a
live external provider request were not part of this verification. Local teaching
and numerical calculations require no provider credentials.

The search extension changes response metadata and source hashes. Regenerated
browser fixtures were compared recursively against their predecessors: every
pre-existing non-timing value was unchanged. New evidence fields are additive.

No deployment or remote branch update is included in this local integration.
