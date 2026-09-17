import { PART_BY_ID, type PartId } from './parts.ts';
import { MATERIAL_RECORDS } from './material-records.ts';
import type { ComponentMaterials } from './component-materials.ts';
import { parseComponentMaterials } from './component-material-selection.ts';
import type { DesignGoals, DeviceParams, DeviceResult } from './types.ts';
import type { ChipSnapshot, SnapshotExperiment, SnapshotMaterials, SnapshotOutputs } from './insight-types.ts';

const PART_IDS = new Set<PartId>(['junction', 'capacitor', 'gate', 'substrate', 'ground', 'board', 'package']);
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const numberIn = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const shortText = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

function deviceParams(raw: unknown): DeviceParams | null {
  if (!isObject(raw) || !numberIn(raw.ej_ghz, .01, 50) || !numberIn(raw.ec_ghz, .01, 2) ||
    !numberIn(raw.ng, 0, 1) || !numberIn(raw.ncut, 20, 60) || !Number.isInteger(raw.ncut)) return null;
  return { ej_ghz: raw.ej_ghz, ec_ghz: raw.ec_ghz, ng: raw.ng, ncut: raw.ncut };
}

function sameParams(a: DeviceParams, b: DeviceParams): boolean {
  return a.ej_ghz === b.ej_ghz && a.ec_ghz === b.ec_ghz && a.ng === b.ng && a.ncut === b.ncut;
}

function outputsFromResult(result: DeviceResult): SnapshotOutputs {
  const points = result.charge_response;
  const reference = points.length ? points.reduce((a, b) => b.ng < a.ng ? b : a).f01_ghz : null;
  return {
    params: { ej_ghz: result.ej_ghz, ec_ghz: result.ec_ghz, ng: result.ng, ncut: result.ncut },
    model: result.model,
    f01_ghz: result.f01_ghz, f12_ghz: result.f12_ghz, alpha_mhz: result.alpha_mhz, ratio: result.ratio,
    dispersion_khz: result.dispersion_khz, dispersion_status: result.dispersion_status,
    dispersion_upper_khz: result.dispersion_upper_khz,
    levels_ghz: result.levels_ghz.slice(0, 4),
    charge_shift_peak_khz: reference === null ? null : Math.max(...points.map(p => Math.abs((p.f01_ghz - reference) * 1e6))),
    model_version: result.model_version,
    ...(result.critical_current_na === undefined ? {} : { critical_current_na: result.critical_current_na }),
    ...(result.total_capacitance_ff === undefined ? {} : { total_capacitance_ff: result.total_capacitance_ff }),
  };
}

/** Resolve existing material evidence locally and on the server; selection is never a solver input. */
export function snapshotMaterials(selection: { topMaterial: string; baseMaterial: string }): SnapshotMaterials {
  return {
    topMaterial: selection.topMaterial, baseMaterial: selection.baseMaterial,
    scope: 'visual selection; material evidence does not alter the electrical solver',
    evidence: MATERIAL_RECORDS.filter(record => record.material === selection.topMaterial && record.substrate === selection.baseMaterial)
      .slice(0, 4).map(record => ({
        id: record.id, kind: record.kind, reference: record.reference, deposition: record.deposition,
        treatment: record.treatment, geometry: record.geometry,
        ...(record.kind === 'resonator-loss' ? { lowPowerLossMin: record.lowPowerLossMin, lowPowerLossMax: record.lowPowerLossMax } : {}),
      })),
  };
}

/** Only a completed result for these exact electrical parameters can become current LLM context. */
export function buildChipSnapshot(input: {
  params: DeviceParams; result: DeviceResult | null; baseline: DeviceResult | null;
  selected: PartId | null; stale: boolean; error: string | null;
  explode?: number;
  goals?: DesignGoals; materials?: { topMaterial: string; baseMaterial: string };
  componentMaterials?: ComponentMaterials;
  experiments?: Array<Omit<SnapshotExperiment, 'freshness'> & { current: boolean }>;
}): ChipSnapshot {
  const matching = input.result !== null && sameParams(input.params, input.result);
  const ready = matching && !input.stale && !input.error;
  return {
    selected_part: input.selected,
    ...(input.explode === undefined ? {} : { view_explode: input.explode }),
    params: { ej_ghz: input.params.ej_ghz, ec_ghz: input.params.ec_ghz, ng: input.params.ng,
      ncut: input.params.ncut, ratio: input.params.ej_ghz / input.params.ec_ghz },
    outputs: ready ? outputsFromResult(input.result!) : null,
    baseline: input.baseline ? outputsFromResult(input.baseline) : null,
    readiness: input.error ? 'error' : ready ? 'ready' : input.stale || !matching ? 'pending' : 'unavailable',
    stale: input.stale || (!!input.result && !matching),
    error: input.error ? 'The current solver calculation failed.' : null,
    ...(input.goals ? { goals: { ...input.goals } } : {}),
    ...(input.materials ? { materials: snapshotMaterials(input.materials) } : {}),
    ...(input.componentMaterials ? { rendered_component_materials: { ...input.componentMaterials } } : {}),
    ...(input.experiments ? { experiments: input.experiments.map(({ current, ...evidence }) => ({ ...evidence, freshness: current ? 'current' as const : 'outdated' as const })) } : {}),
  };
}

