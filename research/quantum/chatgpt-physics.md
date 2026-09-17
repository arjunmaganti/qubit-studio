# Qubit Studio research and model contract

**Evidence labels:** **S** = directly supported by an inspected source; **P** = proposed choice or analytical inference; **U** = unresolved; **V** = requires executable validation after hacking starts. Numbers marked P are scenario specifications, not measured device data. This is a research and planning deliverable; no application, prototype, or numerical simulation was executed.

## A. Executive recommendation

**CONDITIONAL GO.** Build a single-transmon spectral design and tolerance explorer. The smallest useful optimization is: **at a chosen nominal transition frequency, maximize retained anharmonicity subject to a charge-dispersion ceiling, then repeat with explicit electrical-parameter stress scenarios.** Display the trade-off curve and constraint margins alongside the selected candidate. **P**

The physics supports the competing objectives: charge dispersion falls rapidly with increasing Josephson-to-charging-energy ratio, while relative anharmonicity decreases more slowly. This motivates a constrained choice, not a universally best qubit. **S** [^1]

Three conditions determine whether the optimization pitch survives:

1. The selected design must be limited by a meaningful user specification, rather than an arbitrary search bound. **P/V**
2. The official numerical reference and charge-dispersion convergence checks must pass. **V**
3. The demo must report the actual trade-off, including no feasible design, indistinguishable candidates, or no robustness improvement when that is the result. **P/V**

Defer coherence, material selection, layout synthesis, gate fidelity, and fabrication yield. The useful outcome is an inspectable comparison of effective electrical designs under declared assumptions. Its strongest initial audience is students and researchers screening a small model before more detailed work. **P**

## B. Recommended model and optimization

Use the static, isolated, single-mode `scqubits.Transmon`. Represent a Josephson junction shunted by the **effective total capacitance** of the mode. Keep the cosine potential and a converged charge basis; a two-level truncation or harmonic/Duffing approximation cannot supply the required charge-dispersion calculation. **S/P** [^1][^2]

Define numerical GHz-valued parameters `j = EJ/h` and `c = EC/h`. In these units,

\[
H/h=4c(\hat n-n_g)^2-j\cos\hat\varphi.
\]

The charge-basis diagonal is \(4c(n-n_g)^2\), the adjacent off-diagonal is \(-j/2\), and \(n=-N,\ldots,N\). The matrix has dimension \(2N+1\). **S** [^2][^3]

A flux-tunable transmon adds a SQUID asymmetry and bias dependence. Those are useful only if tunability is itself a requirement; they introduce calibration and noise questions without fixing the present optimization. Keep the fixed model for this project. **P**

**Nominal baseline.** At \(n_g=0\), require \(f_{01}=f_*\). Maximize \(A_0=-\alpha(0)\), subject to \(D_{01}\le D_{\max}\), \(A_0\ge A_{\min}\), the full-period frequency band below, and the search domain in C. Equivalently, use the scenario problem below with only the zero-perturbation scenario. Require negative \(\alpha\); do not reward positive anharmonicity through an indiscriminate absolute value. **P**

**Recommended scenario optimization.** For every electrical stress scenario \(s\), evaluate:

\[
A_s=-\alpha(j_s,c_s,0),\qquad
D_s=\max_{n_g\in[0,1]} f_{01}(j_s,c_s,n_g)-\min_{n_g\in[0,1]} f_{01}(j_s,c_s,n_g).
\]

Choose the design maximizing \(\min_s A_s\), subject to:

\[
f_{01}(j,c,0)=f_*,\quad
D_s\le D_{\max},\quad A_s\ge A_{\min},\quad
f_*-\Delta f\le f_{01}(j_s,c_s,n_g)\le f_*+\Delta f.
\]

These full-period mathematical requirements are assessed with independently checked endpoint extrema and charge sweeps; a finite charge grid alone does not certify the continuous interval. The last condition covers the offset-charge period for each scenario, not just \(n_g=0\). The nominal frequency is held exactly in the model; perturbed devices are **not retuned**. The objective's anharmonicity is explicitly evaluated at \(n_g=0\); do not label it an all-offset-charge minimum. Show its charge dependence separately if requested. **P**

