# Qubit Studio — UI/UX session handoff

## Task and boundaries

Continue UI/UX exploration with Vaibhav in a separate chat. This is design discussion, not permission to implement. Confirm competition timing/rules before code. The research integration chat owns reconciliation of the scientific reports and the final model contract; do not independently rewrite it or edit raw research reports.

Read `docs/quantum-design-lab-design.md` for the proposed architecture and product direction. Some scientific scope is provisional and may change as reports are reconciled.

## Binding user clarification

This is an explicitly simplified interactive SIMULATION, not an accurate real-world quantum chip or materials predictor. Optimize within the model. Internal calculation consistency matters; real-device calibration and experimental accuracy are not requirements. Do not bog down the design conversation in research-grade validation caveats. Do not make unsupported claims about fabricated chips either.

## What the team wants

An ambitious, striking interface with floating controls/components and a genuinely compelling simulation/optimization experience. Avoid both a generic dashboard and an unreadable sci-fi cockpit. User phrasing: "i want to cook up some crazy shit but i dont want it to be terrible either."

## Current visual proposal — not yet approved

A quantum workbench with one dominant stylized schematic, graphite canvas, silver device shapes, limited cyan/amber semantic accents, fine etched labeling, and compact linked scientific instruments.

- Fixed or gently tilted schematic, not mandatory free-orbit 3D.
- Floating parameter chips anchored to the relevant elements.
- Click a chip to expand one detailed editor, with slider, exact input, units, and reset.
- Highlight the edited element and the associated calculated outputs.
- Compact inactive controls rather than permanently expanded floating-card soup.
- No default freely draggable panels; preserve stable spatial relationships.
- Contextual factual explanation rather than a chat transcript.
- One continuous workspace with Explore, Stress test, and Optimize modes.
- A pinned baseline and linked result/comparison views.
- No arbitrary glow/particles pretending to be physical behavior.
- SVG/HTML is the proposed rendering foundation; decide on richer rendering only for a specific justified interaction.

Discussion was interrupted during the Explore-mode walkthrough. Resume from there, or refine the overarching interaction model with the user before specifying the rest.

## First research report received

Read `research/quantum/chatgpt-physics.md` if needed for metric vocabulary. It is a preserved original report, not an approved or independently verified final contract. No numerical execution was performed in the report, and its critical sources have not yet been independently audited in the integration chat.

Its provisional recommendation:
- A single-transmon spectral design and electrical-tolerance explorer.
- At a target nominal frequency, trade off retained anharmonicity against charge dispersion.
- Use explicit deterministic stress scenarios before optional probabilistic sampling.
- Defer coherence/lifetime, material selection, manufacturing yield, and gate fidelity.
- An inspectable one-dimensional trade-off curve may be more appropriate than a dramatic black-box optimizer.

UI implications to explore, NOT hard-code yet:
- Junction energy and effective capacitance/charging energy anchors.
- Energy levels, transition spacing, charge-sensitivity curve, feasible-region/constraint margins.
- Plain-language label paired with the exact scientific name, not a fake generic performance score.
- Stress scenarios visibly distinct from time dynamics or measured manufacturing outcomes.
- Do not design the hero around coherence decay or claim better information-retention time before that capability is approved.

Other research reports are still pending. UI exploration can proceed on the stable shell and interaction patterns without fixing numerical values or treating this one report as the final decision.

## Desired next deliverable

A coherent user journey and a small number of strong visual/interaction directions that preserve the spectacle without sacrificing usability. Explain what happens on selection, parameter change, stress testing, optimization, candidate comparison, and export. Decide which moments deserve motion and which must stay stable. No production builder until the user approves the direction and explicitly asks to implement.
