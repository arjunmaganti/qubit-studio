import type { ParamKey } from './params';

export type PartId = 'junction' | 'capacitor' | 'gate' | 'substrate' | 'ground' | 'board' | 'package';

export interface Part {
  id: PartId;
  name: string;
  role: string;
  /** true = this part carries a model input; false = drawn for context only. */
  modeled: boolean;
  param?: ParamKey;
  color: string;
}

export const PARTS: Part[] = [
  {id:'board',name:'Carrier board',role:'The board and contacts supporting the chip. Visual context only.',modeled:false,color:'#1f3b48'},
  {id:'package',name:'Package & clamps',role:'The mechanical frame and clamps around the device. Visual context only.',modeled:false,color:'#b8955a'},
  {
    id: 'junction',
    name: 'Josephson junction',
    role: 'The one nonlinear element. Its tunnelling strength sets how unevenly the energy levels are spaced.',
    modeled: true,
    param: 'ej_ghz',
    color: '#c8862f',
  },
  {
    id: 'capacitor',
    name: 'Shunt capacitor pads',
    role: 'Two large pads across the junction. Bigger pads mean a smaller charging cost.',
    modeled: true,
    param: 'ec_ghz',
    color: '#9aa4b0',
  },
  {
    id: 'gate',
    name: 'Charge gate line',
    role: 'Applies a static offset charge to the island. Sweeping it shows how sensitive the qubit is to stray charge.',
    modeled: true,
    param: 'ng',
    color: '#7f8a97',
  },
  {
    id: 'ground',
    name: 'Ground plane',
    role: 'Surrounding ground metal. Drawn for context; it is not an input to this model.',
    modeled: false,
    color: '#b4bcc6',
  },
  {
    id: 'substrate',
    name: 'Substrate',
    role: 'The chip the metal sits on. Drawn for context; thickness and material are illustrative only.',
    modeled: false,
    color: '#cfd6de',
  },
];

export const PART_BY_ID: Record<PartId, Part> = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
) as Record<PartId, Part>;

export const MODELED_PARTS = PARTS.filter((p) => p.modeled);
export const ILLUSTRATIVE_PARTS = PARTS.filter((p) => !p.modeled);
