import assert from 'node:assert/strict';
import test from 'node:test';
import { builderElectricalModel, BUILDER_DESIGN_PRESETS, BUILDER_TEMPLATES, EMPTY_BUILDER_DESIGN, createBuilderPart, createPresetDesign, createStarterDesign, designToSvg, designWarnings, portPoint, replaceBuilderPart, replacementTemplatesForPart, snap, validBuilderDesign } from './chip-builder.ts';

test('chip builder snaps values and creates catalog parts', () => {
  assert.equal(snap(117, 10), 120);
  const part = createBuilderPart(BUILDER_TEMPLATES[0], 0);
  assert.equal(part.role, 'capacitor');
  assert.equal(part.custom, false);
});

test('rotated part ports follow the component', () => {
  const part = { ...createBuilderPart(BUILDER_TEMPLATES[0], 0), x: 100, y: 100, width: 40, rotation: 90 };
  const port = portPoint(part, 1);
  assert.ok(Math.abs(port.x - 100) < 1e-8);
  assert.ok(Math.abs(port.y - 120) < 1e-8);
});

test('builder validation, warnings and SVG export stay explicit', () => {
  assert.equal(validBuilderDesign(EMPTY_BUILDER_DESIGN), true);
  assert.ok(designWarnings(EMPTY_BUILDER_DESIGN).length >= 2);
  const svg = designToSvg({ ...EMPTY_BUILDER_DESIGN, name: '<chip>' });
  assert.match(svg, /^<svg/);
  assert.match(svg, /&lt;chip&gt;/);
});

test('starter layout is valid and immediately model-ready', () => {
  const starter = createStarterDesign();
  assert.equal(validBuilderDesign(starter), true);
  assert.ok(starter.parts.some(part => part.role === 'junction'));
  assert.ok(starter.parts.some(part => part.role === 'capacitor'));
  assert.equal(starter.connections.length, 2);
});

test('Myla replacements keep a piece in place and preserve compatible links', () => {
  const starter = createStarterDesign();
  const pad = starter.parts.find(part => part.id === 'starter-left-pad')!;
  assert.ok(replacementTemplatesForPart(pad).some(template => template.id === 'stepped-pad'));

  const replaced = replaceBuilderPart(starter, pad.id, 'stepped-pad');
  const nextPad = replaced.parts.find(part => part.id === pad.id)!;
  assert.equal(nextPad.templateId, 'stepped-pad');
  assert.equal(nextPad.x, pad.x);
  assert.equal(nextPad.y, pad.y);
  assert.equal(nextPad.rotation, pad.rotation);
  assert.equal(nextPad.areaUm2, pad.areaUm2);
  assert.equal(replaced.connections.length, starter.connections.length);
  assert.equal(validBuilderDesign(replaced), true);
});

test('pre-existing chip library designs contain valid reusable pieces', () => {
  assert.equal(BUILDER_DESIGN_PRESETS.length, 4);
  for (const preset of BUILDER_DESIGN_PRESETS) {
    const design = createPresetDesign(preset.id);
    assert.equal(validBuilderDesign(design), true, preset.name);
    assert.ok(design.parts.length >= 4, preset.name);
    assert.ok(design.parts.some(part => part.role === 'junction'), preset.name);
    assert.ok(design.parts.some(part => part.role === 'capacitor'), preset.name);
    for (const connection of design.connections) {
      const from = design.parts.find(part => part.id === connection.from.partId)!;
      const to = design.parts.find(part => part.id === connection.to.partId)!;
      assert.ok(connection.from.port < from.ports, `${preset.name} from port`);
      assert.ok(connection.to.port < to.ports, `${preset.name} to port`);
    }
  }
});

test('malformed imported parts and connections are rejected without throwing', () => {
  const starter = createStarterDesign();
  for (const parts of [[null], [false], [{}]]) {
    assert.equal(validBuilderDesign({ ...starter, parts }), false);
  }
  for (const connections of [[null], [{}], [{ id: 'bad', from: null, to: null }]]) {
    assert.equal(validBuilderDesign({ ...starter, connections }), false);
  }
  for (const patch of [{ ports: 1000000 }, { ports: -1 }, { areaUm2: -1 }, { areaUm2: Infinity }, { sourceUrl: 'javascript:alert(1)' }, { material: null }]) {
    assert.equal(validBuilderDesign({ ...starter, parts: [{ ...starter.parts[0], ...patch }, ...starter.parts.slice(1)] }), false);
  }
  assert.equal(validBuilderDesign({ ...starter, parts: [...starter.parts, starter.parts[0]] }), false);
  assert.equal(validBuilderDesign({ ...starter, connections: [...starter.connections, starter.connections[0]] }), false);
});

test('imported connections must refer to a real port on each piece', () => {
  const starter = createStarterDesign();
  const connection = starter.connections[0];
  for (const port of [-1, 2, 1.5]) {
    assert.equal(validBuilderDesign({ ...starter, connections: [{ ...connection, from: { ...connection.from, port } }] }), false);
  }
  assert.equal(validBuilderDesign({ ...starter, connections: [{ ...connection, from: { partId: 'missing', port: 0 } }] }), false);
});


test('builder electrical application matches supported solver values without hiding invalid areas', () => {
  const starter = createStarterDesign();
  const model = builderElectricalModel(starter)!;
  assert.ok(model.ejGhz > 0 && model.ecGhz > 0);
  assert.equal(model.bounded, false);
  const huge = { ...starter, parts: starter.parts.map(part => part.role === 'junction' ? { ...part, areaUm2: 1000 } : part) };
  assert.equal(builderElectricalModel(huge)?.ejGhz, 50);
  assert.equal(builderElectricalModel(huge)?.bounded, true);
  for (const areaUm2 of [0, -1, NaN, Infinity]) {
    const invalid = { ...starter, parts: starter.parts.map(part => part.role === 'capacitor' ? { ...part, areaUm2 } : part) };
    assert.equal(builderElectricalModel(invalid), null);
  }
  assert.equal(builderElectricalModel(EMPTY_BUILDER_DESIGN), null);
  assert.equal(builderElectricalModel(createPresetDesign('tunable-transmon'))?.junctionCount, 2);
});
