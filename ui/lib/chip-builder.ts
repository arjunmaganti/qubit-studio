import { DEFAULT_GEOMETRY_ASSUMPTIONS, ecFromCapacitorArea, ejFromJunctionArea } from './geometry-model.ts';
import { clampParam } from './params.ts';

export type BuilderShape = 'rectangle' | 'circle' | 'cross' | 'stepped' | 'meander' | 'junction' | 'cutout';
export type BuilderRole = 'capacitor' | 'junction' | 'control' | 'resonator' | 'ground' | 'visual';

export interface BuilderTemplate {
  id: string;
  name: string;
  category: string;
  explanation: string;
  shape: BuilderShape;
  role: BuilderRole;
  width: number;
  height: number;
  layer: string;
  material: string;
  ports: number;
  sourceName: string;
  sourceUrl: string;
}

export interface BuilderPart extends Omit<BuilderTemplate, 'category' | 'sourceName'> {
  templateId: string;
  x: number;
  y: number;
  rotation: number;
  custom: boolean;
  areaUm2?: number;
}

export interface BuilderConnection {
  id: string;
  from: { partId: string; port: number };
  to: { partId: string; port: number };
}

export interface ChipBuilderDesign {
  version: 1;
  name: string;
  chipWidth: number;
  chipHeight: number;
  grid: number;
  parts: BuilderPart[];
  connections: BuilderConnection[];
}

const KQC = 'https://iqm-finland.github.io/KQCircuits/';
const METAL = 'https://qiskit-community.github.io/qiskit-metal/';
const GDSFACTORY = 'https://gdsfactory.github.io/gdsfactory/';
const TRANSMON = 'https://arxiv.org/abs/cond-mat/0703002';

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  { id:'rect-pad', name:'Rectangular capacitor pad', category:'Capacitors', explanation:'A simple metal island that stores charge.', shape:'rectangle', role:'capacitor', width:180, height:130, layer:'Metal 1', material:'Al', ports:2, sourceName:'Qiskit Metal patterns', sourceUrl:METAL },
  { id:'stepped-pad', name:'Stepped capacitor pad', category:'Capacitors', explanation:'A capacitor island that narrows in steps toward the junction, based on the Myla reference pack.', shape:'stepped', role:'capacitor', width:210, height:140, layer:'Metal 1', material:'Al', ports:2, sourceName:'Myla reference pack · transmon background', sourceUrl:TRANSMON },
  { id:'xmon-pad', name:'Cross capacitor (Xmon)', category:'Capacitors', explanation:'Four arms provide room for control and readout connections.', shape:'cross', role:'capacitor', width:180, height:180, layer:'Metal 1', material:'Al', ports:4, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'round-pad', name:'Circular capacitor', category:'Capacitors', explanation:'A compact rounded island for exploring different pad geometry.', shape:'circle', role:'capacitor', width:150, height:150, layer:'Metal 1', material:'Al', ports:4, sourceName:'Parametric layout pattern', sourceUrl:GDSFACTORY },
  { id:'jj', name:'Josephson junction', category:'Qubit', explanation:'The nonlinear weak link used by the transmon model.', shape:'junction', role:'junction', width:54, height:24, layer:'Junction', material:'Al', ports:2, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'compact-jj', name:'Compact Josephson junction', category:'Qubit', explanation:'A smaller symbolic junction with two superconducting sides and a thin central barrier, based on the Myla reference pack.', shape:'junction', role:'junction', width:38, height:20, layer:'Junction', material:'Al', ports:2, sourceName:'Myla reference pack · transmon background', sourceUrl:TRANSMON },
  { id:'feedline', name:'Transmission line', category:'Lines', explanation:'Carries microwave signals across the chip.', shape:'rectangle', role:'control', width:250, height:18, layer:'Metal 1', material:'Nb', ports:2, sourceName:'gdsfactory routing model', sourceUrl:GDSFACTORY },
  { id:'charge-line', name:'Charge-control line', category:'Lines', explanation:'A line placed near the qubit to represent charge control.', shape:'rectangle', role:'control', width:190, height:14, layer:'Metal 1', material:'Al', ports:2, sourceName:'Qiskit Metal patterns', sourceUrl:METAL },
  { id:'flux-line', name:'Flux-control line', category:'Lines', explanation:'Represents a nearby line used to tune a two-junction device.', shape:'meander', role:'control', width:180, height:80, layer:'Metal 1', material:'Nb', ports:2, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'readout', name:'Readout resonator', category:'Resonators', explanation:'A folded microwave path used to read out a qubit.', shape:'meander', role:'resonator', width:260, height:120, layer:'Metal 1', material:'Nb', ports:2, sourceName:'Qiskit Metal patterns', sourceUrl:METAL },
  { id:'compact-readout', name:'Compact readout resonator', category:'Resonators', explanation:'A shorter folded microwave path for a more compact teaching layout.', shape:'meander', role:'resonator', width:190, height:90, layer:'Metal 1', material:'Nb', ports:2, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'coupler', name:'Coupling capacitor', category:'Connections', explanation:'Two small conductors that couple nearby circuit sections.', shape:'rectangle', role:'capacitor', width:70, height:34, layer:'Metal 1', material:'Al', ports:2, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'bond-pad', name:'Bond pad', category:'Connections', explanation:'A large contact point for a wire connection at the chip edge.', shape:'rectangle', role:'control', width:90, height:70, layer:'Metal 1', material:'Au', ports:1, sourceName:'gdsfactory port model', sourceUrl:GDSFACTORY },
  { id:'airbridge', name:'Airbridge', category:'Connections', explanation:'A bridge across a line, shown as a layout marker.', shape:'rectangle', role:'visual', width:58, height:24, layer:'Bridge', material:'Al', ports:0, sourceName:'KQCircuits patterns', sourceUrl:KQC },
  { id:'ground-cutout', name:'Ground cutout', category:'Ground', explanation:'An opening in the surrounding ground metal.', shape:'cutout', role:'ground', width:190, height:100, layer:'Ground opening', material:'None', ports:0, sourceName:'Parametric layout pattern', sourceUrl:GDSFACTORY },
  { id:'round-cutout', name:'Circular ground cutout', category:'Ground', explanation:'A rounded opening in the surrounding ground metal.', shape:'circle', role:'ground', width:150, height:150, layer:'Ground opening', material:'None', ports:0, sourceName:'Parametric layout pattern', sourceUrl:GDSFACTORY },
];

