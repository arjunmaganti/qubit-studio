# Qubit Studio — Demo acceptance checklist

Status: adversarial review of the proposed V1 demo. Not a numerical result. Not permission to claim the 5 GHz / 10 kHz / 1 kHz outcome.

**Decision:** the proposed loop is enough for an honest constrained-decision demo. A boundary optimum, inactive constraint, or empty set is acceptable. A novel algorithm is not required. The 5 GHz scenario is still **untested**; do not narrate a cost until a run produces one.

Labels used below:

- `LOGIC` — required by the locked-frequency model, independent of the untested numbers.
- `NEEDS RUN` — must be established by an actual calculation.
- `SHOW` — what the live UI must display for that outcome.

---

## Decision-ready review

The product is a calculator of a one-dimensional constrained choice: at locked \(f_{01}\), \(E_J\) and \(E_C\) are linked through the ratio \(r=E_J/E_C\); maximizing retained anharmonicity magnitude \(A=-\alpha\) subject to a charge-dispersion ceiling \(D_{\max}\) is expected to sit on that ceiling or on a search-domain bound. That is a legitimate optimization-track demonstration if a judge can see **what was maximized, what was disallowed, and what a tighter requirement did**.

It fails as a demo if:

- frequency is labeled locked while \(E_J\) and \(E_C\) still move independently;
- “Optimize” returns a point with no feasible/infeasible landscape;
- a scripted ranking reversal or improvement percentage is promised;
- infeasibility looks like a crash, or an inactive constraint looks like a broken control;
- the schematic or copy implies a fabricated chip.

Electrical stress, coherence, yield, materials, and multi-qubit physics stay out. Do not add them to rescue novelty.

---

## 1. Five judge interventions

Hold the same model, units, and search domain unless the row says otherwise. Frozen **baseline** = selected candidate under the previous requirements, with its numbers kept.

### 1. Confirm the frequency lock

| | |
|---|---|
| Judge changes | With \(f_{01}\) locked, move the junction control **or** the charging-energy control. |
| `LOGIC` | The other electrical parameter must update so the locked nominal \(f_{01}\) is preserved. Independent two-parameter motion while the lock is on is a contract break. |
| Compute | Re-diagonalize (or equivalent locked-frequency map) at the new \(r\); report \(f_{01}\), \(A\), \(D_{01}\). |
| `SHOW` if lock holds | Persistent “\(f_{01}\) locked” state; a visible link that the two energies move together. |
| `SHOW` if \(f_{01}\) drifts | Treat as a **numerical/product defect**, not a physics lesson. Do not continue the optimization story. |
| `SHOW` if unresolved | “Frequency lock not verified at this setting.” Do not display a fake linked value. |

### 2. Headline: tighten charge-dispersion ceiling (10 kHz → 1 kHz)

| | |
|---|---|
| Judge changes | Only \(D_{\max}\): **10 kHz → 1 kHz**. Keep locked \(f^\star=5\,\mathrm{GHz}\) and the declared \(A_{\min}\) fixed. |
| `LOGIC` | Selected \(A\) cannot increase. The old baseline must be re-checked against 1 kHz. Possible honest outcomes: **cost** (new feasible point with smaller \(A\)), **inactive** (baseline already meets 1 kHz and remains best), **infeasible** (no searched point meets both), **unresolved** (\(D_{01}\) below validated resolution). |
| `NEEDS RUN` | Which of those four occurs; the size of any \(A\) change; which constraint or domain bound is active. |
| Compute | Iso-frequency sweep (or equivalent 1-D search); \(A\) and \(D_{01}\) at each candidate; baseline re-evaluation; independent recheck of the selected point. |
| `SHOW` cost | Before/after candidates; \(A\) down, \(D_{01}\) meeting the new ceiling; sentence: “Tighter charge-variation limit. Retained transition spacing decreased.” Name the binding limit. |
| `SHOW` inactive | Baseline still selected. Sentence: “This tighter limit still allows the previous best design.” Do not animate a fake redesign. |
| `SHOW` infeasible | Baseline remains visible and marked failing. Sentence: “No design in the searched domain meets both requirements.” Do not silently relax \(A_{\min}\) or \(D_{\max}\). |
| `SHOW` unresolved | “Charge dispersion not resolved at the tested numerical limit.” Do not plot \(D_{01}=0\) as a perfect winner. |

### 3. Loosen the ceiling until it should go inactive

