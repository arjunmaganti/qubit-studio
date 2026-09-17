import type { PartId } from './parts.ts';

/**
 * Material identity and representative uses are supported by the linked sources.
 * Colors and every PBR field below are artistic appearance recipes, not measured
 * optical constants, process qualifications, or inputs to the transmon model.
 * A selection changes a component's finish; it does not redesign its layer stack.
 */
export interface MaterialProfile {
  id: string;
  name: string;
  formula: string;
  elements: string[];
  category: 'metal' | 'semiconductor' | 'ceramic' | 'compound';
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  iridescence: number;
  finish: 'brushed' | 'polished' | 'crystalline' | 'ceramic';
  description: string;
  use: string;
  sourceUrl: string;
  sourceLabel: string;
}

export type ComponentMaterials = Record<PartId, string>;

type ProfileInput = Pick<MaterialProfile,
  'id' | 'name' | 'formula' | 'elements' | 'category' | 'color' | 'description' | 'use' | 'sourceUrl' | 'sourceLabel'
> & Partial<MaterialProfile>;

function profile(input: ProfileInput): MaterialProfile {
  return {
    metalness: 0,
    roughness: 0.3,
    clearcoat: 0.12,
    clearcoatRoughness: 0.2,
    transmission: 0,
    ior: 1.5,
    iridescence: 0,
    finish: 'polished',
    ...input,
  };
}

function metal(
  id: string, name: string, number: number, color: string,
  roughness: number, description: string, use: string,
  overrides: Partial<MaterialProfile> = {},
): MaterialProfile {
  return profile({
    id, name, formula: id, elements: [id], category: 'metal', color,
    metalness: 0.96, roughness, finish: 'brushed', description, use,
    sourceUrl: `https://periodic-table.rsc.org/element/${number}/${name.toLowerCase()}`,
    sourceLabel: `Royal Society of Chemistry · ${name}`,
    ...overrides,
  });
}

const QUANTUM_MATERIALS = {
  sourceUrl: 'https://www.nist.gov/programs-projects/precision-materials-quantum-devices',
  sourceLabel: 'NIST · Precision materials for quantum devices',
};
const ENCAPSULATION = {
  sourceUrl: 'https://www.nist.gov/publications/systematic-improvements-transmon-qubit-coherence-enabled-niobium-surface-encapsulation',
  sourceLabel: 'NIST · Niobium surface encapsulation',
};
const NITRIDES = {
  sourceUrl: 'https://arxiv.org/abs/2103.07711',
  sourceLabel: 'Kim et al. · All-nitride superconducting qubits',
};
const DIELECTRICS = {
  sourceUrl: 'https://arxiv.org/abs/0802.2404',
  sourceLabel: 'O’Connell et al. · Microwave dielectric materials',
};
const MAJORANA_2 = {
  sourceUrl: 'https://quantum.microsoft.com/en-us/insights/blogs/majorana-2-scalable-quantum-processor',
  sourceLabel: 'Microsoft · Majorana 2 material stack',
};

