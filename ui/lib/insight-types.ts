import type { PartId } from './parts.ts';
import type { ComponentMaterials } from './component-materials.ts';
import type { DesignGoals, DeviceParams, DispersionStatus } from './types.ts';

export type InsightTone = 'ok' | 'watch' | 'alert' | 'info';
export type InsightSource = 'local' | 'llm';
export type RegimeId = 'transmon' | 'transitional' | 'charge';

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
  relatedTerms: string[];
}

export interface InsightBundle {
  source: InsightSource;
  headline: string;
  /** Compact HUD line for the 3D view. Symbols stay visible. */
  readout: string;
  cards: InsightCard[];
}

export interface SnapshotOutputs {
  params: DeviceParams;
  model: string;
  f01_ghz: number;
  f12_ghz: number;
  alpha_mhz: number;
  ratio: number;
  dispersion_khz: number | null;
  dispersion_status: DispersionStatus;
  dispersion_upper_khz: number;
  levels_ghz: number[];
  /** Peak |Δf₀₁| across the returned charge sweep, in kHz. */
  charge_shift_peak_khz: number | null;
  model_version: string;
  critical_current_na?: number;
  total_capacitance_ff?: number;
}

export type SnapshotBaseline = SnapshotOutputs;

export interface SnapshotExperiment {
  kind: 'search' | 'stress' | 'tunable' | 'material';
  freshness: 'current' | 'outdated';
  status: 'idle' | 'pending' | 'ready' | 'error';
  model: string;
  scope: string;
  inputs: Record<string, number | string>;
  summary: Record<string, number | string | null>;
}

export interface SnapshotMaterials {
  topMaterial: string;
  baseMaterial: string;
  scope: 'visual selection; material evidence does not alter the electrical solver';
  evidence: Array<{
    id: string;
    kind: 'resonator-loss' | 'device-stack';
    reference: string;
    deposition: string;
    treatment: string;
    geometry: string;
    lowPowerLossMin?: number;
    lowPowerLossMax?: number;
  }>;
}

export interface ChipSnapshot {
  selected_part: PartId | null;
  params: {
    ej_ghz: number;
    ec_ghz: number;
    ng: number;
    ncut: number;
    ratio: number;
  };
  outputs: SnapshotOutputs | null;
  baseline: SnapshotBaseline | null;
  readiness: 'ready' | 'pending' | 'error' | 'unavailable';
  goals?: DesignGoals;
  materials?: SnapshotMaterials;
  /** Appearance-only assignments for the rendered parts; never electrical solver inputs or a fabricated stack. */
  rendered_component_materials?: ComponentMaterials;
  experiments?: SnapshotExperiment[];
  stale: boolean;
  error: string | null;
  view_explode?: number;
}

export interface InsightApiResponse extends InsightBundle {
  llm_configured: boolean;
  llm_error: string | null;
}
