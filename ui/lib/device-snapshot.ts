import { PARAMS, sameParams } from './params.ts';
import type { DeviceParams, DeviceResult } from './types.ts';

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function validDeviceParams(value: unknown): value is DeviceParams {
  if (!record(value)) return false;
  return (Object.keys(PARAMS) as (keyof DeviceParams)[]).every((key) => {
    const n = value[key];
    return finite(n) && n >= PARAMS[key].min && n <= PARAMS[key].max && (key !== 'ncut' || Number.isInteger(n));
  });
}

/** Reject malformed solver payloads before they enter the display/action state. */
export function validDeviceResult(value: unknown): value is DeviceResult {
  if (!validDeviceParams(value)) return false;
  const r = value as unknown as Record<string, unknown>;
  if (!['ratio', 'f01_ghz', 'f12_ghz', 'alpha_mhz', 'anharmonicity_mhz', 'dispersion_upper_khz', 'dispersion_resolution_khz', 'elapsed_ms'].every((key) => finite(r[key]))) return false;
  if ((r.ratio as number) <= 0 || (r.f01_ghz as number) < 0 || (r.f12_ghz as number) < 0 || (r.elapsed_ms as number) < 0) return false;
  if (Math.abs((r.ratio as number) - value.ej_ghz / value.ec_ghz) > 1e-8) return false;
  if (r.dispersion_status === 'resolved') {
    if (!finite(r.dispersion_khz) || r.dispersion_khz < 0) return false;
  } else if (r.dispersion_status !== 'below_reporting_floor' || r.dispersion_khz !== null) return false;
  if ((r.dispersion_upper_khz as number) < 0 || (r.dispersion_resolution_khz as number) <= 0) return false;
  if ((r.dispersion_upper_khz as number) < (r.dispersion_resolution_khz as number) || (finite(r.dispersion_khz) && r.dispersion_khz > (r.dispersion_upper_khz as number))) return false;
  for (const key of ['critical_current_na', 'total_capacitance_ff']) {
    if (r[key] !== undefined && (!finite(r[key]) || r[key] <= 0)) return false;
  }
  if (!['raw_levels_ghz', 'levels_ghz'].every((key) => Array.isArray(r[key]) && r[key].length >= 4 && r[key].length <= 64 && r[key].every(finite))) return false;
  if (!['model', 'model_version'].every((key) => typeof r[key] === 'string' && r[key].length > 0 && r[key].length <= 100)) return false;
  return Array.isArray(r.charge_response) && r.charge_response.length > 0 && r.charge_response.length <= 1001 && r.charge_response.every((p) => record(p) && finite(p.ng) && p.ng >= 0 && p.ng <= 1 && finite(p.f01_ghz) && p.f01_ghz >= 0);
}

export function completedDevice(params: DeviceParams, result: DeviceResult | null, status: string, stale: boolean): result is DeviceResult {
  return status === 'ready' && !stale && result !== null && validDeviceParams(params) && sameParams(params, result);
}
