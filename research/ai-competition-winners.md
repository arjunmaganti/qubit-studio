## Seven verified winners, with the actual technical lesson

**Evidence standard:** Awards below are verified through organizer recaps or Devpost’s platform-generated award section, not participant-written “we won” claims. Mechanisms are organizer/team descriptions, supplemented by repository READMEs where noted. I did **not** execute their software or independently validate performance/clinical claims.

**Organizer sources**
- **[A] Opus 4.6 winners:** https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon
- **[B] Opus 4.7 winners:** https://claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon
- **[C] June 2026 Claude Build Day winners:** https://claude.com/blog/meet-the-winners-of-our-claude-opus-4-8-build-day-hackathon
- **[D] Berkeley AI 2026 gallery:** https://ai-hackathon-2026.devpost.com/project-gallery

### 1. Wrench Board — second place, Built with Opus 4.7 [B]
**Problem:** Electronics repair requires connecting a schematic’s logical circuit to physical probe locations.

**Mechanic:** Schematic + boardview → unified electrical graph → exact pad to measure → measurement updates competing fault hypotheses → next probe. The valuable capability is **active diagnosis grounded in a physical/logical correspondence**, not a repair chatbot.

Repository: https://github.com/Junkz3/wrench-board  
**Boundary:** Organizer describes the diagnostic loop; no independently verified repair-success rate. The contest allowed several days, not necessarily one weekend.

### 2. Conductr — Special Prize, Creative Exploration, Opus 4.6 [A]
**Problem:** A live musical partner cannot pause while an LLM thinks.

**Mechanic:** A C/WASM engine produces deterministic MIDI on roughly 15 ms steps; a performance analyzer summarizes playing, while the LLM periodically changes arrangement parameters. It affects **the next phrase, never blocks the current note**. Rule-based fallback keeps music running.

Repository, whose README details the architecture: https://github.com/nanassound/conductr  
**Boundary:** Generates MIDI, not audio itself; requires a synth/DAW. Latency numbers are project descriptions, not my benchmarks.

### 3. Tekton — first place, June 13 Claude Build Day [C]
**Problem:** Historical reconstruction tends to hide invented details inside convincing visuals.

**Mechanic:** Cited dimensions + architectural rules → parametric geometry with per-component provenance → verifier recomputes dimensions from coordinates. Measured evidence overrides prettier textbook proportions. Uncertainty is visible as measured/rule-derived/reconstructed/conjectural components.

Repository: https://github.com/tangxiya-star/Tekton  
**Important correction:** Despite the recap’s broad autonomous-reconstruction framing, the README says the **runtime website makes no LLM calls and renders frozen artifacts**. This is strong evidence-governed artifact generation, not verified arbitrary-building reconstruction on demand.

### 4. CrossBeam — first place, Opus 4.6 [A]
**Problem:** Builders receive correction letters whose demands must be located and reconciled across blueprint sets.

**Mechanic:** Blueprints + correction letters → parallel document parsing → spatial index → correction-specific agents → targeted action plan. The useful transformation is from **bureaucratic criticism to localized edits**, rather than merely summarizing PDFs.

Repository: https://github.com/mikeOnBreeze/cc-crossbeam  
**Boundary:** A municipality “looking at adopting” it is not deployment; an action plan is not an approved permit. Avoid repeating the recap’s sweeping housing statistics as independently established facts.

### 5. Lucid Voice — Grand Prize, Ddoski’s World track, Berkeley AI 2026 [D]
**Problem:** People using augmentative communication may know their meaning but struggle to express it quickly and personally.

**Mechanic:** A few selected words + personal relationship graph → graph/vector retrieval with submodular fact selection → frozen local Gemma/MLX generates candidate sentences → user selects → style preferences adapt → local cloned voice speaks. Same keywords can produce different phrasing for different relatives.

Award + technical account: https://devpost.com/software/lucid-voice  
**Boundary:** Team reports offline operation. Their “what’s next” explicitly includes testing with AAC users and clinicians; no demonstrated therapeutic benefit. User approval before speaking is a meaningful design feature.

### 6. IronBook — Grand Prize, Ddoski’s Toolbox track, Berkeley AI 2026 [D]
**Problem:** Manufacturing knowledge is tied to particular physical parts, but manuals fail to show where those parts are.

**Mechanic:** Overlapping phone photos → COLMAP camera poses → Metal-accelerated Gaussian splat; vision model receives current view and camera state, then emits validated camera actions to fly toward/highlight an answer. Fallback produces navigable 2.5D rather than nothing.

