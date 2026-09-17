import assert from 'node:assert/strict';
import test from 'node:test';
import { createTourDisclosures } from './tour-disclosures.ts';

test('tour step cleanup closes opened popovers while preserving user-open disclosures', () => {
  const userPanel = { open: true }, viewOptions = { open: false }, child = { open: false };
  const step = createTourDisclosures();
  step.open(userPanel); step.open(viewOptions); step.open(child);
  // Repeated measurement must not mistake a tour-open panel for a user-open one.
  step.open(viewOptions);
  assert.equal(viewOptions.open, true);
  step.restore();
  assert.equal(viewOptions.open, false); assert.equal(child.open, false); assert.equal(userPanel.open, true);
  step.restore(); assert.equal(userPanel.open, true);
});

test('each tour step restores before the next step acquires its disclosures', () => {
  const menu = { open: false };
  const first = createTourDisclosures(); first.open(menu); first.restore();
  const next = createTourDisclosures(); next.open(menu); next.restore();
  assert.equal(menu.open, false, 'Finish/unmount must not leave an intercepting toolbar menu');
  menu.open = true;
  const later = createTourDisclosures(); later.open(menu); later.restore();
  assert.equal(menu.open, true, 'A menu the user opened before a later step stays open');
});
