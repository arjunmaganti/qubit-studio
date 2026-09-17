## 1. SAME PAGE — Don’t translate the conversation. Make the deal visible.

**Travel pain:** At a rental counter, baggage desk, or small tour operator, perfectly translated sentences can still leave you disagreeing about *per person versus total, refundable deposit versus payment, or today versus tomorrow*. The failure is mismatched understanding, not missing vocabulary.

**Pitch:** A shared, bilingual transaction surface where a traveler and a local **assemble what they think is happening—and see exactly where their interpretations disagree.**

**Unusual action + mechanism**
- Start with a narrow transaction, such as renting two bicycles. Drag bicycles, people, money, and return-time tokens onto a timeline.
- Each side chooses their interpretation: “€20 each” versus “€20 total”; “€50 held” versus “€50 paid.”
- A typed transaction graph distinguishes quantity, currency, price basis, refundable amounts, and deadlines. Deterministic rules calculate cash flows and highlight contradictions.
- Both language views render the **same structured facts**, not independently generated translations. Changing a term invalidates its previous acknowledgement.
- End with a portable bilingual summary explicitly marked **“shared understanding, not a legal contract.”**

**Nearest primary-source prior art**
- [Google Translate face-to-face mode](https://support.google.com/translate/answer/6142474?hl=en) already gives each speaker their own half-screen transcription and translation. **A split-screen translator is not the innovation.**
- [ICOON](https://www.icoonforrefugees.com/) already sells a travel picture dictionary and app for pointing at symbols without shared language.
- [Cboard](https://www.cboard.io/) already provides editable symbol-based communication and text-to-speech.

**Difference:** Those establish translation and pointing as existing interaction patterns. The proposed contribution is **two-sided reconstruction of a transaction, with disagreements surfaced at the level of amounts, conditions, and time**. Not a claim of worldwide novelty.

**Design-award interaction / judge-controlled demo, under three minutes:** Hand the judge the “rental owner” side. They secretly choose whether a price is per bike and whether a deposit is refundable. The traveler builds their interpretation. Two beautifully mirrored timelines initially disagree; money visibly flows into different destinations. The judge changes one term, watches the exact mismatch resolve, then changes the return day—reopening only that acknowledgement. Finish with one shared receipt. No chatbot, no rehearsed answer.

**Vision → overnight core:** Eventually cover luggage storage, vehicle hire, and service purchases. Overnight: one bicycle-rental schema, two carefully checked languages, one shared phone or two LAN-connected browsers, typed units, semantic diff, acknowledgement versioning, receipt export. No paid inference required; OCR is optional, not the technical foundation.

**Biggest risk:** Merchants will not complete a complicated form. The whole interaction must be faster than typing into Translate. Test that first. Symbols are not universally understood, and agreement taps do not establish comprehension or honesty. If this becomes a prettier translation form rather than exposing a believable misunderstanding, kill it.

---

## 2. FALLBACK — Reunite without needing another message.

**Travel pain:** Two adults get separated in an unfamiliar station or crowded destination. One waits, one searches, both change meeting points—and keep missing each other. Live location cannot help when connectivity disappears or the last update is stale.

**Pitch:** Before separating, travelers **try to break their reunion plan**, then carry complementary offline instructions that have been checked against those failure scenarios.

**Unusual action + mechanism**
- Choose recognizable, photographed meeting points and a deadline. Assign asymmetric roles: one person anchors; the other returns.
- Drag disturbances onto a shared timeline: late arrival, clock disagreement, missed checkpoint. Watch the naïve “come find me” plan produce crossing paths.
- A finite-state model explores both travelers’ possible states under explicit walking-time and clock-error bounds. It identifies whether the plan contains a guaranteed overlapping wait window **within those assumptions**, or produces a counterexample.
- Compile the accepted plan into two offline role cards with identical plan hashes. No live tracking, no invented knowledge of the other person.
- Private events cannot magically change both copies. Unsupported circumstances lead to a clearly stated terminal fallback, not an asserted successful reunion.

**Nearest primary-source prior art**
- [what3words](https://what3words.com/products/what3words-app) already supplies precise meeting locations and offline compass navigation. Its official FAQ distinguishes this from sharing an address, which needs connectivity.
- [Briar](https://briarproject.org/how-it-works/) already offers decentralized messaging and synchronization over Bluetooth or Wi-Fi when the internet is unavailable.

**Difference:** Not more precise positioning or another offline messenger. **The useful artifact is a pre-agreed behavioral protocol that still executes when no messages can pass.** The technical contribution is checking the protocol and exposing its assumptions, not inventing distributed rendezvous theory.

**Design-award interaction / judge-controlled demo, under three minutes:** A split-flap departure-board aesthetic presents two travelers’ parallel timelines. The judge scrubs time and introduces a delay: animated paths cross without meeting. They replace “both search” with anchor/return, and the overlapping wait interval becomes visible. Load both role cards onto phones, switch off Wi-Fi and cellular data, and demonstrate that instructions remain available. Run accelerated time in an explicitly labeled simulator; do not pretend the simulation is field validation.

**Vision → overnight core:** Eventually import station layouts and support more travelers. Overnight: two adults, a manually authored three-node venue graph, bounded delays, one alternate plan, exhaustive state exploration, counterexample replay, and cached offline cards. Static landmark photos, not indoor GPS. No special hardware or subscription API.

**Biggest risk:** “Meet here at six” may already suffice. Earn the extra interaction by revealing a real failure the ordinary plan misses. Never imply universal reunion guarantees, emergency suitability, or safe movement through unknown terrain. An inaccessible meeting point may invalidate the model.

**Recommendation:** SAME PAGE has the more immediate human payoff and stronger face-to-face design opportunity. FALLBACK has the more distinctive computational demo, but greater setup-burden risk.

**Research status:** Inspected the linked primary product documentation via HTTP; these are proposed builds, not reproduced products. Life360 pages were blocked and excluded from substantive comparisons. No files created or modified.