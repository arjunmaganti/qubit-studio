import type { DesignGoals, DeviceParams, SearchCandidate, SearchResult, StressResult, TunableResult, MaterialScenarioResult } from './types.ts';
import { validDeviceParams, validDeviceResult } from './device-snapshot.ts';
import { DEFAULT_MATERIAL_PRIORITY, rankMaterialStacks } from './material-ranking.ts';
import type { SubstratePreference } from './material-ranking.ts';

export type ExperimentKind = 'search' | 'stress' | 'tunable' | 'material';
export type ExperimentStatus = 'idle' | 'pending' | 'ready' | 'error';
export interface ExperimentMaterials { topMaterial: string; baseMaterial: string; topColor: string; baseColor: string }
export interface ExperimentContext { params: DeviceParams; goals: DesignGoals; materials: ExperimentMaterials; baseline?: DeviceParams | null }
export interface ExperimentControls {
  variation: number; flux: number; asymmetry: number; materialPriority: number;
  substratePreference: SubstratePreference; junctionFactor: number; capacitanceFactor: number;
}
export interface ExperimentResults { search: SearchResult; stress: StressResult; tunable: TunableResult; material: MaterialScenarioResult }
export interface ExperimentSnapshot extends ExperimentContext {
  controls: Partial<ExperimentControls>;
  payload: Record<string, number | string>;
}
export interface ExperimentRecord<K extends ExperimentKind> {
  status: ExperimentStatus; result: ExperimentResults[K] | null;
  /** The producing snapshot for result, never overwritten by a new pending request. */
  snapshot: ExperimentSnapshot | null;
  current: boolean; error: string | null;
}
export interface ExperimentEvidence {
  kind: ExperimentKind; status: ExperimentStatus; current: boolean; model: string; scope: string;
  inputs: Record<string, number | string>;
  summary: Record<string, number | string | null>;
}
export interface ExperimentSession {
  controls: ExperimentControls;
  search: ExperimentRecord<'search'>; stress: ExperimentRecord<'stress'>;
  tunable: ExperimentRecord<'tunable'>; material: ExperimentRecord<'material'>;
  evidence: ExperimentEvidence[];
  validationError(kind: ExperimentKind): string | null;
  setControls(patch: Partial<ExperimentControls>): void;
  run(kind: ExperimentKind): Promise<void>;
  getApply(kind: 'search' | 'material'): DeviceParams | null;
  isCurrentSearch(result: SearchResult): boolean;
  chosenCandidate: SearchCandidate | null;
  chosenMaterialId: string | null;
  chooseCandidate(candidate: SearchCandidate): void;
  chooseMaterial(id: string): void;
  getSearchMaterials(): { topMaterial: string; baseMaterial: string } | null;
}

export const DEFAULT_EXPERIMENT_CONTROLS: ExperimentControls = {
  variation: 5, flux: 0.25, asymmetry: 0.1, materialPriority: DEFAULT_MATERIAL_PRIORITY,
  substratePreference: 'any', junctionFactor: 0.9, capacitanceFactor: 1.1,
};
const KINDS: ExperimentKind[] = ['search', 'stress', 'tunable', 'material'];
const ENDPOINTS = { search: 'search', stress: 'stress', tunable: 'evaluate-tunable', material: 'material-scenario' };
const SCOPE = {
  search: 'Exact-frequency ng=0 isolated-transmon search; material ranking is separate measured resonator evidence and a process heuristic.',
  stress: 'Deterministic EJ/EC sensitivity grid, not fabrication yield or a probability model.',
  tunable: 'Separate SQUID transmon model; does not change the main isolated transmon or predict coherence.',
  material: 'User-supplied electrical factors; selected material names/colors do not determine these factors or solver physics.',
};
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const bounded = (x: unknown, lo: number, hi: number) => finite(x) && x >= lo && x <= hi;
const object = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x);
const key = (x: unknown) => JSON.stringify(x);
const copy = <T,>(x: T): T => structuredClone(x);
// A frozen baseline is separate evidence, not a search constraint or applied device.
const decisionKey = (context: ExperimentContext) => key({ ...context, baseline: undefined });

