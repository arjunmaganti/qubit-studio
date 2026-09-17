# Qubit Studio — agentic UI slice: independent execution brief

## Status
Working local prototype at http://localhost:3100. Backend http://127.0.0.1:8000. No deployment. Not final visual approval or full product completion.

## Division of work
- Claude Code, verified Opus 5 / high / Claude Max banner: sole ui/ writer in tmux qubit-ui. Read screenshot/reference handoff, built Next.js/TypeScript/r3f/SVG application, tested, corrected browser findings. Final marker QUBIT_UI_SLICE_DONE observed.
- Grok: grok.com login verified, default grok-4.6 available; supplied an independent UX/model-contract acceptance review. This was a requirements review, not a finished-code audit. First tool-enabled review wandered into extra tool consultation and was intentionally terminated; bounded context-only pass produced grok-review-final.txt.
- Hermes: read existing simulation contract, launched backend, independently ran API/tests/build, exercised browser interactions, identified and returned framing/axis/delta issues to sole writer, verified corrected screenshots.
- Installed Codex failed harmless smoke call because it is too old for configured model. No tooling upgrade or API-billing fallback performed.

## Working scope
- CAD-style parts tree, neutral canvas, selected-part inspector and live result dock.
- Actual orbital 3D using react-three-fiber/Three.js; flat SVG schematic and split view.
- Named selectable meshes; schematic and tree selection cross-highlight the object.
- EJ, EC and offset charge editors; advanced numerical cutoff; independent electrical inputs, not a fake frequency lock.
- Same-origin /api/evaluate proxy to existing scqubits backend. No fabricated fallback results.
- Calculated metrics, energy levels and charge-response arrays.
- Baseline pin and deltas; reset controls.
- Optional exploded slider implemented as viewing-only separation with guides, not physics.
- Technical details progressively disclosed; illustrative geometry/materials explicitly separated from model inputs.

## Independently executed verification
- Backend: health returns ok/isolated-transmon. pytest: 12 passed, two dependency deprecation warnings.
- UI: npm run check passes typecheck, 24 unit tests, production build. npm run lint passes. Node experimental type-stripping/module warning remains non-failing.
- UI HTTP 200 at :3100; backend :8000 operational.
- Real evaluate EJ15/EC0.3/ng0 returned f01=5.682575677295095 GHz; EJ20 same EC/ng returned 6.613448853504742 GHz. Browser edit displayed 6.6134 GHz and preserved baseline EJ15. No manufactured fixture used.
- Final corrected desktop screenshot inspected. Default object fits; chart uses kHz shifts instead of identical rounded GHz axis labels.
- Final split screenshot after resize settled shows full separated chip plus schematic. Resize refit preserves orientation but resets manual zoom (known limitation).
- Schematic capacitor selection verified to select tree, mesh and inspector together. Orbit gesture visibly changed camera in initial browser pass; exploded layers visually verified on final build.
- Browser request blocking simulated connectivity failure: numeric fields cleared to dashes, charts emptied, Pin baseline disabled. Removed blocking and edited again: live results recovered.
- EJ40/EC0.15 final browser state showed <0.001 kHz and explicit below-reporting-floor text rather than numeric zero.
- Responsive width 390px: document scrollWidth equals 390; canvas remains present. This is a narrow-layout smoke check, not exhaustive mobile usability certification.
- Unit tests cover reducer out-of-order completion and formatting; adversarial browser network reordering was not separately performed.

## Corrections from actual visual QA
1. Over-zoomed default chip clipped bottom.
2. Split viewport initially clipped the object; responsive camera fitting added.
3. GHz chart labels rounded different values identically; changed to relative kHz.
4. Red/green sign-only deltas incorrectly implied better/worse; changed to neutral signed values.

## What still needs establishing
- Visual acceptance: density, initial labels and first-use explanation remain a first draft; first screen still exposes several technical symbols and needs novice feedback.
- Next product milestone: wire existing search as constraints -> candidate comparison -> preview/apply, versus further 3D/explode polish. Recommendation: search next, with a bounded visual-polish pass, to reveal meaningful trade-offs.
- Material presets/geometry-to-physics are not defined or built; current materials are appearance only.
- Save/reopen, undo/redo, view cube, chart hover readouts and automated browser regression tests are not implemented.
- Below-reporting-floor charge curve can still display an extremely tiny numerical variation with rounded zero axis ticks; suppressing unresolved variation or adding a plotting-resolution notice is a remaining scientific-visualization refinement. Metric itself is correctly unresolved.
- No production deployment, authentication, operational hardening or load testing.

## Artifacts / restart
UI source: /Users/vaibhav/hackcmu/ui
Builder report: /Users/vaibhav/hackcmu/ui/IMPLEMENTATION-REPORT.md
Reference and browser evidence: /Users/vaibhav/hackcmu/design/reference-pack/
Run UI: cd /Users/vaibhav/hackcmu/ui && npm start (build already produced).
Run backend: cd /Users/vaibhav/hackcmu/simulation && .venv/bin/python -m uvicorn api:app --host 127.0.0.1 --port 8000
Current preview processes intentionally left running; Claude writer idle. No automatic continuing work scheduled.