function parseOutputs(raw: unknown): SnapshotOutputs | null {
  if (!isObject(raw)) return null;
  const params = deviceParams(raw.params);
  if (!params || !shortText(raw.model, 80) || !shortText(raw.model_version, 40) ||
    !numberIn(raw.f01_ghz, 0, 1000) || !numberIn(raw.f12_ghz, 0, 1000) ||
    !numberIn(raw.alpha_mhz, -1e6, 1e6) || !numberIn(raw.ratio, .005, 5000) ||
    Math.abs(raw.ratio - params.ej_ghz / params.ec_ghz) > 1e-6 * Math.max(1, raw.ratio) ||
    !numberIn(raw.dispersion_upper_khz, 0, 1e9) ||
    !Array.isArray(raw.levels_ghz) || raw.levels_ghz.length < 2 || raw.levels_ghz.length > 4 ||
    !raw.levels_ghz.every(n => numberIn(n, -1e6, 1e6)) ||
    !(raw.charge_shift_peak_khz === null || numberIn(raw.charge_shift_peak_khz, 0, 1e9))) return null;
  if (raw.dispersion_status === 'resolved') {
    if (!numberIn(raw.dispersion_khz, 0, 1e9) || raw.dispersion_khz > raw.dispersion_upper_khz) return null;
  } else if (raw.dispersion_status !== 'below_reporting_floor' || raw.dispersion_khz !== null || raw.dispersion_upper_khz <= 0) return null;
  for (const key of ['critical_current_na', 'total_capacitance_ff'] as const) {
    if (raw[key] !== undefined && !numberIn(raw[key], Number.MIN_VALUE, 1e9)) return null;
  }
  return {
    params, model: raw.model, model_version: raw.model_version,
    f01_ghz: raw.f01_ghz, f12_ghz: raw.f12_ghz, alpha_mhz: raw.alpha_mhz, ratio: raw.ratio,
    dispersion_khz: raw.dispersion_khz as number | null, dispersion_status: raw.dispersion_status,
    dispersion_upper_khz: raw.dispersion_upper_khz, levels_ghz: [...raw.levels_ghz] as number[],
    charge_shift_peak_khz: raw.charge_shift_peak_khz,
    ...(raw.critical_current_na === undefined ? {} : { critical_current_na: raw.critical_current_na as number }),
    ...(raw.total_capacitance_ff === undefined ? {} : { total_capacitance_ff: raw.total_capacitance_ff as number }),
  };
}

function parseGoals(raw: unknown): DesignGoals | null {
  if (!isObject(raw) || !numberIn(raw.target_ghz, 3, 8) || !numberIn(raw.tolerance_ghz, .01, 1) ||
    !numberIn(raw.min_anharmonicity_mhz, 0, 2000) || !numberIn(raw.max_dispersion_khz, .01, 100000)) return null;
  return { target_ghz: raw.target_ghz, tolerance_ghz: raw.tolerance_ghz, min_anharmonicity_mhz: raw.min_anharmonicity_mhz, max_dispersion_khz: raw.max_dispersion_khz };
}

function parseEvidenceMap(raw: unknown, nullable: boolean): Record<string, number | string | null> | null {
  if (!isObject(raw) || Object.keys(raw).length > 24) return null;
  const parsed: Record<string, number | string | null> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/i.test(key) ||
      !(numberIn(value, -1e12, 1e12) || shortText(value, 240) || (nullable && value === null))) return null;
    parsed[key] = value as number | string | null;
  }
  return parsed;
}

