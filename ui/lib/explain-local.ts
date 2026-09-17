import { formatTopicHeadline, type TopicId } from './explain-topics.ts';
import { parseChipSnapshot } from './insight-snapshot.ts';
import { num, signed } from './format.ts';
import type { ChipSnapshot } from './insight-types.ts';
import { resolveMaterial } from './component-materials.ts';
import { PART_BY_ID, type PartId } from './parts.ts';


function typicalF01(ghz: number): string {
  if (ghz >= 4 && ghz <= 6.5) {
    return `That sits in the usual $4$–$6.5\\,\\mathrm{GHz}$ control band, so a standard microwave stack can drive it.`;
  }
  if (ghz < 4) {
    return `That is below the $4$–$6.5\\,\\mathrm{GHz}$ band most transmon labs use — still valid here, but a less typical AWG/LO setup.`;
  }
  return `That is above the $4$–$6.5\\,\\mathrm{GHz}$ band most transmon labs use — still valid here, but mixing products and filtering get fussier.`;
}

function typicalAlpha(mhz: number): string {
  const mag = Math.abs(mhz);
  if (mag >= 200) {
    return `$|\\alpha|\\approx${num(mag, 0)}\\,\\mathrm{MHz}$ is comfortable: a pulse aimed at $|0\\rangle\\to|1\\rangle$ is well off-resonance for $|1\\rangle\\to|2\\rangle$.`;
  }
  if (mag >= 100) {
    return `$|\\alpha|$ is only ${num(mag, 0)} MHz, so leakage into $|2\\rangle$ is a real pulse-shaping concern.`;
  }
  return `$|\\alpha|$ is only ${num(mag, 0)} MHz — the ladder is almost harmonic, which is how an LC oscillator behaves, not a qubit.`;
}

function typicalRatio(ratio: number): string {
  if (ratio >= 50) return `At $E_J/E_C=${num(ratio, 1)}$ you are deep in the transmon window ($\\ge 20$). Charge noise is exponentially suppressed.`;
  if (ratio >= 20) return `At $E_J/E_C=${num(ratio, 1)}$ you are a transmon, but not a deep one. Dispersion will grow fast if you drop toward $20$.`;
  if (ratio >= 10) return `At $E_J/E_C=${num(ratio, 1)}$ you are leaving the transmon window. Charge-noise sensitivity will rise quickly.`;
  return `At $E_J/E_C=${num(ratio, 1)}$ this is charge-qubit territory: $f_{01}$ can swing by a large amount with $n_g$.`;
}

/** Instant brief that interprets the live numbers instead of restating the UI. */
export function composeLocalMyla(topic: TopicId, snapshot: ChipSnapshot): { topic: TopicId; title: string; body: string; model: 'local-teaching' } {
  const p = snapshot.params;
  const o = snapshot.outputs;
  const title = formatTopicHeadline(topic, snapshot);
  if (snapshot.readiness !== 'ready' || !snapshot.outputs || !parseChipSnapshot(snapshot).ok) return { topic, title, body: 'Wait for a completed current calculation.', model: 'local-teaching' };
  const ratio = p.ratio;
  const selected = snapshot.selected_part;
  const assignment = selected && topic === selected ? snapshot.rendered_component_materials?.[selected] : undefined;
  const material = assignment ? resolveMaterial(assignment) : undefined;
  const appearance = material ? `The rendered ${PART_BY_ID[selected!].name.toLowerCase()} uses ${material.name} (${material.formula}) with a ${material.finish} finish. This appearance choice does not change the electrical inputs.\n\n` : '';
  const body = appearance + brief(topic, snapshot, p, o, ratio);
  return { topic, title, body, model: 'local-teaching' };
}

