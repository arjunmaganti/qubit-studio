import { completedDevice } from './device-snapshot.ts';
import type { DesignGoals, DeviceParams, DeviceResult } from './types.ts';
import type { ExperimentEvidence } from './experiment-session.ts';
import { validExperimentGoals } from './experiment-session.ts';
import type { ComponentMaterials } from './component-materials.ts';

interface ReportInput {
  params: DeviceParams;
  result: DeviceResult | null;
  status: string;
  stale: boolean;
  goals: DesignGoals;
  materials: { topMaterial: string; baseMaterial: string };
  componentMaterials?: ComponentMaterials;
  baseline: DeviceResult | null;
  experiments: ExperimentEvidence[];
}

/** A report is one completed electrical snapshot; visual materials are separate context. */
export function buildExportReport(input: ReportInput, exportedAt = new Date().toISOString()) {
  if (!completedDevice(input.params, input.result, input.status, input.stale)) return null;
  if (!validExperimentGoals(input.goals)) return null;
  return {
    exported_at: exportedAt,
    application: 'Qubit Studio',
    schema_version: 1,
    parameters: { ej_ghz: input.result.ej_ghz, ec_ghz: input.result.ec_ghz, ng: input.result.ng, ncut: input.result.ncut },
    design_goals: { ...input.goals },
    goal_scope: 'Tolerance assesses the current device. Search locks frequency to the target at ng=0.',
    result: input.result,
    selected_materials: { top_material: input.materials.topMaterial, base_material: input.materials.baseMaterial, scope: 'Film/substrate sensitivity and literature context; not electrical solver inputs. Per-component appearance assignments are recorded separately.' },
    rendered_component_materials: input.componentMaterials ? { assignments: { ...input.componentMaterials }, scope: 'Per-component optical appearance approximations; independent of solver inputs and literature measurements.' } : undefined,
    pinned_baseline: input.baseline,
    experiments: input.experiments,
    disclaimer: 'Simplified isolated-transmon calculation; not a fabricated-device prediction. Experiment model scopes and producing inputs are recorded separately.',
  };
}