| | |
|---|---|
| Judge changes | Raise \(D_{\max}\) well above the current candidate’s \(D_{01}\) (direction opposite to intervention 2). Keep \(f^\star\) and \(A_{\min}\) fixed. |
| `LOGIC` | If \(D_{\max}\) is no longer binding, selection is set by \(A_{\min}\) and/or the search-domain bound, not by the ceiling the judge just moved. Further loosening must not keep changing the winner. |
| `NEEDS RUN` | The \(D_{\max}\) value at which the constraint actually goes inactive. |
| Compute | Same search; mark active vs inactive constraints on the selected point. |
| `SHOW` inactive | Ceiling line moves off the selected point; winner stable; “Charge-dispersion limit is not binding.” |
| `SHOW` if the winner still jumps | Investigate: likely a domain-bound or \(A_{\min}\) interaction, or a stale result. Do not call it a new optimum without naming the active bound. |
| `SHOW` unresolved | Same unresolved banner as above. |

### 4. Raise the anharmonicity floor until it conflicts

| | |
|---|---|
| Judge changes | Increase \(A_{\min}\) only, with \(f^\star\) and current \(D_{\max}\) fixed, until the combination should be impossible or the selected point is forced onto \(A_{\min}\). |
| `LOGIC` | \(A_{\min}\) is an **acceptance floor on the same quantity being maximized**, not a second objective. Tightening it shrinks the feasible set. Combined with a tight \(D_{\max}\), the set can empty. |
| `NEEDS RUN` | The \(A_{\min}\) where the set empties (if it does) under the current \(D_{\max}\) and domain. |
| Compute | Feasible-set membership vs \(A_{\min}\); do not optimize \(\lvert\alpha\rvert\) of the wrong sign. |
| `SHOW` still feasible | Selected \(A\) still \(\ge A_{\min}\); floor line visible. |
| `SHOW` infeasible | Empty feasible set; both floors/ceilings drawn; “These two requirements are incompatible in the searched domain.” Offer to relax a control; do not auto-relax. |
| `SHOW` unexpected positive \(\alpha\) | Reject / out-of-regime, not an absolute-value salvage. |

### 5. Change the locked frequency

| | |
|---|---|
| Judge changes | Locked \(f^\star\) to a different in-range value (not 5 GHz). Keep \(D_{\max}\) and \(A_{\min}\) as they currently are. |
| `LOGIC` | The linked \((E_J,E_C)\) curve must be rebuilt for the new \(f^\star\). Old 5 GHz numbers are stale and must not overwrite the new result. This is the anti-scripted-answer probe. |
| `NEEDS RUN` | New curve, new selected point, new feasibility. Do not assume the 10 kHz / 1 kHz story repeats. |
| Compute | Full locked-frequency remap and search at the new \(f^\star\). |
| `SHOW` success | \(f_{01}\) matches the new lock within the stated tolerance; comparison is vs the new lock, not vs leftover 5 GHz charts. |
| `SHOW` infeasible | Empty set at the new frequency with the current budgets. |
| `SHOW` if 5 GHz plots persist | **Fail.** Stale-result defect. |

Do not add a sixth intervention that introduces stress, yield, or coherence.

---

## 2. Three nonexpert comprehension risks

### Risk A — “Frequency is locked, so nothing should move”

**Confusion:** locked \(f_{01}\) looks like a frozen device, or the two energy controls still look independent.

**Short accurate line:** “The first transition stays at the target. Junction energy and charging energy move **together** so that stays true.”

**Visual, not a chatbot:** a lock badge on \(f_{01}\); a single design-path control or a hard visual coupling between the two energy chips; the other value derived and labeled “set by frequency lock.”

### Risk B — “Which number is the cost?”

**Confusion:** smaller \(D_{01}\) looks universally better, so tightening it should not hurt anything. “Transition spacing” may be heard as “we lowered the 5 GHz.” Signed \(\alpha\) in MHz vs \(f_{01}\) in GHz will vanish on one axis.

**Short accurate line:** “Charge-induced frequency variation: lower is better. Separation between the first two transition frequencies: larger magnitude is better. The operating frequency is the thing we locked.”

**Visual:** before/after ladder with \(f_{01}\) fixed and \(f_{12}\) marked; a callout of their difference \(A\). Separate \(D_{01}\) on a kHz scale. Never one generic “quality” score.

### Risk C — “It didn’t move / it vanished, so it broke”

**Confusion:** boundary optimum looks arbitrary; inactive ceiling looks like a dead slider; empty set looks like a crash.

**Short accurate line:** name the binding limit in one sentence, including domain bounds.

**Visual:** feasible vs rejected region on the 1-D path or trade-off plot; old and new selections marked; one of these exact captions:

- “More separation would violate the charge-dispersion limit.”
- “This tighter limit still allows the previous best design.”
- “No design in the searched domain meets both requirements.”
- “Charge dispersion is below the numerical resolution we trust.”

---

## 3. Pitch audit

### Five claims allowed if implementation tests pass