Award + technical account: https://devpost.com/software/ironbook  
**Boundary:** Reconstruction quality and test counts are team-reported; a queryable scan does not automatically capture an expert’s tacit knowledge. Especially relevant to Apple Silicon feasibility.

### 7. Paper Cuts — Grand Prize, Ddoski’s Playground + Best UI/UX, Berkeley AI 2026 [D]
**Mechanic:** Doodle → recognition → transparent sprite → constrained operations/triggers/element tags → object inserted into a running multiplayer game. Fire and vines interact through structured rules, not arbitrary generated code.

Award: https://devpost.com/software/paper-cuts  
Repository: https://github.com/Jeremyliu-621/paper-cuts  
**Boundary:** Team explicitly says Trainium serving failed and the live demo used hosted inference. Their broader CNN/LoRA/neuro-symbolic claims are not independently reproduced. The transferable insight is **AI proposes meaning; deterministic machinery owns consequences**.

## Three new directions for two builders + phones + Macs

These are **proposed differentiations, not world-first claims**. Keep the prototype narrower than the winners above.

### 1. Undo the Physical World
**User:** Someone dismantling a harmless object who cannot remember how to reassemble it.

Phone video becomes a **reversible state ledger**: removed part, source location, orientation, before/after evidence, and dependencies. Reassembly highlights the original socket using the recorded view. The model may propose a step but cannot invent unseen evidence.

**Under-three-minute demo:** Judge disassembles a pen or simple desk object, shuffles pieces, then follows the generated reverse procedure; intentionally omitted footage triggers “unknown,” not fabricated advice.

**Weekend cut:** One object class, stable camera, manual step confirmation, frame registration and part tracking. One builder owns capture/vision, the other ledger/UI. **Kill condition:** cannot maintain part identity across three removals.

**Analogues:** Wrench Board diagnoses faults; [iFixit](https://www.ifixit.com) offers guides/FixBot. Difference: **your actual teardown becomes its own reversible instruction set**, not generic repair instructions.

### 2. Fine Print → Find Me a Counterexample
**User:** Someone comparing a return policy, warranty, or cancellation offer against what a seller promised.

Extract clauses with source spans into a small executable rule language. A constraint solver searches for the **smallest concrete situation where the promise fails**: item opened, bought on sale, returned after a specific interval. Show a boundary timeline and the exact conflicting clause.

**Demo:** Judge changes one phrase in a policy; the counterexample and boundary move live.

**Weekend cut:** Returns only; days, item condition, sale status, shipping costs. Deterministic solver, model-assisted extraction, user confirmation of ambiguous rules. **Kill condition:** extraction cannot correctly preserve exceptions in a small hand-labeled test set.

**Analogues:** CrossBeam localizes document corrections; Tekton carries provenance into generated artifacts. Difference: **executable falsification of a promise**, not PDF Q&A. Not legal advice.

### 3. Teach Once, Rehearse the Mistake
**User:** A small organization teaching a fragile browser workflow.

Record one successful workflow, then generate a **safe interactive rehearsal with one plausible wrong turn**. The trainee must recover. Capture DOM snapshots and actions; compile a finite-state simulator; attach feedback to violated preconditions rather than LLM judgments about screenshots.

**Demo:** Record a three-step synthetic invoice workflow; judge chooses “wrong customer” or “duplicate submission”; the rehearsal exposes the consequence without touching production.

**Weekend cut:** One controlled web app and three failure types. No universal website cloning. One builder handles recorder/simulator, the other scenario compiler/evidence UI. **Kill condition:** recorded state cannot reproduce the chosen branch deterministically.

**Analogue:** [Scribe](https://www.scribehow.com) captures workflows for documentation and training. Difference: **a generated failure rehearsal rather than another how-to guide**.

**Bottom line:** The strongest common pattern is not “more agents.” It is an interpretable intermediate representation—graph, score, geometry, rule program, or state machine—that creates a new user action and makes errors observable.

**Work completed/issues:** Read official recaps, event galleries, project accounts and selected READMEs. No workspace files changed. Updated the existing research skill reference with Devpost API discovery and demo/runtime-claim pitfalls. Some guessed endpoints returned 404; source sitemaps and Devpost’s API resolved discovery. No unsupported OpenAI/Cursor/ETHGlobal winner claims were added merely to broaden the list.