export const MATERIAL_PROFILES: MaterialProfile[] = [
  metal('Al', 'Aluminium', 13, '#c7cbd0', 0.25,
    'Pale silver with a restrained satin reflection.', 'Junction electrodes, capacitor pads and superconducting films.', QUANTUM_MATERIALS),
  metal('Nb', 'Niobium', 41, '#a1a8b5', 0.28,
    'Cool grey metal with broad, softly blue highlights.', 'Superconducting circuit films and resonators.', ENCAPSULATION),
  metal('Ta', 'Tantalum', 73, '#7c8997', 0.32,
    'Dense blue-grey metal with a subdued sheen.', 'Superconducting pads and niobium surface encapsulation.', ENCAPSULATION),
  metal('Ti', 'Titanium', 22, '#949b9e', 0.39,
    'Neutral grey with a fine, matte metallic finish.', 'Metal and coating comparison; commonly used in structural alloys.'),
  metal('Au', 'Gold', 79, '#dbb265', 0.21,
    'Warm yellow gold with bright edge reflections.', 'Corrosion-resistant contacts and plated package surfaces.', { clearcoat: 0.2 }),
  metal('Cu', 'Copper', 29, '#c38360', 0.27,
    'Warm red-orange metal with soft machined highlights.', 'Conductors, interconnects and thermal hardware.'),
  metal('Ag', 'Silver', 47, '#e1e4e3', 0.13,
    'Bright, nearly neutral silver with crisp reflections.', 'Electrical contacts and reflective surface comparison.', { finish: 'polished' }),
  metal('Pt', 'Platinum', 78, '#b9bcba', 0.19,
    'Dense neutral silver with a smooth polish.', 'Contact and electrode material comparison.', { finish: 'polished' }),
  metal('In', 'Indium', 49, '#c5cad3', 0.33,
    'Soft silver with diffuse, rounded highlights.', 'Soft metal bonds, coatings and low-melting alloys.'),
  metal('Sn', 'Tin', 50, '#afb7bc', 0.34,
    'Soft grey silver with a lightly mottled sheen.', 'Solder and protective-coating material comparison.'),
  metal('Pb', 'Lead', 82, '#858e9a', 0.44,
    'Heavy blue-grey metal with a muted surface.', 'Semiconductor–superconductor devices in Microsoft’s reported Majorana 2 stack.', MAJORANA_2),
  profile({ id: 'Si', name: 'Silicon', formula: 'Si', elements: ['Si'], category: 'semiconductor',
    color: '#192232', metalness: 0.34, roughness: 0.17, clearcoat: 0.66, clearcoatRoughness: 0.11,
    iridescence: 0.12, finish: 'crystalline',
    description: 'Dark crystalline grey with a polished wafer reflection.', use: 'Substrates for fabricated superconducting circuits.',
    sourceUrl: 'https://arxiv.org/abs/1703.10195', sourceLabel: 'Superconducting qubits on silicon substrates' }),
  profile({ id: 'Ge', name: 'Germanium', formula: 'Ge', elements: ['Ge'], category: 'semiconductor',
    color: '#626775', metalness: 0.4, roughness: 0.18, clearcoat: 0.55, finish: 'crystalline',
    description: 'Silver-grey crystalline surface with a dark mirror finish.', use: 'Semiconductor and optical material comparison.',
    sourceUrl: 'https://periodic-table.rsc.org/element/32/germanium', sourceLabel: 'Royal Society of Chemistry · Germanium' }),
  metal('W', 'Tungsten', 74, '#737d88', 0.31,
    'Dense charcoal-grey metal with narrow silver highlights.', 'Refractory metal and electrical-contact comparison.'),
  metal('Mo', 'Molybdenum', 42, '#92999c', 0.29,
    'Neutral grey with an even, fine-grained sheen.', 'Refractory metal and thin-film appearance comparison.'),
  metal('Re', 'Rhenium', 75, '#c0c3c5', 0.23,
    'Light grey with slightly warmer polished highlights.', 'Superconducting resonator films on sapphire.', {
      sourceUrl: 'https://arxiv.org/abs/0909.0547', sourceLabel: 'Wang et al. · Coherence of superconducting coplanar resonators',
    }),
  metal('Ni', 'Nickel', 28, '#b6b5a9', 0.25,
    'Silver with a faint warm cast and hard reflections.', 'Plating and alloy material comparison.'),
  metal('Cr', 'Chromium', 24, '#d0d7dc', 0.12,
    'Cool, bright silver with a sharp polished reflection.', 'Protective coating and surface-finish comparison.', { finish: 'polished' }),
  metal('Fe', 'Iron', 26, '#7c8188', 0.43,
    'Dark neutral metal with a satin machined finish.', 'Mechanical metal comparison; not a superconducting film recommendation.'),
  profile({ id: 'sapphire', name: 'Sapphire', formula: 'Al₂O₃', elements: ['Al', 'O'], category: 'ceramic',
    color: '#dce7ed', roughness: 0.12, clearcoat: 0.72, clearcoatRoughness: 0.1,
    transmission: 0.5, ior: 1.76, finish: 'crystalline',
    description: 'Optical-grade sapphire is clear; a slight cool tint makes its edges readable.', use: 'Single-crystal dielectric substrate and optical window material.',
    sourceUrl: 'https://www.knightoptical.com/stock/windows-and-diffusers/ir-windows/sapphire-windows', sourceLabel: 'Knight Optical · Sapphire windows' }),
  profile({ id: 'alumina', name: 'Alumina ceramic', formula: 'Al₂O₃', elements: ['Al', 'O'], category: 'ceramic',
    color: '#e5e2d8', roughness: 0.58, clearcoat: 0.04, finish: 'ceramic',
    description: 'Opaque ivory ceramic with a soft, fine-grained surface.', use: 'Electrical insulation and ceramic support components.',
    sourceUrl: 'https://www.coorstek.com/media/4235/advanced-alumina.pdf', sourceLabel: 'CoorsTek · Advanced alumina' }),
  profile({ id: 'TiN', name: 'Titanium nitride', formula: 'TiN', elements: ['Ti', 'N'], category: 'compound',
    color: '#ae904d', metalness: 0.85, roughness: 0.27, clearcoat: 0.25, finish: 'brushed',
    description: 'A subdued brass-gold film; stoichiometry and processing affect its appearance.', use: 'Superconducting resonator and capacitor films.',
    sourceUrl: 'https://arxiv.org/abs/1303.4071', sourceLabel: 'Chang et al. · Titanium nitride superconducting qubits' }),
  profile({ id: 'NbN', name: 'Niobium nitride', formula: 'NbN', elements: ['Nb', 'N'], category: 'compound',
    color: '#555f6c', metalness: 0.77, roughness: 0.28, finish: 'brushed',
    description: 'Graphite-grey film with a restrained metallic sheen.', use: 'Superconducting electrodes in nitride junction devices.', ...NITRIDES }),
  profile({ id: 'NbTiN', name: 'Niobium titanium nitride', formula: 'NbTiN', elements: ['Nb', 'Ti', 'N'], category: 'compound',
    color: '#596779', metalness: 0.73, roughness: 0.24, clearcoat: 0.25, finish: 'brushed',
    description: 'Dark blue-grey nitride with polished edge reflections.', use: 'Superconducting microwave resonators.',
    sourceUrl: 'https://arxiv.org/abs/1507.05126', sourceLabel: 'Frequency-tunable NbTiN superconducting resonators' }),
  profile({ id: 'SiO2', name: 'Silicon dioxide', formula: 'SiO₂', elements: ['Si', 'O'], category: 'ceramic',
    color: '#d8e5ec', roughness: 0.14, clearcoat: 0.68, transmission: 0.42, ior: 1.46, iridescence: 0.2,
    description: 'Pale transparent oxide with a subtle thin-film color cue.', use: 'Dielectric and insulating films; visible color depends on thickness.', ...DIELECTRICS }),
  profile({ id: 'AlOx', name: 'Aluminium oxide barrier', formula: 'AlOₓ', elements: ['Al', 'O'], category: 'ceramic',
    color: '#c8d9e3', roughness: 0.23, clearcoat: 0.44, transmission: 0.14, iridescence: 0.15,
    description: 'A translucent oxide appearance for a film too thin to resolve at package scale.', use: 'Tunnel barrier between aluminium junction electrodes.', ...QUANTUM_MATERIALS }),
  profile({ id: 'SiNx', name: 'Silicon nitride', formula: 'SiNₓ', elements: ['Si', 'N'], category: 'ceramic',
    color: '#a8bdb7', roughness: 0.24, clearcoat: 0.4, transmission: 0.08, iridescence: 0.23,
    description: 'A muted green-grey dielectric film with a thickness-dependent color cue.', use: 'Dielectric and passivation-film comparison.', ...DIELECTRICS }),
  profile({ id: 'InAs', name: 'Indium arsenide', formula: 'InAs', elements: ['In', 'As'], category: 'semiconductor',
    color: '#555c70', metalness: 0.29, roughness: 0.16, clearcoat: 0.65, iridescence: 0.12, finish: 'crystalline',
    description: 'Dark crystalline semiconductor with smooth, violet-grey reflections.', use: 'Semiconductor in Microsoft’s reported InAs–Al Majorana 1 devices.',
    sourceUrl: 'https://azure.microsoft.com/en-us/blog/quantum/2025/02/19/microsoft-unveils-majorana-1-the-worlds-first-quantum-processor-powered-by-topological-qubits/', sourceLabel: 'Microsoft · Majorana 1 materials' }),
  profile({ id: 'laminate', name: 'Carrier laminate', formula: 'Glass / epoxy', elements: ['Si', 'O', 'C', 'H'], category: 'compound',
    color: '#60272e', roughness: 0.62, clearcoat: 0.2, clearcoatRoughness: 0.42, finish: 'ceramic',
    description: 'Burgundy solder mask over glass-reinforced epoxy. Mask pigment varies independently of the laminate; elements show principal constituents, not a fixed formulation.',
    use: 'PCB carrier reference; composition and cryogenic suitability depend on the actual laminate.',
    sourceUrl: 'https://www.isola-group.com/pcb-laminates-prepreg/370hr-laminate-prepreg/', sourceLabel: 'Isola · 370HR glass / epoxy laminate' }),
  profile({ id: 'InAsSb', name: 'Indium arsenide antimonide', formula: 'InAsSb', elements: ['In', 'As', 'Sb'], category: 'semiconductor',
    color: '#5d596b', metalness: 0.27, roughness: 0.2, clearcoat: 0.55, iridescence: 0.1, finish: 'crystalline',
    description: 'A dark violet-grey semiconductor appearance; composition varies.', use: 'Semiconductor active-region material reported for Majorana 2.', ...MAJORANA_2 }),
  profile({ id: 'GaSb', name: 'Gallium antimonide', formula: 'GaSb', elements: ['Ga', 'Sb'], category: 'semiconductor',
    color: '#776676', metalness: 0.26, roughness: 0.18, clearcoat: 0.53, iridescence: 0.1, finish: 'crystalline',
    description: 'Grey crystalline material with a muted violet reflection.', use: 'Substrate and heterostructure material reported for Majorana 2.', ...MAJORANA_2 }),
  profile({ id: 'HfO2', name: 'Hafnium dioxide', formula: 'HfO₂', elements: ['Hf', 'O'], category: 'ceramic',
    color: '#ded4ba', roughness: 0.33, clearcoat: 0.3, iridescence: 0.15, finish: 'ceramic',
    description: 'A pale oxide finish with a restrained warm interference cue.', use: 'High-permittivity gate-dielectric material comparison.',
    sourceUrl: 'https://www.nist.gov/publications/measurement-gate-oxide-film-thickness-x-ray-photoelectron-spectroscopy', sourceLabel: 'NIST · Gate-oxide materials' }),
  profile({ id: 'a-Ge', name: 'Amorphous germanium', formula: 'a-Ge', elements: ['Ge'], category: 'semiconductor',
    color: '#676c77', metalness: 0.22, roughness: 0.39, clearcoat: 0.23,
    description: 'Diffuse grey thin film, softer than the polished crystalline profile.', use: 'Deposited dielectric films studied in superconducting microwave circuits.',
    sourceUrl: 'https://arxiv.org/abs/2011.10155', sourceLabel: 'Kopas et al. · Deposited Si and Ge dielectrics' }),
  profile({ id: 'a-Si:H', name: 'Hydrogenated amorphous silicon', formula: 'a-Si:H', elements: ['Si', 'H'], category: 'semiconductor',
    color: '#5b6974', metalness: 0.16, roughness: 0.38, clearcoat: 0.25,
    description: 'Smoky blue-grey film with subdued reflections.', use: 'Amorphous dielectric-film comparison in microwave circuits.', ...DIELECTRICS }),
  profile({ id: 'NbN-TiN', name: 'Niobium nitride / titanium nitride', formula: 'NbN/TiN', elements: ['Nb', 'Ti', 'N'], category: 'compound',
    color: '#77745c', metalness: 0.74, roughness: 0.3, finish: 'brushed',
    description: 'An illustrative muted bronze-grey finish for a layered nitride system.', use: 'NbN film with TiN buffer; distinct from the NbTiN ternary material.', ...NITRIDES }),
  profile({ id: 'BN', name: 'Hexagonal boron nitride', formula: 'BN', elements: ['B', 'N'], category: 'ceramic',
    color: '#e7e4d9', roughness: 0.63, clearcoat: 0.04, finish: 'ceramic',
    description: 'Soft white ceramic with a diffuse, lightly textured finish.', use: 'Electrically insulating ceramic and thermal-management material comparison.',
    sourceUrl: 'https://multimedia.3m.com/mws/media/1798789O/3m-advanced-materials-technical-ceramics-boron-nitrid-bn-cer-brochure-english.pdf',
    sourceLabel: '3M · Hexagonal boron nitride materials' }),
  profile({ id: 'B4C', name: 'Boron carbide', formula: 'B₄C', elements: ['B', 'C'], category: 'ceramic',
    color: '#303638', metalness: 0.03, roughness: 0.56, clearcoat: 0.06, finish: 'ceramic',
    description: 'Dense charcoal ceramic with a fine granular surface.', use: 'Hard technical ceramic comparison; not a qualified chip-substrate substitution.',
    sourceUrl: 'https://www.ceramicsrefractories.saint-gobain.com/materials/boron-carbide-b4c',
    sourceLabel: 'Saint-Gobain · Boron carbide technical ceramics' }),
  profile({ id: 'LaAlO3', name: 'Lanthanum aluminate', formula: 'LaAlO₃', elements: ['La', 'Al', 'O'], category: 'ceramic',
    color: '#c4a081', roughness: 0.19, clearcoat: 0.6, transmission: 0.12, iridescence: 0.07, finish: 'crystalline',
    description: 'Polished tan crystal; growth and annealing can change its color.', use: 'Ternary oxide substrate studied for superconducting circuits.',
    sourceUrl: 'https://arxiv.org/abs/2201.06228', sourceLabel: 'Degnan et al. · Ternary oxide substrates for superconducting circuits' }),
  profile({ id: 'MgAl2O4', name: 'Magnesium aluminate spinel', formula: 'MgAl₂O₄', elements: ['Mg', 'Al', 'O'], category: 'ceramic',
    color: '#dce7df', roughness: 0.13, clearcoat: 0.65, transmission: 0.4, ior: 1.72, finish: 'crystalline',
    description: 'Transparent polished spinel with a slight edge tint for readability.', use: 'Ternary oxide substrate studied for superconducting circuits.',
    sourceUrl: 'https://arxiv.org/abs/2201.06228', sourceLabel: 'Degnan et al. · Ternary oxide substrates for superconducting circuits' }),
];

