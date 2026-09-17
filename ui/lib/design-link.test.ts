import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDesignShareUrl, parseDesignShareUrl } from './design-link.ts';
import { DEFAULT_COMPONENT_MATERIALS } from './component-materials.ts';

const design = {
  params: { ej_ghz: 15, ec_ghz: 0.3, ng: 0.1, ncut: 30 },
  goals: { target_ghz: 5, tolerance_ghz: 0.25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 },
  topMaterial: 'TiN',
  baseMaterial: 'Al₂O₃ (sapphire)',
};

describe('shareable design links', () => {
  it('round-trips a complete design', () => {
    const url = createDesignShareUrl(design, 'http://localhost:3100/?old=value#section');
    assert.deepEqual(parseDesignShareUrl(url), design);
    assert.equal(new URL(url).hash, '');
    assert.equal(new URL(url).searchParams.has('old'), false);
  });

  it('ignores ordinary and incomplete links', () => {
    assert.equal(parseDesignShareUrl('http://localhost:3100/'), null);
    assert.equal(parseDesignShareUrl('http://localhost:3100/?design=1&ej=15'), null);
  });

  it('round-trips independent component materials without changing the sensitivity pair', () => {
    const customized = { ...design, componentMaterials: { ...DEFAULT_COMPONENT_MATERIALS, capacitor: 'Ta', package: 'Cu', substrate: 'sapphire' } };
    assert.deepEqual(parseDesignShareUrl(createDesignShareUrl(customized, 'https://example.test')), customized);
  });

  it('rejects incomplete, unknown and malformed component assignments', () => {
    const url = new URL(createDesignShareUrl(design, 'https://example.test'));
    for (const value of ['{', '{}', JSON.stringify({ ...DEFAULT_COMPONENT_MATERIALS, package: 'Unknownium' }), JSON.stringify({ ...DEFAULT_COMPONENT_MATERIALS, extra: 'Au' })]) {
      url.searchParams.set('component_materials', value);
      assert.equal(parseDesignShareUrl(url.toString()), null);
    }
  });

  it('clamps numeric values and rejects unknown materials', () => {
    const url = createDesignShareUrl(design, 'http://localhost:3100/');
    const changed = new URL(url);
    changed.searchParams.set('ej', '999');
    changed.searchParams.set('top', 'Unknownium');
    assert.equal(parseDesignShareUrl(changed.toString()), null);

    changed.searchParams.set('top', 'Al');
    assert.equal(parseDesignShareUrl(changed.toString())?.params.ej_ghz, 50);
  });
});
