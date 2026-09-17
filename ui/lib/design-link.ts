import { MATERIAL_CATALOG } from './material-records.ts';
import { clampParam } from './params.ts';
import type { DesignGoals, DeviceParams } from './types.ts';
import type { ComponentMaterials } from './component-materials.ts';
import { parseComponentMaterials } from './component-material-selection.ts';

export interface ShareableDesign {
  params: DeviceParams;
  goals: DesignGoals;
  topMaterial: string;
  baseMaterial: string;
  componentMaterials?: ComponentMaterials;
}

const GOAL_BOUNDS: Record<keyof DesignGoals, [number, number]> = {
  target_ghz: [3, 8],
  tolerance_ghz: [0.01, 1],
  min_anharmonicity_mhz: [0, 2000],
  max_dispersion_khz: [0.01, 100000],
};

function finite(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boundedGoal(key: keyof DesignGoals, value: string | null): number | null {
  const parsed = finite(value);
  if (parsed === null) return null;
  const [min, max] = GOAL_BOUNDS[key];
  return Math.min(max, Math.max(min, parsed));
}

export function createDesignShareUrl(design: ShareableDesign, pageUrl: string): string {
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set('design', '1');
  url.searchParams.set('ej', String(design.params.ej_ghz));
  url.searchParams.set('ec', String(design.params.ec_ghz));
  url.searchParams.set('ng', String(design.params.ng));
  url.searchParams.set('ncut', String(design.params.ncut));
  url.searchParams.set('target', String(design.goals.target_ghz));
  url.searchParams.set('tolerance', String(design.goals.tolerance_ghz));
  url.searchParams.set('separation', String(design.goals.min_anharmonicity_mhz));
  url.searchParams.set('charge', String(design.goals.max_dispersion_khz));
  url.searchParams.set('top', design.topMaterial);
  url.searchParams.set('base', design.baseMaterial);
  if (design.componentMaterials) url.searchParams.set('component_materials', JSON.stringify(design.componentMaterials));
  return url.toString();
}

export function parseDesignShareUrl(pageUrl: string): ShareableDesign | null {
  const url = new URL(pageUrl);
  if (url.searchParams.get('design') !== '1') return null;
  const ej = finite(url.searchParams.get('ej'));
  const ec = finite(url.searchParams.get('ec'));
  const ng = finite(url.searchParams.get('ng'));
  const ncut = finite(url.searchParams.get('ncut'));
  const target = boundedGoal('target_ghz', url.searchParams.get('target'));
  const tolerance = boundedGoal('tolerance_ghz', url.searchParams.get('tolerance'));
  const separation = boundedGoal('min_anharmonicity_mhz', url.searchParams.get('separation'));
  const charge = boundedGoal('max_dispersion_khz', url.searchParams.get('charge'));
  const topMaterial = url.searchParams.get('top');
  const baseMaterial = url.searchParams.get('base');

  if ([ej, ec, ng, ncut, target, tolerance, separation, charge].some((value) => value === null)) return null;
  if (!topMaterial || !baseMaterial) return null;
  if (!MATERIAL_CATALOG.includes(topMaterial as (typeof MATERIAL_CATALOG)[number])) return null;
  if (!MATERIAL_CATALOG.includes(baseMaterial as (typeof MATERIAL_CATALOG)[number])) return null;
  const rawComponents = url.searchParams.get('component_materials');
  let componentMaterials: ComponentMaterials | undefined;
  if (rawComponents !== null) {
    if (rawComponents.length > 512) return null;
    try {
      const parsed = parseComponentMaterials(JSON.parse(rawComponents));
      if (!parsed) return null;
      componentMaterials = parsed;
    } catch { return null; }
  }

  return {
    params: {
      ej_ghz: clampParam('ej_ghz', ej!),
      ec_ghz: clampParam('ec_ghz', ec!),
      ng: clampParam('ng', ng!),
      ncut: clampParam('ncut', ncut!),
    },
    goals: {
      target_ghz: target!,
      tolerance_ghz: tolerance!,
      min_anharmonicity_mhz: separation!,
      max_dispersion_khz: charge!,
    },
    topMaterial,
    baseMaterial,
    ...(componentMaterials ? { componentMaterials } : {}),
  };
}
