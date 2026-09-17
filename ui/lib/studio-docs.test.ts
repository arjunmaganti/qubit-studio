import assert from 'node:assert/strict';
import test from 'node:test';
import { DOCS_SECTIONS } from './studio-docs.ts';

test('docs page covers qubits, the transmon Hamiltonian, and studio limits', () => {
  const ids = DOCS_SECTIONS.map((section) => section.id);
  assert.deepEqual(ids, ['overview', 'qubits', 'hardware', 'transmon', 'solver', 'studio', 'limits', 'references']);
  const text = DOCS_SECTIONS.flatMap((section) =>
    section.blocks.flatMap((block) => {
      if (block.type === 'p' || block.type === 'note') return [block.text];
      if (block.type === 'eq') return [block.tex, block.caption ?? ''];
      return block.items;
    }),
  ).join('\n');
  assert.match(text, /4E_C\(\\hat\{n\}-n_g\)\^2/);
  assert.match(text, /isolated\\text\{-\}transmon/);
  assert.match(text, /T_1/);
  assert.match(text, /scqubits/);
  assert.match(text, /Koch/);
  assert.match(text, /\\exp\(-\\sqrt\{8E_J\/E_C\}\)/);
  assert.match(text, /Adding one Cooper pair costs \$4E_C\$/);
  assert.match(text, /Both \$n_g=0\$ and \$n_g=1\/2\$ are extrema/);
});

test('docs equations are KaTeX source, not Unicode stand-ins', () => {
  const equations = DOCS_SECTIONS.flatMap((section) => section.blocks.filter((block) => block.type === 'eq'));
  assert.ok(equations.length >= 5);
  for (const block of equations) {
    if (block.type !== 'eq') continue;
    assert.equal(block.tex.includes('$'), false);
    assert.match(block.tex, /\\|_|\{/);
  }
});
