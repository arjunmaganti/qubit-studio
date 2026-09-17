import type { DeviceResult } from './types';

export const DASH = '—';

export function num(value: number | null | undefined, digits: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return value.toFixed(digits);
}

export function signed(value: number | null | undefined, digits: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return (0).toFixed(digits);
  return `${rounded > 0 ? '+' : '-'}${Math.abs(rounded).toFixed(digits)}`;
}

export interface DispersionDisplay {
  /** Value string, or a status phrase when the backend reported null. */
  text: string;
  resolved: boolean;
  note: string;
}

/**
 * dispersion_khz is null when the computed charge dispersion sits under the
 * reporting floor. That is "too small to report", never zero.
 */
export function dispersionDisplay(result: DeviceResult | null): DispersionDisplay {
  if (!result) return { text: DASH, resolved: false, note: '' };
  if (result.dispersion_khz === null || result.dispersion_status === 'below_reporting_floor') {
    return {
      text: `< ${num(result.dispersion_upper_khz, 3)} kHz`,
      resolved: false,
      note: `Below the ${num(result.dispersion_resolution_khz, 3)} kHz reporting floor — not zero, just unresolved.`,
    };
  }
  return {
    text: `${num(result.dispersion_khz, 3)} kHz`,
    resolved: true,
    note: '',
  };
}

export type DeltaTone = 'up' | 'down' | 'flat';

export interface DeltaDisplay {
  text: string;
  tone: DeltaTone;
}

/** Difference against a pinned baseline. Returns null when either side is unavailable. */
export function delta(
  current: number | null | undefined,
  baseline: number | null | undefined,
  digits: number,
  unit: string,
): DeltaDisplay | null {
  if (current === null || current === undefined || !Number.isFinite(current)) return null;
  if (baseline === null || baseline === undefined || !Number.isFinite(baseline)) return null;
  const diff = current - baseline;
  const threshold = Math.pow(10, -digits) / 2;
  if (Math.abs(diff) < threshold) return { text: `no change vs baseline`, tone: 'flat' };
  const sign = diff > 0 ? '+' : '-';
  return {
    text: `${sign}${Math.abs(diff).toFixed(digits)} ${unit} vs baseline`.trim(),
    tone: diff > 0 ? 'up' : 'down',
  };
}

/** Compact one-line description of the parameters a displayed result came from. */
export function paramSummary(result: Pick<DeviceResult, 'ej_ghz' | 'ec_ghz' | 'ng' | 'ncut'> | null): string {
  if (!result) return DASH;
  return `$E_J$ ${num(result.ej_ghz, 2)} GHz · $E_C$ ${num(result.ec_ghz, 3)} GHz · $n_g$ ${num(result.ng, 3)} · $n_{\\mathrm{cut}}$ ${result.ncut}`;
}
