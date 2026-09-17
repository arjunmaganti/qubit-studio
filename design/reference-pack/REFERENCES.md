# Qubit Studio — evidence-based reference pack

These are source references, not an approved app design. Six entries have assigned roles. Official screenshots, marketing illustrations and exercised interactions are explicitly distinguished. Screenshots are for design reference, not licensed assets to ship in the product.

## Start here
Open index.html for the annotated visual board. Attach reference-board.jpg, REFERENCES.md and CLAUDE-CHATGPT-PROMPT.md to your design model, plus full-size screenshots as needed.

## Synthesis
SOLIDWORKS structure + Mechanical Watch interaction + Onshape explode guides + Falstad linked results + Shapr3D object/material treatment. The synchronized 3D/schematic split and material-to-model mapping are our proposed synthesis, not verified features of every reference.

## A. SOLIDWORKS — workspace anatomy
Source: https://help.solidworks.com/2025/english/SolidWorks/sldworks/c_user_interface_overview.htm
Evidence: Official documentation images extracted from the loaded page and visually inspected. Not a live SOLIDWORKS session.
Observed: Top command hierarchy, named feature tree on left, neutral gray graphics area, outlined solid geometry, contextual selection breadcrumb and a docked task pane.
Borrow: Stable workspace: compact top tools, collapsible named Parts tree, large viewport, docked selected-part Inspector. Maintain clear selected-part identity.
Avoid: Full legacy ribbon density, tiny icon-only commands, mechanical CAD operations unrelated to the simulation. Do not copy the documentation site's red header.
Components: WorkspaceShell, PartsTree, SelectionBreadcrumb, Inspector
Images: screenshots/01b-solidworks-tree.png, screenshots/01-solidworks-interface.png

## B. Onshape — exploded assembly relationships
Source: https://cad.onshape.com/help/Content/Assembly/exploded_views.htm
Evidence: Official help text and embedded screenshot inspected; assembly editor not operated.
Observed: Separated colored components remain aligned; dashed explode lines preserve attachment relationships; an explode-step editor and named explode hierarchy are visible.
Borrow: Deliberate separation paths, connector lines, selection while separated, named components. Our simplified version uses one continuous assembly slider rather than an authoring panel.
Avoid: Random scattering, cinematic debris, treating exploded positions as physical simulation edits, requiring users to author explode steps.
Components: ExplodeController, ExplodeGuides, PartIsolation
Images: screenshots/02-onshape-explode.png

## C. Bartosz Ciechanowski — Mechanical Watch
Source: https://ciechanow.ski/mechanical-watch/
Evidence: Live WebGL illustration rendered. Slider dragged with browser mouse events and separated state visually verified. Orbit behavior described by source; not independently tested here.
Observed: One large outlined 3D object on a quiet pale field; one slider reveals internal layers; consistent view preserves orientation; colored internal parts distinguish mechanisms.
Borrow: The primary interaction reference: assembled-to-separated scrubbing, inspectable internals, restrained controls, progressive explanation around the object. A novice can act before knowing vocabulary.
Avoid: Copying a long article as the app layout, auto-scrolling narrative, color-coding every surface without purpose. Watch construction is not a chip blueprint.
Components: AssemblyScrubber, FirstInteractionHint, ProgressiveExplanation
Images: screenshots/06-watch-assembly.png, screenshots/06-watch-exploded.png

## D. Falstad CircuitJS — connected schematic and results
Source: https://www.falstad.com/circuit/circuitjs.html
Evidence: Live default LRC circuit rendered with schematic, controls and scope traces. Parameter-response behavior not independently exercised in this pass.
Observed: Large central circuit, right-side parameter sliders, aligned bottom scope plots; labels and results share a single workspace.
Borrow: Schematic plus controls plus results in one spatial frame. Our 3D and schematic selections share a single state; results stay visible during edits.
Avoid: Retro typography, black/neon styling as a default, electrical current animation applied to quantum states, generic waveforms that do not come from the model.
Components: SchematicViewport, ParameterEditor, ResultsDock
Images: screenshots/04-falstad.png

## E. Shapr3D — readable dimensional object styling
Source: https://www.shapr3d.com/product/3d-modeling
Evidence: Official marketing illustration and tool-label artwork inspected. Not a screenshot of the complete working editor; support workspace page blocked by Cloudflare.
Observed: Exploded mechanical illustration uses dark edge lines, gray solids and blue accent parts. Separate artwork shows compact icon-plus-text modeling labels.
Borrow: Readable object edges, restrained shading, accent reserved for meaningful parts, compact controls with text labels. Use as rendering and control-treatment reference only.
Avoid: Claiming this proves an adaptive inspector workflow; copying marketing page composition, introducing Extrude/Loft tools without a geometry model.
Components: ChipMaterialStyle, SelectionOutline, ViewportToolbar
Images: screenshots/03-shapr3d-modeling.png, screenshots/03-shapr3d-interface.png

## F. Shapr3D — material rendering contrast
Source: https://www.shapr3d.com/product/visualization
Evidence: Official page and rendered product image inspected. Material drag/drop is stated in source copy, not interacted with; screenshot does not expose a material picker.
Observed: Visibly distinct black frame, bright blue blades and pale metallic supports; restrained highlights separate material surfaces.
Borrow: Material appearance should communicate distinct surfaces without drowning the object in reflections. Our inspector may preview named material presets; that picker is a proposed component, not a copied observed UI.
Avoid: Treating photorealism as scientific accuracy, confusing appearance changes with calculated electrical effects, copying the yellow marketing background.
Components: MaterialPreview, MaterialPresetInspector
Images: screenshots/08-shapr3d-materials.png

## Gaps and exclusions
- SOLIDWORKS marketing page failed; official help images supplied the actual interface evidence. Direct image download was blocked; the images were extracted from the rendered help page.
- Shapr3D workspace help hit a Cloudflare verification wall. The supplied Shapr3D images are marketing/rendering evidence, not an authenticated editor session.
- Spline homepage and EveryCircuit landing page were inspected but excluded from the curated board: those captures did not add enough specific workspace evidence.
- Watch explode-slider drag was exercised and visually verified. SOLIDWORKS/Onshape editor workflows and Shapr3D material dragging were not run. Falstad default rendered; numeric response was not tested in this pack.
- No captured reference establishes a quantum-chip geometry model, material physics, or our proposed synchronized 3D/schematic implementation.
- No production application code was changed.
