# HackCMU 2026: independent idea research

First independent research pass complete. This is an evidence notebook, not a locked project decision. See shortlist.md for research-derived candidates and the three source-linked appendices: competitive-student-winners.md, ai-competition-winners.md, and prior-art-audit.md. Candidate-specific novelty and implementation tests remain open.

## Team and event constraints

- Three teammates: two implementers plus one technical reviewer/tester/demo lead. One implementer has an M3 MacBook Air with 24 GB RAM. Phones available; no specialized hardware confirmed.
- Event submission deadline listed on Devpost: September 12, 2026, 4 pm EDT.
- Tracks reported by the user: optimization, travelling, multiplayer / meeting in real life, food. IFM is a platinum sponsor on the official site; its challenge and acronym remain unverified.
- Official event: https://hack-cmu-2026.devpost.com/
- Organizer site: https://www.acmatcmu.com/hackcmu2026/

## Authoritative judging slide supplied by user

Source: /Users/vaibhav/Downloads/IMG_2658.JPG, visually inspected.

- Originality: "Entirely novel" / "A fresh approach to a problem."
- Technical Difficulty: "Real technical challenges" vs "ChatGPT wrapper."
- Demo Quality: "Clear, understandable, and under 3 minutes."
- Usefulness: "Practical and fulfills a real need."
- Relevance (Track only): how related the project idea is to the selected track.

No numerical weights are shown. Novelty does not require claiming a world-first invention. Track relevance is explicitly a track-only criterion; do not distort the overall idea to fit an assumed sponsor theme.

## Evidence standards

1. Award evidence: explicit organizer announcement or Devpost award label; distinguish overall awards from category and sponsor awards.
2. Mechanism evidence: team description and linked repository. These establish a documented prototype, not independent reproduction or product reliability.
3. Prior art: search research systems and existing products, not just other hackathon submissions.
4. Differentiation: state precisely what would be new about our implementation or application. Do not claim worldwide novelty from a limited search.
5. Feasibility: name the single hardest technical uncertainty and an early experiment that can kill the idea.
6. Demo integrity: use real computation and inputs. Label simulations and constrained environments; no staged success presented as general capability.

## Initial winner bank (documented prototypes, not independently run)

| Project | Event / award evidence | Technical mechanism | Source |
| --- | --- | --- | --- |
| Freak in the Sheets | TreeHacks 2026, Most Technically Complex | LLVM backend, custom ISA and spreadsheet virtual machine | https://devpost.com/software/freak-in-the-sheets-7jl542 |
| Unreal EngJam | Cal Hacks 11.0, Most Entertaining and Warp developer-tool award | FigJam diagram to typed language AST and interpreter, game rendering | https://devpost.com/software/unreal-engjam |
| Mira | TreeHacks 2026, Most Impactful | Room walkthrough to searchable spatial object graph, geometric localization | https://devpost.com/software/mira-w65b0a |
| Robosurge | TreeHacks 2026, second grand prize | Multi-arm grape-surgery prototype, IK, vision calibration, constrained trajectories | https://devpost.com/software/we-use-nix |
| Mirage | TreeHacks 2026, Modal inference-track award; grouped label does not establish placement | Prompt to generated video to GPU-based 3D reconstruction | https://devpost.com/software/synsplatt |
| Duet | Cal Hacks 11.0, first overall | EEG-derived signals into continuously generated executable musical segments | https://devpost.com/software/duet-0tbkxe |
| SoundSheild | PennApps XXV, first overall | Audio processing and rear-awareness vision in a wearable prototype | https://devpost.com/software/soundsheild |
| SurgiSafe | PennApps XXV, healthcare award | Moisture, pH and temperature sensor fusion for wound-monitoring prototype | https://devpost.com/software/infectdetect |
| MarkedDown | LA Hacks 2024, first place | Invisible image watermarking plus online rediscovery | https://devpost.com/software/markeddown |
| Cena Can See | LA Hacks 2025, Gemini sponsor award | Language and vision to humanoid controls through calibration and IK | https://devpost.com/software/cena-can-see |
| WiiWork | TreeHacks 2025, NVIDIA category award, placement grouped | Agent-readable UI contracts and shared human-agent state | https://devpost.com/software/wiiwork-8u1x62 |
| MediLedger | TreeHacks 2025, Web3 agent category award, placement grouped | Inventory commitments and selective Merkle proof disclosures | https://devpost.com/software/mediledger |

