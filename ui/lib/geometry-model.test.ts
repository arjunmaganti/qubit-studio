import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  capacitorAreaFromEc,
  DEFAULT_GEOMETRY_ASSUMPTIONS,
  ecFromCapacitorArea,
  ejFromJunctionArea,
  junctionAreaFromEj,
} from './geometry-model.ts';

describe('illustrative geometry conversions', () => {
  it('round-trips EJ through junction area', () => {
    const density = DEFAULT_GEOMETRY_ASSUMPTIONS.criticalCurrentDensityAcm2;
    const area = junctionAreaFromEj(15, density);
    assert.ok(Math.abs(ejFromJunctionArea(area, density) - 15) < 1e-10);
  });

  it('round-trips EC through capacitor area', () => {
    const density = DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2;
    const area = capacitorAreaFromEc(0.3, density);
    assert.ok(Math.abs(ecFromCapacitorArea(area, density) - 0.3) < 1e-10);
  });

  it('keeps capacitor areas aligned with the full valid EC range', () => {
    const density = DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2;
    for (const ecGhz of [0.01, 0.3, 2]) {
      const area = capacitorAreaFromEc(ecGhz, density);
      assert.ok(Number.isFinite(area) && area > 0);
      assert.ok(Math.abs(ecFromCapacitorArea(area, density) - ecGhz) < 1e-10);
    }
  });
});
