import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_MATERIAL_PRIORITY,
  rankDistinctMaterialPairs,
  rankMaterialStacks,
  recommendMaterialStack,
  VALID_RESONATOR_STACKS,
} from './material-ranking.ts';
import { MATERIAL_CATALOG } from './material-records.ts';

describe('material stack selection', () => {
  it('only exposes curated real material names', () => {
    assert.ok(MATERIAL_CATALOG.length > 1);
    assert.equal(MATERIAL_CATALOG.includes('A' as never), false);
    assert.equal(MATERIAL_CATALOG.includes('S' as never), false);
    assert.equal(MATERIAL_CATALOG.includes('barrier layer' as never), false);
  });

  it('changes recommendation when the ranking priority changes', () => {
    const processFirst = recommendMaterialStack(0, 'any');
    const lossFirst = recommendMaterialStack(100, 'any');
    assert.notEqual(processFirst.id, lossFirst.id);
    assert.equal(VALID_RESONATOR_STACKS.includes(processFirst), true);
    assert.equal(VALID_RESONATOR_STACKS.includes(lossFirst), true);
  });

  it('defaults design search to the best measured stack, not Al on Si', () => {
    const recommendation = recommendMaterialStack(DEFAULT_MATERIAL_PRIORITY, 'any');
    const lowestWorstCaseLoss = Math.min(
      ...VALID_RESONATOR_STACKS.map((record) => record.lowPowerLossMax),
    );

    assert.equal(DEFAULT_MATERIAL_PRIORITY, 100);
    assert.equal(recommendation.lowPowerLossMax, lowestWorstCaseLoss);
    assert.equal(recommendation.id, 'tin-sapphire-gao-2021');
  });

  it('honors a required substrate', () => {
    assert.equal(recommendMaterialStack(50, 'Si').substrate, 'Si');
    assert.equal(recommendMaterialStack(50, 'Al₂O₃ (sapphire)').substrate, 'Al₂O₃ (sapphire)');
  });

  it('returns every compatible stack in recommendation order', () => {
    const ranked = rankMaterialStacks(100, 'any');

    assert.equal(ranked.length, VALID_RESONATOR_STACKS.length);
    assert.equal(ranked[0].id, recommendMaterialStack(100, 'any').id);
    assert.deepEqual(
      new Set(ranked.map((record) => record.id)),
      new Set(VALID_RESONATOR_STACKS.map((record) => record.id)),
    );
  });

  it('offers each material and substrate pair only once', () => {
    const pairs = rankDistinctMaterialPairs(100, 'any');
    const names = pairs.map((record) => `${record.material} on ${record.substrate}`);

    assert.equal(names.length, new Set(names).size);
    assert.equal(names.filter((name) => name === 'Al on Si').length, 1);
    assert.equal(pairs[0].id, recommendMaterialStack(100, 'any').id);
  });
});
