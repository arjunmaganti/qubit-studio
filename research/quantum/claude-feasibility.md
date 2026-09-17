# Qubit Studio — Research & Planning Report for HackCMU 2026

*Prepared for a two-builder + reviewer/demo team, Apple Silicon Macs, ~24 hours, optimization track. This is research and planning only — no code was written, no dependencies installed, nothing was run or benchmarked. Every "fact" below is labeled as **[DOC]** documentation/primary-source-backed, **[ROT]** rule of thumb / heuristic, or **[Q-PHYS]** an open question to route to the physics research lane.*

---

## TL;DR

- **The physics you need is settled and shallow enough to implement correctly in a day.** A transmon's transition frequency is f01 ≈ √(8 EJ EC) − EC and its anharmonicity is α ≈ −EC (Koch et al. 2007), and scqubits' `Transmon` class computes both *exactly* by diagonalizing the Hamiltonian — so your numeric outputs will be trustworthy **provided the physics lane pins units and conventions first.** Do not hand-roll the asymptotic formulas as your source of truth; call scqubits and use the formulas only as display/sanity checks.
- **Your biggest project-killing risk is hosting, not physics.** A cold Python/scqubits container on Railway's Serverless tier "sleeps somewhere between 5 and 10 minutes after its last outbound traffic" (Railway Docs) and can return a 502 on the first wake request, while any Monte Carlo sweep proxied through a Vercel Hobby function must finish inside a hard 300-second wall ("The default execution time, for all projects on all plans, is now 300 seconds," and on Hobby 300s is *also* the maximum). Architect around these two numbers from hour one.
- **Qubit Studio's honest differentiation is the decision workflow, not the calculator.** Free web transmon calculators already exist (c-qed.com; Anton Potočnik's calculator) and SQuADDS is a validated design *database*. None of them do constraint/objective-driven search **plus** matched-sample Monte Carlo robustness comparison **plus** a reproducible exported decision record. Lead your demo with that trio.

---

## Key Findings

### Physics (all [DOC] unless noted)
- A transmon is a Josephson junction shunted by a large capacitor, deliberately operated at large EJ/EC so that charge dispersion (and hence charge-noise dephasing) is exponentially suppressed while anharmonicity falls only as a weak power law (Koch et al., Phys. Rev. A 76, 042319, 2007).
- **Exact Koch 2007 asymptotic formulas (transmon limit EJ/EC ≫ 1), verified verbatim from the paper:**
  - Energy levels (Eq. 2.11): E_m ≈ −EJ + √(8 EC EJ)(m + ½) − (EC/12)(6m² + 6m + 3).
  - Anharmonicity (Eq. 2.12): α ≡ E12 − E01 ≈ −EC; relative anharmonicity α_r ≡ α/E01 ≈ −(8 EJ/EC)^(−1/2).
  - Charge dispersion (Eq. 2.5): ε_m ≈ (−1)^m EC · (2^(4m+5)/m!) · √(2/π) · (EJ/2EC)^(m/2 + 3/4) · exp(−√(8 EJ/EC)).
  - From Eq. 2.11 directly: f01 = E01 ≈ √(8 EC EJ) − EC and E12 ≈ √(8 EC EJ) − 2EC.
- **Koch 2007's own recommended design window:** 20 ≲ EJ/EC ≪ 5×10⁴ (text near Eq. 2.13). Below ~EJ/EC ≈ 9 the anharmonicity changes sign; above it, anharmonicity is usable but shrinking.
- **Typical published fixed-frequency transmon parameters:** f01 ≈ 4–6 GHz; α ≈ −200 to −350 MHz; EC ≈ 200–350 MHz; EJ/EC ≈ 40–80. (IBM-device modeling papers quote ω/2π ≈ 5 GHz, α/2π ≈ −300 MHz, EJ/EC ≈ 40–50; a measured InAs gatemon paper reports EC/h = 309 MHz, EJ/EC = 52.)
- **Fabrication variability (this is what justifies your Monte Carlo model):** "Typical fabrication tolerances for transmon frequencies range from 1 to 2%, with uncertainties dominated by the 2 to 4% variation in tunnel junction resistance Rn" (Zhang et al., *Science Advances* 8, eabi6690, 2022). Post-fab **laser annealing (LASIQ)** tunes junctions to sub-percent precision: the same IBM work reports annealing "to within 0.3% tolerance around RT (corresponding to ~10 MHz)" and an as-tuned frequency-equivalent precision of ~5 MHz; a related npj QI study measured an initial spread of σf = 132.3 MHz (2.3% of median) before tuning.

