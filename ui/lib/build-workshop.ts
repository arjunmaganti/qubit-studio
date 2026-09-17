import type { PartId } from './parts.ts';
import type { DeviceParams } from './types.ts';

export interface WorkshopChoices {
  wafer?: string;
  metal?: string;
  ej?: number;
  ec?: number;
  ng?: number;
  assembled?: boolean;
}

export interface WorkshopOption {
  label: string;
  hint: string;
  apply: Partial<WorkshopChoices>;
}

export interface WorkshopStep {
  id: string;
  title: string;
  body: string;
  require?: keyof WorkshopChoices | 'solve';
  part?: PartId;
  explode?: number;
  reveal?: PartId[];
  options?: WorkshopOption[];
}

const HIDDEN_AT_START: PartId[] = ['package', 'board', 'ground', 'capacitor', 'junction', 'gate'];

export const WORKSHOP_HIDDEN_START = HIDDEN_AT_START;

export const WORKSHOP_STEPS: WorkshopStep[] = [
  {
    id: 'intro',
    title: 'Let’s build a chip',
    body: 'This is a blank slice of crystal — think of it as a tiny plate. We will add the parts of a quantum bit one at a time. Watch the model on the left as you pick.',
    explode: 1,
    reveal: ['substrate'],
  },
  {
    id: 'wafer',
    title: 'Pick the plate',
    body: 'Everything sits on this wafer. Silicon is the same stuff as phone chips. Sapphire is a hard, clear crystal labs also use. Either one is fine — you are just choosing how the plate looks.',
    require: 'wafer',
    part: 'substrate',
    explode: 1,
    reveal: ['substrate'],
    options: [
      { label: 'Silicon', hint: 'Everyday computer-chip material', apply: { wafer: 'Si' } },
      { label: 'Sapphire', hint: 'A clear, hard lab crystal', apply: { wafer: 'sapphire' } },
    ],
  },
  {
    id: 'metal',
    title: 'Pick the metal',
    body: 'Now we add a metal that becomes superconducting when it is extremely cold: a steady current can flow with no resistance. Real chips still have tiny microwave losses; this model does not compute those. The color is just so you can see the metal.',
    require: 'metal',
    part: 'ground',
    explode: 1,
    reveal: ['substrate', 'ground'],
    options: [
      { label: 'Aluminium', hint: 'The usual choice', apply: { metal: 'Al' } },
      { label: 'Niobium', hint: 'Another common wiring metal', apply: { metal: 'Nb' } },
      { label: 'Tantalum', hint: 'Used on some long-lived chips', apply: { metal: 'Ta' } },
      { label: 'Titanium nitride', hint: 'A gold-tinted film', apply: { metal: 'TiN' } },
    ],
  },
  {
    id: 'junction',
    title: 'The tiny switch',
    body: 'The little piece in the middle is a super-thin sandwich. That is the part that lets this chip behave like a quantum bit, not a regular switch. Firmer means the two sides are linked more tightly.',
    require: 'ej',
    part: 'junction',
    explode: 1,
    reveal: ['substrate', 'ground', 'junction'],
    options: [
      { label: 'Soft', hint: 'Looser link · a bit more wobbly', apply: { ej: 8 } },
      { label: 'Typical', hint: 'A good middle setting', apply: { ej: 15 } },
      { label: 'Firm', hint: 'Tighter link · steadier', apply: { ej: 22 } },
    ],
  },
  {
    id: 'pads',
    title: 'Add the storage pads',
    body: 'These two metal pads are a capacitor: they store electric charge. Bigger pads hold more charge and make leftover charge matter less. Smaller pads spread the energy notes farther apart, so the two qubit states are easier to tell apart.',
    require: 'ec',
    part: 'capacitor',
    explode: 1,
    reveal: ['substrate', 'ground', 'junction', 'capacitor'],
    options: [
      { label: 'Small pads', hint: 'Punchier, easier-to-tell-apart notes', apply: { ec: 0.42 } },
      { label: 'Medium pads', hint: 'A balanced size', apply: { ec: 0.3 } },
      { label: 'Big pads', hint: 'Calmer and more easygoing', apply: { ec: 0.22 } },
    ],
  },
  {
    id: 'gate',
    title: 'Add a control wire',
    body: 'This thin line can add a little leftover charge. A transmon is built so its note barely changes when that happens. We try two settings — rest and halfway — and later compare them. If the two notes match, leftover charge is not a problem.',
    require: 'ng',
    part: 'gate',
    explode: 1,
    reveal: ['substrate', 'ground', 'junction', 'capacitor', 'gate'],
    options: [
      { label: 'Rest (0)', hint: 'One end of the leftover-charge sweep', apply: { ng: 0 } },
      { label: 'Halfway (0.5)', hint: 'The other end. Together they measure the wiggle.', apply: { ng: 0.5 } },
    ],
  },
  {
    id: 'package',
    title: 'Put it in a case',
    body: 'In a lab the chip sits on a board inside a little case. That is just the housing — it does not change the quantum bit itself. Keep the layers pulled apart, or snap them together.',
    require: 'assembled',
    explode: 1,
    reveal: ['substrate', 'ground', 'junction', 'capacitor', 'gate', 'board', 'package'],
    options: [
      { label: 'Keep layers apart', hint: 'See every piece', apply: { assembled: false } },
      { label: 'Snap together', hint: 'How it looks in its case', apply: { assembled: true } },
    ],
  },
  {
    id: 'readout',
    title: 'What did we make?',
    body: 'The computer just worked out your chip’s main “note” — how fast this quantum bit ticks. Wait until the result is live, then continue.',
    require: 'solve',
    explode: 0,
    reveal: ['substrate', 'ground', 'junction', 'capacitor', 'gate', 'board', 'package'],
  },
  {
    id: 'done',
    title: 'Your chip',
    body: 'You built a quantum bit from a blank plate: a wafer, a metal, a switch, and pads. Save it under Design tools if you want it back. Click around later if you want more from me.',
    explode: 0,
    reveal: ['substrate', 'ground', 'junction', 'capacitor', 'gate', 'board', 'package'],
  },
];