function brief(
  topic: TopicId,
  snapshot: ChipSnapshot,
  p: ChipSnapshot['params'],
  o: ChipSnapshot['outputs'],
  ratio: number,
): string {
  if (!o) {
    return `The solver has not returned levels yet, so there is no $f_{01}$ to interpret.\n$E_J=${num(p.ej_ghz, 2)}\\,\\mathrm{GHz}$ and $E_C=${num(p.ec_ghz, 3)}\\,\\mathrm{GHz}$ are the inputs; frequency is an output, not a typed-in target.`;
  }

  const f01 = o.f01_ghz;
  const alpha = o.alpha_mhz;
  const disp = o.dispersion_khz;
  const dispNote =
    o.dispersion_status === 'below_reporting_floor' || disp === null
      ? `Charge dispersion is below the ${num(o.dispersion_upper_khz, 3)} kHz reporting floor — not zero, just too small for this solver to quote.`
      : disp < 1
        ? `Charge dispersion is ${num(disp, 3)} kHz: very quiet for a transmon.`
        : disp < 100
          ? `Charge dispersion is ${num(disp, 1)} kHz: a typical transmon residual, not a problem unless the electrostatic environment is noisy.`
          : `Charge dispersion is ${num(disp, 0)} kHz — large enough that $n_g$ drift will jitter the qubit frequency.`;

  switch (topic) {
    case 'f01':
      return `${typicalF01(f01)} In the lab this is the LO/AWG tone you send through the drive line; you never type $f_{01}$ as an input.\nTo move it, change $E_J$ (junction area / $I_c$) or $E_C$ (pad size). Approximate transmon formula: $f_{01}\\approx\\sqrt{8E_JE_C}-E_C$.`;
    case 'f12':
      return `$f_{12}=${num(o.f12_ghz, 3)}\\,\\mathrm{GHz}$ is $|1\\rangle\\to|2\\rangle$, lower than $f_{01}$ by $|\\alpha|$. That detuning is what lets a drive at $f_{01}$ miss the leakage transition.\nIf $|\\alpha|$ shrinks, the two lines overlap in a finite-width pulse and population leaks into $|2\\rangle$.`;
    case 'alpha':
      return `${typicalAlpha(alpha)} For a transmon $\\alpha\\approx -E_C$, so this number is really telling you the charging energy of the island.\nIf $|\\alpha|$ is too small, raise $E_C$ (smaller pads) — knowing that also makes charge noise worse.`;
    case 'dispersion':
      return `${dispNote} Transmons buy that quietness with $E_J/E_C\\gg 1$; the residual wiggle falls off exponentially with the ratio.\nIf this looks loud, raise $E_J$ or lower $E_C$ until $E_J/E_C$ is well above $20$.`;
    case 'ratio':
      return `${typicalRatio(ratio)} That single derived number is the main design fork: addressability ($|\\alpha|\\sim E_C$) versus charge immunity.\nYou cannot type the ratio in; it is $E_J$ divided by $E_C$.`;
    case 'levels':
      return `A transmon is an anharmonic oscillator, not a two-level atom. $|0\\rangle$ is idle, $|1\\rangle$ is the bit, $|2\\rangle$ is the leakage state you design around.\nThe $|0\\rangle$–$|1\\rangle$ gap is $f_{01}=${num(f01, 3)}\\,\\mathrm{GHz}$; the next gap is smaller by $\\alpha=${signed(alpha, 0)}\\,\\mathrm{MHz}$. That difference is the whole point of the junction nonlinearity.`;
    case 'charge':
      return `This curve is $f_{01}(n_g)$ minus its value at $n_g=0$. Offset charge is never still in a real fridge, so a steep curve means a wandering qubit.\n${dispNote} Flatten it by climbing $E_J/E_C$.`;
    case 'junction':
      return `$E_J=\\hbar I_c/(2e)$ is set by junction area and oxide, not by typing a frequency. Raising it blueshifts $f_{01}$ and the transmon ratio.\nLive $E_J=${num(p.ej_ghz, 2)}\\,\\mathrm{GHz}$ $\\Rightarrow$ $f_{01}=${num(f01, 2)}\\,\\mathrm{GHz}$ at $E_J/E_C=${num(ratio, 1)}$. ${typicalF01(f01)}`;
    case 'capacitor':
      return `$E_C=e^2/(2C_\\Sigma)$. Bigger shunt pads $\\Rightarrow$ more $C$ $\\Rightarrow$ smaller $E_C$. You are trading $|\\alpha|$ (need enough to address $|1\\rangle$) against $E_J/E_C$ (need enough to hide from $n_g$).\nLive $E_C=${num(p.ec_ghz, 3)}\\,\\mathrm{GHz}$ $\\Rightarrow$ ${typicalAlpha(alpha)}`;
    case 'gate':
      return `$n_g$ is island charge in units of Cooper pairs, from a DC gate or from stray two-level systems. Sweeping $0\\to 1$ is how you map charge dispersion; it is a diagnostic, not a performance knob.\nAt $n_g=${num(p.ng, 3)}$, ${dispNote}`;
    case 'ground':
      return `The ground plane is scenery in this model: no current, no slotline, no participation ratio is computed.\nChanging how it looks cannot move $f_{01}$, $\\alpha$, or dispersion. Use it only to read the layout.`;
    case 'substrate':
      return `Substrate $\\varepsilon_r$ would set $C$ on a real chip, but this workbench does not extract capacitance from geometry.\nAny material color or teaching scale of $E_C$ is not a $T_1$ or loss prediction.`;
    case 'regime':
      return `${typicalRatio(ratio)} Koch et al. introduced the transmon specifically so that exponential charge-noise suppression beats the modest loss of anharmonicity.\nIf you need more $|\\alpha|$, you pay for it with a lower ratio and a louder charge curve.`;
    case 'ncut':
      return `$n_{\\mathrm{cut}}=${p.ncut}$ truncates the charge basis to $n\\in[-n_{\\mathrm{cut}},+n_{\\mathrm{cut}}]$. It is a numerical cutoff, not a lithography step.\n$30$ is enough for a typical transmon; if $E_J/E_C$ is very large and levels look unstable, raise it to check convergence before trusting $f_{01}$.`;
    case 'materials': {
      const assignments = snapshot.rendered_component_materials;
      const rendered = assignments ? Object.entries(assignments).map(([part, id]) => {
        const material = resolveMaterial(id);
        return `${PART_BY_ID[part as PartId].name}: ${material.name} (${material.formula})`;
      }).join('; ') : 'No independent component assignments were recorded in this snapshot.';
      return `Rendered components: ${rendered}\n\nThe film/substrate sensitivity pair is ${snapshot.materials?.topMaterial ?? 'unspecified'} on ${snapshot.materials?.baseMaterial ?? 'unspecified'}. Component finishes independently change color, reflection, texture, and transparency. These are illustrative appearances. The solver still takes $E_J$ and $E_C$ as numbers and does not compute $T_1$ from the catalog.`;
    }
    case 'goals':
      return `Targets are $f_{01}=${num(snapshot.goals?.target_ghz ?? 5, 2)}\\,\\mathrm{GHz}$, $|\\alpha|\\ge ${num(snapshot.goals?.min_anharmonicity_mhz ?? 200, 0)}\\,\\mathrm{MHz}$, dispersion $\\le ${num(snapshot.goals?.max_dispersion_khz ?? 10, 1)}\\,\\mathrm{kHz}$.\nLive chip: $f_{01}=${num(f01, 2)}\\,\\mathrm{GHz}$, $\\alpha=${signed(alpha, 0)}\\,\\mathrm{MHz}$. Search only scans a grid of $E_J,E_C$; a pass is not a fabricated optimum.`;
    case 'assembly':
      return `The chip is ${(snapshot.view_explode ?? 0) > 0 ? 'shown as separated layers' : 'assembled'}. Exploding the view separates the cover, circuit films, die, carrier, and frame so their edges and undersides can be inspected.\nThe component buttons select each part for material customization. Its material remains the same in both views. Layer separation and optical finishes do not change the Hamiltonian or the calculated results.`;
    case 'baseline': {
      const b = snapshot.baseline;
      if (!b) {
        return `No baseline is pinned yet. Pin after a completed solve if you want a before/after on $f_{01}$ and $\\alpha$.\nA later shift is not automatically better — it depends on the frequency and charge-noise you actually wanted.`;
      }
      const df = f01 - b.f01_ghz;
      const da = alpha - b.alpha_mhz;
      return `Pinned $f_{01}=${num(b.f01_ghz, 3)}\\,\\mathrm{GHz}$, $\\alpha=${signed(b.alpha_mhz, 0)}\\,\\mathrm{MHz}$. Live minus pinned: $\\Delta f_{01}=${signed(df, 3)}\\,\\mathrm{GHz}$, $\\Delta\\alpha=${signed(da, 0)}\\,\\mathrm{MHz}$.\nRead that against your goal (target frequency vs charge immunity), not as a score.`;
    }
    case 'search':
      return `“Try a goal” scans a ratio grid at the exact target frequency, solving for $E_J$ and $E_C$ and keeps points that pass your $f_{01}$, $|\\alpha|$, and dispersion cuts.\nIt is exhaustive on that grid only — not a process window, not a full-chip EM extract.`;
    case 'stress':
      return `Robustness wiggles $E_J$ and $E_C$ by a few percent to mimic junction-area and pad-size scatter.\nWatch $f_{01}$ span and dispersion: if they blow past your goals, the chosen hypothetical variation leaves the goal region. This is not a yield model.`;
    case 'tunable':
      return `A flux-tunable transmon replaces one junction with a SQUID. The engine uses $E_J^{\\mathrm{eff}}=E_{J\\mathrm{max}}\\sqrt{\\cos^{2}(\\pi\\Phi/\\Phi_0)+d^{2}\\sin^{2}(\\pi\\Phi/\\Phi_0)}$, matching scqubits' TunableTransmon (always $\\ge 0$).\nThat Hamiltonian is separate from the isolated transmon on the 3D chip. Changing flux here does not rewrite the main $E_J$ slider.`;
    case 'model':
      return `This is Koch’s isolated transmon in scqubits: charge-basis Hamiltonian with inputs $E_J,E_C,n_g$. Outputs $f_{01}$, $\\alpha$, dispersion.\nNo readout resonator, no Purcell, no $T_1$. Treat numbers as trends for intuition, not as a tapeout.`;
    default:
      return typicalRatio(ratio);
  }
}
