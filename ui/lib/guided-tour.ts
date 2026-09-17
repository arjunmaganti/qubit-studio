import type { PartId } from './parts.ts';

export type InspectorTab = 'edit' | 'experiment' | 'materials';
export type ViewMode = '3d' | 'schematic' | 'split';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  target: string;
  tab?: InspectorTab;
  view?: ViewMode;
  part?: PartId | null;
  openDetails?: string;
}

/** Twenty-step tour of the essentials. Hardcoded so it is instant. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'This is a transmon',
    body: 'Qubit Studio is a teaching schematic of a superconducting qubit — a transmon. It can be $|0\\rangle$, $|1\\rangle$, or a superposition of both.\nNumbers in Results come from a solver. The drawing is not a mask layout and not to scale.',
    target: 'brand',
  },
  {
    id: 'myla',
    title: 'Myla',
    body: 'Click a part, metric, or graph after this tour. A short card pops up beside it with the live numbers.\nDuring the tour those cards stay quiet.',
    target: 'brand',
  },
  {
    id: 'views',
    title: '3D, Layout, Split',
    body: '3D is the packaged chip. Layout is the 2-D plan. Split shows both, linked by the same selection.\nDrag to orbit in 3D. Nothing extra is computed when you change cameras.',
    target: 'view-3d',
    view: '3d',
  },
  {
    id: 'assembly',
    title: 'Assembled / exploded',
    body: 'Exploded pulls the stack apart so you can see the junction between the pads. View only — the Hamiltonian does not care.',
    target: 'assembly',
    view: '3d',
  },
  {
    id: 'parts',
    title: 'Three inputs',
    body: 'Only three parts change the math: junction ($E_J$), pads ($E_C$), and gate ($n_g$).\nGround, substrate, board, and package are scenery.',
    target: 'parts-panel',
    tab: 'edit',
  },
  {
    id: 'slider-ej',
    title: 'Junction energy $E_J$',
    body: '$E_J=\\hbar I_c/(2e)$ is tunnelling. Raising it blueshifts $f_{01}$ and $E_J/E_C$, which hides the qubit from stray charge.\nYou never type $f_{01}$. It is a solver output.',
    target: 'field-ej',
    tab: 'edit',
    part: 'junction',
  },
  {
    id: 'slider-ec',
    title: 'Charging energy $E_C$',
    body: '$E_C=e^2/(2C_\\Sigma)$. Bigger pads $\\Rightarrow$ more $C$ $\\Rightarrow$ smaller $E_C$: quieter versus charge, but weaker $|\\alpha|\\approx E_C$.\nThat is the central transmon tradeoff.',
    target: 'field-ec',
    tab: 'edit',
    part: 'capacitor',
  },
  {
    id: 'slider-ng',
    title: 'Offset charge $n_g$',
    body: 'A diagnostic, not a performance knob. Sweep $0\\to 1$. If $f_{01}$ barely moves, you are in the transmon window.',
    target: 'field-ng',
    tab: 'edit',
    part: 'gate',
  },
  {
    id: 'metric-f01',
    title: 'Operating frequency $f_{01}$',
    body: 'The microwave tone that flips $|0\\rangle\\to|1\\rangle$. Labs usually sit at $4$–$6.5\\,\\mathrm{GHz}$.\nChange $E_J$ or $E_C$; the solver computes this.',
    target: 'metric-f01',
  },
  {
    id: 'metric-alpha',
    title: 'Level separation $\\alpha$',
    body: '$\\alpha=f_{12}-f_{01}\\approx -E_C$ (with $E_C$ quoted as a frequency). That gap lets a pulse hit $|1\\rangle$ without leaking into $|2\\rangle$.\nAn $LC$ oscillator has $\\alpha=0$. Typical transmons: $|\\alpha|\\sim 200$–$350\\,\\mathrm{MHz}$.',
    target: 'metric-alpha',
  },
  {
    id: 'metric-disp',
    title: 'Charge sensitivity',
    body: 'How much $f_{01}$ would wander if $n_g$ drifted. Transmons make this tiny on purpose by taking $E_J/E_C\\ge 20$.\nA value below the reporting floor is not zero.',
    target: 'metric-disp',
  },
  {
    id: 'chart-levels',
    title: 'Energy ladder',
    body: 'Rungs relative to $|0\\rangle$. The blue gap is $f_{01}$; the next is $f_{12}$. Open Technical details to see the plots.',
    target: 'chart-levels',
    openDetails: '[data-tour="tech-results"]',
  },
  {
    id: 'geometry',
    title: 'Shape the junction',
    body: 'Converts pad and junction area into $E_J$ and $E_C$ with two stated teaching assumptions, then reshapes the 3D parts.\nNot a mask layout. Apply writes those energies onto the live chip.',
    target: 'geometry',
    tab: 'edit',
  },
  {
    id: 'tab-goal',
    title: 'Design mode',
    body: 'Switch to Design and state a target $f_{01}$ (plus $|\\alpha|$ and charge cuts). Search walks a grid of $E_J,E_C$.\nA pass is “this grid point satisfies your cuts,” not a tapeout.',
    target: 'tab-goal',
    tab: 'experiment',
  },
  {
    id: 'search-run',
    title: 'Find variables + materials',
    body: 'Runs the grid and, if something passes, suggests $E_J$, $E_C$, and a catalog metal/substrate pair.\nUse variables + materials writes those numbers onto the chip. It does not predict $T_1$.',
    target: 'search-run',
    tab: 'experiment',
  },
  {
    id: 'tab-materials',
    title: 'Materials',
    body: 'Per-component films recolor the 3D chip. Color is a room-light stand-in, not kinetic inductance or $T_1$.\nElectrical $E_J,E_C$ only change if you run a compare/apply scenario.',
    target: 'tab-materials',
    tab: 'materials',
  },
  {
    id: 'save-design',
    title: 'Save and share',
    body: 'Save stores this design in the browser. Copy link puts it in the URL. Restore brings one back.\nNothing is uploaded.',
    target: 'save-design',
  },
  {
    id: 'baseline',
    title: 'Pin a baseline',
    body: 'Freezes the current completed result. Later numbers show a delta against that snapshot.\nA rise or fall is not automatically better.',
    target: 'baseline',
    openDetails: '[data-tour="tech-results"]',
  },
  {
    id: 'status',
    title: 'Solver status',
    body: 'Live result means $f_{01}$ and $\\alpha$ are real solver outputs. Updating means a newer solve is in flight.\nIf it says failed, nothing below is being guessed locally.',
    target: 'status',
  },
  {
    id: 'finish',
    title: 'You can drive it',
    body: '$E_J$ and $E_C$ are inputs. $f_{01}$ and $\\alpha$ are outputs. This model does not predict $T_1$.\nClick anything for Myla. Exit returns you to free exploration.',
    target: 'brand',
    tab: 'edit',
    view: '3d',
    part: null,
  },
];