export const MATERIAL_BY_ID: Record<string, MaterialProfile> = Object.fromEntries(
  MATERIAL_PROFILES.map((material) => [material.id, material]),
);

export const DEFAULT_COMPONENT_MATERIALS: ComponentMaterials = {
  junction: 'Al', capacitor: 'Al', gate: 'Al', ground: 'Al',
  substrate: 'Si', board: 'laminate', package: 'Au',
};

/** Discovery shortcuts for appearance exploration, not fabrication approvals. */
export const RECOMMENDED_MATERIALS: Record<PartId, string[]> = {
  junction: ['Al', 'Nb', 'NbN', 'AlOx'],
  capacitor: ['Al', 'Nb', 'Ta', 'TiN', 'NbTiN'],
  gate: ['Al', 'Nb', 'Au', 'Ti'],
  ground: ['Al', 'Nb', 'Ta', 'TiN', 'Re'],
  substrate: ['Si', 'sapphire', 'Ge', 'InAs', 'GaSb'],
  board: ['laminate', 'alumina', 'sapphire'],
  package: ['Au', 'Cu', 'Al', 'Ag'],
};

const LEGACY_MATERIAL_IDS: Record<string, string> = {
  'Al₂O₃ (sapphire)': 'sapphire', 'Al2O3 (sapphire)': 'sapphire',
  'Al₂O₃': 'alumina', Al2O3: 'alumina',
  'AlOₓ': 'AlOx', 'SiO₂': 'SiO2', 'SiNₓ': 'SiNx', 'Si₃N₄': 'SiNx', Si3N4: 'SiNx',
  'HfO₂': 'HfO2', 'NbN/TiN': 'NbN-TiN',
  'B₄C': 'B4C', 'LaAlO₃': 'LaAlO3', 'MgAl₂O₄': 'MgAl2O4',
};