export function workshopHidden(stepIndex: number): PartId[] {
  const revealed = new Set<PartId>();
  for (let i = 0; i <= stepIndex && i < WORKSHOP_STEPS.length; i += 1) {
    for (const id of WORKSHOP_STEPS[i].reveal ?? []) revealed.add(id);
  }
  const all: PartId[] = ['package', 'board', 'substrate', 'ground', 'capacitor', 'junction', 'gate'];
  return all.filter((id) => !revealed.has(id));
}

export function workshopParams(choices: WorkshopChoices): DeviceParams {
  return {
    ej_ghz: choices.ej ?? 15,
    ec_ghz: choices.ec ?? 0.3,
    ng: choices.ng ?? 0,
    ncut: 30,
  };
}

export function workshopCanAdvance(step: WorkshopStep, choices: WorkshopChoices, solverReady: boolean): boolean {
  if (!step.require) return true;
  if (step.require === 'solve') return solverReady;
  return choices[step.require] !== undefined;
}

const METAL_NAMES: Record<string, string> = {
  Al: 'aluminium',
  Nb: 'niobium',
  Ta: 'tantalum',
  TiN: 'titanium nitride',
};

export function workshopRecap(choices: WorkshopChoices): string {
  const wafer = choices.wafer === 'sapphire' ? 'a sapphire plate' : 'a silicon plate';
  const metal = METAL_NAMES[choices.metal ?? 'Al'] ?? 'aluminium';
  const link = choices.ej === 8 ? 'a soft switch' : choices.ej === 22 ? 'a firm switch' : 'a typical switch';
  const pads = choices.ec === 0.42 ? 'small pads' : choices.ec === 0.22 ? 'big pads' : 'medium pads';
  const gate = choices.ng === 0.5 ? 'a nudged control wire' : 'a calm control wire';
  const pack = choices.assembled === false ? 'Layers are still pulled apart.' : 'It is snapped into its case.';
  return `You picked ${wafer}, ${metal} wiring, ${link}, ${pads}, and ${gate}. ${pack}`;
}