Additional prototype: EyeCraft, HackMIT 2025, face/head/voice-controlled Minecraft. Award not independently confirmed: https://github.com/qihongw08/eyecraft-mod

Additional prototype: Remy, TreeHacks 2026, observed cooking state and recipe-task progression. No award label found; previous chatbot's Best Demo attribution is unsupported: https://devpost.com/software/remy-qhcw4s

## Additional Cal Hacks 12.0 findings

Primary gallery inspected: https://cal-hacks-12-0.devpost.com/project-gallery

- **FaceTimeOS**, first overall: FaceTime/iMessage as a remote interface to a Mac agent; documented work includes audio routing, desktop actions and screenshot confirmation. This is a case where integration engineering is central, not an argument that all agent interfaces are weak. https://devpost.com/software/facetime-macos-ai-agent
- **Bob**, Most Creative Hack: Snap Spectacles plus Gemini Live, object detection and aligned object highlights for physical work. This is direct prior art against pitching a generic visual assembly assistant as novel. The builders' claim of a first-of-its-kind system is not independently established. https://devpost.com/software/bob-vj43mq
- **Duck Duck Goose**, AppLovin Query Planner Challenge: on-disk data layout, materialized views, query rewriting and caching using DuckDB. Team reports major speedup on an M3 Pro with 18 GB RAM after preprocessing; not independently benchmarked. Concrete performance engineering can be a strong hack without unusual hardware or a conversational interface. https://devpost.com/software/duck-duck-goose-jelxr9
- **Expungo**, Greatest Social Impact plus Promise Public Impact Prize: legal-document extraction, eligibility guidance and completed expungement forms. Its practical deliverable is stronger than generic legal Q&A. Legal accuracy is not independently validated, and its privacy wording conflicts with its described use of third-party model APIs; do not repeat the privacy guarantee. https://devpost.com/software/clearpathai

Interpretation: awards recognize several kinds of accomplishment, including systems engineering and completion of a consequential workflow. A hand-picked winner sample cannot establish what causes winning, and a sponsor prize should not be conflated with overall first place.

## Important limits in the references

- Mira's documented map is from a one-time walkthrough, not continuously updated object memory.
- Mirage explicitly lists physics and object manipulation as half-completed future work. Generated 3D appearance is not a validated simulator.
- Robosurge's bounds proofs do not establish clinical safety for an entire surgical system.
- Remy describes scene observations every seven seconds, not an independently validated real-time cooking tutor.
- WiiWork is a website built for agent interaction, not universal control of arbitrary existing sites.
- Merkle proofs alone do not establish zero-knowledge privacy or truth of physical inventory.

## Independent prior art and enabling technology inspected

### Physical objects as programs are established prior art

- Dynamicland describes communal computing in physical space and publishes a research history dating to 2014: https://dynamicland.org/
- Microsoft Project Zanzibar tracks identified objects on a tangible surface and supports physical programming, games, and storytelling. Official page lists CHI 2018 Best Paper: https://www.microsoft.com/en-us/research/project/project-zanzibar/
- Therefore, "move objects and something happens on screen" is not itself a novel idea. A proposed tabletop simulator needs a specific missing capability or useful problem, plus a defensible model.

### Sound and camera as offline data links are established prior art

- ggwave provides FSK-based data over sound, error correction, browser examples, and an advertised bandwidth of 8–16 bytes/sec: https://github.com/ggerganov/ggwave
- libcimbar provides animated colored barcodes and fountain-coded optical transfer. Its documented decoder platform is Android/native; browser/WASM support is encoder-only in the inspected README: https://github.com/sz3/libcimbar
- Do not pitch "phones communicate without Wi-Fi" as a new invention. Any new application needs substantive workflow or protocol innovation. Do not assume a browser decoder exists just because the encoder runs in a browser.
- Browser audio primitives: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## Decision gates for candidate concepts

Each candidate must answer:

1. Who has the problem, and what is the current workaround?
2. What does the judge physically observe within three minutes?
3. What is the closest existing system, and what exact behavior differs?
4. What is the nontrivial technical mechanism, apart from calling a model?
5. What can two builders implement without specialized hardware?
6. What early experiment would make us abandon or narrow it?
7. What is simulated, restricted, or not yet established?

Earlier suggestions (Dry Run, Ghost Hands, Clearinghouse, Counterexample) remain unselected and are undergoing prior-art review. This research should be allowed to replace them rather than defend them.
