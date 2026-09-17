// Against a production UI and its real isolated-transmon API. Provider replies are mocked.
const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const requireUI = createRequire(path.resolve(__dirname, '../../ui/package.json'));
const { chromium } = requireUI('playwright');
const provider = require('./fixtures/provider.json');
const output = path.resolve(__dirname, '../../test-results/unification');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1640, height: 1100 } });
  page.setDefaultTimeout(30000);
  const checks = [], errors = [], evaluations = [];
  let aiRequests = 0;
  const check = name => { checks.push(name); console.log('PASS', name); };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', async response => {
    if (response.url().endsWith('/api/evaluate') && response.ok()) evaluations.push(await response.json());
  });
  await page.route('**/api/explain', route => { aiRequests++; return route.fulfill({ json: provider.success }); });
  const waitReady = () => page.waitForFunction(() => {
    const status = document.querySelector('.wave-header [role="status"]');
    return status && /ready|live/i.test(status.textContent || '');
  });
  try {
    const firstEvaluation = page.waitForResponse(response => response.url().endsWith('/api/evaluate') && response.ok()).then(response => response.json());
    await page.goto(process.argv[2] || 'http://127.0.0.1:3117');
    await waitReady();
    assert.ok(Number.isFinite((await firstEvaluation).f01_ghz), 'Production UI received an actual numerical API result');
    check('Production UI evaluates through the real same-origin numerical API');
    await page.locator('.view-options summary').click();
    await page.getByRole('button', { name: 'High detail rendering', exact: true }).click();
    await page.locator('.view-options summary').click();

    await page.getByRole('button', { name: 'Ask Myla', exact: true }).first().click();
    const myla = page.locator('.myla-panel[role="dialog"]');
    await myla.waitFor();
    assert.equal(aiRequests, 0, 'Opening Myla must stay local');
    assert.ok((await myla.innerText()).length > 100, 'Local Myla explanation is populated');
    await myla.locator('summary', { hasText: 'Choose explanation topics' }).click();
    await myla.locator('input[type="checkbox"]:not(:checked)').first().check();
    assert.equal(await myla.locator('.myla-panel-note').count(), 2, 'Multiple selected topics retain their local notes');
    await myla.getByRole('button', { name: 'Clear topic selection', exact: true }).click();
    assert.ok(await myla.getByRole('button', { name: 'Ask Gemini about this', exact: true }).isDisabled());
    await myla.getByRole('checkbox').first().check();
    await myla.locator('summary', { hasText: 'Choose explanation topics' }).click();
    await myla.getByRole('button', { name: 'Ask Gemini about this', exact: true }).click();
    await myla.getByText(provider.success.body, { exact: true }).waitFor();
    assert.equal(aiRequests, 1, 'Explicit provider action sends exactly one request');
    await page.keyboard.press('Escape');
    await myla.waitFor({ state: 'hidden' });
    check('Myla has immediate local notes and an explicit provider request with a mocked reply');
    await page.locator('.components-menu summary').click();
    await page.locator('.components-menu').getByRole('button', { name: /^Shunt capacitor pads/ }).click();
    await myla.waitFor();
    const numericField = page.locator('#p-ec_ghz');
    await numericField.click();
    assert.ok(await numericField.evaluate(node => document.activeElement === node), 'Dismissing automatic Myla notes preserves focus on the clicked numeric field');
    await myla.waitFor({ state: 'hidden' });
    check('Automatic part notes leave CAD controls accessible and preserve the next numeric-field focus');

    await page.getByRole('button', { name: 'Chip builder', exact: true }).click();
    const builder = page.getByRole('dialog', { name: 'Build your own quantum chip', exact: true });
    await builder.waitFor();
    await builder.getByRole('button', { name: 'Starter layout', exact: true }).click();
    const count = await builder.locator('.builder-piece').count();
    assert.ok(count >= 3, 'Starter layout has real editable pieces');
    await builder.getByRole('button', { name: 'Circuit', exact: true }).click();
    assert.equal(await builder.locator('.builder-circuit-piece').count(), count);
    await builder.locator('.builder-circuit-piece').first().focus();
    await page.keyboard.press('Enter');
    await builder.getByRole('region', { name: /Myla replacement suggestions/ }).waitFor();
    assert.ok(await builder.locator('.builder-replacements button').count(), 'Selected piece has alternatives');
    await builder.locator('.builder-replacements button').first().click();
    assert.match(await builder.getByRole('status').innerText(), /replaced/);
    await builder.getByRole('button', { name: '3D preview', exact: true }).click();
    assert.ok(await builder.getByLabel('Automatic three-dimensional preview of the custom chip').isVisible());
    await builder.getByRole('button', { name: 'Layout', exact: true }).click();
    await builder.locator('.builder-piece').filter({ has: page.locator('text', { hasText: 'Josephson junction' }) }).first().click();
    await builder.getByRole('button', { name: 'Rotate one quarter turn', exact: true }).click();
    const portErrors = await builder.locator('.builder-piece.selected').evaluate(piece => {
      const svg = piece.ownerSVGElement;
      const ports = [...piece.querySelectorAll('.builder-port')].map(circle => new DOMPoint(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))).matrixTransform(circle.getScreenCTM()));
      const ends = [...svg.querySelectorAll('.builder-connection')].flatMap(line => [[line.x1.baseVal.value, line.y1.baseVal.value], [line.x2.baseVal.value, line.y2.baseVal.value]].map(([x,y]) => new DOMPoint(x,y).matrixTransform(line.getScreenCTM())));
      return ports.map(port => Math.min(...ends.map(end => Math.hypot(port.x-end.x, port.y-end.y))));
    });
    assert.ok(portErrors.length >= 2 && portErrors.every(distance => distance < 0.1), 'Rotated junction ports match connection endpoints on screen');
    await builder.getByRole('button', { name: 'Use this chip in simulation', exact: true }).click();
    await builder.getByText('Current simulation for this chip', { exact: true }).waitFor();
    check('Chip builder preserves layout, circuit, 3D preview, replacements and real solver Apply');

    await builder.getByRole('textbox', { name: 'Chip design name', exact: true }).fill('Unification smoke chip');
    await builder.getByRole('button', { name: 'Save', exact: true }).click();
    assert.match(await builder.getByRole('status').innerText(), /saved in this browser/);
    const [download] = await Promise.all([
      page.waitForEvent('download'), builder.getByRole('button', { name: 'JSON', exact: true }).click(),
    ]);
    const savedPath = path.join(output, 'exported-chip.json');
    await download.saveAs(savedPath);
    const chip = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    assert.equal(chip.name, 'Unification smoke chip');
    assert.equal(chip.parts.length, count);
    await builder.getByRole('button', { name: 'New blank chip', exact: true }).click();
    assert.equal(await builder.locator('.builder-piece').count(), 0);
    assert.ok(await builder.getByRole('button', { name: 'Use this chip in simulation', exact: true }).isDisabled());
    await builder.locator('input[type="file"]').setInputFiles(savedPath);
    await builder.getByText('Chip file imported.', { exact: true }).waitFor();
    assert.equal(await builder.locator('.builder-piece').count(), count);
    await builder.locator('input[type="file"]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"parts":[null]}') });
    await builder.getByText('Unsupported chip file', { exact: true }).waitFor();
    assert.equal(await builder.locator('.builder-piece').count(), count, 'Bad import preserves current chip');
    await builder.getByRole('button', { name: 'Close', exact: true }).click();
    check('Builder save/export/import round trip works and malformed input preserves the design');

    const learn = page.locator('.learning-menu').filter({ has: page.locator('summary', { hasText: 'Learn' }) });
    await learn.locator('summary').click();
    await learn.getByRole('button', { name: 'Build a chip', exact: true }).click();
    const workshop = page.getByRole('dialog', { name: 'Build a chip with Myla', exact: true });
    await workshop.waitFor();
    await workshop.getByRole('button', { name: 'Next', exact: true }).click();
    for (const choice of ['Silicon', 'Niobium', 'Firm', 'Big pads', 'Halfway (0.5)', 'Snap together']) {
      assert.ok(await workshop.getByRole('button', { name: 'Next', exact: true }).isDisabled(), 'Each required choice gates Next');
      await workshop.getByRole('button', { name: new RegExp('^' + choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
      await workshop.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await workshop.getByRole('button', { name: 'Next', exact: true }).click();
    assert.match(await workshop.innerText(), /niobium wiring/);
    assert.match(await workshop.innerText(), /firm switch/);
    assert.match(await workshop.innerText(), /big pads/);
    await workshop.getByRole('button', { name: 'Finish', exact: true }).click();
    await workshop.waitFor({ state: 'hidden' });
    await waitReady();
    assert.ok(evaluations.some(result => result.ej_ghz === 22 && result.ec_ghz === 0.22 && result.ng === 0.5), 'Workshop produces requested numerical inputs');
    check('Nine-step Myla workshop requires choices, updates the live solver and reaches the recap');
    assert.equal(errors.length, 0, errors.join('\n'));
    await page.screenshot({ path: path.join(output, 'completed.png'), fullPage: true });
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'passed', checks, errors, aiRequests, numericalEvaluations: evaluations.length, browser: browser.version() }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'failed', checks, errors, aiRequests, error: error.stack }, null, 2));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
