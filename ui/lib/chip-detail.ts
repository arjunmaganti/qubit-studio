import { CHIP, DIE_SCALE, PLATE } from './chip-geometry.ts';

/** Shared presentation geometry. These dimensions never enter the solver. */
export const BOND_COUNT = 46;
export const bondPosition = (i: number) => -0.47 + i * 0.94 / (BOND_COUNT - 1);
export const bondPoints = (i: number, side: number): [number, number, number][] => {
  const t = bondPosition(i);
  return [[t, 0.008, CHIP.size / 2 - 0.022],
    [t * 1.015, 0.051 + Math.sin(i * 1.7 + side) * 0.003, CHIP.size / 2 + 0.026],
    [t * 1.05, PLATE.top + 0.003, (PLATE.window / 2 + 0.028) / DIE_SCALE]];
};
export const BOND_FINISH = { wire: '#d7b579', foot: '#d6b77a', land: '#d4b373' };
export const JUNCTION_ELECTRODE: [number, number][] = [
  [-0.034, -0.011], [-0.003, -0.011], [-0.003, -0.005],
  [0.013, -0.005], [0.013, 0.007], [-0.034, 0.007],
];
export const JUNCTION_OVERLAP = { width: 0.024, depth: 0.022, z: 0.002, upperZ: 0.003, color: '#b9b5cb' };

export const FILM_TEXTURE_SIZE = 2048;
export const PERFORATIONS = { start: 150, end: 1898, pitch: 24, size: 5, border: 22 };
export const FILM_LAUNCHES = Array.from({length: 64}, (_, i) => {
  const t = i / 63 - 0.5, x = t * 1740, innerX = t * 1280, innerY = 570 + Math.abs(t) * 110;
  return { x, width: i % 8 === 0 ? 2.2 : 1.4,
    points: [[x, 931], [x, 825 - Math.abs(t) * 120], [innerX, innerY], [innerX, innerY - 32]] };
});

/** Undistorted top projection of the 3D die. Legacy outline coordinates remain intact. */
export const INSPECTION_SCALE = 378 / 1.08;
export const PLAN_ASPECT = 378 / 698;
export const inspectionPoint = (x: number, y: number): [number, number] => [500 + (x - 500) * PLAN_ASPECT, y];
export const inspectionWorldPoint = (x: number, z: number): [number, number] => [500 + x * INSPECTION_SCALE, 310 + z * INSPECTION_SCALE];
export const PLAN_TRANSFORM = `translate(${500 * (1 - PLAN_ASPECT)} 0) scale(${PLAN_ASPECT} 1)`;
export const FILM_TRANSFORM = `translate(500 310) scale(${CHIP.size * INSPECTION_SCALE / FILM_TEXTURE_SIZE})`;
