# Linked chip inspection rendering

The Layout pane projects the existing die without the previous horizontal stretch. The shared stepped electrode, substrate and ground contours remain unchanged in 3D. Layout inspects the die and nearby shield aperture; the wider package, mounting hardware, side inserts and exploded stack remain in the assembly view.

`ui/lib/chip-detail.ts` supplies both renderers with the 46 bonds per side, film fan-outs, perforation recipe, overlapping junction electrodes, oxide barrier and fixed contact colors. Component appearance comes from the existing material catalog and page-owned assignments. The layout locator receives the same assignments and hidden component list. Contacts and traces hide with the component that owns them in Assembly.

Layout keeps its dark background, screen-sized labels, pan/zoom, per-pad inspection and full-chip locator. Callouts use a collision-aware screen-space placement function, prioritize selection in tight spaces and reserve space for the locator. Keyboard focus outlines retain a constant screen width under magnification.

No solver, parameter, Myla or session logic changes. The material picker's scope sentence now correctly mentions 3D and Layout.

Verification:

- `cd ui && npm run check`: frontend tests, lint, production build, typecheck and 16 browser journeys.
- With a local UI running, `node qa/browser/render-consistency.cjs http://127.0.0.1:3126`: disposable-browser checks and screenshots for full-chip and capacitor/junction inspection, individual pads, pan/zoom, material changes, shared selection, hidden components, narrow splits and stacked splits. Evidence is written to `test-results/render-consistency/`.

Built on `740d1c8`, preserving the earlier appearance, geometry-bounds, caption-clearance and browser-verification fixes.

## Inspection-detail refinement

The follow-up preserves the geometry sharing introduced in `99bca1f`. Material mode adds restrained metal tones, fine brushed grain, contact bevels and attachment feet, aperture edge lines, etched ground detail and compact component identifiers. The existing shared definitions still supply the actual fan-outs, 184 bonds, ground openings and junction overlap. Contact identifiers appear at closer zoom levels. Callouts use smaller screen-sized labels and segmented leaders; keyboard focus uses sharp outlines without a glow.

A local **Material / Layers** display toggle offers a distinct color per inspection layer. This is a viewing preference: it changes neither material assignments nor model inputs. The locator and legend follow the chosen palette and shared visibility. The legend also selects the corresponding component in both renderers.

### Reference analysis

Original Siemens images and documentation were inspected, including the high-resolution Xpedition announcement image and page 4 of the L-Edit IC fact sheet. These supplied display principles; the product includes no copied reference graphics or invented routing.

| Reference | Observed display principle | Application here |
| --- | --- | --- |
| [Xpedition / HyperLynx announcement](https://news.siemens.com/en-us/siemens-xpedition-hyperlynx-ng/) and its original linked 1280 × 720 image | Linked 2D/3D views; dense but precise repeated routing and pad boundaries against a dark canvas | Keep the orthographic inspection view; sharpen shared fan-outs, bond feet and contact banks |
| [Xpedition interactive routing aids](https://resources.sw.siemens.com/en-US/product-demo-interactive-pcb-routing-aids/) | Trace spacing and pad transitions are the useful detail, with fine edges preserving legibility | Preserve physical traces and pad contours; avoid decorative new circuits |
| [Calibre DESIGNrev](https://resources.sw.siemens.com/en-US/fact-sheet-calibre-designrev/) | User-controlled layer color, fill, line width, visibility and selection alongside zoom/pan | Add an independent layer palette, coordinated legend and sharp selected outlines |
| [L-Edit IC](https://www.siemens.com/en-us/products/ic/ic-custom/ams/l-edit-ic/) and [original fact sheet, page 4](https://static.sw.cdn.siemens.com/siemens-disw-assets/public/1rBNeyD3nt6LnA8Tnwvwkv/en-US/Siemens%20SW%20Tanner%20L%20Edit%20IC%20FS%2081552%20C1.pdf) | Distinct fills, tiny identifiers and thin contrasting boundaries clarify overlapping IC geometry | Distinguish pads, ground, junction and gate; retain a readable junction overlap at close scale |

The references contain more nets and devices than this single-qubit design. Detail is therefore added to the existing chip, without adding unrelated circuitry or changing its dimensions. Surface grain and the inspection palette are display treatments, not new fabrication geometry.

The visual suite also verifies that toggling layer colors preserves materials, parameter inputs, selected parts, geometry and camera, that the close-up locator follows it, and that keyboard focus leaves junction edges unblurred.