**Why this is nontrivial but small.** Fixing frequency removes one degree of freedom. Larger anharmonicity then competes with charge insensitivity. The expected optimum activates the charge-dispersion specification; an active specification is legitimate even when the solution is a boundary point. Fixing both frequency and anharmonicity instead would largely turn the exercise into parameter fitting. **P**, using the asymptotics in [^1]; exact behavior **V**.

Use a transparent one-dimensional sweep with refinement, not a large black-box search. Let \(r=j/c\), diagonalize \(H/(hc)=4(\hat n-n_g)^2-r\cos\varphi\), and denote its first gap by \(g_{01}(r,0)\). Then

\[
c=\frac{f_*}{g_{01}(r,0)},\qquad j=rc.
\]

This scaling is exact for the specified Hamiltonian and removes the need to repeatedly fit two variables. Reject mapped candidates outside the search domain. Report a best candidate within the searched resolution, not an unproved global optimum. **P/V**

## C. Inputs, outputs, units, and constraints

| Quantity | Contract and meaning | Example or proposed domain | Evidence / limitation |
|---|---|---|---|
| `EJ_GHz` = \(j\) | Josephson energy divided by **h**, in GHz | P search: 5–35 GHz | S source default: 15 GHz [^3]; not a geometry variable |
| `EC_GHz` = \(c\) | Charging energy divided by **h**, in GHz | P search: 0.15–0.45 GHz | S source default: 0.3 GHz [^3] |
| \(r=j/c\) | Dimensionless energy ratio | P nominal search: 20–120 | Exploration guardrail, not a universal transmon validity theorem |
| \(n_g\) | Offset charge in Cooper-pair units, \(Q/(2e)\); periodic modulo 1 | P nominal 0; diagnostic sweep 0–1 | S definition [^1]; environment/bias probe, not free robustness design variable |
| \(N=\texttt{ncut}\) | Charge-basis numerical cutoff | P start 30; validate 40 and 50 | S meaning [^3]; never expose as physical component |
| Eigenvalue count | Compute at least levels 0, 1, 2 | P return first 4 for UI | Different from `ncut` and `truncated_dim` |
| \(f_*\), \(\Delta f\) | Nominal target and allowed perturbed half-band | P 5.000 GHz, 0.100 GHz | V feasible demo settings, not literature standards |
| \(D_{\max}\) | Maximum transition charge dispersion | P 10 kHz = \(10^{-5}\) GHz | User sensitivity budget; V whether active |
| \(A_{\min}\) | Minimum anharmonicity magnitude at \(n_g=0\) | P 200 MHz = 0.200 GHz | Requirement floor; may be inactive or cause infeasibility |
| \(\lambda_m\) | Returned eigenvalues: \(E_m/h\), GHz | UI levels: \(\lambda_m-\lambda_0\) | S energy convention [^2][^4]; no populations or decay dynamics |
| \(f_{01},f_{12}\) | \(\lambda_1-\lambda_0\), \(\lambda_2-\lambda_1\), GHz | Positive upward transition frequencies | S definitions [^5]; isolated, bare transitions |
| \(\alpha\), \(A\) | Signed \(\alpha=f_{12}-f_{01}\); magnitude \(A=-\alpha\) in this domain | Display signed alpha and magnitude in MHz | S [^5]; spectral selectivity, not gate fidelity or a gate-time prediction |
| \(D_{01}\) | Peak-to-peak variation of the **transition**, kHz | Endpoint shortcut: \(\lvert f_{01}(1/2)-f_{01}(0)\rvert\) | S library convention [^3]; V check against sweep |
| Constraint margins | \(D_{\max}-\max_sD_s\), \(\min_sA_s-A_{\min}\), worst frequency-band margin | Positive passes, negative fails | P scenario-specific, subject to numerical error |
| Optional sensitivity | \(\partial f_{01}/\partial j\), \(\partial f_{01}/\partial c\), or offset-charge curve | Label derivative units explicitly | P/V; zero local slope does not prove finite-variation insensitivity |
| \(T_1,T_2,T_\phi\) | Omitted from version one | “Not modeled” | Noise spectra and coupling assumptions required [^8][^9][^10][^11] |

