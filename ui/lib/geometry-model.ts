const ELEMENTARY_CHARGE_C = 1.602176634e-19;
const PLANCK_J_S = 6.62607015e-34;

export interface GeometryAssumptions {
  criticalCurrentDensityAcm2: number;
  capacitanceDensityFfUm2: number;
}

export const DEFAULT_GEOMETRY_ASSUMPTIONS: GeometryAssumptions = {
  criticalCurrentDensityAcm2: 50,
  capacitanceDensityFfUm2: 0.08,
};

export function ejFromJunctionArea(areaUm2: number, criticalCurrentDensityAcm2: number): number {
  const criticalCurrentA = criticalCurrentDensityAcm2 * areaUm2 * 1e-8;
  return criticalCurrentA / (4 * Math.PI * ELEMENTARY_CHARGE_C) / 1e9;
}

export function junctionAreaFromEj(ejGhz: number, criticalCurrentDensityAcm2: number): number {
  const criticalCurrentA = ejGhz * 1e9 * 4 * Math.PI * ELEMENTARY_CHARGE_C;
  return criticalCurrentA / criticalCurrentDensityAcm2 / 1e-8;
}

export function ecFromCapacitorArea(areaUm2: number, capacitanceDensityFfUm2: number): number {
  const capacitanceF = areaUm2 * capacitanceDensityFfUm2 * 1e-15;
  return ELEMENTARY_CHARGE_C ** 2 / (2 * PLANCK_J_S * capacitanceF) / 1e9;
}

export function capacitorAreaFromEc(ecGhz: number, capacitanceDensityFfUm2: number): number {
  const capacitanceF = ELEMENTARY_CHARGE_C ** 2 / (2 * PLANCK_J_S * ecGhz * 1e9);
  return capacitanceF / 1e-15 / capacitanceDensityFfUm2;
}
