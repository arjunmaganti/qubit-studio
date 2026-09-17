// A passing negative-control run means BOTH intentionally damaged bundles failed
// at the expected real-component assertion, not during setup or compilation.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const results = path.join(root, 'test-results/browser');
const controls = {
  search: 'Search action has an explicit stable accessible name',
  compare: 'Compare action has an explicit stable accessible name',
};
for (const [name, expected] of Object.entries(controls)) {
  const before = new Set(fs.existsSync(results) ? fs.readdirSync(results) : []);
  const child = spawnSync(process.execPath, [path.join(__dirname, 'run.cjs'), name], { stdio: 'inherit' });
  const added = fs.readdirSync(results).filter(file => !before.has(file) && file.startsWith(`${name}-`));
  if (child.status !== 1 || added.length !== 1) throw new Error(`${name}: expected a failing browser run with artifacts.`);
  const report = JSON.parse(fs.readFileSync(path.join(results, added[0], 'report.json'), 'utf8'));
  if (report.status !== 'FAILED' || !report.error?.includes(expected)) throw new Error(`${name}: failed for an unexpected reason.`);
  console.log(`PASS negative control: removing ${name} action metadata was detected by the real component journey.`);
}
