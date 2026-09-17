import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import katex from 'katex';
import { MATH_PARTS, withTex } from './math-text.ts';

describe('provider math rendering', () => {
  for (const [open, close] of [['\\(', '\\)'], ['\\[', '\\]'], ['$', '$'], ['$$', '$$']]) {
    it(`preserves ${open} equations instead of nesting dollar delimiters`, () => {
      const equation = String.raw`E_C = e^2 / (2 C_\Sigma)`;
      const explicit = `${open}${equation}${close}`;
      const text = `The charging energy is ${explicit}. A smaller ${open}E_C${close} helps.`;
      assert.equal(withTex(text), text);
      const parts = withTex(text).split(MATH_PARTS);
      assert.equal(parts[1], explicit);
      assert.equal(parts[3], `${open}E_C${close}`);
      for (const part of [parts[1], parts[3]]) {
        const math = part.slice(open.length, -close.length);
        const html = katex.renderToString(math, { throwOnError: true, trust: false });
        assert.ok(html.includes('class="katex"'));
        assert.ok(!html.includes('katex-error'));
      }
    });
  }

  it('preserves equations and numeric units together from the reported Gemini answer', () => {
    const text = String.raw`Total capacitance \(C_\Sigma\) determines \(E_C = e^2 / (2 C_\Sigma)\). Currently \(E_C = 0.300\) GHz corresponds to 64.567 fF.`;
    const normalized = withTex(text);
    assert.ok(normalized.includes(String.raw`\(E_C = e^2 / (2 C_\Sigma)\)`));
    assert.ok(normalized.includes(String.raw`\(E_C = 0.300\)`));
    assert.ok(normalized.includes(String.raw`$64.567\,\mathrm{fF}$`));
    assert.ok(!normalized.includes(String.raw`\($E_C$`));
  });

  it('retains automatic formatting of unmarked local teaching labels', () => {
    assert.equal(withTex('EJ/EC and E_C; f01 is 5.683 GHz.'), String.raw`$E_J/E_C$ and $E_C$; $f_{01}$ is$5.683\,\mathrm{GHz}$.`);
  });

  it('keeps multiline display equations intact', () => {
    const text = String.raw`\[
E_C = \frac{e^2}{2 C_\Sigma}
\]`;
    assert.equal(withTex(text), text);
    assert.equal(withTex(text).split(MATH_PARTS)[1], text);
  });
});