const REPLACEMENT_FAMILIES = [
  ['rect-pad', 'stepped-pad', 'xmon-pad', 'round-pad'],
  ['jj', 'compact-jj'],
  ['feedline', 'charge-line', 'flux-line'],
  ['readout', 'compact-readout'],
  ['ground-cutout', 'round-cutout'],
] as const;

export function replacementTemplatesForPart(part: BuilderPart): BuilderTemplate[] {
  const family = REPLACEMENT_FAMILIES.find(ids => ids.includes(part.templateId as never));
  const candidates = family
    ? BUILDER_TEMPLATES.filter(template => family.includes(template.id as never))
    : BUILDER_TEMPLATES.filter(template => template.role === part.role);
  return candidates.filter(template => template.id !== part.templateId);
}

export function replaceBuilderPart(design: ChipBuilderDesign, partId: string, templateId: string): ChipBuilderDesign {
  const current = design.parts.find(part => part.id === partId);
  const replacement = BUILDER_TEMPLATES.find(template => template.id === templateId);
  if (!current || !replacement || !replacementTemplatesForPart(current).some(template => template.id === templateId)) return design;
  const part: BuilderPart = {
    ...replacement,
    id: current.id,
    templateId: replacement.id,
    x: current.x,
    y: current.y,
    rotation: current.rotation,
    custom: false,
    areaUm2: current.areaUm2 ?? (replacement.role === 'junction' ? 0.06 : replacement.role === 'capacitor' ? 810 : undefined),
  };
  const connections = design.connections.filter(connection =>
    (connection.from.partId !== partId || connection.from.port < replacement.ports)
      && (connection.to.partId !== partId || connection.to.port < replacement.ports));
  return { ...design, parts: design.parts.map(item => item.id === partId ? part : item), connections };
}

