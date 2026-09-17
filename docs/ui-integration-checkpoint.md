# Working UI checkpoints and integration gate

## Preserved sources

Verified against origin on 2026-09-12. Local preview ports are session-specific, not durable deployment URLs.

| Source | Preview checked | Git checkpoint |
| --- | --- | --- |
| Detailed 3D hardware render | http://127.0.0.1:3117/ | `origin/feat/render-fidelity` at `3961a09d8823280eef45f1c237673ae4bbb700e9` |
| Planar Layout and component inspection | http://127.0.0.1:3104/ | `origin/feat/layout-chip-inspection` at `c24bbceff4573c066ef83d62156999f67eddab2c` |
| Main application safety baseline | Not a UI acceptance reference | `origin/main` at `274c33700415b88f64aa2683260e5ae72a1ea0f8` |

The user confirmed 3117 as the working render reference. Do not substitute 3101 or 3104 for that visual reference. The 3101 development preview stalled using 127.0.0.1 and loaded using localhost; that diagnosis is specific to that server.

## Provenance checks

- Fresh `git fetch origin` and `git ls-remote --heads` verified both feature checkpoints exist remotely.
- Compared tracked UI file hashes in the running 3117 source directory (`/Users/vaibhav/Documents/Codex/2026-09-12/x20-n/work/qubit-fidelity`) against the render checkpoint. All compared files match except `ui/qa-design.playwright.py`; the preview QA script is not byte-identical to the published checkpoint.
- Compared tracked UI file hashes in the running 3104 source directory (`/Users/vaibhav/Documents/Codex/2026-09-12/my-earlier-recommendation-risked-adding-too/work/layout-wave1`) against the layout checkpoint. All compared files match except `ui/package.json` and `ui/package-lock.json`. The published branch retains main's regression runner and Playwright dependency; the preview uses different test scripts/dependency manifest.
- These comparisons cover tracked UI files, not a reproducible-build attestation or an exhaustive untracked-file audit. No credentials were inspected.

## Evidence and limits

Observed in a browser at 3117: ornate chip assembly, selected Josephson junction, inspector detail render, live result status, and results 5.683 GHz / positive spacing difference 344.8 MHz / dispersion 11.889 kHz.

Observed at 3104: Layout interface starts and reports a live result. Full interaction and responsive acceptance remain pending. Neither observation is a full UI/UX pass, and Safari was not directly automated because JavaScript from Apple Events is disabled.

## Integration constraint

The render checkpoint descends from `2228fb2` (the older Design-workspace line), not the cleaned main checkpoint. Do not replace main's tree with the render branch or treat its broad differences against main as an approved deletion list. Preserve current evaluation identity/staleness, experiment state, Apply semantics, AI/material functionality, export provenance, backend and regression infrastructure.

A read-only `git merge-tree --write-tree feat/render-fidelity feat/layout-chip-inspection` reports conflicts in:

- `ui/app/api/search/route.ts`
- `ui/app/globals.css`
- `ui/app/page.tsx`
- `ui/components/Inspector.tsx`
- `ui/components/ParamField.tsx`
- `ui/components/PartsTree.tsx`
- `ui/components/ResultsDock.tsx`
- `ui/components/Viewport3D.tsx`

No working-tree merge was started. Main and both running previews remain unchanged.

## Acceptance before integration

1. Confirm both source UI/UX passes, including selection, parameter edits, reset, current/stale/error results, inspection entry/exit, camera fit, assembled/exploded states, and roomy desktop plus short laptop viewports.
2. Use main plus the Layout checkpoint as the state-safety foundation in an isolated integration branch. Bring over the approved hardware rendering and required presentation dependencies deliberately; reconcile shared shell ownership rather than copying the old render page wholesale.
3. Preserve the detailed gold/graphite hardware appearance from 3117. Layout, circuit, and 3D must share component IDs, applied inputs, selected component, and result provenance. Split is a pane arrangement, not another independent device state.
4. Resolve visual geometry alignment explicitly: orientation, pad outlines, junction enlargement, ground openings, gate side, chip/carrier relationship, and material presentation. See `docs/layout-wave1-integration.md` on the Layout branch. Do not introduce geometry-to-capacitance claims or a second solver pipeline.
5. Exercise cross-selection and parameter continuity between main 3D, Layout, circuit and paired views; verify hidden/revealed components, inspector behavior, Design read-only/Apply protection, and fit/reset in narrow panes.
6. Run the canonical main/layout regression gates on the exact integrated revision, plus visual checks of the actual application. A build or unit-test pass alone does not confirm rendered UI quality.
7. Keep original checkpoints recoverable. Do not update main or publish a combined build as accepted until integrated verification is complete.

Status: source checkpoints preserved remotely; complete UI/UX acceptance and integration are pending.
