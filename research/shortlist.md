# Research-derived candidate shortlist

Status: research synthesis, not an implementation commitment. Originality below is a hypothesis of differentiation, not a worldwide novelty claim. No prototypes have been built or tested. The team has two implementers and one reviewer/tester, Macs and phones, and a short hackathon window.

## What the evidence changes

The earlier generic concepts should not be carried forward unchanged:

- Ghost Hands: existing GhostHands research, LightGuide, assembly-error research, and Bob.
- Dry Run: MIT CityScope/Illuminating Clay, Dynamicland, and drawing-to-simulation tools.
- Clearinghouse: TradeMaximizer already implements multiway cycles and preferences.
- Counterexample websites: WebArena-Infinity, WASP and RedTeamCUA already cover important parts of the proposed mechanism.

See prior-art-audit.md for primary sources and limits.

The best transferable pattern is a meaningful transformation into a checkable internal representation: perception into a graph, policy into rules, or a physical demonstration into a state ledger. This is an interpretation of selected examples, not a statistical model of hackathon success. Category/sponsor winners are not equivalent to overall winners, and multi-day competitions are not evidence that every feature fits HackCMU's shorter window.

## A. Veto: participant-controlled recording

**User problem:** A workshop participant has little control over the recording operator's editing decisions.

**Pitch:** People in the frame, not only the person holding the camera, control whether they appear in the recorded output.

**Observable demo:** Two volunteer participants enter a camera feed. Both are masked. One scans a room code and presents a temporary visual marker to associate their session with a tracked person. They opt in and become visible. They cross positions, then revoke consent. The saved processed clip follows the permission state.

**Technical core:** Temporary marker-to-track association, local person segmentation/tracking, consent events, and compositing before encoding. No face-recognition identity database needed. Ambiguous tracking masks the track or whole frame rather than guessing.

**Closest checked analogue:** Signal's local face-blur tools: https://signal.org/blog/blur-tools/ . Difference hypothesis: subject-controlled live permissions rather than photographer-controlled postprocessing. The broader literature on consent-aware cameras still requires a targeted audit before claiming originality.

**Weekend cut:** One fixed camera, two people, controlled lighting, opt-in/revoke controls. Do not attempt protection against other cameras or guarantee detection of every person. Store only the composited output in the prototype's recording path; verify no alternate raw recording path is active.

**Kill test:** Have the two participants repeatedly cross and briefly occlude one another. If permission jumps to the wrong person or the system cannot reliably mask ambiguous frames, do not present it as a privacy tool.

**Rubric fit:** Highly visible demo, identifiable real need, substantive real-time state/vision work. Multiplayer fit is plausible but not as natural as a cooperative game. Novelty and privacy robustness remain the main uncertainties.

## B. Loophole: executable fine print

**User problem:** A reassuring headline may conceal conditions that change whether an offer is useful.

**Pitch:** Instead of summarizing a return policy, find a concrete situation where its advertised promise fails.

**Observable demo:** Use a clearly labeled synthetic policy with a broad return promise and an unopened-only exception. Extract source-linked rules. A deterministic solver produces an opened-item counterexample. The judge changes the exception; the outcome and boundary visualization update from the actual rules.

**Technical core:** Model-assisted clause extraction into a small typed rule language, source spans, consistency checks, and solver-generated witnesses. Keep extraction separate from execution so a model cannot simply invent a contradiction. Ambiguous policy language requires clarification or an explicit unknown result.

**Closest checked analogues:** CrossBeam's document-to-action localization and Tekton's provenance-governed generated artifacts; generic contract-review tools are a crowded adjacent category. Difference hypothesis: a runnable, editable policy model with a minimal counterexample, not a prose risk summary. Consumer-policy simulators and legal DSL work need further targeted novelty review.

**Weekend cut:** Return policies only. Supported variables: return timing, item condition, sale status and relevant fees. Exclude general legal analysis and complex jurisdictional rights. The result analyzes the supplied policy model, not legal enforceability.

**Kill test:** The reviewer supplies a small hand-labeled set of exceptions and contradictory clauses. If the extractor silently changes their meaning, narrow the supported grammar or require explicit user review before execution.

**Rubric fit:** Strong usefulness and explainable engineering, modest hardware demands, interactive demo without computer vision. The main demo risk is looking like ordinary PDF Q&A; the rule execution and live counterexample must be central. No natural food/multiplayer track fit; potentially optimization, subject to organizer interpretation.

## C. Rewind: your teardown becomes its own undo history

**User problem:** Generic instructions do not record where this person's particular parts came from.

**Pitch:** Turn a recorded disassembly into an evidence-backed reverse procedure for that exact object.

**Observable demo:** Disassemble a harmless desk object under a fixed camera, confirming each removal. Shuffle the parts. The app identifies each part's original location from saved evidence and guides the reverse sequence. An unrecorded removal produces an unknown step rather than an invented instruction.

**Technical core:** Persistent part identities, before/after frame registration, explicit state transitions and a reversible operation ledger. Recovery order comes from the ledger, not a generated paragraph. Some physical operations are not reversible and must be excluded.

**Closest checked analogues:** iFixit guides/FixBot, GhostHands, LightGuide, Assembly101 and Wrench Board. Difference hypothesis is user-specific observed provenance and reversal, not generic visual tutoring. This is adjacent to the rejected assembly category and is not claimed as a wholly new field.

**Weekend cut:** One object class with distinguishable pieces, stable viewpoint, user-confirmed steps. No mains electricity, batteries, vehicles or safety-critical repair. Keep orientation claims within what the recording actually shows.

**Kill test:** Can the system maintain identity through a short removal-and-shuffle sequence? If not, use explicitly tagged parts or drop the concept; do not disguise a manually authored guide as automatically inferred.

**Rubric fit:** Clear practical value and tangible demo; computer-vision risk and extensive adjacent prior art. More compelling than generic next-step instruction only if the personal evidence ledger truly works.

## Additional food-track hypothesis: TouchTrace

**Pitch:** A training replay that shows how a simulated contaminant travels through a sequence of utensil and surface contacts, and identifies the contact that propagated it.

**Demo:** Use dry props, tagged objects and simulated contamination only. Observe or explicitly confirm contact events, propagate a simulated state through a contact graph, and replay the chain. Removing one contact from the model changes the simulated outcome.

**Prior art / real need:** Glo Germ sells educational tools for visualizing handwashing, surface cleaning and containment: https://www.glogerm.com/ . The possible difference is time-resolved causal replay rather than an end-of-exercise fluorescence inspection. The analogy is not evidence of pedagogical benefit.

**Hard boundary:** A camera cannot establish real allergen presence, pathogen transfer, successful cleaning or food safety. This is a controlled training simulation, not a system telling people food is safe. Proximity in a 2D camera image is not proof of physical contact. Ambiguous events require confirmation.

**Why not a primary recommendation yet:** Very natural food-track fit and a visible graph-based mechanism, but contact sensing may force too much manual input and weaken the demo. Additional training-product prior-art review is needed.

## Recommendation

Do not lock a project solely from this memo. The strongest next comparisons are Veto (physical demo and new control model) versus Loophole (software-only, rule-based consumer tool). Rewind remains an option if the team prefers physical interaction and accepts the tracking risk. Novelty, feasibility and appeal are separate gates; these concepts have not yet passed implementation tests.

## Research appendices

- idea-research.md: event rubric, initial winner bank, method and caveats.
- competitive-student-winners.md: eight additional student competition winners.
- ai-competition-winners.md: seven additional AI competition winners.
- prior-art-audit.md: direct challenges to the early concepts and candidate gaps.