export interface BuilderDesignPreset {
  id: 'compact-transmon' | 'xmon-control' | 'readout-transmon' | 'tunable-transmon';
  name: string;
  explanation: string;
  pieces: string[];
}

export const BUILDER_DESIGN_PRESETS: BuilderDesignPreset[] = [
  { id:'compact-transmon', name:'Compact transmon', explanation:'Two stepped pads and a compact junction, matching the reference-pack component view.', pieces:['2 stepped capacitor pads', 'Compact Josephson junction', 'Charge-control line'] },
  { id:'xmon-control', name:'Xmon control layout', explanation:'A cross capacitor with nearby charge and flux-control lines.', pieces:['Cross capacitor', 'Compact Josephson junction', 'Charge-control line', 'Flux-control line'] },
  { id:'readout-transmon', name:'Transmon with readout', explanation:'A two-pad transmon connected to a coupler, readout resonator, and feedline.', pieces:['2 capacitor pads', 'Josephson junction', 'Coupling capacitor', 'Readout resonator', 'Transmission line'] },
  { id:'tunable-transmon', name:'Flux-tunable layout', explanation:'A teaching layout with two junctions, capacitor pads, a flux line, and readout.', pieces:['2 circular capacitor pads', '2 compact junctions', 'Flux-control line', 'Compact readout resonator'] },
];

export const EMPTY_BUILDER_DESIGN: ChipBuilderDesign = {
  version: 1,
  name: 'My quantum chip',
  chipWidth: 1000,
  chipHeight: 600,
  grid: 10,
  parts: [],
  connections: [],
};

export function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

export function createBuilderPart(template: BuilderTemplate, index: number): BuilderPart {
  return {
    id: `${template.id}-${Date.now()}-${index}`,
    templateId: template.id,
    name: template.name,
    explanation: template.explanation,
    shape: template.shape,
    role: template.role,
    width: template.width,
    height: template.height,
    x: 250 + (index % 5) * 110,
    y: 180 + (index % 3) * 100,
    rotation: 0,
    layer: template.layer,
    material: template.material,
    ports: template.ports,
    sourceUrl: template.sourceUrl,
    custom: false,
    areaUm2: template.role === 'junction' ? 0.06 : template.role === 'capacitor' ? 810 : undefined,
  };
}

export function portPoint(part: BuilderPart, port: number): { x: number; y: number } {
  const candidates = [
    { x: -part.width / 2, y: 0 },
    { x: part.width / 2, y: 0 },
    { x: 0, y: -part.height / 2 },
    { x: 0, y: part.height / 2 },
  ];
  const local = candidates[Math.max(0, Math.min(candidates.length - 1, port))];
  const angle = part.rotation * Math.PI / 180;
  return { x: part.x + local.x * Math.cos(angle) - local.y * Math.sin(angle), y: part.y + local.x * Math.sin(angle) + local.y * Math.cos(angle) };
}

export function designWarnings(design: ChipBuilderDesign): string[] {
  const warnings: string[] = [];
  if (!design.parts.some(part => part.role === 'junction')) warnings.push('Add a Josephson junction for a transmon-style circuit.');
  if (!design.parts.some(part => part.role === 'capacitor')) warnings.push('Add at least one capacitor component to store charge.');
  if (design.parts.some(part => Math.abs(part.x - design.chipWidth / 2) + part.width / 2 > design.chipWidth / 2 || Math.abs(part.y - design.chipHeight / 2) + part.height / 2 > design.chipHeight / 2)) warnings.push('One or more pieces extend beyond the chip boundary.');
  const connected = new Set(design.connections.flatMap(connection => [connection.from.partId, connection.to.partId]));
  if (design.parts.some(part => part.ports > 0 && !connected.has(part.id))) warnings.push('Some electrical pieces are not connected. Select one port and then another to connect them.');
  if (design.parts.some(part => part.role === 'visual')) warnings.push('Visual-only pieces are shown in exports but do not change the electrical model.');
  if (design.parts.some(part => part.role === 'junction' && part.layer !== 'Junction')) warnings.push('A junction is assigned to a non-junction fabrication layer.');
  if (design.parts.some(part => part.shape === 'cutout' && part.layer !== 'Ground opening')) warnings.push('A cutout is assigned to a metal layer instead of the ground-opening layer.');
  return warnings;
}

