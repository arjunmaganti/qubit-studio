import { Fragment } from 'react';
import MathText from './MathText';

const TOKEN = /(EJ\s*\/\s*EC|EJ|EC|f01|f12|ng|ncut|δLP|α|Φ\s*\/\s*Φ₀|[+-]?\d+(?:\.\d+)?e[+-]?\d+(?:–[+-]?\d+(?:\.\d+)?e[+-]?\d+)?|[<>≤±~]?\s*[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:–[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?)?\s*(?:fF\/µm²|A\/cm²|GHz|MHz|kHz|nA|fF|µs|µm²|µm|%))/gi;

const SYMBOLS: Record<string, string> = {
  ej: 'E_J',
  ec: 'E_C',
  'ej/ec': 'E_J/E_C',
  f01: 'f_{01}',
  f12: 'f_{12}',
  ng: 'n_g',
  ncut: 'n_{\\mathrm{cut}}',
  α: '\\alpha',
  'δlp': '\\delta_{\\mathrm{LP}}',
  'φ/φ₀': '\\Phi/\\Phi_0',
};

function toLatex(token: string): string {
  const compact = token.replace(/\s+/g, '');
  const symbol = SYMBOLS[compact.toLowerCase()] ?? SYMBOLS[compact];
  if (symbol) return symbol;

  return compact
    .replace(/^±/, '\\pm ')
    .replace(/^≤/, '\\le ')
    .replace(/^</, '\\lt ')
    .replace(/^>/, '\\gt ')
    .replace(/^~/, '\\sim ')
    .replace(/(-?\d+(?:\.\d+)?)e([+-]?\d+)/gi, '$1\\times 10^{$2}')
    .replace(/–/g, '\\text{–}')
    .replace(/fF\/µm²$/, '\\,\\mathrm{fF}/\\mu\\mathrm{m}^{2}')
    .replace(/A\/cm²$/, '\\,\\mathrm{A}/\\mathrm{cm}^{2}')
    .replace(/µm²$/, '\\,\\mu\\mathrm{m}^{2}')
    .replace(/µs$/, '\\,\\mu\\mathrm{s}')
    .replace(/µm$/, '\\,\\mu\\mathrm{m}')
    .replace(/(GHz|MHz|kHz|nA|fF)$/, '\\,\\mathrm{$1}')
    .replace(/%$/, '\\,\\%');
}

/** Typesets equations and number-plus-unit fragments while preserving surrounding prose. */
export default function RichMathText({ children }: { children: string }) {
  return children.split(TOKEN).map((part, index) => {
    if (!part) return null;
    if (!part.match(new RegExp(`^(?:${TOKEN.source})$`, 'i'))) return <Fragment key={index}>{part}</Fragment>;
    return <MathText key={index} math={toLatex(part)} />;
  });
}
