import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DASH, delta, dispersionDisplay, num, paramSummary, signed } from './format.ts';
import type { DeviceResult } from './types.ts';

function makeResult(over: Partial<DeviceResult> = {}): DeviceResult {
  return {
    ej_ghz: 15,
    ec_ghz: 0.3,
    ng: 0,
    ncut: 30,
    ratio: 50,
    raw_levels_ghz: [-12, -6.4, -1, 4],
    levels_ghz: [0, 5.68, 11.02, 16],
    f01_ghz: 5.682575677295095,
    f12_ghz: 5.337808768527467,
    alpha_mhz: -344.7669087676273,
    anharmonicity_mhz: 344.7669087676273,
    dispersion_khz: 11.889089391203811,
    dispersion_status: 'resolved',
    dispersion_upper_khz: 11.889089391203811,
    dispersion_resolution_khz: 0.001,
    model: 'isolated-transmon',
    model_version: 'v1',
    charge_response: [{ ng: 0, f01_ghz: 5.68 }],
    elapsed_ms: 22,
    ...over,
  };
}

describe('num', () => {
  it('should format a finite value to fixed digits', () => {
    assert.equal(num(5.682575, 3), '5.683');
  });

  it('should return a dash when the value is null', () => {
    assert.equal(num(null, 3), DASH);
  });

  it('should return a dash when the value is not finite', () => {
    assert.equal(num(Number.NaN, 3), DASH);
    assert.equal(num(Number.POSITIVE_INFINITY, 3), DASH);
  });
});

describe('signed', () => {
  it('should prefix a positive value with a plus', () => {
    assert.equal(signed(344.76, 1), '+344.8');
  });

  it('should prefix a negative value with a minus', () => {
    assert.equal(signed(-344.76, 1), '-344.8');
  });

  it('should render a value that rounds to zero without a sign', () => {
    assert.equal(signed(0.0001, 2), '0.00');
  });
});

describe('dispersionDisplay', () => {
  it('should show the number when the backend resolved it', () => {
    const d = dispersionDisplay(makeResult());
    assert.equal(d.resolved, true);
    assert.equal(d.text, '11.889 kHz');
    assert.equal(d.note, '');
  });

  it('should never show zero when dispersion is below the reporting floor', () => {
    const d = dispersionDisplay(
      makeResult({
        dispersion_khz: null,
        dispersion_status: 'below_reporting_floor',
        dispersion_upper_khz: 0.001,
      }),
    );
    assert.equal(d.resolved, false);
    assert.equal(d.text, '< 0.001 kHz');
    assert.match(d.note, /not zero/);
    assert.doesNotMatch(d.text, /^0/);
  });

  it('should return a dash when there is no result', () => {
    assert.equal(dispersionDisplay(null).text, DASH);
  });
});

describe('delta', () => {
  it('should report a positive difference against the baseline', () => {
    assert.deepEqual(delta(5.9, 5.68, 3, 'GHz'), { text: '+0.220 GHz vs baseline', tone: 'up' });
  });

  it('should report a negative difference against the baseline', () => {
    assert.equal(delta(5.4, 5.68, 3, 'GHz')?.tone, 'down');
  });

  it('should report no change when below display resolution', () => {
    assert.equal(delta(5.6800001, 5.68, 3, 'GHz')?.tone, 'flat');
  });

  it('should return null when the baseline is missing', () => {
    assert.equal(delta(5.68, null, 3, 'GHz'), null);
  });

  it('should return null when the current value is null (unresolved dispersion)', () => {
    assert.equal(delta(null, 11.9, 3, 'kHz'), null);
  });
});

describe('paramSummary', () => {
  it('should describe the parameters a result came from', () => {
    assert.equal(paramSummary(makeResult()), '$E_J$ 15.00 GHz · $E_C$ 0.300 GHz · $n_g$ 0.000 · $n_{\\mathrm{cut}}$ 30');
  });

  it('should return a dash when there is no result', () => {
    assert.equal(paramSummary(null), DASH);
  });
});
