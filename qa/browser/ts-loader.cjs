const path = require('node:path');
const { createRequire } = require('node:module');
const ts = createRequire(path.resolve(__dirname, '../../ui/package.json'))('typescript');

module.exports = function compile(source) {
  const { negativeControl } = this.getOptions();
  // In-memory fault injection only. Never write or mutate production files.
  if (negativeControl === 'search' && this.resourcePath.endsWith('/components/DesignLab.tsx')) {
    source = source.replace('aria-label="Find variables + materials" aria-busy={busy === \'search\'}', '');
  }
  if (negativeControl === 'compare' && this.resourcePath.endsWith('/components/MaterialSensitivity.tsx')) {
    source = source.replace('aria-label="Compare scenario" aria-busy={loading}', '');
  }
  const result = ts.transpileModule(source, { fileName: this.resourcePath, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors?.length) throw new Error(errors.map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'));
  return result.outputText;
};
