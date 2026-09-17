## Bottom line

**All four initial ideas have substantial prior art. “GhostHands” is even an existing research name.** The opportunity is a narrow, demonstrably better capability—not camera input, a campus setting, or adding an LLM.

### 1. Physical assembly tutoring / “Ghost Hands”

**Established work**
- [GhostHands UX: telementoring with hands-on augmented reality instruction](https://doi.org/10.3233/978-1-61499-530-2-236): a mentor’s virtual hands appear in the worker’s AR view. Publisher-deposited abstract retrieved through Crossref; publisher full text returned 403.
- [LightGuide](https://www.lightguidesys.com/): commercial projected instructions, computer-vision verification, and preventing progression after an incorrect operation. These are vendor claims, not independently reproduced results.
- [Every Mistake Counts in Assembly](https://arxiv.org/abs/2307.16453): detecting assembly-order mistakes through spatial relationships and prerequisite constraints. [Assembly101](https://assembly-101.github.io/) supplies assembly/disassembly video and mistake annotations.

**Why the original pitch is insufficient:** ghost overlays, observing assembly, and flagging incorrect steps are already recognizable research/product categories. Hand tracking alone cannot establish that two components actually connected.

**Potential wedge:** **minimal recovery rather than next-step instruction**. For one low-risk kit, infer the current component graph and compute the fewest detach/reattach operations needed to recover. Accept valid alternate assembly orders; explicitly abstain when a joint is occluded. A judge intentionally introduces an error and sees recovery verified—not merely narrated. Keep parts distinguishable and use a fixed camera.

### 2. Tabletop/drawn diagrams → simulation / optimization

**Established work**
- [MIT Illuminating Clay](https://tangible.media.mit.edu/project/illuminating-clay/): captures physical geometry, computes simulations including visibility and travel time, and projects results back onto the model.
- [MIT CityScope](https://www.media.mit.edu/projects/cityscope/overview/): tangible/digital interactive computation for spatial planning and simulations of interventions.
- [Algodoo](https://www.algodoo.com/): draw physical systems and immediately simulate them.

**Why insufficient:** “move physical things and watch a simulation change” is an established tangible-interface pattern. Queue-layout software also needs credible arrival/service assumptions; animated dots do not prove an improvement.

**Potential wedge:** **measurement-backed, uncertainty-aware operational decisions**. A pop-up food organizer times service on phones; the system recommends a layout only when it improves performance across plausible demand ranges. Show the demand conditions where the recommendation reverses. Narrow to one queue model, two candidate layouts, measured inputs, and a judge-controlled surge. The contribution is calibrated decision support, not drawing recognition.

### 3. Multiway in-person barter

**Established work**
- [Chris Okasaki’s TradeMaximizer](https://github.com/chrisokasaki/TradeMaximizer): explicitly supports multi-party trading cycles, maximizes items traded, includes ranked preferences and duplicate-item protections. Its documentation gives the same A→B→C→A mechanism proposed for Clearinghouse.

**Why insufficient:** the headline algorithm is already implemented and documented. Putting math trades into a room with QR codes improves access but does not establish algorithmic originality.

**Potential wedge:** **failure-aware fulfillment at a live swap event**. Optimize completed handoffs rather than nominal matches: check-in, compatible meeting windows, bounded cycle lengths, unanimous acceptance, and rapid repair when someone withdraws. Show a withdrawal breaking a cycle, then a repaired allocation that preserves already-completed exchanges. Do not call physical exchanges “atomic”—software cannot guarantee delivery or honesty.

### 4. Generating adversarial sandbox websites for agents

**Established work**
- [WebArena-Infinity](https://github.com/web-arena-x/webarena-infinity): automatically generates realistic browser environments, tasks, and programmatic verifiers; agents iteratively test and refine them.
- [WASP](https://github.com/facebookresearch/wasp): executable web environments for evaluating prompt-injection attacks without real-world harm.
- [RedTeamCUA](https://github.com/OSU-NLP-Group/RedTeamCUA): hybrid web/OS sandbox, automated adversarial injection, configurable scenarios, and security evaluation.

**Why insufficient:** both halves—generated websites and adversarial agent testing—already exist. Combining their descriptions is not enough.

**Potential wedge:** **a failure minimizer that emits a regression test**. Starting from one successful browser task, introduce controlled mutations such as delayed updates, duplicated labels, or deceptive content; then remove mutations until a small reproducible failure remains. Preserve task solvability with a reference execution and verify outcomes from application state. The useful artifact is “this minimal change broke your agent, here is a replayable test,” not a gallery of scary websites. Existing fuzzing/minimization literature still needs auditing.

## Three different opportunity hypotheses

These are **underexplored directions worth testing**, not claims of worldwide novelty. Each avoids the original four categories and has a bounded technical loop.

### A. Back-row slide repair

**User:** lecturer or workshop presenter whose slides become unreadable in the actual room.

A phone photographs a browser-hosted slide from the back row. Screen-corner registration and a calibration pattern estimate lost detail and contrast; the browser proposes a larger, simplified rendering and checks the next capture.

**Three-minute demo:** judge picks a dense slide → capture it from across the room → flag fragile text/lines → reflow → judge reads a previously illegible label.

**Technical core / 24h cut:** perspective correction, image-quality measurements, constrained DOM reflow; support HTML slides only. Demo on a Mac display if no projector exists.

**Difference:** [WebAIM’s contrast checker](https://webaim.org/resources/contrastchecker/) evaluates source colors; this tests the physical display-to-viewer path. **Risk:** camera readability is not human accessibility. Include a human calibration step; make no accessibility-certification claim.

### B. Acoustic spill debugger

**User:** event organizer arranging adjacent demo booths or workshop stations.

One browser plays a known, comfortable-volume probe; another records it at listener positions. Estimate relative source-specific spill, then compare a changed speaker position/orientation.

**Three-minute demo:** record near/far positions → identify spill → judge rotates or relocates the laptop → repeat and show measured change.

**Technical core / 24h cut:** probe correlation, frequency-band energy, repeatability checks; one source and one receiver, no 3D room reconstruction.

**Difference:** [NIOSH’s sound-level app](https://apps.apple.com/us/app/niosh-sound-level-meter/id1096545820) already measures noise. The hypothesis is actionable, source-attributed before/after troubleshooting. **Risk:** automatic gain control and echo cancellation may invalidate comparisons. Kill the idea if repeated unchanged-position measurements are unstable. No certified dB, speech-privacy, or safety claims.

### C. Participant-controlled camera consent

**User:** a club recording a workshop where attendees have different recording preferences.

A recording browser masks everyone by default. A participant pairs a temporary on-screen marker with their tracked person and can opt in or revoke from their own browser. Ambiguous tracking reverts to masking.

**Three-minute demo:** two consenting participants enter frame → one opts in → they cross positions → one revokes → exported clip reflects the changes.

**Technical core / 24h cut:** marker-to-person association, local tracking, consent state, canvas compositing; two people, fixed camera, no biometric identity database.

**Difference:** [Signal already offers local face blurring](https://signal.org/blog/blur-tools/). The proposed value is subject-controlled permission during capture rather than photographer-controlled editing. **Risk:** identity swaps and missed people; fail closed, test crossings, and never claim protection from other cameras.

**Execution note:** phone/browser camera and microphone access require permission and a secure context ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). Verify actual phones before committing.

**Audit status:** inspected primary project pages, repositories, and research abstracts via HTTP. No demos reproduced; no workspace files created or modified. Search-engine access was unhelpful and some publisher pages blocked, so evidence came mainly from official repositories and project sites.