# Quantum chip and component reference guide

Reviewed September 12, 2026. This collection contains 25 complementary reference entries: manufacturer photographs, product illustrations, circuit layouts and primary fabrication papers. Linked images remain at their original sources. Dimensions are recorded only where verified or explicitly labeled as filename information.

The most useful visual direction is **several scales of detail and several kinds of surface response**: machined package, patterned board, mirror-like die, thin-film circuits, bond wires and nanostructures. Adding the same noise or saturated color to every layer would weaken that distinction. This is a design inference from the references below.

For an element picker, separate the selected **material stack** from the **view style**. A realistic view can distinguish warm Au, reddish Cu, neutral Al, dark reflective semiconductor, and ceramic transmission/roughness. A material-map view may use stronger assigned colors with a legend. Blue tantalum, pink niobium and other colors in the cited microscope figures are frequently false color; they are useful explanatory overlays, not literal material swatches. Sapphire is Al₂O₃, InAs is a compound, and Au-plated Cu is a layered finish. Changing an element alone does not establish a fabricable or higher-performing quantum device. See the [Princeton fabrication paper](https://arxiv.org/abs/2003.00024) and [NIST encapsulation study](https://www.nist.gov/publications/systematic-improvements-transmon-qubit-coherence-enabled-niobium-surface-encapsulation).

## References

### 1. Majorana 1 — official laboratory hero photo

**Microsoft · assembled package.** Photo, 2000×732 verified. Burgundy board, pale fine traces, warm gold frame with countersunk holes, small mirror-dark die, adjacent green carrier, and silver-white connectors. Use for scale and contrasting finishes; it does not reveal internal microscopic construction.

[Primary source](https://news.microsoft.com/source/features/innovation/microsofts-majorana-1-chip-carves-new-path-for-quantum-computing/) · [Image or figure PDF](https://news.microsoft.com/source/wp-content/uploads/2025/02/Majorana-1-001-Hero.jpg)

### 2. Majorana 1 — official close-up

**Microsoft Azure Quantum · assembled package.** Official close-up asset, 1260×708 filename. Useful complementary reference for die-to-package proportion, bonded chip, routing density, and red/gold/neutral contrast. Photograph colors depend on lighting and coatings, not only elemental composition.

[Primary source](https://azure.microsoft.com/en-us/blog/quantum/wp-content/uploads/2025/02/majorana1_1260x708_v2.jpg)

### 3. InAs–Al parity-measurement device — Nature figures

**Microsoft Azure Quantum / Manfra Group · nanostructure.** Fig. 1 is a device schematic; Fig. 2b is a scanning-electron micrograph of gates around a continuous Al strip. Good for a separately labeled microscopic inspection view. These are not optical package colors or a full Majorana 1 teardown.

[Primary source](https://www.nature.com/articles/s41586-024-08445-2) · [Image or figure PDF](https://manfragroup.org/wp-content/uploads/2025/11/2025.02.19_s41586-024-08445-2.pdf)

### 4. Willow — official launch imagery

**Google Quantum AI · assembled package.** Official product images and fabrication context. Use the dark central chip, broad patterned carrier, repeated fine connections, and restrained studio illumination as composition references. Decorative backgrounds and explanatory graphics are separate from the photographed hardware.

[Primary source](https://blog.google/innovation-and-ai/technology/research/google-willow-quantum-chip/)

### 5. Willow — specification sheet and qubit layouts

**Google Quantum AI · layout.** Two-page primary PDF: package image on page 1; distinct qubit grids and distributions on page 2. Helps keep lattice geometry and physical presentation consistent. The colored grid is a data/layout visualization rather than visible device coloration.

[Primary source](https://quantumai.google/site-assets/downloads/willow-spec-sheet.pdf)

### 6. Sycamore — full-resolution processor photograph

**Google Quantum AI · assembled package.** The article distinguishes the real processor photograph by Erik Lucero from Forest Stearns's cryostat artwork. Use the photograph for dark die, radiating dense contacts and carrier texture; do not treat the adjacent artwork as a fabrication reference.

[Primary source](https://www.research.google/blog/quantum-supremacy-using-a-programmable-superconducting-processor/) · [Image or figure PDF](https://1.bp.blogspot.com/-4pbQ6nBDyxY/XbC8MHKgTCI/AAAAAAAAE10/wu0JGYKYZ-wyCUIQRTvYt2PGzCPKmHsrACLcBGAsYHQ/s1600/Google_Quantum_Nature_cover_art_Sycamore_device_small.png)

### 7. Sycamore — packaging and preliminary-testing press images

**Google Quantum AI · fabrication and wire bonds.** Technical-visuals collection includes a chip mounted in its PCB during packaging, an array of chips prepared for preliminary electrical testing, and microwave cable assembly. Best complementary source for manufacturing repetition, bond-pad fanout and hardware scale.

[Primary source](https://sites.google.com/pressatgoogle.com/quantum/)

### 8. Heron — official processor package

**IBM Quantum · assembled package.** Official Heron package visual: branded die/package with precise repeating perimeter structure. Useful for geometric order, interposer edges and typography hierarchy. Promotional product imagery should not be assumed to expose all underlying layers.

[Primary source](https://www.ibm.com/quantum/blog/quantum-roadmap-2033)

### 9. Heron — stacked package illustration and hand-held scale

**IBM Quantum · stacked package.** Primary two-page overview includes a stacked Heron package render and a hand-held chip photo. Use the former for legible layer separation and the latter for scale. Distinguish render from photograph; publication is largely grayscale.

[Primary source](https://www.ibm.com/quantum/assets/IBM-Quantum-Think-2024.pdf)

### 10. Novera — QPU hardware stack

**Rigetti Computing · system assembly.** Annotated hardware identifies patch panel, shield, payload bracket and I/O plate. Useful for exploded hierarchy and showing the chip as one small part of a larger assembly. It is a complete QPU reference, not just a naked die.

[Primary source](https://www.rigetti.com/novera) · [Image or figure PDF](https://www.rigetti.com/uploads/novera/novera-closer-look.png)

### 11. Novera — nine-qubit circuit layout

**Rigetti Computing · layout.** Official circuit asset linked from the Novera page. Source describes a 3×3 tunable-transmon array, nearest-neighbor tunable couplers and shared readout per column. Use for component relationships and repetition; interpret the diagram's colors as functional labels.

[Primary source](https://www.rigetti.com/uploads/novera/9qubit.png)

### 12. QCage — microwave chip carrier and shielding

**Quantum Machines / QDevil · package components.** 1250×872 product visual verified. Satin gray enclosure, gold connectors, recessed screw sockets and separate gold thermal bars. Documentation identifies low-loss PCB, gold-plated copper cavity, Au-plated BeCu thermalization bolts, and Al/Cu shielding layers. Product rendering is not calibrated material photography.

[Primary source](https://www.quantum-machines.co/products/qcage/) · [Image or figure PDF](https://www.quantum-machines.co/wp-content/uploads/2026/03/Fig_QCage24_625X436.webp)

### 13. QBoard-II — modular carrier, daughterboard and coax

**Quantum Machines / QDevil · package components.** 1564×650 image verified: pale gold carrier, black board, bright central cavity, local bond fanout, silver fasteners and braided coax. Source identifies PCB/interposer/daughterboard and shield lid; daughterboard cavity is 0.5 mm deep. Helpful for visibly distinct exploded parts.

[Primary source](https://www.quantum-machines.co/products/qboard/) · [Image or figure PDF](https://www.quantum-machines.co/wp-content/uploads/2026/03/QBoard-II-highlights-1.webp)

### 14. LINQER — complete exploded sample-holder stack

**SCALINQ · exploded assembly.** Exploded image verified in browser, 400×800 served thumbnail. Gold support columns and disks, black cable bundles, a tiny chip, patterned carrier disk and recessed bottom cup. Good for readable stack hierarchy; individual layers need recesses and sidewall detail rather than uniform slabs.

[Primary source](https://www.scalinq.com/solutions/linqer-packaging/) · [Image or figure PDF](https://www.scalinq.com/wp-content/uploads/elementor/thumbs/LINQER36-exploded-view-for-website-page-1-scaled-rkg02ap9zspzcbekoy9mdnm7soh1isyabjvjrtea0w.png)

### 15. Cryogenic microwave-package characterization

**Bluefors / Quantum Machines · package engineering.** QCage.24 measurement and integration context. Useful for documenting why cavity, PCB and coaxial-to-coplanar transitions exist. Charts are engineering evidence, not material swatches; use this with QCage product visuals for component semantics.

[Primary source](https://bluefors.com/stories/calibration-of-a-multi-qubit-microwave-package/)

### 16. Pogo-pin package — individual parts and assembly sequence

**IBM Research / NIST · exploded assembly.** Figs. 3–5 show cross-section, separate parts, and assembly photographs: pedestal/cavity, spacer, interposer, plugs, pins, dowels and wire-bonded die. Caption warns pictured part compositions differ from those used experimentally. Best reference for mechanically meaningful exploded layers.

[Primary source](https://arxiv.org/abs/1709.02402) · [Image or figure PDF](https://arxiv.org/pdf/1709.02402)

### 17. Broadband sample holder — top, bottom, CPWs and via fence

**Averkin et al. · package components.** Figs. 1–2 show removable copper base, lid underside channels, four RF connectors and a central chip slot; Fig. 2 includes dimensioned cross-sections. Excellent for carrier machining and via fences. Device example is a 4×4 mm chip, not a universal package size.

[Primary source](https://arxiv.org/abs/1407.5326) · [Image or figure PDF](https://arxiv.org/pdf/1407.5326)

### 18. Superconducting through-silicon vias — three-chip stack

**MIT Lincoln Laboratory and collaborators · interposer and vias.** Figs. 1–4 cover qubit/interposer/routing stack, TiN-lined TSVs, indium bump bonds, and SEM views down to Josephson junctions. Useful for meaningful undersides and inter-layer connections. Figure colors encode materials and functions; they are not optical appearances.

[Primary source](https://www.nature.com/articles/s41534-020-00289-8)

### 19. Flip-chip module — wiring chip, resonator chip and spacers

**Chalmers University of Technology and collaborators · interposer and bumps.** Fig. 1 combines an actual bonded-module photo with colorized chip micrographs. Shows Nb CPWs, SU-8 corner spacers and indium bumps: 25 µm diameter and 10 µm final thickness. Excellent exploded-view geometry; colored overlays and schematic thicknesses are explanatory.

[Primary source](https://link.springer.com/article/10.1140/epjqt/s40507-023-00213-x) · [Image or figure PDF](https://media.springernature.com/lw685/springer-static/image/art%3A10.1140%2Fepjqt%2Fs40507-023-00213-x/MediaObjects/40507_2023_213_Fig1_HTML.png)

### 20. Indium bump-bonded micromachined microwave cavities

**Yale University / Schoelkopf Lab · cavity and bonding.** Figs. 1–2 show bump arrays and two metallized silicon chips forming a cavity. The etched lower chip has angled sidewalls; the upper chip has a coupling aperture. Use for cavity recesses, seams and bump placement rather than a flat generic enclosure.

[Primary source](https://arxiv.org/abs/2001.09216)

### 21. Tantalum transmons — pads, junctions, film grains and package

**Princeton University / Houck, de Leon and Cava groups · materials and microfabrication.** Fig. 1: false-colored optical Ta capacitor pads with Al junction; Fig. 3: film microstructure; Fig. S5: double-pad and Xmon devices mounted to a PCB. Blue Ta is explicitly false color. Nanometer grain structure should affect subtle roughness, not oversized visible crystals.

[Primary source](https://arxiv.org/abs/2003.00024) · [Image or figure PDF](https://arxiv.org/pdf/2003.00024)

### 22. Niobium capacitor pads, aluminum junction and film cross-section

**NIST · materials and microfabrication.** Figs. 3–5 offer Nb-on-Si cross-section, NbTiN spiral CPW, a qubit with Nb pads and an Al junction, and a multilayer superconducting-circuit cross-section. Pink and other component colors are explanatory. Strong references for microscopic inspection and layer relationships.

[Primary source](https://www.nist.gov/programs-projects/flux-quantum-electronics)

### 23. Niobium encapsulation — material-stack comparison

**NIST / Fermilab and collaborators · material compatibility.** Primary publication record links a comparison of Nb encapsulated by Ta, Al or TiN, across substrates. Useful evidence that surface composition and fabrication matter beyond the base element. Treat this as a material-stack reference; a simple recolor cannot imply its measured coherence improvements.

[Primary source](https://www.nist.gov/publications/systematic-improvements-transmon-qubit-coherence-enabled-niobium-surface-encapsulation)

### 24. Tantalum-on-silicon chip — laboratory and packaging photos

**Princeton Materials Institute · substrate and fabrication.** Includes gloved handling and placing the chip in its package, plus explanation of the transition from sapphire to high-purity silicon. Useful for physical scale, substrate context and package construction. Reported performance comes from the complete fabrication process.

[Primary source](https://materials.princeton.edu/news/2025/princeton%E2%80%99s-new-quantum-chip-built-scale)

### 25. Sycamore single-qubit SEM — submillimeter scale

**Google Quantum AI · microfabrication.** Page 4, Fig. 2 shows one Sycamore physical qubit through an electron microscope and states approximately 0.2 mm width. Use it to calibrate tiny lithographic motifs against the much larger package. SEM contrast is not a visible-light metal finish.

[Primary source](https://services.google.com/fh/files/misc/google_quantum_ai_about.pdf)

## Highest-value rendering changes suggested by these references

- **Assembled view:** a small, crisp die within a richly patterned carrier; machined recesses and fasteners; thin bond-wire fans with real endpoints; broad reflected highlights balanced with dark reflection areas. Microsoft, Sycamore and QBoard provide the strongest optical references.
- **Exploded view:** preserve each layer's underside, edge thickness, holes, contact pads, vias and seats. Keep wire bonds attached to their local die/carrier subassembly; use distinct interposer contacts between separated layers. LINQER and the pogo-pin paper are the clearest hierarchy references.
- **Component inspection:** provide a close-up camera and scale-aware detail for pads, resonators, junctions and bump arrays. Circuit films should look patterned into/on the die rather than like enormous raised metal blocks. Use the Princeton, NIST and TSV figures for geometry, with microscopic views explicitly identified.
- **Material selection:** change only compatible selected components, and visibly vary reflectivity, roughness, tint and ceramic/semiconductor behavior. Preserve a named composition and fabrication context alongside optional explanatory colors.

These are rendering recommendations, not a claim that the application's geometry reproduces a proprietary processor or predicts quantum performance.
