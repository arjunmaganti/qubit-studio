export type DocsBlock =
  | { type: 'p'; text: string }
  | { type: 'eq'; tex: string; caption?: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string };

export interface DocsSection {
  id: string;
  title: string;
  blocks: DocsBlock[];
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    blocks: [
      {
        type: 'p',
        text: 'Qubit Studio is a teaching workbench for one superconducting qubit: an isolated transmon. The 3D chip and layout drawing are illustrations. The numbers in Results come from diagonalizing the transmon Hamiltonian with the scqubits solver. This page is the technical companion to that workbench — what a qubit is, why a transmon looks the way it does, and which quantities the site actually computes.',
      },
      {
        type: 'note',
        text: 'The studio does not predict coherence times $T_1$ or $T_2$, does not extract capacitance from the drawing, and does not model a many-qubit processor. Materials you pick recolor the illustration unless you explicitly apply a parameter scenario.',
      },
    ],
  },
  {
    id: 'qubits',
    title: 'From bits to qubits',
    blocks: [
      {
        type: 'p',
        text: 'A classical bit is a switch with two values, $0$ and $1$. A qubit is a two-level quantum system. In the computational basis $\\{|0\\rangle,|1\\rangle\\}$ its pure state is a unit vector in $\\mathbb{C}^2$:',
      },
      {
        type: 'eq',
        tex: '|\\psi\\rangle = a|0\\rangle + b|1\\rangle,\\qquad |a|^2+|b|^2=1.',
        caption: 'The complex amplitudes $a$ and $b$ are not hidden classical bits. They are the state.',
      },
      {
        type: 'p',
        text: 'A projective measurement in this basis yields $0$ or $1$ with probabilities $|a|^2$ and $|b|^2$ (the Born rule). After the measurement the state is the corresponding basis vector. Superposition is therefore not “both values at once” in the sense of a coin that is already heads or tails but unread: until you measure, the system is described by the amplitudes themselves, which can interfere.',
      },
      {
        type: 'p',
        text: 'Allowed operations between measurements are unitary maps $U$ with $U^\\dagger U = I$. Single-qubit unitaries are rotations of the Bloch sphere. Two-qubit gates can create entanglement. The canonical example is the Bell state',
      },
      {
        type: 'eq',
        tex: '|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}\\big(|00\\rangle+|11\\rangle\\big),',
        caption: 'Neither qubit has a definite bit value, yet the two outcomes are perfectly correlated.',
      },
      {
        type: 'p',
        text: 'A quantum algorithm is a circuit of such gates, followed by measurement. The practical difficulty is that real hardware is an open system: the computational subspace leaks, phases wander, and the intended two-level system is only an approximation to a larger Hilbert space. Error correction exists to fight that, but it is not part of this site.',
      },
    ],
  },
  {
    id: 'hardware',
    title: 'Superconducting circuits',
    blocks: [
      {
        type: 'p',
        text: 'Several physical platforms can host a qubit: trapped ions, photonic modes, spins in semiconductors or defects, and superconducting circuits. Qubit Studio is about the last of these.',
      },
      {
        type: 'p',
        text: 'A superconducting qubit is a microwave electrical circuit, cooled to millikelvin temperatures so that the metal is superconducting and thermal occupancy of gigahertz modes is negligible. Linear inductors and capacitors make a harmonic oscillator, whose levels are equally spaced — unusable as a qubit, because a drive that hits $|0\\rangle\\to|1\\rangle$ also hits $|1\\rangle\\to|2\\rangle$. The Josephson junction supplies the missing nonlinearity: a weak link (typically an $\\mathrm{AlO}_x$ tunnel barrier between aluminium films) whose supercurrent obeys $I = I_c\\sin\\varphi$, with $\\varphi$ the gauge-invariant phase difference across the junction. Devices with tantalum or niobium capacitor pads still often use an $\\mathrm{Al}/\\mathrm{AlO}_x/\\mathrm{Al}$ junction.',
      },
      {
        type: 'p',
        text: 'The junction energy and the island charging energy are',
      },
      {
        type: 'eq',
        tex: 'E_J = \\frac{\\hbar I_c}{2e},\\qquad E_C = \\frac{e^2}{2C_\\Sigma}.',
        caption: '$I_c$ is the critical current. $C_\\Sigma$ is the total capacitance of the superconducting island to its surroundings.',
      },
      {
        type: 'p',
        text: 'In circuit quantum electrodynamics the qubit is coupled to a linear resonator used for dispersive readout. Qubit Studio does not include that resonator. It models the isolated qubit Hamiltonian only.',
      },
    ],
  },
  {
    id: 'transmon',
    title: 'The transmon',
    blocks: [
      {
        type: 'p',
        text: 'The Cooper-pair box — a junction plus a small island — is a charge qubit. Its spectrum depends strongly on offset charge $n_g$, the continuous gate-induced charge on the island in units of Cooper pairs. That makes it fragile against charge noise.',
      },
      {
        type: 'p',
        text: 'The transmon, introduced by Koch et al. (2007), is the same circuit with a large shunt capacitor across the junction. Increasing $C_\\Sigma$ lowers $E_C$ and pushes the ratio $E_J/E_C$ well above $1$ (this workbench treats $\\gtrsim 20$ as the transmon window). Charge dispersion of $f_{01}$ then falls as $\\exp(-\\sqrt{8E_J/E_C})$, while the anharmonicity only falls algebraically, remaining of order $E_C$. That is the central tradeoff: quieter versus offset charge, at the price of a less anharmonic ladder.',
      },
      {
        type: 'p',
        text: 'The isolated-transmon Hamiltonian (diagonalized here in the truncated charge basis) is',
      },
      {
        type: 'eq',
        tex: 'H = 4E_C(\\hat{n}-n_g)^2 - E_J\\cos\\hat{\\varphi},',
        caption: '$\\hat{n}$ counts Cooper pairs on the island. $\\hat{\\varphi}$ is the phase across the junction, with $[\\hat{\\varphi},\\hat{n}]=i$. Adding one Cooper pair costs $4E_C$, not $E_C$.',
      },
      {
        type: 'p',
        text: 'In the transmon regime a useful closed-form estimate (not the studio solver) is',
      },
      {
        type: 'eq',
        tex: 'hf_{01} \\approx \\sqrt{8E_J E_C}-E_C,\\qquad \\alpha = f_{12}-f_{01} \\approx -E_C/h.',
        caption: 'Valid in the transmon regime and independent of $n_g$. Labs typically sit near $f_{01}\\sim 4$–$6.5\\,\\mathrm{GHz}$ with $|\\alpha|\\sim 200$–$350\\,\\mathrm{MHz}$.',
      },
      {
        type: 'p',
        text: 'Here $f_{01}$ is the transition frequency between the ground and first excited eigenstates, and $f_{12}$ is the next rung. A microwave pulse at $f_{01}$ can drive $|0\\rangle\\leftrightarrow|1\\rangle$ while remaining off-resonant from $|1\\rangle\\leftrightarrow|2\\rangle$ precisely because $\\alpha\\neq 0$. A linear $LC$ oscillator has $\\alpha=0$.',
      },
    ],
  },
  {
    id: 'solver',
    title: 'What the solver computes',
    blocks: [
      {
        type: 'p',
        text: 'Every live number in the studio is produced by scqubits’ $\\mathtt{Transmon}$ object, which diagonalizes $H$ in a truncated charge basis $n\\in\\{-n_{\\mathrm{cut}},\\ldots,n_{\\mathrm{cut}}\\}$. The engine labels this model $\\mathtt{isolated\\text{-}transmon}$ / $v1$.',
      },
      {
        type: 'p',
        text: 'On this site every energy slider is already a frequency $E/h$ in gigahertz (the scqubits convention). Then $f_{01}=E_1-E_0$ in those units, with no extra factor of $h$. Inputs:',
      },
      {
        type: 'ul',
        items: [
          '$E_J/h$ — Josephson energy. Set by junction area and oxide via $I_c$.',
          '$E_C/h$ — charging energy. Set by the total island capacitance $C_\\Sigma$.',
          '$n_g$ — offset charge, in units of Cooper pairs, swept on $[0,1]$.',
          '$n_{\\mathrm{cut}}$ — numerical charge-basis cutoff. A solver setting, not a fabricated dimension.',
        ],
      },
      {
        type: 'p',
        text: 'Outputs, from the ordered eigenvalues $E_0<E_1<E_2<\\cdots$:',
      },
      {
        type: 'eq',
        tex: 'f_{01}=E_1-E_0,\\qquad f_{12}=E_2-E_1,\\qquad \\alpha=f_{12}-f_{01}.',
        caption: 'Here $E_i$ are already $E_i/h$ in gigahertz, matching the sliders.',
      },
      {
        type: 'p',
        text: 'Charge dispersion is not a fit parameter. The engine evaluates $f_{01}$ at $n_g=0$ and at $n_g=1/2$ and reports',
      },
      {
        type: 'eq',
        tex: '\\delta f_{01} = \\big|f_{01}(n_g=\\tfrac12)-f_{01}(n_g=0)\\big|.',
        caption: 'Both $n_g=0$ and $n_g=1/2$ are extrema of $f_{01}(n_g)$, so this is the peak-to-peak charge dispersion. Parking at $n_g=1/2$ does not by itself increase first-order charge sensitivity. If the splitting lies below the $1\\,\\mathrm{Hz}$ reporting floor it is returned as unresolved, not as zero.',
      },
      {
        type: 'p',
        text: 'You never type $f_{01}$ as an input. Changing $E_J$ or $E_C$ and waiting for a live result is how the frequency moves. With sliders already in gigahertz, the textbook overlay is $f_{01}\\approx\\sqrt{8E_J E_C}-E_C$; the results dock always displays the diagonalization, which keeps a weak $n_g$ dependence the overlay drops.',
      },
    ],
  },
  {
    id: 'studio',
    title: 'What the site is for',
    blocks: [
      {
        type: 'p',
        text: 'The workbench is a CAD-style view of that one-qubit model.',
      },
      {
        type: 'ul',
        items: [
          'Explore — edit $E_J$, $E_C$, and $n_g$. The 3D assembly, layout, and circuit schematic share one selection. Only the junction, pads, and gate enter $H$. Package, board, ground plane, and wafer are scenery.',
          'Design — state a target $f_{01}$ with cuts on $|\\alpha|$ and dispersion. Search walks a grid of $E_J$ and $E_C$. A pass means “this grid point satisfies your cuts,” not a tapeout.',
          'Build chip — a guided demo that starts from a blank wafer. Choices recolor the illustration and write teaching values of $E_J$, $E_C$, and $n_g$ into the same solver.',
          'Myla — click a part or a result after the tours. A short card interprets the live numbers. It does not replace the solver.',
        ],
      },
      {
        type: 'p',
        text: 'The exploded view, camera, and per-part materials change what you see, not the spectrum, unless you apply a named electrical scenario. Geometry tools convert pad and junction area into $E_J$ and $E_C$ under two stated teaching assumptions; they are not an electromagnetic extraction from a mask.',
      },
    ],
  },
  {
    id: 'limits',
    title: 'What this model leaves out',
    blocks: [
      {
        type: 'ul',
        items: [
          'No $T_1$, $T_2$, or Purcell limit. Loss participation, two-level systems, and quasiparticles are absent.',
          'No readout resonator, drive line Hamiltonian, or cross-Kerr physics.',
          'No full-wave capacitance matrix and no lithographic design rule check.',
          'No multi-qubit coupling, except a separate tunable-transmon helper that still is not a processor.',
          'Material colors are room-light stand-ins. Changing aluminium to tantalum does not, by itself, change $E_J$ or $E_C$.',
        ],
      },
      {
        type: 'p',
        text: 'Those omissions are deliberate. The point of the site is to make the isolated-transmon spectrum inspectable: how $E_J$ and $E_C$ set $f_{01}$ and $\\alpha$, and how $E_J/E_C$ hides $n_g$.',
      },
    ],
  },
  {
    id: 'references',
    title: 'References',
    blocks: [
      {
        type: 'ul',
        items: [
          'J. Koch et al., “Charge-insensitive qubit design derived from the Cooper pair box,” Phys. Rev. A 76, 042319 (2007). The transmon Hamiltonian and the $E_J/E_C$ tradeoff.',
          'P. Krantz et al., “A quantum engineer’s guide to superconducting qubits,” Appl. Phys. Rev. 6, 021318 (2019). Circuit QED, control, and readout.',
          'P. Groszkowski and J. Koch, “scqubits: a Python package for superconducting qubits,” Quantum 5, 583 (2021). The library behind Evaluate.',
          'M. A. Nielsen and I. L. Chuang, Quantum Computation and Quantum Information. Standard reference for amplitudes, measurement, and circuits.',
        ],
      },
    ],
  },
];
