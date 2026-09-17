import type { ChipSnapshot } from './insight-types.ts';
import { num, signed } from './format.ts';

export const TOPIC_IDS = [
  'f01',
  'f12',
  'alpha',
  'dispersion',
  'ratio',
  'levels',
  'charge',
  'junction',
  'capacitor',
  'gate',
  'ground',
  'substrate',
  'regime',
  'ncut',
  'materials',
  'goals',
  'assembly',
  'baseline',
  'search',
  'stress',
  'tunable',
  'model',
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export interface TopicSpec {
  id: TopicId;
  label: string;
  symbol: string;
  tex: string;
  /** Instruction to Gemini: what to explain, simply. */
  ask: string;
}

export const TOPICS: Record<TopicId, TopicSpec> = {
  f01: {
    id: 'f01',
    label: 'Operating frequency',
    symbol: 'f₀₁',
    tex: 'f_{01}',
    ask: 'Is this f01 typical for a transmon fridge? What lab hardware it corresponds to, and which slider moves it without pretending it is an input.',
  },
  f12: {
    id: 'f12',
    label: 'Next rung',
    symbol: 'f₁₂',
    tex: 'f_{12}',
    ask: 'f12 is |1⟩→|2⟩. Why it sits below f01 by |α|, and why a drive at f01 should miss it.',
  },
  alpha: {
    id: 'alpha',
    label: 'Level spacing',
    symbol: 'α',
    tex: '\\alpha',
    ask: 'Is |α| large enough to address |1⟩ cleanly? Tie α≈−EC and the tradeoff with charge noise.',
  },
  dispersion: {
    id: 'dispersion',
    label: 'Charge-noise sensitivity',
    symbol: 'δf₀₁',
    tex: '\\delta f_{01}',
    ask: 'Interpret this dispersion: quiet, typical, or loud? Why EJ/EC suppresses it exponentially, and what to turn if it is loud.',
  },
  ratio: {
    id: 'ratio',
    label: 'Transmon ratio',
    symbol: 'E_J/E_C',
    tex: 'E_J/E_C',
    ask: 'Name the regime from this EJ/EC and the Koch tradeoff: lose some |α|, gain exponential charge-noise immunity.',
  },
  levels: {
    id: 'levels',
    label: 'Energy levels',
    symbol: '|0⟩, |1⟩, |2⟩',
    tex: '|0\\rangle,\\,|1\\rangle,\\,|2\\rangle',
    ask: 'Why the ladder is anharmonic: |2⟩ is leakage, f12 is lower than f01 by |α|, and that is the junction’s job.',
  },
  charge: {
    id: 'charge',
    label: 'Charge response',
    symbol: 'f₀₁ vs n_g',
    tex: 'f_{01}\\ \\mathrm{vs}\\ n_g',
    ask: 'Read the f01(ng) curve as a diagnosis of electrostatic immunity, not as a pretty plot. What would flatten it.',
  },
  junction: {
    id: 'junction',
    label: 'Josephson junction',
    symbol: 'E_J',
    tex: 'E_J',
    ask: 'Explain the Josephson junction and its Josephson energy E_J in simple language. If provided, connect E_J to the derived critical current in nA. What happens if the student raises or lowers E_J?',
  },
  capacitor: {
    id: 'capacitor',
    label: 'Shunt capacitor pads',
    symbol: 'E_C',
    tex: 'E_C',
    ask: 'EC from pad capacitance. Bigger pads: quieter vs ng, smaller |α|. Say which side this live EC is on.',
  },
  gate: {
    id: 'gate',
    label: 'Charge gate line',
    symbol: 'n_g',
    tex: 'n_g',
    ask: 'ng is a diagnostic sweep, not a performance knob. What a transmon vs charge qubit does across 0→1, using this dispersion.',
  },
  ground: {
    id: 'ground',
    label: 'Ground plane',
    symbol: 'context',
    tex: '\\mathrm{context}',
    ask: 'Explain the ground plane in this workbench in simple language. Be clear that it is drawn for context and is not an input to this isolated-transmon model.',
  },
  substrate: {
    id: 'substrate',
    label: 'Substrate',
    symbol: 'context',
    tex: '\\mathrm{context}',
    ask: 'Explain the substrate in this workbench in simple language. Be clear that thickness is illustrative and that any material picker is a teaching scale, not a capacitance extractor.',
  },
  regime: {
    id: 'regime',
    label: 'Operating regime',
    symbol: 'E_J/E_C window',
    tex: 'E_J/E_C',
    ask: 'Explain whether this chip is in the transmon regime in simple language, using the current E_J/E_C ratio.',
  },
  ncut: {
    id: 'ncut',
    label: 'Solver cutoff',
    symbol: 'ncut',
    tex: '\\mathrm{ncut}',
    ask: 'Explain ncut: it is a math truncation, not a lithography step. Say how it relates to the current energy levels.',
  },
  materials: {
    id: 'materials',
    label: 'Materials',
    symbol: 'stack',
    tex: '\\mathrm{stack}',
    ask: 'Explain the rendered_component_materials assigned independently to the seven components. The top/base materials are a separate sensitivity pair and may differ. Color, finish and transparency are illustrative; electrical scaling is an explicit teaching scenario, not a capacitance extract or T1 prediction.',
  },
  goals: {
    id: 'goals',
    label: 'Design goals',
    symbol: 'targets',
    tex: '\\mathrm{targets}',
    ask: 'Explain the student’s target frequency, anharmonicity floor, and charge-dispersion cap, and how they compare to the live solver outputs.',
  },
  assembly: {
    id: 'assembly',
    label: 'Exploded assembly',
    symbol: 'view',
    tex: '\\mathrm{view}',
    ask: 'Explain the current Assembled/Exploded view and how separated components can be selected and assigned materials. View and appearance changes do not change any calculated value.',
  },
  baseline: {
    id: 'baseline',
    label: 'Pinned baseline',
    symbol: 'compare',
    tex: '\\mathrm{compare}',
    ask: 'Explain the pinned baseline: it is a saved solver result for before/after comparison, not a better design by default.',
  },
  search: {
    id: 'search',
    label: 'Goal search',
    symbol: 'grid',
    tex: '\\mathrm{grid}',
    ask: 'Explain Try a goal: the app searches a grid of E_J/E_C values against the student’s targets. It is not a global optimum over all chips.',
  },
  stress: {
    id: 'stress',
    label: 'Robustness test',
    symbol: 'variation',
    tex: '\\delta E_J,\\delta E_C',
    ask: 'Explain the robustness/stress test: small E_J and E_C wiggles, and what that means for the live frequency and dispersion.',
  },
  tunable: {
    id: 'tunable',
    label: 'Flux-tunable transmon',
    symbol: 'Φ/Φ₀',
    tex: '\\Phi/\\Phi_0',
    ask: 'Explain the flux-tunable model: effective E_J vs flux. Be clear this is a separate teaching model from the isolated transmon on the 3D chip.',
  },
  model: {
    id: 'model',
    label: 'This workbench',
    symbol: 'scqubits',
    tex: '\\mathrm{scqubits}',
    ask: 'Explain Qubit Studio itself: a simplified isolated-transmon teaching model. Numbers come from the solver. It is not a fabricated-device prediction.',
  },
};

export function isTopicId(value: unknown): value is TopicId {
  return typeof value === 'string' && (TOPIC_IDS as readonly string[]).includes(value);
}

export function topicFromPart(partId: string | null): TopicId | null {
  if (partId && isTopicId(partId)) return partId;
  return null;
}

export function topicFromParam(key: string): TopicId | null {
  if (key === 'ej_ghz') return 'junction';
  if (key === 'ec_ghz') return 'capacitor';
  if (key === 'ng') return 'gate';
  if (key === 'ncut') return 'ncut';
  return null;
}

/** Numbers Gemini is allowed to use for this topic — never invent beyond this. */
export function topicNumbers(
  topic: TopicId,
  snapshot: ChipSnapshot,
): Record<string, string | number | boolean | number[] | null> {
  const out = snapshot.outputs;
  const { params } = snapshot;
  const base = {
    E_J_GHz: params.ej_ghz,
    E_C_GHz: params.ec_ghz,
    n_g: params.ng,
    ncut: params.ncut,
    EJ_over_EC: Number(num(params.ratio, 1)),
  };
  if (!out) return { ...base, solver: 'no completed calculation' };

  const shared = {
    ...base,
    f01_GHz: out.f01_ghz,
    f12_GHz: out.f12_ghz,
    alpha_MHz: out.alpha_mhz,
    dispersion_kHz: out.dispersion_khz,
    dispersion_status: out.dispersion_status,
    dispersion_upper_kHz: out.dispersion_upper_khz,
  };

  switch (topic) {
    case 'f01':
      return { ...shared, note: 'f01 is a solver output, not a typed-in target' };
    case 'f12':
      return { ...shared, note: 'f12 = f01 + alpha; leakage transition' };
    case 'alpha':
      return { ...shared, formula: 'α = f12 − f01 ≈ −E_C' };
    case 'dispersion':
    case 'charge':
      return { ...shared, charge_shift_peak_kHz: out.charge_shift_peak_khz };
    case 'ratio':
    case 'regime':
      return { ...shared, transmon_floor: 20 };
    case 'levels':
      return { ...shared, levels_GHz: out.levels_ghz };
    case 'junction':
      return { ...shared, control: 'E_J slider', critical_current_nA: out.critical_current_na ?? null };
    case 'capacitor':
      return { ...shared, control: 'E_C slider', total_capacitance_fF: out.total_capacitance_ff ?? null };
    case 'gate':
      return { ...shared, control: 'n_g slider' };
    case 'ground':
    case 'substrate':
      return { ...base, modeled: false };
    case 'ncut':
      return { ...shared, ncut: params.ncut };
    case 'materials':
      return {
        ...shared,
        top_material: snapshot.materials?.topMaterial ?? null,
        base_material: snapshot.materials?.baseMaterial ?? null,
        ...Object.fromEntries(Object.entries(snapshot.rendered_component_materials ?? {}).map(([part, id]) => [`rendered_${part}_material`, id])),
      };
    case 'goals':
      return {
        ...shared,
        target_ghz: snapshot.goals?.target_ghz ?? null,
        min_anharmonicity_mhz: snapshot.goals?.min_anharmonicity_mhz ?? null,
        max_dispersion_khz: snapshot.goals?.max_dispersion_khz ?? null,
      };
    case 'assembly':
      return { ...base, explode: snapshot.view_explode ?? 0, modeled: false };
    case 'baseline':
      return {
        ...shared,
        baseline_f01_GHz: snapshot.baseline?.f01_ghz ?? null,
        baseline_alpha_MHz: snapshot.baseline?.alpha_mhz ?? null,
      };
    case 'search':
    case 'stress':
    case 'tunable':
    case 'model':
      return shared;
    default:
      return shared;
  }
}

export function formatTopicHeadline(topic: TopicId, snapshot: ChipSnapshot): string {
  const spec = TOPICS[topic];
  const out = snapshot.outputs;
  if (!out) return spec.label;
  switch (topic) {
    case 'f01':
      return `${spec.label} · ${num(out.f01_ghz, 3)} GHz`;
    case 'alpha':
      return `${spec.label} · ${signed(out.alpha_mhz, 1)} MHz`;
    case 'dispersion':
      return out.dispersion_khz === null
        ? `${spec.label} · < ${num(out.dispersion_upper_khz, 3)} kHz`
        : `${spec.label} · ${num(out.dispersion_khz, 2)} kHz`;
    case 'ratio':
    case 'regime':
      return `${spec.label} · E_J/E_C ${num(snapshot.params.ratio, 1)}`;
    case 'junction':
      return `${spec.label} · E_J ${num(snapshot.params.ej_ghz, 2)} GHz`;
    case 'capacitor':
      return `${spec.label} · E_C ${num(snapshot.params.ec_ghz, 3)} GHz`;
    case 'gate':
      return `${spec.label} · n_g ${num(snapshot.params.ng, 3)}`;
    default:
      return spec.label;
  }
}
