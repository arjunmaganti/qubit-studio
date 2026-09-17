import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { materialColor, materialPartColors } from './material-colors.ts';

describe('material colors', () => {
  it('uses curated colors for known materials', () => {
    assert.equal(materialColor('Al'), '#c5c9ce');
    assert.equal(materialColor('Pb'), '#858b92');
  });

  it('gives a custom material a stable valid color', () => {
    const first = materialColor('My custom film');
    assert.match(first, /^#[0-9a-f]{6}$/);
    assert.equal(materialColor('My custom film'), first);
  });

  it('maps the top material to metal and the base material to the substrate', () => {
    const colors = materialPartColors({
      topMaterial: 'Al',
      baseMaterial: 'Si',
      topColor: '#aaaaaa',
      baseColor: '#222222',
    });
    assert.equal(colors.junction, '#aaaaaa');
    assert.equal(colors.capacitor, '#aaaaaa');
    assert.equal(colors.substrate, '#222222');
  });
});
