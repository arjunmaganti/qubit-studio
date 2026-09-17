import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { approxDeltaMhz, transmonApproxF01Ghz } from './transmon-approx.ts';

describe('transmonApproxF01Ghz', () => {
  it('should match √(8 EJ EC) − EC for the default teaching point', () => {
    const approx = transmonApproxF01Ghz(15, 0.3);
    assert.ok(Math.abs(approx - 5.7) < 1e-12);
  });

  it('should report solver − approx in MHz', () => {
    const delta = approxDeltaMhz(5.6826, 15, 0.3);
    assert.ok(Math.abs(delta - (5.6826 - 5.7) * 1e3) < 1e-6);
  });
});