1. This is a **simplified** transmon simulation of effective electrical parameters, not a fabricated-chip predictor.
2. With frequency locked, \(E_J\) and \(E_C\) are **linked**; the remaining choice is the energy ratio under the stated requirements.
3. The app **maximizes retained transition spacing** \(A\) subject to a charge-dispersion ceiling and a declared \(A\) floor, inside a reported search domain.
4. Tightening a requirement **re-evaluates** the frozen baseline and either shows a cost, an inactive constraint, or infeasibility — whichever the calculation returns.
5. Numbers come from the stated model/library path (diagonalization → \(f_{01}\), \(\alpha\), \(D_{01}\)), with units and solver cutoff visible.

### Five tempting claims to refuse

1. “We found the best transmon” / globally optimal device.
2. Lower charge dispersion means better coherence, gates, or fidelity.
3. The design will run at 5 GHz when manufactured; 10 kHz / 1 kHz is a process spec or yield.
4. Tightening dispersion **necessarily** costs transition spacing (untested; may be inactive or infeasible).
5. Empty set means such a transmon is physically impossible, or we discovered the anharmonicity–charge-noise trade-off.

### “Isn’t this just a calculator?”

Yes. The useful part is not a new solver. It is keeping frequency locked while two electrical parameters stay consistent, putting competing requirements on one path, and showing **what a tighter requirement costs — or that it costs nothing, or that it cannot be met.** If the live app cannot show that decision, it is only a spectrum calculator, and should be pitched as one.

---

## 4. Live-app reviewer checklist

Execute against the working UI. Check fail unless noted. `NEEDS RUN` items cannot be signed off from screenshots of unloaded controls.

### Frequency-lock consistency

- [ ] Lock on: moving one energy control updates the other; displayed \(f_{01}\) stays at \(f^\star\) within the stated tolerance. `NEEDS RUN`
- [ ] Lock off (if present): the two energies can move independently and \(f_{01}\) is allowed to change.
- [ ] Copy never says both energies are free while the lock is on.
- [ ] Changing \(f^\star\) rebuilds the linked path; old \(f^\star\) candidates are not reused silently.

### Units and labels

- [ ] \(f_{01}\) in GHz, \(A\)/\(\alpha\) in MHz with sign shown, \(D_{01}\) in kHz, \(E_J/h\) and \(E_C/h\) in GHz, \(n_g\) dimensionless.
- [ ] Ordinary frequency, not \(\omega/2\pi\) mixed into the same field.
- [ ] Schematic labeled as an equivalent-circuit drawing, not a layout or chip photo.
- [ ] \(n_\mathrm{cut}\) is a solver setting, not a device part.
- [ ] No “yield,” “T1/T2,” “gate fidelity,” or “quality score.”

### Baseline versus current requirements

- [ ] Baseline parameters and original requirements remain stored after a requirement change.
- [ ] Baseline is re-scored under **current** requirements; pass/fail can change.
- [ ] Difference is labeled **cost of tightening the specification**, not “more robust.”
- [ ] If one point wins both budgets, it is shown once, not as two fake winners.

### Constraint boundaries

- [ ] \(D_{\max}\) and \(A_{\min}\) are visible on the decision plot (ceiling / floor).
- [ ] Selected point names the active constraint **or** the search-domain bound.
- [ ] \(A_{\min}\) is a floor on the maximized quantity, not a second objective.
- [ ] Unexpected positive \(\alpha\) is rejected, not folded into \(|\alpha|\).

### Stale results during updates

- [ ] In-flight edits show “Updating — previous result” (or equivalent) on the last completed numbers.
- [ ] Older job responses cannot overwrite a newer request.
- [ ] Changing \(f^\star\), lock, domain, or budgets invalidates the previous comparison until recomputed.
- [ ] Cached / previously computed runs are labeled as such.

### Numerical-resolution limits

- [ ] Official fixture path exists and is not the 5 GHz demo numbers. `NEEDS RUN`
- [ ] Finalists rechecked at a larger \(n_\mathrm{cut}\); selection does not flip at the stated tolerance. `NEEDS RUN`
- [ ] \(D_{01}\) below the validated floor is **unresolved**, never a zero that wins a log plot. `NEEDS RUN`
- [ ] Endpoint dispersion shortcut, if used, is checked against an explicit \(n_g\) sweep on finalists. `NEEDS RUN`

### Honest failure states

- [ ] Empty feasible set: explicit infeasible, baseline kept and marked failing, no auto-relaxed constraints.
- [ ] Inactive constraint: winner unchanged, caption says the limit is not binding.
- [ ] Unchanged / tie at resolution: reported as a tie, not a redesign.
- [ ] Solver/backend failure: structured error, not a plausible number.
- [ ] Search-domain limits are printed on the result.

### Demo-day pass rule

Sign the optimization demo only if interventions **1** and **2** work, and at least one of **3–5** has been rehearsed with whatever outcome the run actually produced.

Do **not** require a visible knee, an interior optimum, or a 10 kHz → 1 kHz anharmonicity drop. Do **require** that a judge can point to the binding reason the selected design cannot be improved, and that tightening \(D_{\max}\) does not invent a cost the calculation did not return.
