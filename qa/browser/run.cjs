const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { once } = require('node:events');
const root = path.resolve(__dirname, '../..');
const requireUI = createRequire(path.join(root, 'ui/package.json'));
const { EXPECTED_JOURNEYS } = require('./contract.json');
const negativeControl = process.argv[2];
if (negativeControl && !['search', 'compare'].includes(negativeControl)) throw new Error('Usage: node qa/browser/run.cjs [search|compare]');
const artifactRoot = path.join(root, 'test-results/browser');
fs.mkdirSync(artifactRoot, { recursive: true });
const output = fs.mkdtempSync(path.join(artifactRoot, `${negativeControl || 'regression'}-`));
const consoleMessages = [], pageErrors = [], blockedNetwork = [];
const started = Date.now();
let browserVersion = null;
const write = (name, value) => fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');

async function main() {
  let browser, context, page, server;
  try {
    const provenance = require('./fixtures/provenance.json');
    for (const [file, expected] of Object.entries(provenance.sha256)) {
      const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
      if (actual !== expected) throw new Error(`Fixture provenance changed: ${file}. See docs/testing-integration.md before regenerating fixtures.`);
    }
    await require('./build.cjs')(output, negativeControl);
    const allowedFiles = new Set(fs.readdirSync(output).filter(name => /\.(js|html)$/.test(name)));
    // The real imported workspace stylesheet requests this checked-in font.
    // Keep the harness offline: serve only this explicit local asset.
    const localAssets = new Map([
      ['fonts/instrument-sans/InstrumentSans-Variable.ttf', path.join(output, 'fonts/instrument-sans/InstrumentSans-Variable.ttf')],
    ]);
    for (const name of localAssets.keys()) allowedFiles.add(name);
    server = http.createServer((request, response) => {
      const name = request.url === '/' ? 'index.html' : request.url?.slice(1);
      if (!allowedFiles.has(name)) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', name.endsWith('.html') ? 'text/html' : name.endsWith('.ttf') ? 'font/ttf' : 'application/javascript');
      response.end(fs.readFileSync(localAssets.get(name) || path.join(output, name)));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const { chromium } = requireUI('playwright');
    // Playwright owns this disposable browser and profile; no existing app server
    // or signed-in browser is used. Missing browser binaries are a hard failure.
    browser = await chromium.launch({ headless: true });
    browserVersion = browser.version();
    context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === origin && (url.pathname === '/' || allowedFiles.has(url.pathname.slice(1)))) return route.continue();
      blockedNetwork.push(url.href);
      return route.abort('blockedbyclient');
    });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    page = await context.newPage();
    page.on('console', message => consoleMessages.push({ type: message.type(), text: message.text() }));
    page.on('pageerror', error => pageErrors.push(error.stack || error.message));
    // Real browser keyboard events, used by the dialog journey for Tab/Escape.
    await page.exposeFunction('qaPressKey', key => page.keyboard.press(key));
    await page.goto(origin, { waitUntil: 'load', timeout: 15000 });
    await page.waitForFunction(() => {
      try { return ['passed', 'FAILED'].includes(JSON.parse(document.querySelector('#report').textContent).status); } catch { return false; }
    // Includes lazy shader initialization plus every interaction-specific deadline
    // on software WebGL. Individual assertions still have their own bounded waits.
    }, null, { timeout: 120000 });
    const report = JSON.parse(await page.locator('#report').textContent());
    write('report.json', report);
    for (const [index, item] of (report.exportedReports || []).entries()) write(`actual-page-export-${index + 1}.json`, item.report);
    const checks = report.checks || [];
    if (report.status !== 'passed' || checks.length !== EXPECTED_JOURNEYS || new Set(checks).size !== EXPECTED_JOURNEYS || report.renderErrors?.length !== 0 || report.exportedReports?.length !== 2 || report.applyCalls !== 1) {
      throw new Error(report.error || `Expected ${EXPECTED_JOURNEYS} complete journeys, coherent renders, one Apply and two real Page exports.`);
    }
    if (pageErrors.length || blockedNetwork.length) throw new Error('Browser errors or unexpected network requests; see diagnostics.json.');
    console.log(`PASS: ${checks.length} browser journeys, ${Object.values(report.network).reduce((a, b) => a + b, 0)} controlled requests, 2 actual Page exports, 0 incoherent renders.`);
  } catch (error) {
    process.exitCode = 1;
    write('failure.json', { error: error.stack || String(error) });
    console.error(error.stack || error);
  } finally {
    if (page) {
      try { fs.writeFileSync(path.join(output, 'browser-dom.html'), await page.content()); await page.screenshot({ path: path.join(output, 'browser.png'), fullPage: true }); } catch (error) { consoleMessages.push({ type: 'artifact-error', text: String(error) }); }
    }
    if (context) await context.tracing.stop({ path: path.join(output, 'trace.zip') });
    if (browser) await browser.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    write('diagnostics.json', { consoleMessages, pageErrors, blockedNetwork });
    write('execution.json', { node: process.version, platform: process.platform, playwright: requireUI('playwright/package.json').version, browserVersion, elapsedMs: Date.now() - started, expectedJourneys: EXPECTED_JOURNEYS, negativeControl: negativeControl || null, exitCode: process.exitCode || 0 });
    console.log(`Artifacts: ${path.relative(root, output)}`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
