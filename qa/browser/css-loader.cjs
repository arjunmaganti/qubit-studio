// Apply production component styles in the standalone React browser harness.
const fs = require('node:fs');
const path = require('node:path');
module.exports = function loadCSS(source) {
  // KaTeX's installed font files travel with the bundle. Keep the runner's
  // strict network policy: no remote fonts or extra runtime allowlist.
  source = source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (match, _quote, url) => {
    if (!/\.(woff2?|ttf)$/.test(url) || /^(?:[a-z]+:|\/)/i.test(url)) return match;
    const file = path.resolve(path.dirname(this.resourcePath), url);
    this.addDependency(file);
    const ext = path.extname(file).slice(1);
    return `url("data:font/${ext};base64,${fs.readFileSync(file).toString('base64')}")`;
  });
  return `const style = document.createElement('style');\nstyle.textContent = ${JSON.stringify(source)};\ndocument.head.appendChild(style);`;
};
