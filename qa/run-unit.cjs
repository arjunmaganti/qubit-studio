// Run the actual repository tests and reject a successful process with zero tests.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ui = path.resolve(__dirname, '../ui');
const files = fs.readdirSync(path.join(ui, 'lib')).filter(name => name.endsWith('.test.ts')).sort();
if (!files.length) throw new Error('No frontend test files found in ui/lib.');
const output = path.resolve(__dirname, '../test-results/unit');
fs.mkdirSync(output, { recursive: true });
const child = spawn(process.execPath, ['--experimental-strip-types', '--test', '--test-reporter=tap', ...files.map(name => `lib/${name}`)], { cwd: ui, stdio: ['ignore', 'pipe', 'inherit'] });
let tap = '';
child.stdout.on('data', data => { tap += data; process.stdout.write(data); });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('close', code => {
  fs.writeFileSync(path.join(output, 'results.tap'), tap);
  const count = Number(tap.match(/^# tests (\d+)$/m)?.[1] ?? 0);
  const skipped = Number(tap.match(/^# skipped (\d+)$/m)?.[1] ?? 0);
  const todo = Number(tap.match(/^# todo (\d+)$/m)?.[1] ?? 0);
  const passed = Number(tap.match(/^# pass (\d+)$/m)?.[1] ?? 0);
  // Node emits a passing file-level test when a file registers no tests. That
  // synthetic success must not satisfy our nonempty verification requirement.
  const topLevelNames = [...tap.matchAll(/^# Subtest: (.+)$/gm)].map(match => match[1].replaceAll('\\', '/'));
  const emptyFiles = files.filter(name => topLevelNames.includes(`lib/${name}`) || topLevelNames.includes(path.join(ui, 'lib', name).replaceAll('\\', '/')));
  const ok = code === 0 && count > 0 && passed === count && skipped === 0 && todo === 0 && emptyFiles.length === 0;
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify({ count, passed, skipped, todo, emptyFiles, exitCode: code, ok }, null, 2) + '\n');
  if (!ok) { console.error('Frontend verification requires executed, passing tests with no skips or TODOs.'); process.exitCode = 1; }
});
