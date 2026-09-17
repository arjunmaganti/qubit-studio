import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_COMPONENT_MATERIALS } from './component-materials.ts';
import { restoreComponentMaterials, assignComponentMaterial, applyLayerMaterials } from './component-material-selection.ts';

test('assigning one material preserves every other component and rejects unknown recipes', () => {
  const current = { ...DEFAULT_COMPONENT_MATERIALS };
  const updated = assignComponentMaterial(current, 'capacitor', 'Ta');
  assert.equal(updated.capacitor, 'Ta');
  assert.deepEqual({ ...updated, capacitor: current.capacitor }, current);
  assert.deepEqual(current, DEFAULT_COMPONENT_MATERIALS);
  assert.equal(assignComponentMaterial(current, 'capacitor', 'not-a-material'), current);
  assert.equal(assignComponentMaterial(current, 'capacitor', 'toString'), current);
});

test('saved selections recover valid parts while malformed and obsolete values use defaults', () => {
  for (const raw of [null, 'broken JSON', 'null', '[]', '42']) assert.deepEqual(restoreComponentMaterials(raw), DEFAULT_COMPONENT_MATERIALS);
  const restored = restoreComponentMaterials(JSON.stringify({ package: 'Cu', substrate: 'sapphire', capacitor: 'obsolete', ground: 'constructor', unknown: 'Au' }));
  assert.equal(restored.package, 'Cu');
  assert.equal(restored.substrate, 'sapphire');
  assert.equal(restored.capacitor, DEFAULT_COMPONENT_MATERIALS.capacitor);
  assert.equal(restored.ground, DEFAULT_COMPONENT_MATERIALS.ground);
  assert.equal(Object.keys(restored).length, 7);
});

test('legacy film/substrate choices preserve custom mechanical materials and resolve compounds', () => {
  const updated = applyLayerMaterials({ ...DEFAULT_COMPONENT_MATERIALS, board: 'alumina', package: 'Cu' }, 'NbN/TiN', 'Al₂O₃ (sapphire)');
  assert.equal(updated.junction, 'NbN-TiN');
  assert.equal(updated.capacitor, 'NbN-TiN');
  assert.equal(updated.ground, 'NbN-TiN');
  assert.equal(updated.gate, 'NbN-TiN');
  assert.equal(updated.substrate, 'sapphire');
  assert.equal(updated.board, 'alumina');
  assert.equal(updated.package, 'Cu');
});

test('changing only the legacy substrate preserves independent film assignments', () => {
  const current = { ...DEFAULT_COMPONENT_MATERIALS, capacitor: 'Ta', gate: 'TiN', ground: 'Nb' };
  const updated = applyLayerMaterials(current, undefined, 'Al₂O₃ (sapphire)');
  assert.equal(updated.substrate, 'sapphire');
  assert.deepEqual({ ...updated, substrate: current.substrate }, current);
  assert.equal(applyLayerMaterials(current), current);
});

test('changing only the legacy film preserves an independently chosen substrate', () => {
  const current = { ...DEFAULT_COMPONENT_MATERIALS, substrate: 'MgAl2O4', package: 'Cu' };
  const updated = applyLayerMaterials(current, 'NbN/TiN');
  for (const part of ['junction', 'capacitor', 'gate', 'ground'] as const) assert.equal(updated[part], 'NbN-TiN');
  assert.equal(updated.substrate, 'MgAl2O4');
  assert.equal(updated.package, 'Cu');
  assert.equal(updated.board, current.board);
});