/** Unsupported/custom legacy materials use Al rather than inventing a recipe. */
export function materialIdFromLegacy(name: string): string {
  const trimmed = name.trim();
  if (Object.hasOwn(MATERIAL_BY_ID, trimmed)) return trimmed;
  return Object.hasOwn(LEGACY_MATERIAL_IDS, trimmed) ? LEGACY_MATERIAL_IDS[trimmed] : 'Al';
}

export function resolveMaterial(id: string): MaterialProfile {
  return MATERIAL_BY_ID[materialIdFromLegacy(id)];
}

export function materialProfilesForElement(symbol: string): MaterialProfile[] {
  return MATERIAL_PROFILES.filter((material) => material.elements.includes(symbol));
}

export interface PeriodicElement {
  symbol: string;
  name: string;
  number: number;
  /** Grid column; f-block columns are display positions, not chemical groups. */
  group: number;
  /** Grid row; 8 and 9 are detached f-block rows, chemically periods 6 and 7. */
  period: number;
}

export const PERIODIC_TABLE_SOURCE = 'https://iupac.org/what-we-do/periodic-table-of-elements/';

/** IUPAC element identities. Detached f-block display keeps every element unique. */
export const PERIODIC_ELEMENTS: PeriodicElement[] = ([
  ['H', 'Hydrogen', 1, 1, 1], ['He', 'Helium', 2, 18, 1],
  ['Li', 'Lithium', 3, 1, 2], ['Be', 'Beryllium', 4, 2, 2],
  ['B', 'Boron', 5, 13, 2], ['C', 'Carbon', 6, 14, 2],
  ['N', 'Nitrogen', 7, 15, 2], ['O', 'Oxygen', 8, 16, 2],
  ['F', 'Fluorine', 9, 17, 2], ['Ne', 'Neon', 10, 18, 2],
  ['Na', 'Sodium', 11, 1, 3], ['Mg', 'Magnesium', 12, 2, 3],
  ['Al', 'Aluminium', 13, 13, 3], ['Si', 'Silicon', 14, 14, 3],
  ['P', 'Phosphorus', 15, 15, 3], ['S', 'Sulfur', 16, 16, 3],
  ['Cl', 'Chlorine', 17, 17, 3], ['Ar', 'Argon', 18, 18, 3],
  ['K', 'Potassium', 19, 1, 4], ['Ca', 'Calcium', 20, 2, 4],
  ['Sc', 'Scandium', 21, 3, 4], ['Ti', 'Titanium', 22, 4, 4],
  ['V', 'Vanadium', 23, 5, 4], ['Cr', 'Chromium', 24, 6, 4],
  ['Mn', 'Manganese', 25, 7, 4], ['Fe', 'Iron', 26, 8, 4],
  ['Co', 'Cobalt', 27, 9, 4], ['Ni', 'Nickel', 28, 10, 4],
  ['Cu', 'Copper', 29, 11, 4], ['Zn', 'Zinc', 30, 12, 4],
  ['Ga', 'Gallium', 31, 13, 4], ['Ge', 'Germanium', 32, 14, 4],
  ['As', 'Arsenic', 33, 15, 4], ['Se', 'Selenium', 34, 16, 4],
  ['Br', 'Bromine', 35, 17, 4], ['Kr', 'Krypton', 36, 18, 4],
  ['Rb', 'Rubidium', 37, 1, 5], ['Sr', 'Strontium', 38, 2, 5],
  ['Y', 'Yttrium', 39, 3, 5], ['Zr', 'Zirconium', 40, 4, 5],
  ['Nb', 'Niobium', 41, 5, 5], ['Mo', 'Molybdenum', 42, 6, 5],
  ['Tc', 'Technetium', 43, 7, 5], ['Ru', 'Ruthenium', 44, 8, 5],
  ['Rh', 'Rhodium', 45, 9, 5], ['Pd', 'Palladium', 46, 10, 5],
  ['Ag', 'Silver', 47, 11, 5], ['Cd', 'Cadmium', 48, 12, 5],
  ['In', 'Indium', 49, 13, 5], ['Sn', 'Tin', 50, 14, 5],
  ['Sb', 'Antimony', 51, 15, 5], ['Te', 'Tellurium', 52, 16, 5],
  ['I', 'Iodine', 53, 17, 5], ['Xe', 'Xenon', 54, 18, 5],
  ['Cs', 'Caesium', 55, 1, 6], ['Ba', 'Barium', 56, 2, 6],
  ['La', 'Lanthanum', 57, 3, 8], ['Ce', 'Cerium', 58, 4, 8],
  ['Pr', 'Praseodymium', 59, 5, 8], ['Nd', 'Neodymium', 60, 6, 8],
  ['Pm', 'Promethium', 61, 7, 8], ['Sm', 'Samarium', 62, 8, 8],
  ['Eu', 'Europium', 63, 9, 8], ['Gd', 'Gadolinium', 64, 10, 8],
  ['Tb', 'Terbium', 65, 11, 8], ['Dy', 'Dysprosium', 66, 12, 8],
  ['Ho', 'Holmium', 67, 13, 8], ['Er', 'Erbium', 68, 14, 8],
  ['Tm', 'Thulium', 69, 15, 8], ['Yb', 'Ytterbium', 70, 16, 8],
  ['Lu', 'Lutetium', 71, 17, 8], ['Hf', 'Hafnium', 72, 4, 6],
  ['Ta', 'Tantalum', 73, 5, 6], ['W', 'Tungsten', 74, 6, 6],
  ['Re', 'Rhenium', 75, 7, 6], ['Os', 'Osmium', 76, 8, 6],
  ['Ir', 'Iridium', 77, 9, 6], ['Pt', 'Platinum', 78, 10, 6],
  ['Au', 'Gold', 79, 11, 6], ['Hg', 'Mercury', 80, 12, 6],
  ['Tl', 'Thallium', 81, 13, 6], ['Pb', 'Lead', 82, 14, 6],
  ['Bi', 'Bismuth', 83, 15, 6], ['Po', 'Polonium', 84, 16, 6],
  ['At', 'Astatine', 85, 17, 6], ['Rn', 'Radon', 86, 18, 6],
  ['Fr', 'Francium', 87, 1, 7], ['Ra', 'Radium', 88, 2, 7],
  ['Ac', 'Actinium', 89, 3, 9], ['Th', 'Thorium', 90, 4, 9],
  ['Pa', 'Protactinium', 91, 5, 9], ['U', 'Uranium', 92, 6, 9],
  ['Np', 'Neptunium', 93, 7, 9], ['Pu', 'Plutonium', 94, 8, 9],
  ['Am', 'Americium', 95, 9, 9], ['Cm', 'Curium', 96, 10, 9],
  ['Bk', 'Berkelium', 97, 11, 9], ['Cf', 'Californium', 98, 12, 9],
  ['Es', 'Einsteinium', 99, 13, 9], ['Fm', 'Fermium', 100, 14, 9],
  ['Md', 'Mendelevium', 101, 15, 9], ['No', 'Nobelium', 102, 16, 9],
  ['Lr', 'Lawrencium', 103, 17, 9], ['Rf', 'Rutherfordium', 104, 4, 7],
  ['Db', 'Dubnium', 105, 5, 7], ['Sg', 'Seaborgium', 106, 6, 7],
  ['Bh', 'Bohrium', 107, 7, 7], ['Hs', 'Hassium', 108, 8, 7],
  ['Mt', 'Meitnerium', 109, 9, 7], ['Ds', 'Darmstadtium', 110, 10, 7],
  ['Rg', 'Roentgenium', 111, 11, 7], ['Cn', 'Copernicium', 112, 12, 7],
  ['Nh', 'Nihonium', 113, 13, 7], ['Fl', 'Flerovium', 114, 14, 7],
  ['Mc', 'Moscovium', 115, 15, 7], ['Lv', 'Livermorium', 116, 16, 7],
  ['Ts', 'Tennessine', 117, 17, 7], ['Og', 'Oganesson', 118, 18, 7],
] satisfies [string, string, number, number, number][]).map(([symbol, name, number, group, period]) => ({
  symbol, name, number, group, period,
}));
