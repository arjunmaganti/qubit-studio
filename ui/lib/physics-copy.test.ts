import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { composeLocalMyla } from './explain-local.ts';
import { TOUR_STEPS } from './guided-tour.ts';
import { buildChipSnapshot } from './insight-snapshot.ts';
import { PARAMS } from './params.ts';
import { DEFAULT_COMPONENT_MATERIALS } from './component-materials.ts';

const fixtures = JSON.parse(readFileSync(new URL('../../qa/browser/fixtures/solver.json', import.meta.url), 'utf8'));
const snapshot = () =>
  buildChipSnapshot({
    params: fixtures.params,
    result: fixtures.evaluate,
    baseline: null,
    selected: 'junction',
    stale: false,
    error: null,
    goals: { target_ghz: 5, tolerance_ghz: 0.25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 },
    materials: { topMaterial: 'Al', baseMaterial: 'Si' },
    explode: 0,
    componentMaterials: DEFAULT_COMPONENT_MATERIALS,
  });

test('tour introduces a qubit as a superposition, not a classical bit', () => {
  assert.match(TOUR_STEPS[0].body, /superposition/);
  assert.equal(/stores a \$0\$ or a \$1\$/.test(TOUR_STEPS[0].body), false);
});

test('Myla tunable formula matches the non-negative scqubits SQUID expression', () => {
  const body = composeLocalMyla('tunable', snapshot()).body;
  assert.match(body, /\\sqrt\{\\cos\^\{2\}/);
  assert.match(body, /d\^\{2\}\\sin\^\{2\}/);
});

test('charging-energy copy uses 4 E_C for one Cooper pair', () => {
  assert.match(PARAMS.ec_ghz.meaning, /four times/i);
});