/** The builder feeds the existing bounded, fixed-transmon teaching model. */
export function builderElectricalModel(design: ChipBuilderDesign) {
  const junctions = design.parts.filter(part => part.role === 'junction');
  const capacitors = design.parts.filter(part => part.role === 'capacitor');
  if (!junctions.length || !capacitors.length) return null;
  const modeled = [junctions[0], ...capacitors];
  if (modeled.some(part => !Number.isFinite(part.areaUm2) || (part.areaUm2 ?? 0) <= 0)) return null;
  const ej = ejFromJunctionArea(junctions[0].areaUm2!, DEFAULT_GEOMETRY_ASSUMPTIONS.criticalCurrentDensityAcm2);
  const ec = ecFromCapacitorArea(capacitors.reduce((sum, part) => sum + part.areaUm2!, 0), DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2);
  if (!Number.isFinite(ej) || !Number.isFinite(ec) || ej <= 0 || ec <= 0) return null;
  const ejGhz = clampParam('ej_ghz', ej), ecGhz = clampParam('ec_ghz', ec);
  return { ejGhz, ecGhz, bounded: ejGhz !== ej || ecGhz !== ec, junctionCount: junctions.length };
}

export function validBuilderDesign(value: unknown): value is ChipBuilderDesign {
  if (!value || typeof value !== 'object') return false;
  const design = value as ChipBuilderDesign;
  const shapes: BuilderShape[] = ['rectangle','circle','cross','stepped','meander','junction','cutout'];
  const roles: BuilderRole[] = ['capacitor','junction','control','resonator','ground','visual'];
  return design.version === 1 && typeof design.name === 'string' && design.name.length <= 100
    && Number.isFinite(design.chipWidth) && design.chipWidth >= 200 && design.chipWidth <= 5000
    && Number.isFinite(design.chipHeight) && design.chipHeight >= 200 && design.chipHeight <= 5000
    && Number.isFinite(design.grid) && design.grid >= 1 && design.grid <= 100
    && Array.isArray(design.parts) && design.parts.length <= 500 && Array.isArray(design.connections) && design.connections.length <= 1000
    && design.parts.every(part => part !== null && typeof part === 'object'
      && typeof part.id === 'string' && part.id.length > 0 && typeof part.name === 'string' && Number.isFinite(part.x) && Number.isFinite(part.y)
      && typeof part.templateId === 'string' && typeof part.explanation === 'string' && typeof part.layer === 'string'
      && typeof part.material === 'string' && typeof part.custom === 'boolean'
      && typeof part.sourceUrl === 'string' && (part.sourceUrl === '' || /^https?:\/\//i.test(part.sourceUrl))
      && Number.isInteger(part.ports) && part.ports >= 0 && part.ports <= 4
      && (part.areaUm2 === undefined || (Number.isFinite(part.areaUm2) && part.areaUm2 > 0))
      && shapes.includes(part.shape) && roles.includes(part.role) && Number.isFinite(part.width) && Number.isFinite(part.height)
      && Number.isFinite(part.rotation) && part.width >= 1 && part.width <= 5000 && part.height >= 1 && part.height <= 5000)
    && new Set(design.parts.map(part => part.id)).size === design.parts.length
    && design.connections.every(connection => connection !== null && typeof connection === 'object'
      && typeof connection.id === 'string' && connection.id.length > 0
      && Number.isInteger(connection.from?.port) && Number.isInteger(connection.to?.port)
      && design.parts.some(part => part.id === connection.from.partId && connection.from.port >= 0 && connection.from.port < part.ports)
      && design.parts.some(part => part.id === connection.to.partId && connection.to.port >= 0 && connection.to.port < part.ports))
    && new Set(design.connections.map(connection => connection.id)).size === design.connections.length;
}

export function createStarterDesign(): ChipBuilderDesign {
  const padTemplate = BUILDER_TEMPLATES.find(template => template.id === 'rect-pad')!;
  const junctionTemplate = BUILDER_TEMPLATES.find(template => template.id === 'jj')!;
  const lineTemplate = BUILDER_TEMPLATES.find(template => template.id === 'charge-line')!;
  const left = { ...createBuilderPart(padTemplate, 0), id:'starter-left-pad', x:330, y:300 };
  const junction = { ...createBuilderPart(junctionTemplate, 1), id:'starter-junction', x:500, y:300 };
  const right = { ...createBuilderPart(padTemplate, 2), id:'starter-right-pad', x:670, y:300 };
  const line = { ...createBuilderPart(lineTemplate, 3), id:'starter-control', x:820, y:160, rotation:90 };
  return {
    ...EMPTY_BUILDER_DESIGN,
    name:'Starter transmon layout',
    parts:[left,junction,right,line],
    connections:[
      {id:'starter-link-left',from:{partId:left.id,port:1},to:{partId:junction.id,port:0}},
      {id:'starter-link-right',from:{partId:junction.id,port:1},to:{partId:right.id,port:0}},
    ],
  };
}

function presetPart(templateId: string, id: string, x: number, y: number, rotation = 0): BuilderPart {
  const template = BUILDER_TEMPLATES.find(item => item.id === templateId);
  if (!template) throw new Error(`Unknown builder template: ${templateId}`);
  return { ...createBuilderPart(template, 0), id, x, y, rotation };
}

function presetConnection(id: string, from: BuilderPart, fromPort: number, to: BuilderPart, toPort: number): BuilderConnection {
  return { id, from: { partId: from.id, port: fromPort }, to: { partId: to.id, port: toPort } };
}

export function createPresetDesign(id: BuilderDesignPreset['id']): ChipBuilderDesign {
  if (id === 'compact-transmon') {
    const left = presetPart('stepped-pad', 'compact-left-pad', 310, 300);
    const junction = presetPart('compact-jj', 'compact-junction', 500, 300);
    const right = presetPart('stepped-pad', 'compact-right-pad', 690, 300, 180);
    const charge = presetPart('charge-line', 'compact-charge-line', 840, 180, 90);
    return { ...EMPTY_BUILDER_DESIGN, name:'Compact transmon', parts:[left,junction,right,charge], connections:[
      presetConnection('compact-left-link', left, 1, junction, 0),
      presetConnection('compact-right-link', junction, 1, right, 0),
      presetConnection('compact-charge-link', charge, 0, right, 1),
    ] };
  }
  if (id === 'xmon-control') {
    const xmon = presetPart('xmon-pad', 'xmon-capacitor', 500, 300);
    const junction = presetPart('compact-jj', 'xmon-junction', 650, 300);
    const charge = presetPart('charge-line', 'xmon-charge-line', 250, 300);
    const flux = presetPart('flux-line', 'xmon-flux-line', 500, 490);
    return { ...EMPTY_BUILDER_DESIGN, name:'Xmon control layout', parts:[xmon,junction,charge,flux], connections:[
      presetConnection('xmon-junction-link', xmon, 1, junction, 0),
      presetConnection('xmon-charge-link', charge, 1, xmon, 0),
      presetConnection('xmon-flux-link', flux, 0, xmon, 3),
    ] };
  }
  if (id === 'readout-transmon') {
    const left = presetPart('rect-pad', 'readout-left-pad', 230, 280);
    const junction = presetPart('jj', 'readout-junction', 390, 280);
    const right = presetPart('rect-pad', 'readout-right-pad', 550, 280);
    const coupler = presetPart('coupler', 'readout-coupler', 690, 280);
    const resonator = presetPart('readout', 'readout-resonator', 820, 280, 90);
    const feedline = presetPart('feedline', 'readout-feedline', 780, 510);
    return { ...EMPTY_BUILDER_DESIGN, name:'Transmon with readout', parts:[left,junction,right,coupler,resonator,feedline], connections:[
      presetConnection('readout-left-link', left, 1, junction, 0),
      presetConnection('readout-right-link', junction, 1, right, 0),
      presetConnection('readout-coupler-link', right, 1, coupler, 0),
      presetConnection('readout-resonator-link', coupler, 1, resonator, 0),
      presetConnection('readout-feedline-link', resonator, 1, feedline, 0),
    ] };
  }
  const left = presetPart('round-pad', 'tunable-left-pad', 260, 300);
  const first = presetPart('compact-jj', 'tunable-junction-a', 455, 275);
  const second = presetPart('compact-jj', 'tunable-junction-b', 545, 325);
  const right = presetPart('round-pad', 'tunable-right-pad', 740, 300);
  const flux = presetPart('flux-line', 'tunable-flux-line', 500, 485);
  const resonator = presetPart('compact-readout', 'tunable-readout', 500, 105);
  return { ...EMPTY_BUILDER_DESIGN, name:'Flux-tunable layout', parts:[left,first,second,right,flux,resonator], connections:[
    presetConnection('tunable-left-a', left, 1, first, 0),
    presetConnection('tunable-a-right', first, 1, right, 0),
    presetConnection('tunable-left-b', left, 2, second, 0),
    presetConnection('tunable-b-right', second, 1, right, 2),
    presetConnection('tunable-flux-link', flux, 0, second, 1),
    presetConnection('tunable-readout-link', resonator, 0, left, 3),
  ] };
}

export function designToSvg(design: ChipBuilderDesign): string {
  const esc = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char] ?? char));
  const shapes = design.parts.map(part => {
    const color = part.shape === 'cutout' ? '#092d3d' : part.role === 'junction' ? '#e0a42c' : '#b8c5ca';
    if (part.shape === 'circle') return `<ellipse cx="0" cy="0" rx="${part.width/2}" ry="${part.height/2}"/>`;
    if (part.shape === 'cross') return `<path d="M${-part.width/6} ${-part.height/2}H${part.width/6}V${-part.height/6}H${part.width/2}V${part.height/6}H${part.width/6}V${part.height/2}H${-part.width/6}V${part.height/6}H${-part.width/2}V${-part.height/6}H${-part.width/6}Z"/>`;
    if (part.shape === 'stepped') return `<path d="M${-part.width/2} ${-part.height/2}H${part.width*.08}V${-part.height*.34}H${part.width*.24}V${-part.height*.18}H${part.width/2}V${part.height*.18}H${part.width*.24}V${part.height*.34}H${part.width*.08}V${part.height/2}H${-part.width/2}Z"/>`;
    if (part.shape === 'meander') return `<path d="M${-part.width/2} ${-part.height/3}H${part.width/3}V0H${-part.width/3}V${part.height/3}H${part.width/2}" fill="none" stroke="${color}" stroke-width="12"/>`;
    return `<rect x="${-part.width/2}" y="${-part.height/2}" width="${part.width}" height="${part.height}" rx="6"/>`;
  }).map((shape, index) => `<g transform="translate(${design.parts[index].x} ${design.parts[index].y}) rotate(${design.parts[index].rotation})" fill="${design.parts[index].shape==='cutout'?'#092d3d':design.parts[index].role==='junction'?'#e0a42c':'#b8c5ca'}" stroke="#e9f2f4">${shape.replace(/ transform="[^"]+"/, '')}<title>${esc(design.parts[index].name)}</title></g>`).join('');
  const connections = design.connections.map(connection => {
    const a = design.parts.find(part => part.id === connection.from.partId), b = design.parts.find(part => part.id === connection.to.partId);
    if (!a || !b) return '';
    const p1 = portPoint(a, connection.from.port), p2 = portPoint(b, connection.to.port);
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#55b9ff" stroke-width="4"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${design.chipWidth} ${design.chipHeight}"><title>${esc(design.name)}</title><rect width="100%" height="100%" rx="20" fill="#0a3547"/>${connections}${shapes}</svg>`;
}
