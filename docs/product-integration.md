# Combined Qubit Studio product

The application combines the approved Layout inspection branch (`c24bbce`) with the gold/graphite hardware renderer from `feat/render-fidelity` (`3961a09`). It was developed in isolation on `feat/combined-qubit-product`, preserving the safety checkpoint evaluation, experiment, export and Design workflows. The renderer was imported selectively rather than merging an older application shell.

## Interaction

3D is the initial view. Layout remains a primary representation, and Split view places hardware and Layout in a resizable workspace. The divider supports pointer dragging, arrow keys and double-click reset. On narrower screens the two panes stack. Show circuit adds the linked equivalent circuit below the chip workspace.

All representations share the selected component and the existing page-owned parameters, visibility, evaluation and baseline. One inspector edits EJ for the junction, EC for either capacitor pad, and offset charge for the gate. Ground, substrate, carrier board and package provide contextual inspection. Selecting a part during close-up retargets inspection. Invoking inspection from 3D opens the linked split workspace so the main assembly remains visible. Return restores the previous Layout camera.

Assembly state and reset-camera controls belong to the hardware pane. View options exposes common component visibility and contextual Layout annotations. Current results and baseline differences stay in the supporting results strip. Design preserves its existing read-only selection and candidate-application workflow; direct parameter changes and resets remain disabled.

## Shared geometry and boundaries

`chip-plan.ts` shares stepped capacitor outlines, gate orientation and substrate outline between Layout and the hardware meshes. Ground openings are aligned around those electrodes. This mapping uses normalized illustration coordinates, not calibrated physical dimensions. The gold package, fasteners, wire bonds and lighting retain the hardware renderer's visual identity. The surrounding carrier illustration is context, not a pixel-registered CAD projection of every package feature. Junction detail remains illustrative.

Both capacitor pads retain one EC identity. Board and package are selectable visual context, not new circuit elements. Material choices preserve the existing 3D appearance behavior. No geometry-to-capacitance calculation or physics-engine change is introduced.

Exports retain the completed producing parameter/result pair and baseline evidence. Their download anchor is attached before clicking, with delayed blob URL cleanup to let the browser consume the payload.

## Validation

- 89 unit tests across 22 suites pass, including shared-plan geometry and imported camera/connector helpers.
- Lint, TypeScript checking and production build pass.
- 16 browser journeys pass: 32 controlled requests, two actual Page exports, zero incoherent renders.
- Both browser negative controls detect deliberately removed accessible action names.
- Live UI inspection covers assembled/exploded split views, selection from hardware/Layout/circuit, component close-ups, narrow stacked composition, Design-disabled editing and EC baseline comparison.
- Live baseline experiment: EJ 15 GHz, EC 0.300 GHz produces 5.683 GHz; changing EC to 0.340 GHz produces 6.026 GHz with a displayed +0.344 GHz difference.

The preview runs on port 3119 with the existing isolated solver on port 8004. The reference previews and active application checkouts were not modified. This integration is local and has not been merged into main.
