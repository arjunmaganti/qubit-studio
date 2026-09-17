const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ui = path.resolve(__dirname, '../../ui');
const requireUI = createRequire(path.join(ui, 'package.json'));

// Reuse the bundler already locked by Next 16.3.5. An incompatible Next upgrade
// must fail this build; do not substitute component stubs or silently skip it.
module.exports = async function build(output, negativeControl) {
  const { webpack } = requireUI('next/dist/compiled/webpack/webpack');
  if (negativeControl) {
    const targets = {
      search: ['components/DesignLab.tsx', 'aria-label="Find variables + materials" aria-busy={busy === \'search\'}'],
      compare: ['components/MaterialSensitivity.tsx', 'aria-label="Compare scenario" aria-busy={loading}'],
    };
    if (!targets[negativeControl]) throw new Error('Unknown negative control.');
    const [file, text] = targets[negativeControl];
    if (!fs.readFileSync(path.join(ui, file), 'utf8').includes(text)) throw new Error('Negative-control target changed; update the test transform explicitly.');
  }
  await new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: 'development', devtool: false, target: 'web',
      entry: path.join(__dirname, 'journeys.tsx'),
      output: { path: output, filename: 'journeys.js', publicPath: '/' },
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { '@': ui, react: path.join(ui, 'node_modules/react'), 'react-dom': path.join(ui, 'node_modules/react-dom') },
        modules: [path.join(ui, 'node_modules'), 'node_modules'],
      },
      module: { rules: [{ test: /\.css$/, use: { loader: path.join(__dirname, 'css-loader.cjs') } }, { test: /\.tsx?$/, exclude: /node_modules/, use: { loader: path.join(__dirname, 'ts-loader.cjs'), options: { negativeControl } } }] },
    });
    compiler.run((error, stats) => {
      if (stats) fs.writeFileSync(path.join(output, 'build.log'), stats.toString({ colors: false, all: false, errors: true, warnings: true }));
      compiler.close(closeError => error || closeError || stats?.hasErrors()
        ? reject(error || closeError || new Error('Harness compilation failed; see build.log.')) : resolve());
    });
  });
  fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(output, 'index.html'));
  const font = 'fonts/instrument-sans/InstrumentSans-Variable.ttf';
  fs.mkdirSync(path.dirname(path.join(output, font)), { recursive: true });
  fs.copyFileSync(path.join(ui, 'public', font), path.join(output, font));
};
