import assert from 'node:assert/strict';
import test from 'node:test';
import {
  workshopCanAdvance,
  workshopHidden,
  workshopParams,
  workshopRecap,
  WORKSHOP_STEPS,
} from './build-workshop.ts';

test('workshop starts on a bare wafer and reveals parts as the user chooses', () => {
  assert.deepEqual(workshopHidden(0), ['package', 'board', 'ground', 'capacitor', 'junction', 'gate']);
  assert.ok(!workshopHidden(1).includes('substrate'));
  assert.ok(workshopHidden(2).includes('junction'));
  assert.equal(workshopHidden(WORKSHOP_STEPS.length - 1).length, 0);
});

test('workshop Next is gated on a choice, then on a live solver result', () => {
  const wafer = WORKSHOP_STEPS.find((step) => step.id === 'wafer')!;
  const readout = WORKSHOP_STEPS.find((step) => step.id === 'readout')!;
  assert.equal(workshopCanAdvance(wafer, {}, false), false);
  assert.equal(workshopCanAdvance(wafer, { wafer: 'sapphire' }, false), true);
  assert.equal(workshopCanAdvance(readout, { ej: 15, ec: 0.3 }, false), false);
  assert.equal(workshopCanAdvance(readout, { ej: 15, ec: 0.3 }, true), true);
});

test('workshop energies are the discrete teaching picks, not typed targets', () => {
  assert.deepEqual(workshopParams({ ej: 8, ec: 0.42, ng: 0.5 }), {
    ej_ghz: 8,
    ec_ghz: 0.42,
    ng: 0.5,
    ncut: 30,
  });
  assert.match(
    workshopRecap({ wafer: 'sapphire', metal: 'Nb', ej: 22, ec: 0.22, ng: 0, assembled: true }),
    /niobium/,
  );
});

test('workshop gate copy does not claim n_g = 1/2 makes the chip noisier', () => {
  const gate = WORKSHOP_STEPS.find((step) => step.id === 'gate')!;
  const blob = [gate.body, ...(gate.options ?? []).flatMap((option) => [option.label, option.hint])].join('\n');
  assert.equal(/fidgety|matter more|noisier|sensitive/i.test(blob), false);
  assert.match(blob, /halfway/i);
  assert.match(blob, /wiggle|compare|two notes/i);
});
