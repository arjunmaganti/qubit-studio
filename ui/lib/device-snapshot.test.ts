import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { completedDevice, validDeviceParams, validDeviceResult } from './device-snapshot.ts';
import { buildExportReport } from './export-report.ts';
import type { DeviceResult } from './types.ts';

// Synthetic contract fixture: these values test state handling, not solver accuracy.
const result: DeviceResult = {
  ej_ghz: 15, ec_ghz: .3, ng: .3, ncut: 40, ratio: 50,
  raw_levels_ghz: [-10, -5, -.3, 4.1], levels_ghz: [0, 5, 9.7, 14.1],
  f01_ghz: 5, f12_ghz: 4.7, alpha_mhz: -300, anharmonicity_mhz: 300,
  dispersion_khz: .1, dispersion_status: 'resolved', dispersion_upper_khz: .1,
  dispersion_resolution_khz: .001, model: 'isolated-transmon', model_version: 'v1',
  charge_response: [{ ng: 0, f01_ghz: 5 }, { ng: .5, f01_ghz: 4.9999999 }], elapsed_ms: 1,
};
const input = {
  params: { ej_ghz: 15, ec_ghz: .3, ng: .3, ncut: 40 }, result,
  status: 'ready', stale: false,
  goals: { target_ghz: 5, tolerance_ghz: .25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 },
  materials: { topMaterial: 'Al', baseMaterial: 'Si' }, baseline: { ...result, ej_ghz: 16 }, experiments: [],
};

describe('completed electrical snapshots', () => {
  it('rejects nonfinite, out-of-domain and fractional solver inputs', () => {
    for (const patch of [{ ng: NaN }, { ej_ghz: Infinity }, { ec_ghz: 0 }, { ng: 2 }, { ncut: 30.5 }, { ncut: 61 }]) {
      assert.equal(validDeviceParams({ ...input.params, ...patch }), false);
    }
    assert.equal(validDeviceParams(input.params), true);
  });
  it('rejects incomplete, malformed, and inconsistent result payloads', () => {
    assert.equal(validDeviceResult(result), true);
    for (const patch of [{ levels_ghz: [] }, { f01_ghz: null }, { f01_ghz: -10 }, { f12_ghz: -1 }, { ratio: 51 }, { dispersion_khz: null }, { dispersion_upper_khz: .01 }, { elapsed_ms: -1 }, { critical_current_na: Infinity }, { charge_response: [{ ng: NaN, f01_ghz: 5 }] }]) {
      assert.equal(validDeviceResult({ ...result, ...patch }), false);
    }
    assert.equal(validDeviceResult({ ...result, dispersion_khz: null, dispersion_status: 'below_reporting_floor' }), true);
  });
  it('requires both exact identity and completed state for actions', () => {
    assert.equal(completedDevice(input.params, result, 'ready', false), true);
    for (const key of ['ej_ghz', 'ec_ghz', 'ng', 'ncut'] as const) {
      assert.equal(completedDevice({ ...input.params, [key]: input.params[key] + .01 }, result, 'ready', false), false);
    }
    for (const status of ['idle', 'loading', 'error']) assert.equal(completedDevice(input.params, result, status, false), false);
    assert.equal(completedDevice(input.params, result, 'ready', true), false);
  });
});

describe('report provenance', () => {
  it('refuses pending, mismatched and invalid-goal exports', () => {
    assert.equal(buildExportReport({ ...input, status: 'loading' }), null);
    assert.equal(buildExportReport({ ...input, stale: true }), null);
    assert.equal(buildExportReport({ ...input, params: { ...input.params, ng: 0 } }), null);
    for (const target_ghz of [NaN, 0, 9]) assert.equal(buildExportReport({ ...input, goals: { ...input.goals, target_ghz } }), null);
  });
  it('exports one completed identity with separate materials, baseline and outdated evidence', () => {
    const report = buildExportReport({ ...input, experiments: [{ kind: 'stress', status: 'ready', current: false, model: 'isolated-transmon', scope: 'Deterministic sensitivity grid', inputs: { params_ej_ghz: 16 }, summary: { f01_span_ghz: .2 } }] }, '2026-09-12T00:00:00Z');
    assert.ok(report);
    assert.deepEqual(report.parameters, input.params);
    assert.equal(report.result, result);
    assert.equal(report.pinned_baseline?.ej_ghz, 16);
    assert.equal(report.selected_materials.top_material, 'Al');
    assert.match(report.selected_materials.scope, /not electrical solver inputs/);
    assert.equal(report.experiments[0].current, false);
    assert.equal(report.experiments[0].inputs.params_ej_ghz, 16);
  });
  it('records independent component materials without changing the electrical snapshot', () => {
    const componentMaterials = { junction: 'Al', capacitor: 'Ta', gate: 'Nb', ground: 'Al', substrate: 'sapphire', board: 'laminate', package: 'Cu' };
    const report = buildExportReport({ ...input, componentMaterials });
    assert.ok(report);
    assert.deepEqual(report.parameters, input.params);
    assert.equal(report.result, result);
    assert.deepEqual(report.rendered_component_materials?.assignments, componentMaterials);
    componentMaterials.package = 'Au';
    assert.equal(report.rendered_component_materials?.assignments.package, 'Cu');
  });
});