### Implementation (all [DOC] unless noted)
- **scqubits 4.3.1 is the current PyPI release** ("scqubits: superconducting qubits in Python – 4.3.1"); conda-forge supports Python 3.9–3.12. **Target Python 3.12** (or 3.11); avoid 3.13.
- The current `Transmon._evals_calc` uses `scipy.linalg.eigvalsh_tridiagonal`, described in the changelog as a "Speedup for diagonalization of Transmon and TunableTransmon by recognizing the Hamiltonian matrix as tridiagonal." Older docs describe `scipy.linalg.eigh`; both diagonalize the same charge-basis Hamiltonian and give equivalent eigenvalues. **No transmon-path API breakage between 4.3.1 and main that affects you.**
- scqubits hard-depends on qutip, matplotlib, sympy, pathos, dill, and more — a heavy dependency tree for a small container. **Set the matplotlib Agg backend** (`MPLBACKEND=Agg` or `matplotlib.use("Agg")` before importing pyplot) to avoid headless-container crashes.
- **Railway** free/trial: 0.5 GB RAM (Free) / 1 GB shared-vCPU (Trial), **4 GB image-size limit** on both, serverless sleep after 5–10 min, and a platform maximum HTTP request timeout of 15 minutes on its proxy.
- **Vercel** Hobby with Fluid compute: **300 s function default = 300 s maximum** (no higher ceiling on Hobby).

---

## Details

### PART 1 — Physics primer for non-physicists building this product

#### (a) What a transmon physically *is*, and how it differs from a harmonic oscillator — [DOC]
A superconducting qubit is an electrical circuit, cooled to ~10–20 mK, that behaves as a quantum object. The transmon has two elements in parallel: a **capacitor** and a **Josephson junction** (two superconductors separated by a thin insulating barrier). In a superconductor, electrons bind into **Cooper pairs**; the junction lets Cooper pairs tunnel across the barrier. The two conjugate variables are the **charge** n̂ (number of Cooper pairs that have crossed, in units of 2e) and the **phase** φ̂ (the superconducting phase difference across the junction). They are quantum-conjugate like position and momentum.

A plain LC circuit is a **harmonic oscillator**: its energy levels are evenly spaced, so a microwave pulse resonant with the 0→1 transition would also drive 1→2, 2→3, … and you could never isolate a clean two-level qubit. The Josephson junction is a **nonlinear inductor**; it makes the potential a cosine rather than a parabola, so the levels become *unequally* spaced (Krantz et al. 2019, *Appl. Phys. Rev.* 6, 021318). That unequal spacing — the **anharmonicity** — is what lets you address only |0⟩↔|1⟩ and treat everything else as leakage. The transmon is, in Krantz's phrasing, "essentially a slightly anharmonic oscillator."

#### (b) The Hamiltonian, EJ and EC, and the transmon regime — [DOC]
scqubits implements exactly (from the `Transmon` class docstring):

  H = 4 E_C (n̂ − n_g)² − (E_J/2) Σ_n ( |n⟩⟨n+1| + h.c. )

