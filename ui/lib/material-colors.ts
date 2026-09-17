import type { PartId } from './parts';

const MATERIAL_COLORS: Record<string, string> = {
  Al: '#c5c9ce',
  'Al₂O₃ (sapphire)': '#476f9e',
  'Al₂O₃': '#476f9e',
  'AlOₓ': '#9fc0dc',
  'a-Ge': '#646974',
  'a-Si:H': '#566776',
  Si: '#4a4b50',
  Pb: '#858b92',
  In: '#a8b6c7',
  InAs: '#536b78',
  InAsSb: '#55505f',
  GaSb: '#805d7f',
  TiN: '#aa8530',
  Nb: '#a7adb4',
  NbN: '#505860',
  NbTiN: '#535b63',
  'NbN/TiN': '#7b704d',
  Ta: '#747d88',
  Re: '#bdc0c4',
  'SiO₂': '#b7d3df',
  'SiNₓ': '#9eb3b8',
  'HfO₂': '#d0b987',
  BN: '#e2dfd0',
  'B₄C': '#34383d',
  'LaAlO₃': '#cda5a1',
  'MgAl₂O₄': '#b5c9c2',
  'barrier layer': '#c49b6c',
  'buffer layer': '#8ea68e',
};

/** Stable fallback means the same custom material always receives the same color. */
export function materialColor(name: string): string {
  const normalized = name.trim();
  if (MATERIAL_COLORS[normalized]) return MATERIAL_COLORS[normalized];
  let hash = 0;
  for (const character of normalized || 'custom') hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  const saturation = 28 + (Math.abs(hash >> 8) % 24);
  const lightness = 45 + (Math.abs(hash >> 16) % 18);
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
      : hue < 180 ? [0, chroma, x]
        : hue < 240 ? [0, x, chroma]
          : hue < 300 ? [x, 0, chroma]
            : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export interface MaterialAppearance {
  topMaterial: string;
  baseMaterial: string;
  topColor: string;
  baseColor: string;
}

export function materialPartColors(appearance: MaterialAppearance): Partial<Record<PartId, string>> {
  return {
    junction: appearance.topColor,
    capacitor: appearance.topColor,
    gate: appearance.topColor,
    ground: appearance.topColor,
    substrate: appearance.baseColor,
  };
}
