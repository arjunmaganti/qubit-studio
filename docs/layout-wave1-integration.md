# Layout and component inspection integration

Historical checkpoint for the first Layout integration. The subsequent combined product implementation is documented in [product-integration.md](product-integration.md); that work resolves the legacy-renderer alignment described below.

This branch adds the reviewed Layout interface and component inspection to the cleaned application. It is based on the safety-fix checkpoint `274c337`; that checkpoint's dependency lockfile, regression harness, evaluation lifecycle, experiment store, exports and backend remain intact. The work was developed and reviewed in isolation from the active 3D implementation.

## Shared shell changes

- `ui/app/page.tsx` renders `LayoutWorkbench`, initially selects the junction, and guards direct parameter/preset/reset edits in Design. The page continues to own electrical parameters, evaluation, experiments, frozen baseline, materials, explanations and exports. Selecting a hidden part reveals it.
- `ui/components/ParamField.tsx` adds optional disabled and display-label props, preserving the existing validation and synchronization defaults.
- `ui/components/ResultsDock.tsx` accepts an optional navigation hint for the expanded results view.

The remaining implementation is modular Layout components, scoped CSS and pure geometry/inspection helpers. The original 3D renderer is supplied as children and remains unchanged. Reconcile shell ownership against the completed 3D checkpoint; do not replace that renderer or copy this page wholesale over another active branch.

## Rendering and inspection

`LayoutArtwork` supplies live SVG geometry to the overview, close-up and locator. Both capacitor pads use the shared `capacitor` identity and EC editor. Junction, gate, ground and substrate retain their existing identities. Decorative carrier details are presentation only, not circuit elements or geometry-derived electrical inputs.

Every selectable component has an inspection view with contextual annotations. Capacitor inspection offers both/left/right pad focus. Double-clicking geometry or pressing I on a focused component opens inspection. Selection through the canvas, Components menu or linked circuit follows the new component while retaining the original return camera. The locator, Full chip action and Escape within the canvas restore that camera. Magnification has one meaning: 100% fits the illustration; there are no physical scale claims. Ground openings expose continuous substrate; they are not holes through the chip. Carrier mounting holes are separate visual context.

## State contracts

Explore edits keep historical results labeled outdated during pending or failed evaluation. Baseline pinning and export require a completed current result. Exports preserve the producing parameter/result pair, frozen baseline and experiment evidence.

Design keeps direct parameter controls and resets disabled. Its selected-part inspector can display read-only candidate coordinates, while chip/circuit/results continue to describe the applied device until explicit Apply. Search Apply still uses the exact candidate EJ/EC, ng=0 and producing cutoff from the existing experiment session. Inspection, view changes and component selection do not create another solver pipeline or replace experiment state.

## Geometry alignment still required

The retained legacy 3D renderer has rectangular pads and a gate on the opposite side from the approved stepped Layout. The representations share logical identities and effective parameters, but do not yet share physical mesh definitions. Layout retains its approved silver/gold artwork; material selection changes legacy 3D appearance according to the existing sandbox behavior.

At integration with the completed 3D checkpoint, agree orientation, pad outlines, junction enlargement, ground openings, gate side, chip/carrier relationship and material presentation. Extract shared visual geometry only after those decisions. Keep both pads tied to EC and decorative carrier details outside the circuit model.

The smallest next step is that integration followed by reproducing the existing checks and repairing demonstrated regressions. No new geometry-to-capacitance engine is part of this change.
