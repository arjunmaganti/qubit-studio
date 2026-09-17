## 1. SECOND CUT — a fabrication compiler that survives reality
**Track: Optimization**

**Pitch:** “Give it the material you actually have—not the material a blueprint assumes. It designs something useful, then redesigns around your mistakes without throwing away your work.”

**Actual problem:** Makers, theater shops and repair workshops have irregular offcuts and partly completed objects. Ordinary CAD assumes the design comes first; cutting optimizers assume the parts are already decided. A missing board or bad cut can invalidate the plan. The unmet capability is **changing the design while preserving completed physical work**.

**Interaction:** Photograph flat stock beside a size reference; confirm thickness and trace defects. A split canvas shows physical material and the object it could become. Drag an object’s dimensions; watch its parts migrate across the stock. Already-cut edges become visibly “committed.” Mark a mistake and the object morphs around it, with the exact cost of each compromise.

**Technical invention:** Jointly search a parametric assembly grammar, stock assignments, cut geometry and joinery. After every physical change, freeze completed operations and solve a minimum-change repair problem: preserve function, minimize replacement material, rework and unusable remnants. Polygon geometry validates nesting; assembly constraints validate mating parts. Offer genuinely different Pareto solutions—not invented efficiency scores.

**Closest verified prior art:**
- [Carpentry Compiler](https://grail.cs.washington.edu/projects/carpentrycompiler/) already compiles geometric designs into tool-specific fabrication instructions and optimizes accuracy, time and material cost.
- [Stock-constrained frame optimization](https://doi.org/10.3389/fbuil.2020.00057) already optimizes reclaimed-stock assignment and cutting under structural constraints.
- [Stock- and stress-informed reclaimed timber fabrication](https://doi.org/10.1007/s44242-026-00115-y) goes further: material tracking, stock-informed form generation, mixed-reality fabrication and physical validation.

**Specific differentiation:** “Design from scraps” is **not** the novelty. The proposed contribution is **execution-aware recovery**: keep what has already been cut or assembled, then change the remaining design and operations. The inspected sources establish substantial adjacent work; they do not establish that this exact workflow is unique.

**Judge-controlled demo, under three minutes:** Judge chooses usable dimensions for a desk organizer from real offcuts. Show competing designs and select one. Then the judge removes a piece or marks a cut in the wrong place. Recompile live while preserving committed pieces; reveal changed joints and assembly steps. Finish with a full-size organizer made through the same pipeline, not a scale model standing in for the entire vision.

**Full vision / overnight core:** A material-first CAD system for reuse, repair and adaptive fabrication. Overnight: two or three connected organizer/stand families, irregular sheet-stock scanning, real nesting and repair optimization, SVG cutting templates and animated assembly. One builder owns geometry/solver, one interaction; reviewer tests adversarial stock changes and fabrication. Start with cardboard and verified dimensions. Do not claim furniture load safety from images.

**Main risk:** Without coupled design changes and committed-work preservation, this collapses into a pretty cutting optimizer.

---

## 2. DONENESS FIELD — design how food cooks by changing its geometry
**Track: Food; also substantively Optimization**

**Pitch:** “Don’t find another recipe. Make the food you have physically capable of reaching the result you want.”

**Actual problem:** Mixed-pan cooking fails because thickness, moisture, spacing and heat exposure differ. A timer cannot make a thick center tender before a thin edge burns. People compensate by guessing cuts and staggering additions. The new capability is **inverse cooking design**: specify the desired interior and surface result, then solve for preparation geometry and placement—not merely cooking instructions.

**Interaction:** A beautiful overhead tray becomes an editable thermal canvas. Slice a potato digitally; drag pieces apart; paint “more browned” or “softer.” Scrub time and see predicted cross-sections, surface exposure and uncertainty. Hit **Make these finish together**: cut templates and placement change, while the desired result stays fixed.

**Technical invention:** Couple reduced-order heat diffusion with calibrated surface-browning/tenderness proxies. Search cut thickness, shape, spacing, placement and a shared heating program. Optimize mismatch between target outcomes, preparation effort and robustness to uncertain oven conditions. This is a numerical inverse problem; an LLM may label ingredients, but cannot fabricate the outcome predictions.

**Closest verified prior art:**
- [Combustion Predictive Thermometer](https://combustion.inc/products/predictive-thermometer) uses eight sensors and a physics-based virtual food model to predict remaining cooking time. Physics-based doneness prediction is already commercial.
- [June Oven](https://juneoven.com/) combines food recognition, guided programs and temperature/cooking interfaces.
- [CMU’s Morphing Pasta](https://www.morphingmatter.cs.cmu.edu/projects/morphing-pasta-and-beyond) engineers food geometry through grooves, diffusion and simulation. Computational food shape is established research.

**Specific differentiation:** Those sources respectively predict cooking, automate programs, or engineer morphing food. This proposal exposes **cut geometry and tray layout as inverse-design variables for a user-chosen cooking outcome**. It must outperform “cut the harder vegetable smaller,” not just visualize that advice.

**Judge-controlled demo, under three minutes:** Judge changes potato-piece thickness and paints a preferred outcome. The simulator exposes the resulting center/surface conflict. Judge selects an effort limit; the solver finds compatible cuts and placement or declares the request infeasible. Beside it, show actual baseline and optimized cooking trials with measured temperature traces and photographed cross-sections. Clearly distinguish measured trials from the judge’s new, untested prediction.

**Full vision / overnight core:** A cooking authoring environment spanning unfamiliar pans, portion sizes, ovens and food geometries. Overnight: one well-calibrated ingredient family, real geometry optimization, cross-section rendering, uncertainty and held-out cooking trials. An oven and thermometer are prerequisites—not confirmed resources. Extend to mixed vegetables only after validation; never present temperature alone as proven texture or safety.

**Main risk:** Thermal simulation is buildable; credible food-response calibration is the bottleneck. Without physical validation, this is an attractive hypothesis, not a demonstrated cooking invention.

---

**Honest comparison:** SECOND CUT is the stronger overnight bet: judge interventions are immediate, correctness is inspectable, and the recovery behavior is distinctive. DONENESS FIELD has the stronger food-native visual identity, but should only win selection if kitchen access and an early calibration experiment succeed. Neither deserves a world-first claim.

**Research performed:** Inspected primary product/research pages and checked adjacent reclaimed-material work. Some initial URLs were blocked or missing; accessible primary alternatives supplied the comparisons above. No files created or modified; no implementation or physical validation performed.