**Unit rule.** Real energies are \(E=h f\); angular frequencies are \(\omega=2\pi f=E/\hbar\). GHz here means ordinary frequency, not radians per nanosecond. Pass `j` and `c` directly as scqubits `EJ` and `EC` with GHz selected; do not multiply them by \(2\pi\). GHz-to-MHz multiplies by \(10^3\); GHz-to-kHz by \(10^6\). **S/P** [^4]

The optimization bounds do not apply to the official reproduction fixture in E. A library example is not automatically a recommended device operating point. **P**

## D. Uncertainty and noise assumptions

**Sourced relationships.** \(E_C=e^2/(2C_\Sigma)\), so capacitance variation changes charging energy inversely. \(E_J=\hbar I_c/(2e)\), so critical-current variation changes Josephson energy proportionally. **S** [^1] Recovering dimensions, film properties, or process settings requires additional modeling and data. **P**

**Proposed default: deterministic stress tests.** Use 25 equally spaced combinations of \(\delta_I\in\{-0.02,-0.01,0,0.01,0.02\}\) and \(\delta_C\in\{-0.01,-0.005,0,0.005,0.01\}\):

\[
j_s=j(1+\delta_I),\qquad c_s=c/(1+\delta_C).
\]

These ±2% and ±1% envelopes are deliberately declared hypothetical tolerances. They are neither measured standard deviations nor a probability distribution. Passing means **“passes all 25 evaluated electrical stress scenarios.”** It does not certify the entire continuous rectangle. Do not count numerical failures as passes. **P**

Apply the nominal search limits to nominal designs only. Perturbations may leave those slider limits; calculate them rather than clipping or resampling them. Require positivity, converged results, and a separately declared model-check range, proposed \(r_s\ge20\). A failed range check is a failed robustness condition. **P**

**Optional probabilistic view.** If time permits, draw independent uniform \(\delta_I\) and \(\delta_C\) inside the same envelopes. Explicitly name this an assumed distribution; independence is not established. Use a fresh, shared IID evaluation set for the frozen nominal and robust candidates, report joint pass count / total, and a binomial confidence interval. The interval describes Monte Carlo error under that assumed model, not uncertainty about fabrication physics. **P** [^13]

**Physical correlations matter.** Junction dimensions can affect both critical current and junction capacitance; total modal capacitance also contains shunt and environmental contributions. Process-wide effects and local variations need not be independent. A later physical latent-variable model could use \(I_c=J_c\mathcal A\) and \(C_\Sigma=C_{\rm shunt}+c_J\mathcal A+C_{\rm other}\), but its constants, covariance, and applicability require calibration. Do not invent those inputs to imply a fabrication model. **P/U**

**Measured variability is process-specific.** Osman et al. measured 32 nominally identical qubits with 49 MHz frequency standard deviation, or 39 MHz after excluding three outliers; their spectrum-inferred charging-energy deviation was 1.7 MHz (0.8%). Kreikebaum et al. distinguish local and wafer-scale junction variation and report a mismatch between test and device wafers. These studies motivate testing electrical variation, but neither supplies this project's probability distribution or tolerance box. **S/P** [^15][^16]

**Will the robust design beat the nominal winner?** It can improve scenario feasibility by sacrificing nominal anharmonicity when the nominal winner sits near the dispersion ceiling. It need not improve nominal performance, and may offer no material advantage. Frequency spread caused by electrical variation may remain essentially unchanged. If no candidate survives the stress conditions, that is a useful result. **P/V**

**Coherence decision: defer.** Documentation provides conditional noise models, not a device-independent mapping from \((j,c)\) to lifetime. A later educational noise panel could use explicit assumptions, but must be labeled by mechanism and independently validated. **S/P** [^8]

| Mechanism | Additional information needed | Version-one decision |
|---|---|---|
| Capacitive loss | \(Q_{\rm cap}(\omega)\), temperature, applicable mode/loss model | Defer; documented defaults are illustrative [^10] |
| Charge / critical-current dephasing | Noise amplitude and its coordinate units, PSD convention, low-frequency cutoff, experiment/filter assumptions, derivative order | Defer; first-order sweet-spot treatment is insufficient [^9] |
| Coupling to an external circuit / Purcell loss | Impedance or resonator frequency, coupling, linewidth, and relevant modes | Defer; not specified by the isolated Hamiltonian [^10] |
| Other relaxation | Mechanism-specific coupling and spectral density; possible quasiparticle or defect data | Defer; generic library availability is not calibration |
| Combined coherence | Included channels and applicable rate-addition assumptions | Defer; never add lifetimes [^11] |