equivalently H = 4 E_C (n̂ − n_g)² − E_J cos φ̂ (Koch Eq. 2.1). The three tunable parameters map directly onto your floating controls:
- **EC — the charging energy**: EC = e²/(2CΣ), set by the total capacitance CΣ. Bigger capacitor → smaller EC. [DOC: Krantz 2019; e.g. CΣ = 62.7 fF → EC/h = 309 MHz in a measured device.]
- **EJ — the Josephson energy**: EJ = (ℏ/2e)·Ic = Φ0·Ic/2π, set by the junction critical current Ic (equivalently EJ = Φ0²/((2π)²·LJ) via the junction inductance, or ∝ 1/Rn via the room-temperature junction resistance through the Ambegaokar–Baratoff relation). [DOC]
- **ng — the offset (gate) charge**: the dimensionless charge bias; charge noise is fluctuation in ng. [DOC]

The **transmon regime** is EJ/EC ≫ 1 (Koch: 20 ≲ EJ/EC ≪ 5×10⁴). In this regime φ is a "good quantum number" (small phase fluctuations) and eigenstates localize in the cosine well, becoming nearly harmonic — hence the small anharmonicity.

#### (c) The asymptotic formulas and their exact higher-order corrections — [DOC]
Leading order (the numbers you'll show on screen):
- f01 ≈ √(8 EJ EC) − EC
- α ≈ −EC
- charge dispersion ~ exp(−√(8 EJ/EC)) (drops exponentially with EJ/EC — the whole point of the transmon).

Exact higher-order forms from Koch 2007 (use these as display/sanity checks, but compute the *real* numbers with scqubits):
- **Eq. 2.11:** E_m ≈ −EJ + √(8 EC EJ)(m + ½) − (EC/12)(6m² + 6m + 3). The √(8 EC EJ) term is the Josephson plasma frequency ωp; the −(EC/12)(…) term is the leading anharmonic correction.
- **Eq. 2.12:** α ≈ −EC and α_r ≈ −(8 EJ/EC)^(−1/2) = −√(EC/8EJ).
- **Eq. 2.5:** ε_m ≈ (−1)^m EC (2^(4m+5)/m!) √(2/π) (EJ/2EC)^(m/2+3/4) exp(−√(8 EJ/EC)).

**Important accuracy caveat [ROT→Q-PHYS]:** the asymptotic α ≈ −EC underestimates the true magnitude at finite EJ/EC. Independent numerical work notes that at EJ/EC = 60 the exact |α| ≈ 1.13·EC (~13% larger than −EC). **This is precisely why Qubit Studio should report scqubits' diagonalized values, not the closed-form −EC, as its authoritative output.**

#### (d) Typical published parameter ranges — [DOC] with [ROT] flags
| Quantity | Typical fixed-frequency value | Source type |
|---|---|---|
| f01 | 4–6 GHz (hardware optimized for 4–8 GHz) | IBM-device modeling; multiple |
| α (anharmonicity) | −200 to −350 MHz (often ≈ −300 to −330) | IBM/Rigetti device & modeling papers |
| EC | ~200–350 MHz | measured devices (e.g. 207, 309 MHz) |
| EJ | ~10–20 GHz | measured devices (e.g. EJ ≈ 16 GHz) |
| EJ/EC | ~40–80 (rule of thumb "> 50" for charge-noise immunity) | Koch; device papers |
| Ic | ~10–30 nA | measured (e.g. 30 nA) |

The "EJ/EC > 50" and "|α| > 200 MHz" thresholds are widely cited **[ROT]** engineering rules, not hard physical laws — good defaults for your constraint presets, but flag them to the physics lane for confirmation of exact bounds. **[Q-PHYS]**

#### (e) Gate-speed vs. charge-noise trade-off — [DOC]
This is the central design tension your optimizer exists to navigate:
- **Raise EJ/EC** → charge dispersion drops exponentially → less dephasing → but anharmonicity shrinks (α_r → 0), which *slows down* the fastest safe gate.
- **Why anharmonicity limits gate speed:** a shorter control pulse has a wider frequency bandwidth; once that bandwidth becomes comparable to |α|, it starts driving the 1→2 leakage transition (Krantz 2019; Blais et al. 2021, *Rev. Mod. Phys.* 93, 025005). Blais 2021 shows Gaussian pulses degrade sharply as gate time shrinks, while **DRAG** (Derivative Removal by Adiabatic Gate) pulse-shaping suppresses leakage and keeps error falling. Blais concludes "small anharmonicity is not a fundamental obstacle to fast and high-fidelity single-qubit gates." A commonly cited [ROT] leakage threshold is peak-Rabi/|α| ≈ 0.15–0.20, and a rough minimum-pulse rule τp ~ 1/|α| (Koch Eq. 2.13: |α_r^min| ~ (τp·ω01)^(−1)).
- **Product implication [ROT]:** your objective function should let the user weight "charge-noise robustness" (favor high EJ/EC) against "gate speed headroom" (favor larger |α| ≈ EC). This is a genuine Pareto trade-off — an ideal thing to visualize. **Ask the physics lane to specify the exact objective and any gate-time model** rather than inventing one. **[Q-PHYS]**

#### (f) How the chip is fabricated and operated — [DOC]
- **Junctions:** Al/AlOx/Al, made by two-angle shadow evaporation with an intermediate oxidation step; typical lateral junction dimensions ~100 nm.
- **Temperature:** operated in a dilution refrigerator at ~10–20 mK (well below Al's superconducting transition).
- **Readout:** each qubit couples capacitively to a **readout resonator** (a coplanar-waveguide cavity); **dispersive readout** measures a qubit-state-dependent shift of the resonator frequency. Resonators are frequency-multiplexed on a common feedline. A **drive line** delivers the microwave control pulses.
- These details motivate your SVG schematic (capacitor pads + junction + coupled resonator + drive line) but are **out of scope for the numerics** — you are modeling the isolated transmon, not the full cQED system or EM environment.

#### (g) T1, T2, and what scqubits' noise models assume — [DOC], limitations [ROT]/[Q-PHYS]
- **T1** = energy-relaxation time (|1⟩→|0⟩ decay). **T2** = total coherence time, combining T1 and pure dephasing Tφ via 1/T2 = 1/(2T1) + 1/Tφ. **[DOC]**
- scqubits `Transmon` **`supported_noise_channels()`** returns: `tphi_1_over_f_cc`, `tphi_1_over_f_ng`, `t1_capacitive`, `t1_charge_impedance`. **`effective_noise_channels()`** (used by `t1_effective`/`t2_effective`) **removes `t1_charge_impedance`** because charge lines are usually not directly coupled to transmons. **[DOC — confirmed in source]**
- **Model assumptions:** T1 channels use a Fermi's-golden-rule / spectral-density approach; dephasing uses a first-order 1/f formula with a noise-strength amplitude A_noise (the docs say scqubits "uses sensible default values … based on the literature"; custom A_noise can be passed). Coherence times are returned in the default **ns** units (in units of 2π·(system units)). **[DOC]**
- **Two limitations that matter for your UI:**
  1. **NaN at sweet spots:** at a first-order sweet spot ∂f/∂λ = 0 the 1/f dephasing formula diverges → scqubits returns `np.nan`. Your UI must handle NaN gracefully (display "dephasing-insensitive / sweet spot," not "error"). **[DOC/ROT]**
  2. **Which channels actually dominate a *fixed-frequency* transmon is a physics-lane question.** For fixed-frequency transmons real T1 is usually dominated by **dielectric loss** (device papers quote loss tangents ~3×10⁻⁷) — a channel *not* in scqubits' default transmon set. **Do not present scqubits T1/T2 as predictive device numbers.** Gate coherence output behind an explicit "illustrative, unvalidated" flag until the physics lane signs off. **[Q-PHYS]**

#### (h) Fabrication variability that justifies the Monte Carlo model — [DOC]
- **EJ spread** is the dominant uncertainty. Because f01 ∝ √EJ ∝ √Ic ∝ 1/√Rn, a 2–4% junction-resistance spread produces a ~1–2% frequency spread: "Typical fabrication tolerances for transmon frequencies range from 1 to 2%, with uncertainties dominated by the 2 to 4% variation in tunnel junction resistance Rn" (Zhang et al., *Science Advances* 2022). A representative pre-tuning measurement: σf = 132.3 MHz ≈ 2.3% of a 5.7 GHz median, with σR ≈ 4.6% of median Rn (npj QI 2021).
- **EC spread** is smaller (set by lithographically-defined capacitor pads, which are more reproducible than the junction barrier) — treat EC uncertainty as a smaller percentage than EJ. **[ROT — get exact ratio from physics lane]** **[Q-PHYS]**
- **Post-fab EJ trimming:** laser annealing (IBM's LASIQ) raises Rn to hit a target frequency, tuning "to within 0.3% tolerance around RT (~10 MHz)" with as-tuned precision ~5 MHz and no measurable coherence impact; other groups report thermal/alternating-bias annealing reaching 0.15–0.17% and tuning ranges of 6–18%.
- **Product implication:** default your Monte Carlo to sample EJ with a ~1–2% (frequency-equiv.) or ~2–4% (resistance-equiv.) Gaussian and EC with a smaller spread; expose these as user-editable assumptions; cite the source in the export. **Ask the physics lane to confirm the exact default σ values and whether to sample Rn or EJ directly.** **[Q-PHYS]**

#### (i) Glossary
- **Cooper pair** — bound electron pair carrying supercurrent (charge 2e).
- **Josephson junction** — two superconductors + thin barrier; a nonlinear inductor.
- **EJ / EC** — Josephson energy (∝ Ic) / charging energy (∝ 1/CΣ).
- **ng** — offset charge; charge noise = fluctuations in ng.
- **Anharmonicity (α)** — E12 − E01; ≈ −EC; the level-spacing unevenness that defines the qubit.
- **Charge dispersion** — variation of energy levels with ng; source of charge-noise dephasing; ~exp(−√(8EJ/EC)).
- **Sweet spot** — bias point where ∂f/∂(noise) = 0; first-order noise-insensitive.
- **f01** — |0⟩→|1⟩ transition frequency ≈ √(8EJEC) − EC.
- **Dispersive readout** — qubit-state-dependent shift of a coupled resonator.
- **DRAG** — pulse-shaping to suppress leakage in fast gates.
- **T1 / T2 / Tφ** — relaxation / total coherence / pure-dephasing times.
- **Dilution refrigerator** — cryostat reaching ~10 mK.

---

### PART 2 — Implementation cross-check and gaps

#### (1) scqubits 4.3.1 PyPI vs. main branch — transmon path — [DOC]
- **Prior-work numbers confirmed:** 4.3.1 is the latest PyPI release. conda-forge/docs support Python 3.9–3.12.
- **Diagonalization:** current source (`scqubits/core/transmon.py`) implements `_evals_calc` with `scipy.linalg.eigvalsh_tridiagonal(diagonal, off_diagonal, select="i", select_range=(0, evals_count-1), check_finite=False)`. The changelog line is: "Speedup for diagonalization of Transmon and TunableTransmon by recognizing the Hamiltonian matrix as tridiagonal." Some older doc pages still describe `scipy.linalg.eigh` (dense). **Both are correct and numerically equivalent for the transmon**; the tridiagonal path is just faster. This is not a breaking difference for your use.
- **`find_EJ_EC` caveat [DOC/ROT]:** the method is a **`@staticmethod`** — `Transmon.find_EJ_EC(E01, anharmonicity, ng=0, ncut=30)` — that runs `scipy.optimize.minimize` on a squared-error cost of (E01, anharmonicity) starting from EJ=10, EC=0.1. It is an unconstrained local optimizer with a fixed start point; the SQuADDS authors note it "can diverge" for modest EJ/EC ≲ 50. **Don't rely on it as your bounded optimizer** — build your own bounded search over (EJ, EC) that evaluates `eigenvals`/`E01`/`anharmonicity` directly (e.g., SciPy `minimize` with bounds, or a grid + local refine), which also gives you clean control over constraints and matched-sample Monte Carlo.
- **darwin scipy pin [DOC, per prior work]:** main-branch pyproject pins `scipy<=1.13.1` on darwin only. On your Apple-Silicon Macs this means a local dev environment will resolve to scipy ≤ 1.13.1; your **Linux container will not be subject to that pin**, so pin scipy explicitly in the container to keep local and deployed numerics identical. **[ROT]**
- **Safest interpreter:** **Python 3.12** (3.11 also fine). Avoid 3.13 (outside the tested/supported 3.9–3.12 range) and avoid ≤3.9.

#### (2) How scqubits-adjacent tools package/containerize — [DOC] + [ROT]
- **Headless matplotlib is the #1 pitfall.** scqubits imports matplotlib unconditionally; in a headless container matplotlib defaults to Agg and *any* attempt to `show()` a GUI window fails ("Matplotlib is currently using agg, a non-GUI backend"). **Fix:** set `MPLBACKEND=Agg` as a container env var, or call `matplotlib.use("Agg")` before importing pyplot. Never call `.plot_*()` GUI methods server-side — compute arrays and send JSON to the frontend to render in SVG/Canvas. **[DOC]**
- **qutip / sympy weight [ROT]:** qutip historically needs a C++ compiler/Cython to build from source (qutip docs), though modern wheels usually avoid this; sympy and qutip together add hundreds of MB. Combined with numpy/scipy/matplotlib/pathos/dill, a naive image can approach or exceed **Railway's 4 GB image-size limit**. **Mitigate:** slim base image (python:3.12-slim), install only what's imported, prefer wheels, and consider whether you need qutip at runtime at all (the pure transmon path uses numpy/scipy; qutip is a hard dependency of scqubits but may not be exercised by your endpoints). **[ROT — verify import graph, don't assume]**
- **pathos multiprocessing in containers [ROT]:** scqubits uses `pathos`/`dill` for parallel parameter sweeps (`num_cpus`). On a **0.5–1 GB / 1-shared-vCPU** Railway instance, multiprocessing gives you nothing and can OOM by forking multiple interpreter copies. **Run all sweeps single-process (`num_cpus=1`) on the free/trial tier** and parallelize in your own bounded loop only if you move to a bigger instance.
- **Comparable tooling for framing:** SQuADDS (Quantum 2024) explicitly builds its design workflow on scqubits' `Transmon.find_EJ_EC`; Qiskit Metal ships an in-browser-style `Hcpb` charge-basis solver for tutorials; SQcircuit and CircuitQ are alternative circuit solvers cited alongside scqubits. This confirms scqubits is the right, well-precedented engine.

#### (3) Existing web-based transmon tools — where Qubit Studio differs — [DOC]
- **c-qed.com ("Transmon Calculator | cQED Designer & Simulator")** — a browser tool that "calculate[s] Ej/Ec ratios, Purcell limits, and simulate[s] iSWAP gates." It's a real-time calculator/simulator, **not** a constraint-driven optimizer with uncertainty analysis.
- **Anton Potočnik's "Transmon Qubit Calculator"** — a widely-used single-page unit/parameter converter (EC↔CΣ, EJ↔LJ↔Ic↔Rn, frequencies, Purcell, χ-shift). A point calculator, no optimization or Monte Carlo.
- **SQuADDS** — a *validated design database + simulation workflow* mapping target Hamiltonian parameters to physical geometries; heavyweight, research-grade, and about matching designs from a database, not interactive robustness search.
- **Qiskit Metal** — full chip-layout/EM design environment; far broader and heavier than your scope.
- **Qubit Studio's defensible wedge (state this explicitly in the demo):** (i) **constraint/objective-driven bounded search** over (EJ, EC) to hit user targets; (ii) **matched-sample Monte Carlo** (same random seeds/samples across candidates) so robustness comparisons are apples-to-apples; (iii) a **reproducible exported decision record** bundling inputs, assumptions, seeds, and results. No existing free tool combines these.

#### (4) Railway / Vercel constraints the earlier pass should weigh — [DOC]
- **Vercel Hobby function ceiling:** with Fluid compute (now default), "The default execution time, for all projects on all plans, is now 300 seconds (5 minutes)"; on **Hobby, 300 s is both the default *and* the maximum** — there is no higher ceiling. (If Fluid compute were disabled, Hobby reverts to a 10 s default / 60 s max.) **Any Monte Carlo run that must return through a Vercel API route has a hard 300 s budget.**
- **Vercel Fluid default instance:** Standard is now 1 vCPU / 2 GB. Fine for proxying; **do the heavy numerics on Railway, not in the Vercel function.**
- **Railway Serverless sleep:** "Once a service stops sending packets it is considered inactive after 5 minutes. Inactivity is sampled on an interval … so in practice a service sleeps somewhere between 5 and 10 minutes after its last outbound traffic." The **first request after sleep incurs a cold start and can return a 502** until the container is up; some cases "may require a rebuild to revive the service."
- **Railway image + resources:** Free = 0.5 GB RAM / 1 vCPU / **4 GB image**; Trial = 1 GB RAM / 2 shared vCPU / **4 GB image** / 5 services per project. The **4 GB image limit** is the real constraint given the scqubits+qutip+sympy tree.
- **Railway proxy timeout:** "The platform maximum HTTP request timeout is 15 minutes." So Railway itself won't cut off a long compute inside 15 min — **but your Vercel proxy will, at 300 s.** The binding constraint on end-to-end latency is Vercel's 300 s, not Railway's 15 min.
- **Networking behaviors [DOC/ROT]:** Railway public networking will convert plain HTTP POST → GET on some paths (use HTTPS, correct methods); TLS certs are Let's Encrypt, auto-issued within ~an hour of DNS. **CORS** is your app's responsibility (FastAPI `CORSMiddleware` allowing the Vercel origin) — not handled by Railway. Add a lightweight **`/health` endpoint**.
- **Limited Trial caveat [DOC]:** if you don't connect and verify a GitHub account, Railway puts you on the **Limited Trial with restricted outbound network access and only a limited set of ports** — verify your account before the hackathon to avoid a surprise.

---

## Recommendations

**Stage 0 — before hacking starts (do tonight, ~30 min):**
1. Verify your Railway account against GitHub to get the **Full Trial** (avoids restricted-network surprises). Decide Trial (1 GB RAM) over Free (0.5 GB) — scqubits+qutip will be tight at 0.5 GB.
2. Send the physics lane a one-page question list (the **[Q-PHYS]** items below) so answers land before you wire the objective.

**Stage 1 — de-risk the two things that can kill the demo (first ~4 hours):**
3. Stand up the FastAPI container early with **Python 3.12**, **scqubits pinned to 4.3.1**, **scipy pinned** (match the darwin ≤1.13.1 you'll dev against), **`MPLBACKEND=Agg`**, a **`/health` endpoint**, and **FastAPI CORS** allowing your Vercel origin. Confirm the image builds under **4 GB** (slim base; prune unused extras).
4. Prove the end-to-end path with a *trivial* transmon call returning JSON before building UI. This flushes out headless-matplotlib, cold-start 502, and CORS issues while they're cheap to fix.

**Stage 2 — core product (bulk of the time):**
5. **Compute authoritative numbers with scqubits** (`Transmon(EJ, EC, ng, ncut, truncated_dim=6)` → `E01()`, `anharmonicity()`, `get_dispersion_vs_paramvals`). Use the Koch closed-forms only as on-screen sanity annotations, clearly labeled "asymptotic approximation."
6. **Write your own bounded optimizer** over (EJ, EC) (SciPy `minimize` with bounds or grid+refine) — **do not** depend on `find_EJ_EC`, which is an unconstrained local fit that can diverge below EJ/EC ≈ 50.
7. **Matched-sample Monte Carlo:** draw one set of random perturbations with a fixed seed and apply the *same* samples to every candidate. Default EJ spread ~1–2% (freq-equiv) / 2–4% (Rn-equiv); smaller EC spread — **all user-editable, sourced in the export.**
8. **Keep every run under the timeouts.** Bound Monte Carlo sample count and optimizer iterations so a request finishes well inside **Vercel's 300 s** (aim <60 s for demo snappiness). Run scqubits **single-process (`num_cpus=1`)** on the small instance. If a run could exceed the budget, make it async (kick off + poll) rather than one long blocking request.
9. Handle **NaN at sweet spots** in the UI as an informative state, not an error.
10. Ship the **exported decision record** (JSON + human-readable): targets, constraints, objective, EJ/EC results, uncertainty assumptions with citations, **random seed**, and library versions. This *is* your differentiator — build it, don't cut it.

**Stage 3 — demo hardening (last ~2 hours):**
11. **Pre-warm the Railway service** ~1–2 min before demoing (or hit `/health` on a timer) so no one sees a cold-start 502. Consider disabling Serverless sleep for the demo window if the tier allows.
12. Gate any T1/T2 output behind an explicit **"illustrative, not validated"** badge unless the physics lane has signed off.

**Benchmarks/thresholds that would change the plan:**
- If the container image can't get under 4 GB → drop optional heavy imports or move to a paid Railway tier (Hobby: 48 GB RAM / 100 GB image).
- If a representative Monte Carlo run approaches ~200 s → switch to async job + polling, or cut sample count / cache the base spectrum.
- If cold-start 502s persist → add a Vercel-side retry-with-backoff proxy and/or a keep-alive ping.
- If EJ/EC targets fall below ~50 and outputs look unstable → increase `ncut` (charge cutoff) and confirm convergence (scqubits does **not** auto-check truncation convergence — that's on you).

---

## Caveats

- **Physics-lane open questions [Q-PHYS] — do not invent answers:** (1) exact objective function and any gate-time/DRAG model for the speed↔charge-noise trade-off; (2) exact default Monte Carlo σ for EJ and EC (and whether to sample Rn or EJ); (3) which noise channels are authoritative for a *fixed-frequency* transmon (scqubits' defaults omit dielectric loss, the usual real-world T1 limiter); (4) confirmation of the constraint presets (EJ/EC > 50, |α| > 200 MHz are engineering rules of thumb, not hard laws); (5) exact EC-vs-EJ variability ratio.
- **scqubits values are exact for the *model*, not the *device*.** The closed-form α ≈ −EC underestimates |α| by ~13% at EJ/EC = 60; always show the diagonalized number. Coherence outputs are model estimates with literature-default noise amplitudes, not device predictions.
- **Hosting numbers are from official docs as of research date (Sept 12, 2026)** and reflect current Fluid-compute defaults; Vercel/Railway limits change — re-check Project Settings → Functions and Railway plan pages before relying on any single number. No hosting **costs, latencies, or benchmarks** are asserted here beyond what official docs state.
- **Nothing in this report was tested, benchmarked, or executed.** All performance guidance is planning-stage reasoning from documented limits, to be validated during the build.
- **Source-quality note:** Koch 2007, Krantz 2019, Blais 2021, and the scqubits paper/docs are primary/authoritative. Parameter ranges are corroborated across multiple device and modeling papers. A few figures (junction dimensions, loss tangents) come from individual device papers and are representative, not universal. The exact Koch equation forms were verified against the open-access arXiv PDF (cond-mat/0703002v2).