# Qubit Studio UI

CAD-style workbench over the transmon solver in `../simulation`.

```bash
npm run dev    # http://localhost:3100  (3000 is taken by another service)
```

Requires the FastAPI backend on `http://127.0.0.1:8000` (override with `QUBIT_API_URL`).
The browser uses same-origin proxy routes for evaluation, optimization, stress testing,
tunable-transmon analysis, and material sensitivity scenarios.

The Design Lab adds a goal verdict, grid-search optimizer, deterministic nine-corner
EJ/EC stress test, flux and junction-asymmetry controls, demo presets, and JSON report
export. Material combinations remain explicitly labeled as sensitivity scenarios unless
the imported dataset has a matching record.

The **Chip builder** workspace adds a reusable component palette,
drag-and-drop placement with grid snapping, editable layers/materials/dimensions, custom
parametric pieces, connection ports, a generated 3D preview, basic design checks, browser
saves, and JSON import and JSON/SVG export. Supported junction and capacitor areas can be applied
to the teaching model; every other layout feature remains explicitly illustrative. Template
references point to the original KQCircuits, Qiskit Metal, or gdsfactory project rather than
presenting recreated teaching shapes as fabrication-ready source geometry.

The main workspace keeps linked 3D/Layout selection, split panes, focus and layer inspection,
visual material choices, saved inspection views, and exact electrical editing. **Learn** offers
the short Myla tour, full feature tour, a guided chip-building workshop, and technical notes.
**Ask Myla** opens local teaching immediately. **Ask Gemini** explicitly calls the existing
server-side explanation route when `GEMINI_API_KEY` is configured; no provider credential is
needed for local teaching or numerical calculations.

Run `npm run check` for the unit, lint, production-build, typecheck, and controlled browser tiers.
See [the integration report](../docs/myla-unification.md) for source provenance and real-app checks.