## E. Reference reproduction test

**Use the official Basics example and its adjacent Energy spectrum page together.** Inputs: `EJ=30.0`, `EC=1.2`, `ng=0.3`, `ncut=31`, GHz units, request 12 eigenvalues. The separate Transmon overview uses **30.02**, which must not be mixed into this fixture. **S** [^2][^6][^7]

The documentation prints the first three raw eigenvalues:

| Level | Published \(E_m/h\), GHz |
|---|---:|
| 0 | −21.82665096 |
| 1 | −6.16372350 |
| 2 | 8.01931750 |

These are published targets, not results generated for this report. Simple subtraction gives \(f_{01}=15.66292746\) GHz, \(f_{12}=14.18304100\) GHz, and \(\alpha=-1.47988646\) GHz; those derived values inherit the printed rounding. **S/P** [^7]

After the start, pin and record the installed versions, reproduce the fixture, and check the first three published values to proposed absolute tolerance \(10^{-6}\) GHz. Then increase `ncut` from 31 to 41 and 51; the proposed target for changes in the first three levels/gaps is \(10^{-8}\) GHz. Investigate failures instead of silently relaxing tolerances. **P/V**

For optimizer candidates, separately converge \(D_{01}\): agreement of GHz-scale energies is insufficient evidence for a kHz-scale difference. Validate endpoint dispersion against a 101-point period sweep, then 201 points on finalists. Proposed acceptance: frequency and alpha changes below \(10^{-8}\) GHz; dispersion changes below the larger of 1 Hz and 1% of \(D_{01}\). Near a constraint, use the estimated error as a margin or mark the result unresolved. These are engineering checks, not rigorous error bounds. **P/V**

## F. Five dangerous scientific mistakes

1. **Mixing h, ħ, GHz, MHz, and radians.** Give quantities unambiguous names and preserve the signed definition of alpha.
2. **Calling two target equations an optimization breakthrough.** Expose the remaining trade-off and identify the active constraint or search bound.
3. **Turning charge dispersion into coherence or gate fidelity.** Static spectra provide neither bath dynamics nor pulse performance.
4. **Calling stress-test pass rates manufacturing yield.** Keep assumptions, correlations, and finite-sample limitations visible; never retune each perturbed sample invisibly.
5. **Trusting a tiny eigenvalue difference without convergence.** Check the transition dispersion itself, handle unresolved values, and never present a numerical zero as perfect noise immunity.

## G. Required product changes and pitch

Attach `EJ/h` to the junction and `EC/h` to an explicitly labeled effective capacitance. If capacitance or critical current is editable, derive the corresponding energy automatically; do not allow inconsistent independent copies of the same parameter. Treat schematic dimensions as illustrative. Put offset charge in an environment/bias control, not a fabricated component. **P**

Make the main action **“Find a design meeting these spectral requirements.”** Show the nominal candidate, scenario-qualified candidate, active constraints, and the anharmonicity–dispersion curve. Replace a composite “qubit performance score” with quantities users can interpret. Include model version, convergence status, and assumptions in the comparison export. **P**

An honest pitch is: **“Qubit Studio helps you explore a validated transmon Hamiltonian, choose electrical parameters meeting spectral constraints, and see how explicit parameter variations change those constraints.”** Validation here must be earned through E after the start. **P/V**

A researcher would object to claims of optimal materials, fabrication-ready geometry, measured yield, longer device coherence, faster reliable gates, processor-level advantage, or discovery of a new design principle. This project demonstrates accessible constraint-driven analysis of an established model. **P**

