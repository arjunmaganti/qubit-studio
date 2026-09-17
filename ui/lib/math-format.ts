import { num, signed } from './format';

const UNITS: Record<string, string> = {
  GHz: '\\mathrm{GHz}',
  MHz: '\\mathrm{MHz}',
  kHz: '\\mathrm{kHz}',
  nA: '\\mathrm{nA}',
  fF: '\\mathrm{fF}',
  us: '\\mu\\mathrm{s}',
  um: '\\mu\\mathrm{m}',
  um2: '\\mu\\mathrm{m}^{2}',
  Acm2: '\\mathrm{A}/\\mathrm{cm}^{2}',
  fFum2: '\\mathrm{fF}/\\mu\\mathrm{m}^{2}',
  percent: '\\%',
  pairCharge: '2e',
};

export function mathValue(value: number, digits: number, unit: keyof typeof UNITS): string {
  return `${num(value, digits)}\\,${UNITS[unit]}`;
}

export function signedMathValue(value: number, digits: number, unit: keyof typeof UNITS): string {
  return `${signed(value, digits)}\\,${UNITS[unit]}`;
}

export function mathRange(min: number, max: number, digits: number, unit: keyof typeof UNITS): string {
  return `${num(min, digits)}\\text{–}${num(max, digits)}\\,${UNITS[unit]}`;
}

export function scientific(value: number, digits = 1): string {
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const coefficient = value / 10 ** exponent;
  return `${num(coefficient, digits)}\\times 10^{${exponent}}`;
}
