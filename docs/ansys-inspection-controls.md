# Layer display and component inspection

The split viewer extends the existing material/layer palette with per-component fill controls, temporary isolation, named inspection views and deeper zoom. These controls operate on the same die geometry already shared with the assembly renderer.

## Inspection behavior

- **Layer display controls** opens a compact panel for Package, Carrier, Substrate, Ground, Pads, Junction and Gate. Visibility remains shared with the 3D renderer. Solid, translucent and outline are top-down display treatments; they do not replace a component's physical material.
- **Translucent** reduces surface fill and grain while retaining readable boundaries. **Outline** clears the physical fill and surface treatment, preserving pad and ground contours, contacts, fan-outs and selectable interiors. The locator uses the same treatment.
- **Focus selected component** temporarily isolates the selected component and fits both panes to it, including a close clipping range for the tiny junction in 3D. **Restore previous view** recovers the prior cameras, selection and visibility, including components that were already hidden before focus. Selecting a different isolated component does not rewrite that return state.
- **Saved inspection views** retain the layout camera, selected component, visible layers, fill treatment and Material/Layers palette during the current workbench session. Applying a view changes presentation state only, preserving a deliberately hidden selected component or an explicitly cleared selection.
- Layout zoom extends to **24× (2400%)**, with cursor-centered wheel zoom and pan. Component fitting gives the junction and individual pads usable close inspection framing. Full-chip fit and the existing inspection return affordances remain available.

Myla, solver logic, parameter behavior and physical material assignments are unchanged. Layer display modes apply to the orthographic inspection pane; the assembly retains its existing material rendering and shares visibility/selection.

## Reference rationale

The adaptation follows inspection patterns in the original Ansys references reviewed for this work:

| Reference | Relevant interaction | Adaptation |
| --- | --- | --- |
| [HFSS 3D Layout viewing and visibility](https://innovationspace.ansys.com/courses/courses/ansys-hfss-3d-layout-getting-started/lessons/viewing-and-visibility-in-ansys-hfss-3d-layout-lesson-2/) | Distinct fill and visibility states help inspect stacked geometry | Solid, translucent and outline per component, coordinated with the existing palette |
| [HFSS original visibility training slides](https://innovationspace.ansys.com/courses/wp-content/uploads/sites/5/2021/07/HFSS_3DLGS_2019R3_EN_LE02_Visib-1.pdf) | Selection isolation, fit-selected inspection and view management | Temporary component focus with restoration, deeper zoom and named inspection views |
| [SIwave Layers Workspace](https://ansyshelp.ansys.com/public/Views/Secured/Electronics/v252/en/Subsystems/SIwave/Content/LayersWorkspace.htm) | Layer controls alongside the canvas | Compact component display panel with shared visibility controls |
| [Qiskit Metal transmon in HFSS](https://qiskit-community.github.io/qiskit-metal/tut/4-Analysis/4.11-Analyze-and-tune-a-transmon.html) | A transmon remains a small set of purposeful electrodes and surrounding geometry | Keep the existing physical chip and improve its inspection controls rather than adding decorative circuitry |

No reference graphics are embedded in the product.

## Verification

Run the focused visual suite against the local preview, after other browser suites finish:

```sh
node qa/browser/inspection-controls.cjs http://127.0.0.1:3126
```

The suite owns a disposable browser profile and writes screenshots plus `report.json` to `test-results/inspection-controls/`. It checks actual SVG fill behavior, material/input preservation, synchronized hiding, close 3D isolation framing and restoration, focus switching to a previously hidden component, hidden/cleared-selection saved view restoration, locator consistency, the 24× limit, wheel zoom and pan, narrow split labels/control bounds and selected-junction clearance, stacked split overflow and page errors.

The existing frontend command remains `npm --prefix ui run check`; the prior rendering suite remains `node qa/browser/render-consistency.cjs http://127.0.0.1:3126`. The integrated focused run on September 12, 2026 passed all **11 checks** with **zero page errors** in Chromium 153.0.8010.12. Its seven screenshots were visually reviewed, including isolated 3D junction framing, high magnification, the narrow layer panel, selected-junction label clearance and stacked inspection. Broader frontend results are recorded in the accompanying verification output.