Suggested 24-hour allocation, beginning only when permitted: first 3 hours for environment and reference checks; hours 3–8 for model contract and nominal trade-off; hours 8–13 for stress scenarios and schematic integration; hours 13–18 for comparisons and exports; final 6 hours for convergence, boundary audits, and demo rehearsal. Builder 1 owns numerical behavior, builder 2 owns UI/integration, reviewer/demo lead owns references, assumptions, and adversarial checks. Defer optional Monte Carlo before cutting validation. **P**

## H. Source ledger

The ledger gives exact locations and limits; bracketed numbers throughout refer here. Live documentation was inspected for this report. Version 4.3.1 source was separately inspected; pinning it is a proposal, and environment compatibility remains V. The official release listing identifies this release, but a successful installation has not been tested. [^14]

| ID | Exact source and section | Supported claim | Limitation |
|---|---|---|---|
| 1 | Koch et al., *Charge-insensitive qubit design derived from the Cooper pair box* (2007), [paper PDF](https://arxiv.org/pdf/cond-mat/0703002), §§II.A–C and V.C; Eqs. 2.1, 2.3–2.5, 2.11–2.12 | Model, charge coordinate, capacitance/critical-current relations, transmon asymptotics | Approximations are regime-dependent; no hackathon tolerance calibration |
| 2 | scqubits, [Transmon](https://scqubits.readthedocs.io/en/latest/guide/qubits/transmon.html), Hamiltonian and initialization | Charge-basis model, overview fixture using 30.02 | Overview fixture differs from Basics |
| 3 | scqubits v4.3.1, [transmon.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/transmon.py), `default_params`, `_evals_calc`, `_compute_dispersion`, `hilbertdim` | Source defaults, tridiagonal solver, endpoint dispersion, basis dimension | Static source inspection does not establish runtime correctness |
| 4 | scqubits, [Units](https://scqubits.readthedocs.io/en/latest/guide/settings/guide-units.html), Units and warning | GHz convention and coherent unit-setting requirement | Unit setting does not rescue inconsistent input numbers |
| 5 | scqubits v4.3.1, [qubit_base.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/qubit_base.py), `anharmonicity`, `E01` | Signed differences computed from eigenvalues | Does not specify control performance |
| 6 | scqubits, [Basics: Example Transmon](https://scqubits.readthedocs.io/en/latest/guide/basics/basics.html#example-transmon) | Exact reproduction input values | Demonstration point, not a typical-device prescription |
| 7 | scqubits, [Energy spectrum](https://scqubits.readthedocs.io/en/latest/guide/basics/basics-spectra.html), `eigenvals(12)` and convergence warning | Published eigenvalues and user responsibility for cutoff | Rounded values; moving documentation |
| 8 | scqubits, [Coherence Times](https://scqubits.readthedocs.io/en/latest/guide/noise/guide-noise.html), assumptions note and units | Conditional approximations; GHz settings imply ns output | Not evidence that any selected noise model matches a device |
| 9 | scqubits, [Dephasing](https://scqubits.readthedocs.io/en/latest/guide/noise/dephasing.html), 1/f noise | Amplitude, cutoff, experiment-time dependence; first-order limitation | Defaults and implementation conventions require a pinned audit |
| 10 | scqubits, [Depolarization](https://scqubits.readthedocs.io/en/latest/guide/noise/depolarization.html), Capacitive noise; Charge-coupled impedance; User-defined noise | Loss, bath, impedance and spectral-density requirements | Library examples are not process-specific measurements |
| 11 | scqubits, [Effective coherence times](https://scqubits.readthedocs.io/en/latest/guide/noise/effective_noise.html) | Rate addition and selected-channel scope | Does not prove completeness of channels or exponential decay assumptions |
| 12 | Schreier et al., *Suppressing Charge Noise Decoherence in Superconducting Charge Qubits* (2007 preprint / 2008 publication), [full text](https://arxiv.org/html/0712.3581v1), Eq. 1 and Figs. 1–3 | Experimental effective-parameter examples and spectral/dispersion agreement | Devices are coupled and tunable; cannot reproduce all observations with an isolated transmon |
| 13 | SciPy, [binomtest](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html), `proportion_ci` | Available binomial interval calculation | Needs appropriate Bernoulli sampling; not applicable to a deterministic grid fraction |
| 14 | scqubits, [v4.3.1 release](https://github.com/scqubits/scqubits/releases/tag/v4.3.1) | Inspectable release baseline | Installation, timing, and compatibility untested here |
| 15 | Osman et al., *Mitigation of frequency collisions in superconducting quantum processors* (2023), [full text](https://arxiv.org/html/2303.04663v2), §III | Measured frequency variation and spectrum-inferred charging-energy variation | Small cryogenic sample, process-specific data and explicit outlier handling |
| 16 | Kreikebaum et al., *Improving wafer-scale Josephson junction resistance variation in superconducting quantum coherent circuits* (2020), [full text](https://arxiv.org/html/1909.09165v2), §§III–IV, Tables 1–2 | Local/global variation and test-to-device process-transfer limits | Critical current inferred from resistance; not a universal prior |
| 17 | scqubits v4.3.1, [noise.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/noise.py), `NOISE_PARAMS`, `tphi_1_over_f`, `tphi_1_over_f_cc` | Actual default and wrapper paths | Normalization and limiting behavior require a separate executable audit |

## Appendix 1. Why the optimization has only one real design direction

Write \(\lambda_m=c\,\mu_m(r,n_g)\). Every gap, signed anharmonicity, and charge-dispersion width scales with \(c\). Hence the fixed-frequency constraint removes scale exactly, leaving \(r\). This is a useful simplification: a team can inspect the entire remaining design curve instead of presenting a mysterious optimizer. **P**, algebra from the stated Hamiltonian.

The asymptotic estimates are \(f_{01}\simeq\sqrt{8jc}-c\) and \(\alpha\simeq-c\). **S** [^1] Rearrangement gives \(c\simeq f_*/(\sqrt{8r}-1)\). Increasing \(r\) at fixed target reduces \(c\) and usually reduces \(A\), while improving charge insensitivity. These estimates explain the decision; final scoring must use the charge-basis solution. **P/V**

This distinction matters: at fixed \(c\), increasing \(j\) mainly changes frequency and relative anharmonicity; the leading absolute anharmonicity stays near \(c\). A pitch claiming that absolute anharmonicity universally collapses whenever \(E_J/E_C\) increases is misleading. The fixed-frequency contract is what makes the proposed trade-off clear. **P**

If both target frequency and target alpha are fixed, the approximations give \(c\simeq|\alpha|\) and \(j\simeq(f_*+c)^2/(8c)\). The library's `find_EJ_EC` helper likewise fits these two quantities; it is not the proposed scenario optimizer. **P/S** [^3]

**Boundary audit after the start.** Identify every active condition. Expand the numerical search box within the physically stated model scope and repeat. If the selected point moves with an arbitrary box edge, label it bound-limited. If a dispersion ceiling becomes inactive, show that the user's selected problem no longer contains that trade-off. If every point fails, expose the limiting constraint rather than secretly relaxing requirements. Repeat the ratio sweep with finer spacing around all feasible intervals and transitions, without assuming monotonicity. **P/V**

Proposed initial search: 201 ratio points, then local refinement to \(\Delta r\le0.01\) around candidate optima and feasibility boundaries. Recheck finalist objective and margins under further refinement; start with a 0.1 MHz objective-change target. These are numerical-resolution choices, not a proof that disconnected narrow feasible regions cannot exist. **P/V**

## Appendix 2. What parameter robustness can and cannot achieve

Under the proposed electrical map,

\[
r_s=r(1+\delta_I)(1+\delta_C).
\]

At first order, using the asymptotic frequency,

\[
\delta f_{01}\simeq\frac{f_{01}+c}{2}\delta_I
-\frac{f_{01}-c}{2}\delta_C.
\]

Thus independent critical-current and capacitance perturbations produce frequency spread that cannot generally be eliminated by changing only the ratio at a fixed target. Positive correlations can cancel part of the frequency perturbation; opposing perturbations can reinforce it. Because these same variations also change \(r\), frequency and dispersion failure modes need not be maximized by the same scenario. **P**, first-order derivation; accuracy **V**.

For Gaussian assumptions introduced later, the linearized frequency variance is \(a^2\sigma_I^2+b^2\sigma_C^2-2ab\rho\sigma_I\sigma_C\), with \(a=(f+c)/2\), \(b=(f-c)/2\). This shows why a covariance assumption is a model input, not a cosmetic toggle. It is not a recommendation to assume Gaussian manufacturing errors. **P**

For the finite-grid optimizer, “worst” means worst among evaluated scenarios. Refine the stress grid from 5×5 to 9×9 for finalists and inspect interior points. Additional points can disprove a claimed margin; agreement still does not establish a continuum guarantee. Offset charge is swept as a nuisance coordinate, without assigning it a manufacturing distribution. **P/V**

For an optional sampled comparison, a proposed 1,000 fresh IID draws is a starting budget, not a precision guarantee. Freeze both candidates before evaluation and reuse the same draws to make differences interpretable. Include all constraints in one joint pass indicator. Do not multiply separate marginal pass rates. If the difference is small, report it as unresolved; a formal superiority claim needs a paired comparison or additional independent evaluation. **P**

## Appendix 3. Numerical and source-code audit

The inspected v4.3.1 implementation uses tridiagonal eigensolvers for the Transmon spectral calculation. Some guide prose mentions a generic dense solver. Treat the pinned code as implementation evidence and the printed fixture as a separate numerical check. **S** [^3][^7]

`ncut` controls the physical charge-basis approximation. The requested number of eigenvalues controls which low states are returned. `truncated_dim` controls retained eigenstates in relevant transformed/composite operations. Increasing the latter is not a substitute for increasing `ncut`. **S/P** [^3][^5]

For this model, the library evaluates charge dispersion using offset charges 0 and 1/2. Its `point_count` does not refine this special case. Perform the independent verification sweep through eigenvalue calculations at explicit offset charges. For a transition, subtract the transition frequencies at those points; do not confuse this with a single level's signed shift. If endpoint and sweep results disagree beyond the error budget, investigate and use the scanned definition until resolved. **S/P/V** [^3]

The signed level quantity \(\epsilon_m=E_m(1/2)-E_m(0)\) differs from the positive transition width \(D_{01}=|\epsilon_1-\epsilon_0|/h\). **S/P** [^1] Do not replace the transition width with \(|\epsilon_1|/h\), sum energies after independently shifting their zeros, or identify a sweet-spot derivative with global charge immunity.

At large ratio, dispersion subtracts nearly equal frequencies. Use float64, retain full internal precision, and report a floor such as “below validated numerical resolution” when needed. A tiny result on a log plot must not be promoted to an arbitrarily good optimizer score. A finite dispersion ceiling avoids rewarding meaningless extra zeros. **P/V**

For robust and nominal comparisons, use identical cutoffs, eigenvalue counts, parameter conventions, and evaluation sets. Cache keys must include numerical settings and model version as well as physical parameters. Isolate model instances between requests because parameter sweeps mutate object state internally. Reject stale responses when a newer control change has arrived. These are implementation requirements for later, not implemented features. **P**

The return contract should include inputs with units, raw and ground-relative levels, transitions, signed alpha, magnitude, dispersion, each constraint margin, model/solver versions, cutoff, convergence evidence, scenario definition, and evaluation status. Use explicit statuses such as feasible, infeasible, numerical failure, and unresolved near threshold. **P**

**Deferred noise audit.** In pinned v4.3.1, the first-order dephasing routine returns infinity at exactly zero computed rate, while the guide describes NaN at sweet spots. Its low-frequency default also differs by a factor of \(2\pi\) from the guide table. The critical-current wrapper combines a noise-amplitude argument with an `EJ` derivative, so absolute/fractional amplitude normalization needs dimensional verification. These are specific documentation/convention questions, not grounds for declaring the entire library incorrect. Do not rank designs by a diverging first-order lifetime. **S/U/V** [^9][^17]

## Appendix 4. Additional physical reference and decision gates

Schreier et al. report charging energies 0.386 and 0.332 GHz and maximum Josephson energies 17.45 and 18.06 GHz for their example devices. Their Fig. 3 reports charge dispersion decreasing from 74 MHz to 0.8 MHz as the ratio increases from 10.4 to 28.6. These support the scale and qualitative phenomenon, but are not exact isolated-device regression targets: the experiment contains resonator coupling, flux tuning, and quasiparticle effects. **S** [^12]

The official fixture in E is therefore the preferred first reproduction. Subsequent physical comparisons can check trends without claiming the full experiment was reconstructed. A successful library regression establishes implementation consistency; it does not establish that a chosen effective circuit matches a fabricated sample. **P**

| Decision gate after the start | Pass condition | If it fails |
|---|---|---|
| Reference | Published spectral fixture and convergence criteria reproduced | Resolve units/version/solver discrepancy before optimization |
| Trade-off | Feasible curve with interpretable constraint or honest bound-limited status | Present constraint exploration; do not claim a meaningful optimum |
| Scenario claim | Finalists rechecked under denser stress/charge grids | Restrict claim to evaluated scenarios or mark unresolved |
| Demo comparison | Actual measured-in-simulation differences exceed numerical resolution | Show no material change or infeasibility honestly |
| Product readiness | Every visible metric has a defined unit, source/model, and limitation | Remove unsupported metrics before polishing |

The largest unresolved scientific/product risk is not whether the transmon Hamiltonian is known. It is whether the illustrative requirements produce an informative, numerically resolvable feasible trade-off within a one-day implementation. Resolve that first when execution is permitted. **U/V**

## Source notes

[^1]: Koch et al., *Charge-insensitive qubit design derived from the Cooper pair box* (2007), [paper PDF](https://arxiv.org/pdf/cond-mat/0703002), §§II.A–C and V.C; Eqs. 2.1, 2.3–2.5, 2.11–2.12.
[^2]: scqubits, [Transmon](https://scqubits.readthedocs.io/en/latest/guide/qubits/transmon.html), Hamiltonian and initialization.
[^3]: scqubits v4.3.1, [transmon.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/transmon.py), `default_params`, `_evals_calc`, `_compute_dispersion`, `hilbertdim`.
[^4]: scqubits, [Units](https://scqubits.readthedocs.io/en/latest/guide/settings/guide-units.html), Units and warning.
[^5]: scqubits v4.3.1, [qubit_base.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/qubit_base.py), `anharmonicity`, `E01`.
[^6]: scqubits, [Basics: Example Transmon](https://scqubits.readthedocs.io/en/latest/guide/basics/basics.html#example-transmon).
[^7]: scqubits, [Energy spectrum](https://scqubits.readthedocs.io/en/latest/guide/basics/basics-spectra.html), `eigenvals(12)` and convergence warning.
[^8]: scqubits, [Coherence Times](https://scqubits.readthedocs.io/en/latest/guide/noise/guide-noise.html), assumptions note and units.
[^9]: scqubits, [Dephasing](https://scqubits.readthedocs.io/en/latest/guide/noise/dephasing.html), 1/f noise.
[^10]: scqubits, [Depolarization](https://scqubits.readthedocs.io/en/latest/guide/noise/depolarization.html), Capacitive noise; Charge-coupled impedance; User-defined noise.
[^11]: scqubits, [Effective coherence times](https://scqubits.readthedocs.io/en/latest/guide/noise/effective_noise.html).
[^12]: Schreier et al., *Suppressing Charge Noise Decoherence in Superconducting Charge Qubits* (2007 preprint / 2008 publication), [full text](https://arxiv.org/html/0712.3581v1), Eq. 1 and Figs. 1–3.
[^13]: SciPy, [binomtest](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html), `proportion_ci`.
[^14]: scqubits, [v4.3.1 release](https://github.com/scqubits/scqubits/releases/tag/v4.3.1).
[^15]: Osman et al., *Mitigation of frequency collisions in superconducting quantum processors* (2023), [full text](https://arxiv.org/html/2303.04663v2), §III.
[^16]: Kreikebaum et al., *Improving wafer-scale Josephson junction resistance variation in superconducting quantum coherent circuits* (2020), [full text](https://arxiv.org/html/1909.09165v2), §§III–IV, Tables 1–2.
[^17]: scqubits v4.3.1, [noise.py](https://github.com/scqubits/scqubits/blob/v4.3.1/scqubits/core/noise.py), `NOISE_PARAMS`, `tphi_1_over_f`, `tphi_1_over_f_cc`.
