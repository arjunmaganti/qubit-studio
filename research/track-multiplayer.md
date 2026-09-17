## 1. TAKE THREE — strangers become a tiny film crew
**“Don’t collect everyone’s footage afterward. Give everyone a different job in the same shot.”**

**Use:** A club fair, orientation, museum workshop, or outdoor event offers a three-minute creation station. Three strangers leave with a polished, jointly authored 15-second film—not another photobooth strip.

**Mechanism:** A shared storyboard distributes **complementary production abilities**, not generic prompts:
- **Performer:** sees action cues and controls when they are ready.
- **Camera operator:** sees a framing silhouette and live alignment feedback.
- **Foley artist:** records and places a real sound effect against the action.

Each shot is a dependency graph: framing ready + performer ready + sound ready → synchronized take. The system combines their actual recordings into a predefined cinematic effect. Start with **“The Impossible Handoff”**: someone passes an ordinary object out of frame; it emerges from a different person’s hand in another location. Matching exit/entry position, movement direction, and sound makes the transition work.

**Standout UI:** A comic-strip storyboard on the Mac; each panel visibly splits into three colored responsibilities. Camera overlays show the previous shot’s final silhouette and motion direction. As participants complete their contributions, three colored strands resolve into an actual playable frame. The exported film credits every role.

**Why this gap:** A group can already film together, but someone must know coverage, continuity, timing, and editing. This makes that production knowledge executable and distributes meaningful participation—including an off-camera role. The usefulness hypothesis is a facilitator-free micro-workshop and event souvenir, not “technology cures loneliness.”

**Actual prior art / precise difference:**
- [Switcher](https://www.switcherstudio.com/) already connects multiple devices and lets a director switch views from one interface. **Our contribution is coordinating novice performers, sound makers, and camera operators before capture**, not another multicamera switcher.
- [MoViMash, ACM Multimedia 2012](https://www.comp.nus.edu.sg/~ooiwt/papers/mm12-movimash.pdf), inspected in author-hosted full text, already selects mobile footage using view quality, editing states, and selection history. Therefore **automatic editing and camera-quality scoring are not novel**. TAKE THREE instead creates the missing coordinated action and continuity needed for a specific jointly produced effect.

**Exact live demo:** 0:00–0:25: judge chooses an object; three participants join by room code and choose roles. 0:25–1:20: film two short handoff shots and capture a sound. 1:20–1:45: deliberately misalign the second shot; overlay identifies the mismatch and requests a retake. 1:45–2:30: export and play their impossible handoff, then reveal the three-source timeline.

**Technical core / overnight cut:** Browser capture, shared readiness state machine, clock-offset estimation, audio-onset alignment, simple hand/object tracking or explicit alignment guides, FFmpeg compositing. **One effect, two shots, three roles.** No generative-video dependency.

**Risk / kill test:** Recording/upload/export friction can consume the entire demo. Test the actual phones immediately. Reject the build if two short recordings cannot reliably become a playable composite inside the demo budget. Keep an explicit consent gate and delete failed takes.

---

## 2. TREATY — a shared plan nobody can silently overrule
**“Everyone holds one boundary of the plan. Move yours, and everyone sees what becomes possible.”**

**Use:** People already together after a campus event want to actually go somewhere; a club committee needs to agree on an outing. Polls pick winners but do not resolve *why* the winning plan excludes someone.

**Mechanism:** Each person controls their own constraints on a shared plan: spending, departure deadline, walking tolerance, activity preferences. The Mac displays feasible plans as islands inside an animated intersection of everyone’s boundaries.

The distinctive interaction is a **conditional concession**: “I can spend more **if** we finish earlier.” Another person can offer a matching concession. The system previews the joint result, but changes become real only when their owners accept. Nobody edits someone else’s limits; the solver never quietly relaxes them.

This is not an AI itinerary generator or majority vote. It is a **multi-person negotiation instrument** that makes reciprocal trade-offs directly manipulable.

**Standout UI:** Every phone is a colored handle on the same elastic planning surface. Drag a provisional boundary and new islands emerge on the shared screen. Conditional offers appear as paired bridges: incomplete until both owners accept. Everyone can look up and discuss one shared object instead of separately filling out surveys.

**Why this gap:** Existing decision tools help collect positions. They leave participants to mentally compute which combination of small changes would unblock the group. TREATY externalizes that calculation while preserving individual authority.

**Actual prior art / precise difference:**
- [Loomio](https://www.loomio.com/) already supports discussion, reasoned voting, proposal improvement, and recorded outcomes; [Slido](https://www.sli.do/) already captures live audience preferences. **The difference is executable conditional concessions and feasibility explanations**, not “giving everyone a voice.”
- [Sharika et al., PNAS 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11127007/), inspected in full text, used group decisions requiring members to pool differently distributed information. Among 44 groups in the final analysis, 23 reached the correct answer. This motivates surfacing distributed information; **it does not establish that TREATY improves decisions**, and its physiological measurements are not part of the proposal.

**Exact live demo:** Three strangers receive conflicting outing constraints. The popular plan is visibly infeasible. Judge adds “back before 8.” The solver explains the conflicting requirements. Two participants negotiate and preview a conditional exchange; their joint acceptance reveals a workable plan. Judge then withdraws one concession: the plan must revert immediately, rather than retaining an unauthorized compromise.

**Technical core / overnight cut:** Small curated activity dataset; exhaustive feasibility search or constraint solver; minimal conflicting subsets; conditional-offer state machine; versioned unanimous acceptance. No live bookings or unverifiable venue data.

**Risk:** Can feel like elaborate Doodle. Kill it if users merely submit preferences and wait for a recommendation. The demo must make **two-person contingent negotiation** indispensable.

**Recommendation:** TAKE THREE is the stronger social/design spectacle; TREATY has the clearer recurring practical need. Researched official products and primary papers; no project files modified. Some publisher pages blocked access, so author-hosted and open-access full texts were used.