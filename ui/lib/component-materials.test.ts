import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_COMPONENT_MATERIALS, MATERIAL_BY_ID, MATERIAL_PROFILES, PERIODIC_ELEMENTS,
  RECOMMENDED_MATERIALS, materialIdFromLegacy, materialProfilesForElement, resolveMaterial,
} from './component-materials.ts';
import { MATERIAL_CATALOG } from './material-records.ts';

describe('component material selection', () => {
  it('resolves legacy formulas without conflating crystal phases or nitride layer systems', () => {
    assert.equal(materialIdFromLegacy(' Al₂O₃ (sapphire) '), 'sapphire');
    assert.equal(materialIdFromLegacy('Al₂O₃'), 'alumina');
    assert.equal(materialIdFromLegacy('AlOₓ'), 'AlOx');
    assert.equal(materialIdFromLegacy('SiNₓ'), 'SiNx');
    assert.equal(materialIdFromLegacy('SiO₂'), 'SiO2');
    assert.equal(materialIdFromLegacy('a-Ge'), 'a-Ge');
    assert.equal(materialIdFromLegacy('a-Si:H'), 'a-Si:H');
    assert.equal(resolveMaterial('NbN/TiN').id, 'NbN-TiN');
    assert.notEqual(resolveMaterial('NbN/TiN'), resolveMaterial('NbTiN'));
    assert.notEqual(resolveMaterial('a-Ge'), resolveMaterial('Ge'));
  });

  it('uses a valid fallback for unknown persisted IDs, including inherited object keys', () => {
    for (const id of ['', 'unknown-film', '__proto__', 'constructor', 'toString']) {
      assert.equal(resolveMaterial(id), MATERIAL_BY_ID.Al);
    }
  });

  it('gives every existing scientific picker material an intentional appearance', () => {
    for (const name of MATERIAL_CATALOG) {
      const material = resolveMaterial(name);
      if (name === 'Al') assert.equal(material.id, 'Al');
      else assert.notEqual(material.id, 'Al', `${name} silently fell back to aluminium`);
    }
    assert.equal(resolveMaterial('B₄C').id, 'B4C');
    assert.equal(resolveMaterial('LaAlO₃').id, 'LaAlO3');
    assert.equal(resolveMaterial('MgAl₂O₄').id, 'MgAl2O4');
  });

  it('connects every component default and shortcut to a unique valid material recipe', () => {
    assert.equal(new Set(MATERIAL_PROFILES.map((material) => material.id)).size, MATERIAL_PROFILES.length);
    assert.deepEqual(Object.keys(DEFAULT_COMPONENT_MATERIALS).sort(), Object.keys(RECOMMENDED_MATERIALS).sort());
    for (const id of [...Object.values(DEFAULT_COMPONENT_MATERIALS), ...Object.values(RECOMMENDED_MATERIALS).flat()]) {
      assert.ok(Object.hasOwn(MATERIAL_BY_ID, id), `Missing material ${id}`);
    }
    for (const material of MATERIAL_PROFILES) {
      assert.match(material.color, /^#[0-9a-f]{6}$/i);
      assert.equal(new URL(material.sourceUrl).protocol, 'https:');
      for (const field of ['metalness', 'roughness', 'clearcoat', 'clearcoatRoughness', 'transmission', 'iridescence'] as const) {
        assert.ok(Number.isFinite(material[field]) && material[field] >= 0 && material[field] <= 1, `${material.id}.${field}`);
      }
      assert.ok(material.ior >= 1 && material.ior <= 2.333, `${material.id}.ior`);
    }
  });

  it('finds compound constituents while leaving unsupported elements unavailable', () => {
    assert.ok(materialProfilesForElement('Al').some((material) => material.id === 'Al'));
    assert.ok(materialProfilesForElement('Al').some((material) => material.id === 'sapphire'));
    assert.ok(materialProfilesForElement('N').some((material) => material.id === 'NbTiN'));
    assert.ok(materialProfilesForElement('As').some((material) => material.id === 'InAs'));
    assert.deepEqual(materialProfilesForElement('Og'), []);
    assert.deepEqual(materialProfilesForElement('__proto__'), []);
    for (const material of MATERIAL_PROFILES) {
      for (const symbol of material.elements) {
        assert.ok(PERIODIC_ELEMENTS.some((element) => element.symbol === symbol), `${material.id} has unknown element ${symbol}`);
      }
    }
  });

  it('lays out all 118 elements without duplicates or overlapping cells', () => {
    assert.deepEqual(PERIODIC_ELEMENTS.map((element) => element.number), Array.from({ length: 118 }, (_, index) => index + 1));
    assert.equal(new Set(PERIODIC_ELEMENTS.map((element) => element.symbol)).size, 118);
    assert.equal(new Set(PERIODIC_ELEMENTS.map((element) => `${element.group}:${element.period}`)).size, 118);
    for (const element of PERIODIC_ELEMENTS) {
      assert.ok(element.group >= 1 && element.group <= 18 && element.period >= 1 && element.period <= 9);
      assert.ok(element.name.length > 1);
    }
    assert.equal(PERIODIC_ELEMENTS.filter((element) => element.period === 8).length, 15);
    assert.equal(PERIODIC_ELEMENTS.filter((element) => element.period === 9).length, 15);
  });
});
