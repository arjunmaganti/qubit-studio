/**
 * Textbook transmon approximation, with EJ and EC quoted as frequencies (E/h).
 * f01 ≈ √(8 EJ EC) − EC. This is not the solver; it is the formula students
 * meet in Koch et al. Use it only as a comparison overlay.
 */
export function transmonApproxF01Ghz(ejGhz: number, ecGhz: number): number {
  if (!(ejGhz > 0) || !(ecGhz > 0)) return Number.NaN;
  return Math.sqrt(8 * ejGhz * ecGhz) - ecGhz;
}

/** Solver minus approximation, in MHz. Positive means the solver sits above the formula. */
export function approxDeltaMhz(solverF01Ghz: number, ejGhz: number, ecGhz: number): number {
  const approx = transmonApproxF01Ghz(ejGhz, ecGhz);
  if (!Number.isFinite(approx) || !Number.isFinite(solverF01Ghz)) return Number.NaN;
  return (solverF01Ghz - approx) * 1e3;
}