export function parseChipSnapshot(body: unknown): { ok: true; snapshot: ChipSnapshot } | { ok: false; error: string } {
  const invalid = (error: string) => ({ ok: false as const, error });
  if (!isObject(body)) return invalid('Snapshot must be a JSON object.');
  const params = deviceParams(body.params);
  if (!params || !isObject(body.params) || !numberIn(body.params.ratio, .005, 5000) ||
    Math.abs(body.params.ratio - params.ej_ghz / params.ec_ghz) > 1e-6 * Math.max(1, body.params.ratio)) return invalid('Snapshot electrical parameters are invalid or outside supported bounds.');
  if (body.selected_part !== null && !(typeof body.selected_part === 'string' && PART_IDS.has(body.selected_part as PartId))) return invalid('Snapshot selected part is invalid.');
  if (typeof body.stale !== 'boolean' || !(body.error === null || shortText(body.error, 240)) ||
    !['ready', 'pending', 'error', 'unavailable'].includes(body.readiness as string)) return invalid('Snapshot readiness is invalid.');
  const outputs = body.outputs === null ? null : parseOutputs(body.outputs);
  if (body.outputs !== null && !outputs) return invalid('Snapshot outputs contain invalid or unbounded values.');
  const baseline = body.baseline === null ? null : parseOutputs(body.baseline);
  if (body.baseline !== null && !baseline) return invalid('Snapshot baseline must contain its frozen parameters and valid outputs.');
  if (body.readiness === 'ready' && (!outputs || body.stale || body.error || !sameParams(params, outputs.params))) return invalid('Snapshot is not a completed matching calculation.');
  if (body.readiness !== 'ready' && outputs) return invalid('Pending or failed parameters cannot carry current outputs.');
  const goals = body.goals === undefined ? undefined : parseGoals(body.goals);
  if (goals === null) return invalid('Snapshot design goals are invalid.');
  let materials: SnapshotMaterials | undefined;
  if (body.materials !== undefined) {
    if (!isObject(body.materials) || !shortText(body.materials.topMaterial, 80) || !shortText(body.materials.baseMaterial, 80)) return invalid('Snapshot material selection is invalid.');
    materials = snapshotMaterials({ topMaterial: body.materials.topMaterial, baseMaterial: body.materials.baseMaterial });
  }
  const componentMaterials = body.rendered_component_materials === undefined
    ? undefined : parseComponentMaterials(body.rendered_component_materials);
  if (componentMaterials === null) return invalid('Snapshot rendered component materials must assign a known appearance to all seven parts.');
  if (body.view_explode !== undefined && !numberIn(body.view_explode, 0, 1)) return invalid('Snapshot view context is invalid.');
  let experiments: SnapshotExperiment[] | undefined;
  if (body.experiments !== undefined) {
    if (!Array.isArray(body.experiments) || body.experiments.length > 4) return invalid('Snapshot supports at most four completed experiments.');
    experiments = [];
    const kinds = new Set<string>();
    for (const raw of body.experiments) {
      if (!isObject(raw) || !['search', 'stress', 'tunable', 'material'].includes(raw.kind as string) ||
        !['current', 'outdated'].includes(raw.freshness as string) || !shortText(raw.model, 80) || !shortText(raw.scope, 240) ||
        !['idle', 'pending', 'ready', 'error'].includes(raw.status as string) ||
        (raw.freshness === 'current' && raw.status !== 'ready') || kinds.has(raw.kind as string)) return invalid('Snapshot experiment identity is invalid.');
      const inputs = parseEvidenceMap(raw.inputs, false);
      const summary = parseEvidenceMap(raw.summary, true);
      if (!inputs || !summary) return invalid('Snapshot experiment evidence is invalid or too large.');
      kinds.add(raw.kind as string);
      experiments.push({ kind: raw.kind as SnapshotExperiment['kind'], freshness: raw.freshness as SnapshotExperiment['freshness'], status: raw.status as SnapshotExperiment['status'], model: raw.model, scope: raw.scope, inputs: inputs as Record<string, number | string>, summary });
    }
  }
  return { ok: true, snapshot: {
    selected_part: body.selected_part as PartId | null, params: { ...params, ratio: body.params.ratio }, outputs, baseline,
    readiness: body.readiness as ChipSnapshot['readiness'], stale: body.stale,
    error: body.error ? 'The current solver calculation failed.' : null,
    ...(body.view_explode === undefined ? {} : { view_explode: body.view_explode as number }), ...(goals ? { goals } : {}), ...(materials ? { materials } : {}), ...(experiments ? { experiments } : {}),
    ...(componentMaterials ? { rendered_component_materials: componentMaterials } : {}),
  } };
}

export function selectedPartName(id: PartId | null): string | null {
  return id ? PART_BY_ID[id].name : null;
}
