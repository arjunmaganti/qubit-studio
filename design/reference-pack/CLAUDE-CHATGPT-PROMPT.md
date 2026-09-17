# Qubit Studio: visual concept handoff

Attach reference-board.jpg, the selected full-size screenshots, and REFERENCES.md alongside this prompt. If the model cannot read local paths, upload the files; a filesystem path alone does not give ChatGPT/Claude access. If uploads are limited, prioritize A (SOLIDWORKS tree), C (watch assembled + exploded), B (Onshape), D (Falstad).

## Task
Design a reviewable UI concept for Qubit Studio, an approachable CAD-style quantum-chip simulation studio. Do not implement production code yet. Produce the assembled desktop state, selected-part editing state, synchronized 3D/schematic split state, and a future exploded state. Use the supplied screenshots as evidence, not just their brand names. Start by mapping each reference to its role. Do not create a landing page.

## User decisions, not optional suggestions
- CAD-inspired workspace, explicitly inspired by SOLIDWORKS, but more approachable and interactive.
- Fully orbital 3D AND a usable flat schematic; offer 3D / Schematic / Split. Do not replace 3D with a static tilted drawing.
- Shared selection and configuration across views. Switching views must preserve edits; returning to 3D restores the camera.
- First screen works for newcomers and physics students without a forced expertise questionnaire. Show a loaded example, plain-language part labels and a small optional first-action hint. Reveal symbols, units and equations progressively; never replace scientific accuracy with vague labels like quantum power.
- Signature moment: select a component, change its modeled properties or supported material preset, immediately see visual and calculated consequences and trade-offs.
- Exploded assembly is a later feature after the core loop, but the initial object must contain individually named and selectable parts. Future explosion uses reversible continuous separation with connector guides, preserves selection, supports orbit and reassembly. It is a viewing operation, not a simulation edit.
- This is a simplified simulation, NOT a real-device prediction product. Implementation must follow the declared model. Do not demand hardware calibration; do not invent effects for unsupported material/geometry controls.

## Reference recipe: transform principles, do not clone
A SOLIDWORKS = workspace skeleton and stable parts hierarchy.
B Onshape = separated-component alignment and attachment guides.
C Mechanical Watch = interactive assembly scrubber and approachable explanation. This is the primary interaction reference.
D Falstad = schematic, parameters and live results connected in one workspace.
E Shapr3D modeling = outlined dimensional object and compact labeled control treatment, not proof of a specific inspector layout.
F Shapr3D visualization = distinguishable material surfaces; not a physics model or verified material-picker UI.

## Proposed composition to test, not approved final styling
Desktop base: compact top bar; collapsible Parts tree on left; large viewport center; selected-part inspector right; resizable results dock below the viewport. Neutral light-gray modeling canvas, white/light tool surfaces, dark crisp text, outlined metallic geometry and one blue selection accent. This palette is a proposal; user approved CAD direction, not exact colors.
Top level: project name, undo/redo, compare, save. Viewport tools: 3D/Schematic/Split, view cube, fit/reset view, isolate selected part. Keep analysis actions (stress test, find designs) distinct from camera/view controls.
No oversized page title, decorative dashboard cards, sidebar chatbot, bento grid, neon particles, meaningless gauges or generic performance score.

## Explicit component anatomy
WorkspaceShell: stable regions; compact typography; objects rather than branding dominate.
PartsTree: plain-language name, selection, visibility/isolate actions. Separate modeled components from illustrative layers; not every visible layer is an editable model input.
ViewportToolbar: labeled controls with tooltips and keyboard access; Reset view always discoverable.
PartInspector: component name, one-sentence role, supported property control, slider + numeric input + units, reset, collapsed technical section. Prefer stable inspector over many expanded floating cards; a compact anchored label can connect selection to the part.
ResultsDock: computed transition frequency, energy-level gaps, anharmonicity and charge dispersion where supported. Show a baseline and the changed quantity; plain-language explanation plus accurate technical detail. No invented numerical results in a visual mockup: use dashes or explicit illustrative placeholders.
MaterialPresetInspector: unresolved numerical contract. If included in the concept, mark illustrative/model preset vs appearance-only. Do not silently map real material names to invented performance.
AssemblyScrubber (future): Assembled to Exploded; separation never changes numerical outputs. Restore assembled state and camera predictably.

## Interaction and honesty rules
- Empty-space drag orbits; explicit editing handles edit; no ambiguous gesture ownership.
- Immediate visual response, but stale calculations are visibly marked Updating. Latest edit wins when async calculations finish out of order.
- One edit is one undo action, not hundreds of slider frames.
- Cross-highlight selected part in 3D, schematic and tree.
- Before/after uses the same output scales; reset and compare are easy.
- Invalid values, numerical failure and no-feasible-candidate outcomes are designed states, not fabricated success.
- Colored outline plus text label, not color alone, communicates selection/status.
- Reduced-motion users can reach every state without cinematic transitions. Keyboard/numeric alternatives exist to drag gestures.
- Diagram dimensions/layer thickness can be exaggerated for legibility, labeled illustrative; geometry-to-physics mapping is not yet defined.

## Required output
1. State-by-state concept with explicit reference-role annotations.
2. Component and interaction notes with first-use flow.
3. Assumptions, unavailable evidence and unresolved model inputs.
4. If producing HTML, keep it standalone and clearly mark simulated interactions/data. Do not claim WebGL/solver integration from a static mockup.
5. Stop for visual review before production implementation.

Never collapse this into 'a sleek quantum dashboard'. The product is an object-centered CAD workbench that makes a simplified model understandable through manipulation.