export function numericExperimentInput(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}
export function validExperimentGoals(goals: DesignGoals): boolean {
  return bounded(goals.target_ghz, 3, 8) && bounded(goals.tolerance_ghz, 0.01, 1)
    && bounded(goals.min_anharmonicity_mhz, 0, 2000) && bounded(goals.max_dispersion_khz, 0.01, 100000);
}
export function searchBaselineParams(baseline: DeviceParams | null | undefined): DeviceParams | null {
  return baseline ? { ej_ghz: baseline.ej_ghz, ec_ghz: baseline.ec_ghz, ng: baseline.ng, ncut: baseline.ncut } : null;
}
export function experimentSnapshot(kind: ExperimentKind, context: ExperimentContext, c: ExperimentControls): ExperimentSnapshot {
  const { params, goals, materials } = context;
  let payload: Record<string, number | string>;
  let controls: Partial<ExperimentControls>;
  if (kind === 'search') {
    payload = { target_ghz: goals.target_ghz, max_dispersion_khz: goals.max_dispersion_khz,
      min_anharmonicity_mhz: goals.min_anharmonicity_mhz, points: 201, ncut: params.ncut };
    controls = { materialPriority: c.materialPriority, substratePreference: c.substratePreference };
  } else if (kind === 'stress') {
    payload = { ...params, variation_percent: c.variation }; controls = { variation: c.variation };
  } else if (kind === 'tunable') {
    payload = { ejmax_ghz: params.ej_ghz, ec_ghz: params.ec_ghz, ng: params.ng, ncut: params.ncut,
      flux: c.flux, asymmetry: c.asymmetry }; controls = { flux: c.flux, asymmetry: c.asymmetry };
  } else {
    payload = { ...params, scenario_name: `${materials.topMaterial.trim()} on ${materials.baseMaterial.trim()}`.slice(0, 80),
      junction_critical_current_factor: c.junctionFactor, total_capacitance_factor: c.capacitanceFactor };
    controls = { junctionFactor: c.junctionFactor, capacitanceFactor: c.capacitanceFactor };
  }
  return copy({ params, goals, materials, controls, payload, ...(kind === 'search' && context.baseline ? { baseline: searchBaselineParams(context.baseline) } : {}) });
}
export function validateExperiment(kind: ExperimentKind, context: ExperimentContext, c: ExperimentControls): string | null {
  if (!validDeviceParams(context.params)) return 'Enter finite electrical settings within the supported bounds.';
  if (!validExperimentGoals(context.goals)) return 'Complete the goals with finite values within their supported bounds.';
  if (!Object.values(context.materials).every((v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 100)) return 'Select valid material names and colors.';
  if (kind === 'search' && context.baseline && !validDeviceParams(context.baseline)) return 'The pinned baseline has invalid electrical settings.';
  if (kind === 'search' && (!bounded(c.materialPriority, 0, 100)
    || !['any', 'Si', 'Al₂O₃ (sapphire)'].includes(c.substratePreference))) return 'Choose a valid material-ranking preference.';
  if (kind === 'tunable' && (!bounded(c.flux, 0, 1) || !bounded(c.asymmetry, 0, 1))) return 'Flux and junction asymmetry must be between 0 and 1.';
  if (kind === 'stress') {
    if (!bounded(c.variation, 0.1, 20)) return 'Variation must be between 0.1% and 20%.';
    for (const factor of [1-c.variation/100, 1+c.variation/100]) {
      if (!validDeviceParams({ ...context.params, ej_ghz: context.params.ej_ghz * factor,
        ec_ghz: context.params.ec_ghz * factor })) return 'This variation leaves the supported electrical-parameter bounds.';
    }
  }
  if (kind === 'material') {
    if (!bounded(c.junctionFactor, 0.5, 1.5) || !bounded(c.capacitanceFactor, 0.5, 1.5)) return 'Scenario factors must be between 0.5 and 1.5.';
    if (!validDeviceParams({ ...context.params, ej_ghz: context.params.ej_ghz * c.junctionFactor,
      ec_ghz: context.params.ec_ghz / c.capacitanceFactor })) return 'This scenario leaves the supported electrical-parameter bounds.';
  }
  return null;
}

function metrics(value: unknown): value is Record<string, unknown> {
  if (!object(value)) return false;
  const fields = ['ej_ghz','ec_ghz','ng','ratio','f01_ghz','f12_ghz','alpha_mhz','anharmonicity_mhz','dispersion_upper_khz'];
  return fields.every((name) => finite(value[name]))
    && (value.ej_ghz as number) > 0 && (value.ec_ghz as number) > 0
    && (value.f01_ghz as number) >= 0 && (value.f12_ghz as number) >= 0 && (value.dispersion_upper_khz as number) >= 0
    && bounded(value.ng, 0, 1)
    && Math.abs((value.ratio as number) - (value.ej_ghz as number)/(value.ec_ghz as number)) < 1e-8
    && ['raw_levels_ghz','levels_ghz'].every((name) => Array.isArray(value[name]) && value[name].length === 4 && value[name].every(finite))
    && ((value.dispersion_status === 'resolved' && finite(value.dispersion_khz) && value.dispersion_khz >= 0)
      || (value.dispersion_status === 'below_reporting_floor' && value.dispersion_khz === null));
}
function matchesEcho(value: unknown, payload: Record<string, number | string>): boolean {
  return object(value) && Object.entries(payload).every(([k, v]) => value[k] === v);
}
/** Validate the response shape and producing coordinates; no client-generated spectra. */
export function parseExperimentResult<K extends ExperimentKind>(kind: K, value: unknown, snapshot: ExperimentSnapshot): ExperimentResults[K] {
  const fail = (): never => { throw new Error('The experiment returned inconsistent or invalid results. Retry the calculation.'); };
  if (!object(value)) return fail();
  const p = snapshot.payload;
  if (kind !== 'tunable' && !matchesEcho(value.request, p)) return fail();
  if (kind === 'search') {
    if (value.model !== 'isolated-transmon' || typeof value.model_version !== 'string'
      || !Array.isArray(value.candidates) || !bounded(value.candidates.length, 1, p.points as number)
      || value.evaluated_count !== value.candidates.length || !Number.isInteger(value.feasible_count)
      || typeof value.selection_rule !== 'string' || value.optimality_scope !== 'evaluated grid only') return fail();
    for (const candidate of value.candidates) {
      if (!metrics(candidate) || candidate.ng !== 0 || !object(candidate.margins)
        || !['charge_budget_khz','anharmonicity_floor_mhz','ej_lower_ghz','ej_upper_ghz','ec_lower_ghz','ec_upper_ghz'].every((name) => finite((candidate.margins as Record<string, unknown>)[name]))
        || !Object.values(candidate.margins).every(finite) || !Array.isArray(candidate.violations)
        || !candidate.violations.every((r) => typeof r === 'string') || candidate.feasible !== (candidate.violations.length === 0)) return fail();
    }
    if (snapshot.baseline) {
      const assessment = value.baseline_evaluation;
      if (!object(assessment) || !matchesEcho(assessment.params, snapshot.baseline as unknown as Record<string, number>)
        || !metrics(assessment.assessment) || !matchesEcho(assessment.assessment, snapshot.baseline as unknown as Record<string, number>)
        || !object(assessment.assessment.margins) || !Object.values(assessment.assessment.margins).every(finite)
        || !Array.isArray(assessment.assessment.violations) || !assessment.assessment.violations.every(reason => typeof reason === 'string')
        || assessment.assessment.feasible !== (assessment.assessment.violations.length === 0)) return fail();
    }
    if (value.selection_evidence !== undefined) {
      const evidence = value.selection_evidence;
      if (!object(evidence) || !['higher_a_rejected', 'grid_boundary', 'evaluated_maximum', 'infeasible'].includes(evidence.kind as string)
        || !Number.isInteger(evidence.higher_a_count) || !bounded(evidence.higher_a_count, 0, value.candidates.length)
        || !Array.isArray(evidence.higher_a_rejections)
        || !evidence.higher_a_rejections.every(item => object(item) && typeof item.reason === 'string' && Number.isInteger(item.count) && bounded(item.count, 1, value.evaluated_count as number))
        || ![null, 'lower', 'upper'].includes(evidence.selected_at_ratio_boundary as null | string)) return fail();
    }
    const feasible = value.candidates.filter((candidate) => candidate.feasible);
    if (feasible.length !== value.feasible_count) return fail();
    if (feasible.length === 0) { if (value.status !== 'infeasible' || value.selected !== null) return fail(); }
    else {
      const selected = value.selected;
      if (!metrics(selected) || value.status !== 'feasible' || selected.feasible !== true || selected.ng !== 0
        || !validDeviceParams({ ej_ghz: selected.ej_ghz, ec_ghz: selected.ec_ghz, ng: selected.ng, ncut: p.ncut })
        || Math.abs((selected.f01_ghz as number) - (p.target_ghz as number)) > 1e-9
        || !feasible.some((candidate) => Object.keys(candidate).every((name) => key(candidate[name]) === key(selected[name])))) return fail();
    }
  } else if (kind === 'stress') {
    if (value.status !== 'ok' || value.model !== 'isolated-transmon' || !metrics(value.nominal)
      || !matchesEcho(value.nominal, { ej_ghz: p.ej_ghz, ec_ghz: p.ec_ghz, ng: p.ng })
      || !Array.isArray(value.scenarios) || value.scenarios.length !== 9 || !object(value.ranges)) return fail();
    const factors = [1-(p.variation_percent as number)/100, 1, 1+(p.variation_percent as number)/100];
    const pairs = new Set<string>();
    for (const point of value.scenarios) {
      if (!metrics(point) || !finite(point.ej_factor) || !finite(point.ec_factor) || point.ng !== p.ng
        || !factors.includes(point.ej_factor) || !factors.includes(point.ec_factor)
        || !validDeviceParams({ ej_ghz: point.ej_ghz, ec_ghz: point.ec_ghz, ng: point.ng, ncut: p.ncut })
        || point.ej_ghz !== (p.ej_ghz as number)*point.ej_factor || point.ec_ghz !== (p.ec_ghz as number)*point.ec_factor) return fail();
      pairs.add(`${point.ej_factor}:${point.ec_factor}`);
    }
    if (pairs.size !== 9) return fail();
    for (const name of ['f01_ghz','anharmonicity_mhz','dispersion_upper_khz']) {
      const range = value.ranges[name];
      if (!object(range) || !finite(range.min) || !finite(range.max) || !finite(range.span) || range.min > range.max || range.span < 0) return fail();
      const values = value.scenarios.map((point) => point[name] as number);
      if (range.min !== Math.min(...values) || range.max !== Math.max(...values)
        || Math.abs(range.span-(range.max-range.min)) > 1e-9) return fail();
    }
  } else if (kind === 'tunable') {
    if (value.model !== 'symmetric-asymmetric-squid-transmon' || !matchesEcho(value, p)
      || typeof value.model_version !== 'string' || !Array.isArray(value.flux_response) || value.flux_response.length !== 51) return fail();
    for (const point of [value, ...value.flux_response]) {
      if (!object(point) || !['flux','effective_ej_ghz','f01_ghz','f12_ghz','alpha_mhz','anharmonicity_mhz'].every((name) => finite(point[name]))
        || !bounded(point.flux, 0, 1) || !bounded(point.effective_ej_ghz, 0, (p.ejmax_ghz as number) + 1e-12)
        || (point.f01_ghz as number) < 0 || (point.f12_ghz as number) < 0
        || !Array.isArray(point.levels_ghz) || point.levels_ghz.length !== 4 || !point.levels_ghz.every(finite)) return fail();
    }
  } else {
    if (value.status !== 'ok' || value.scenario_name !== p.scenario_name || !validDeviceResult(value.baseline) || !validDeviceResult(value.modified)
      || !Array.isArray(value.assumptions) || !value.assumptions.every((x) => typeof x === 'string')
      || !object(value.deltas) || !['ej_ghz','ec_ghz','f01_ghz','anharmonicity_mhz','dispersion_upper_khz'].every((name) => finite(value.deltas && (value.deltas as Record<string, unknown>)[name]))) return fail();
    if (!matchesEcho(value.baseline, snapshot.params as unknown as Record<string, number>)
      || !matchesEcho(value.modified, { ...snapshot.params, ej_ghz: snapshot.params.ej_ghz * (p.junction_critical_current_factor as number),
        ec_ghz: snapshot.params.ec_ghz / (p.total_capacitance_factor as number) })) return fail();
  }
  if (kind !== 'search' && typeof value.scope !== 'string') return fail();
  return value as unknown as ExperimentResults[K];
}

type Cell = { status: ExperimentStatus; result: ExperimentResults[ExperimentKind] | null; snapshot: ExperimentSnapshot | null;
  generation: number; completedGeneration: number; error: string | null };
export class ExperimentSessionStore {
  private chosenCandidate: SearchCandidate | null = null;
  private chosenMaterialId: string | null = null;
  private context: ExperimentContext;
  private controls: ExperimentControls = { ...DEFAULT_EXPERIMENT_CONTROLS };
  private cells: Record<ExperimentKind, Cell>;
  private controllers: Partial<Record<ExperimentKind, AbortController>> = {};
  private listeners = new Set<() => void>();
  private revision = 0;
  private active = true;
  private fetcher: typeof fetch;
  constructor(context: ExperimentContext, fetcher: typeof fetch = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
    this.context = copy(context);
    this.cells = Object.fromEntries(KINDS.map((kind) => [kind, { status: 'idle', result: null, snapshot: null,
      generation: 0, completedGeneration: -1, error: null }])) as Record<ExperimentKind, Cell>;
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getRevision = () => this.revision;
  private emit() { this.revision++; this.listeners.forEach((listener) => listener()); }
  private invalidate(kind: ExperimentKind) {
    this.controllers[kind]?.abort(); delete this.controllers[kind];
    const old = this.cells[kind];
    this.cells[kind] = { ...old, generation: old.generation+1, status: old.result ? 'ready' : 'idle', error: null };
  }
  updateContext(context: ExperimentContext) {
    if (key(context) === key(this.context)) return;
    if (decisionKey(context) !== decisionKey(this.context)) for (const kind of KINDS) this.invalidate(kind);
    this.context = copy(context); this.emit();
  }
  setControls = (patch: Partial<ExperimentControls>) => {
    const previous = this.controls;
    this.controls = { ...previous, ...patch };
    for (const kind of KINDS) if (key(experimentSnapshot(kind, this.context, previous)) !== key(experimentSnapshot(kind, this.context, this.controls))) this.invalidate(kind);
    this.emit();
  };
  activate() { if (!this.active) { this.active = true; this.emit(); } }
  dispose() { this.active = false; for (const kind of KINDS) this.invalidate(kind); this.emit(); }
  record<K extends ExperimentKind>(kind: K, context = this.context): ExperimentRecord<K> {
    const cell = this.cells[kind];
    return { status: cell.status, result: cell.result as ExperimentResults[K] | null, snapshot: cell.snapshot,
      current: this.active && cell.status === 'ready' && cell.completedGeneration === cell.generation && cell.snapshot !== null
        && decisionKey(cell.snapshot) === decisionKey(experimentSnapshot(kind, context, this.controls)), error: cell.error };
  }
  async run(kind: ExperimentKind, context = this.context): Promise<void> {
    if (!this.active || key(context) !== key(this.context)) return;
    this.invalidate(kind);
    const cell = this.cells[kind];
    const error = validateExperiment(kind, context, this.controls);
    if (error) { this.cells[kind] = { ...cell, status: 'error', error }; this.emit(); return; }
    const snapshot = experimentSnapshot(kind, context, this.controls);
    const generation = cell.generation;
    const controller = new AbortController(); this.controllers[kind] = controller;
    this.cells[kind] = { ...cell, status: 'pending' }; this.emit();
    try {
      const response = await this.fetcher(`/api/${ENDPOINTS[kind]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...snapshot.payload, ...(snapshot.baseline ? { baseline: snapshot.baseline } : {}) }), signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`The experiment could not be completed (HTTP ${response.status}). Check the inputs and retry.`);
      const result = parseExperimentResult(kind, await response.json(), snapshot);
      if (!this.active || controller.signal.aborted || this.cells[kind].generation !== generation) return;
      if (kind === 'search') { this.chosenCandidate = null; this.chosenMaterialId = null; }
      this.cells[kind] = { status: 'ready', result, snapshot, generation, completedGeneration: generation, error: null }; this.emit();
    } catch (error) {
      if (!this.active || controller.signal.aborted || this.cells[kind].generation !== generation) return;
      this.cells[kind] = { ...this.cells[kind], status: 'error', error: error instanceof Error ? error.message : 'The experiment failed. Retry.' }; this.emit();
    } finally { if (this.controllers[kind] === controller) delete this.controllers[kind]; }
  }
  getApply(kind: 'search' | 'material', context = this.context): DeviceParams | null {
    if (key(context) !== key(this.context)) return null;
    const record = this.record(kind, context);
    if (!record.current || !record.result || !record.snapshot) return null;
    const result = kind === 'search' ? (this.chosenCandidate ?? (record.result as SearchResult).selected) : (record.result as MaterialScenarioResult).modified;
    if (!result) return null;
    const params = { ej_ghz: result.ej_ghz, ec_ghz: result.ec_ghz, ng: result.ng,
      ncut: kind === 'search' ? record.snapshot.params.ncut : (result as MaterialScenarioResult['modified']).ncut };
    return validDeviceParams(params) && (kind !== 'search' || (result as SearchResult['selected'])?.feasible) ? params : null;
  }
  chooseCandidate(candidate: SearchCandidate, context = this.context) {
    const search = this.record('search', context);
    if (key(context) !== key(this.context) || !search.current || !search.result) return;
    const exact = search.result.candidates.find(item => key(item) === key(candidate));
    if (!exact?.feasible || exact.ng !== 0 || Math.abs(exact.f01_ghz - context.goals.target_ghz) > 1e-9) return;
    this.chosenCandidate = copy(exact); this.emit();
  }
  chooseMaterial(id: string, context = this.context) {
    const search = this.record('search', context);
    if (key(context) !== key(this.context) || !search.current || !search.snapshot) return;
    const stacks = rankMaterialStacks(search.snapshot.controls.materialPriority!, search.snapshot.controls.substratePreference!);
    if (!stacks.some(stack => stack.id === id)) return;
    this.chosenMaterialId = id; this.emit();
  }
  view(context = this.context): ExperimentSession {
    const search = this.record('search', context), stress = this.record('stress', context);
    const tunable = this.record('tunable', context), material = this.record('material', context);
    return { controls: copy(this.controls), search, stress, tunable, material,
      isCurrentSearch: result => { const record = this.record('search', context); return record.current && record.result === result && key(context) === key(this.context); },
      chosenCandidate: this.chosenCandidate ?? search.result?.selected ?? null, chosenMaterialId: this.chosenMaterialId,
      chooseCandidate: candidate => this.chooseCandidate(candidate, context), chooseMaterial: id => this.chooseMaterial(id, context),
      validationError: (kind) => validateExperiment(kind, context, this.controls),
      setControls: this.setControls, run: (kind) => this.run(kind, context),
      getApply: (kind) => this.getApply(kind, context),
      getSearchMaterials: () => {
        if (!this.getApply('search', context) || !search.snapshot) return null;
        const stacks = rankMaterialStacks(search.snapshot.controls.materialPriority!, search.snapshot.controls.substratePreference!);
        const stack = stacks.find(item => item.id === this.chosenMaterialId) ?? stacks[0];
        return { topMaterial: stack.material, baseMaterial: stack.substrate };
      },
      evidence: KINDS.flatMap((kind) => {
        const record = this.record(kind, context);
        if (!record.result || !record.snapshot) return [];
        const s = record.snapshot;
        const inputs = Object.fromEntries([
          ...Object.entries(s.params).map(([k,v]) => [`params_${k}`, v]),
          ...Object.entries(s.baseline ?? {}).map(([k,v]) => [`baseline_${k}`, v]),
          ...Object.entries(s.goals).map(([k,v]) => [`goals_${k}`, v]),
          ...Object.entries(s.materials).map(([k,v]) => [`materials_${k}`, v]),
          ...Object.entries(s.controls),
        ]) as Record<string, number | string>;
        let summary: ExperimentEvidence['summary'];
        let model: string;
        if (kind === 'search') {
          const r = record.result as SearchResult; model = r.model;
          summary = { model_version: r.model_version, status: r.status, evaluated_count: r.evaluated_count, feasible_count: r.feasible_count,
            selected_ej_ghz: r.selected?.ej_ghz ?? null, selected_ec_ghz: r.selected?.ec_ghz ?? null,
            chosen_ej_ghz: (this.chosenCandidate ?? r.selected)?.ej_ghz ?? null,
            chosen_ec_ghz: (this.chosenCandidate ?? r.selected)?.ec_ghz ?? null,
            chosen_material_id: this.chosenMaterialId,
            selected_ng: r.selected?.ng ?? null, evaluated_ncut: s.params.ncut,
            selection_evidence_kind: r.selection_evidence?.kind ?? null,
            higher_anharmonicity_rejected_count: r.selection_evidence?.higher_a_count ?? null,
            baseline_assessment_freshness: !r.baseline_evaluation ? null : key(r.baseline_evaluation.params) === key(searchBaselineParams(context.baseline)) ? 'current' : 'outdated',
            f01_ghz: r.selected?.f01_ghz ?? null, anharmonicity_mhz: r.selected?.anharmonicity_mhz ?? null,
            dispersion_upper_khz: r.selected?.dispersion_upper_khz ?? null };
        } else if (kind === 'stress') {
          const r = record.result as StressResult; model = r.model;
          summary = { scenario_count: r.scenarios.length, f01_min_ghz: r.ranges.f01_ghz.min, f01_max_ghz: r.ranges.f01_ghz.max,
            anharmonicity_min_mhz: r.ranges.anharmonicity_mhz.min, dispersion_max_khz: r.ranges.dispersion_upper_khz.max };
        } else if (kind === 'tunable') {
          const r = record.result as TunableResult; model = r.model;
          summary = { model_version: r.model_version, f01_ghz: r.f01_ghz, effective_ej_ghz: r.effective_ej_ghz, anharmonicity_mhz: r.anharmonicity_mhz };
        } else {
          const r = record.result as MaterialScenarioResult; model = r.modified.model;
          summary = { model_version: r.modified.model_version, scenario_name: r.scenario_name, baseline_f01_ghz: r.baseline.f01_ghz, modified_f01_ghz: r.modified.f01_ghz,
            modified_ej_ghz: r.modified.ej_ghz, modified_ec_ghz: r.modified.ec_ghz, delta_f01_ghz: r.deltas.f01_ghz };
        }
        return [{ kind, status: record.status, current: record.current, model, scope: SCOPE[kind], inputs, summary }];
      }),
    };
  }
}
