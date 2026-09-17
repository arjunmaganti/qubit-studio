import type { PartId } from './parts';

/** Axis-aligned bounding box of one rendered group, used for camera fitting. */
export interface PartGeometry {
  id: PartId;
  size: [number, number, number];
  position: [number, number, number];
  /** Vertical offset at explode = 1; y = position[1] + explodeY * explode. */
  explodeY: number;
}

/**
 * Illustrative assembly. World units, y up, chip top face at y = 0, assembly centred on the origin.
 * Nothing here is a fabrication dimension; proportions are chosen for legibility.
 *
 * Stack (bottom → top): package frame · carrier board · substrate chip · ground pattern · pads /
 * junction / gate. The graphite lid plate and gold clamps belong to the package and explode upward
 * while the frame explodes downward, so the exploded view reads as a sandwich.
 */
export const FRAME = { outer: 2.5, inner: 2.12, top: 0.0, depth: 0.22, explodeY: -0.85 };
export const BOARD = { size: 2.16, top: -0.04, thickness: 0.05, explodeY: -0.42 };
export const PLATE = { size: 1.93, window: 0.90, top: 0.03, depth: 0.07, explodeY: 1.3 };
/** Presentation scale of the complete die, preserving the linked Layout's circuit proportions. */
export const DIE_SCALE = 0.76;
export const isDiePart = (id: PartId) => !['package', 'board'].includes(id);
export const CHIP = { size: 1.08, thickness: 0.04, explodeY: -0.1 };
export const GROUND = { size: 1.08, explodeY: 0.32 };
export const PADS = { width: 0.45, depth: 0.43, height: 0.012, offsetX: 0.225, explodeY: 0.63 };
export const JUNCTION = { explodeY: 0.94 };
export const GATE = { from: 233*1.08/698, to: 442*1.08/698, explodeY: 0.63 };

const unscaledParts: PartGeometry[] = [
  { id: 'package', size: [FRAME.outer, FRAME.depth, FRAME.outer], position: [0, FRAME.top - FRAME.depth / 2, 0], explodeY: FRAME.explodeY },
  { id: 'package', size: [PLATE.size, PLATE.depth + 0.06, PLATE.size], position: [0, PLATE.top - PLATE.depth / 2 + 0.03, 0], explodeY: PLATE.explodeY },
  { id: 'board', size: [BOARD.size, BOARD.thickness, BOARD.size], position: [0, BOARD.top - BOARD.thickness / 2, 0], explodeY: BOARD.explodeY },
  { id: 'substrate', size: [CHIP.size, CHIP.thickness, CHIP.size], position: [0, -CHIP.thickness / 2, 0], explodeY: CHIP.explodeY },
  { id: 'ground', size: [GROUND.size, 0.004, GROUND.size], position: [0, 0.002, 0], explodeY: GROUND.explodeY },
  { id: 'capacitor', size: [PADS.width, PADS.height, PADS.depth], position: [-PADS.offsetX, PADS.height / 2, 0], explodeY: PADS.explodeY },
  { id: 'capacitor', size: [PADS.width, PADS.height, PADS.depth], position: [PADS.offsetX, PADS.height / 2, 0], explodeY: PADS.explodeY },
  { id: 'junction', size: [0.069, 0.013, 0.026], position: [0, 0.015, 0.002], explodeY: JUNCTION.explodeY },
  { id: 'gate', size: [GATE.to - GATE.from, 0.01, 0.04], position: [(GATE.from + GATE.to) / 2, 0.005, 0], explodeY: GATE.explodeY },
];
export const PARTS_GEOMETRY: PartGeometry[] = unscaledParts.map(part => isDiePart(part.id) ? {
  ...part,
  size: [part.size[0] * DIE_SCALE, part.size[1], part.size[2] * DIE_SCALE],
  position: [part.position[0] * DIE_SCALE, part.position[1], part.position[2] * DIE_SCALE],
} : part);

/**
 * Connector anchor per part: a point on a face exposed in the assembled state at the default pose.
 * Illustrative choice; there is no occlusion test, so after orbiting to the far side the callout can
 * point through the assembly.
 */
const unscaledAnchors: Record<PartId, { point: [number, number, number]; explodeY: number }> = {
  junction: { point: [0, 0.022, 0], explodeY: JUNCTION.explodeY },
  capacitor: { point: [PADS.offsetX, PADS.height, -PADS.depth / 2 + 0.03], explodeY: PADS.explodeY },
  gate: { point: [345*1.08/698, 0.01, 0], explodeY: GATE.explodeY },
  ground: { point: [0.34, 0.004, 0.3], explodeY: GROUND.explodeY },
  substrate: { point: [-0.45, -0.02, 0.45], explodeY: CHIP.explodeY },
  board: { point: [0.925, BOARD.top, -0.55], explodeY: BOARD.explodeY },
  package: { point: [1.125, FRAME.top, 0.55], explodeY: FRAME.explodeY },
};
export const ANCHORS = Object.fromEntries(Object.entries(unscaledAnchors).map(([id, anchor]) => [id, {
  ...anchor,
  point: isDiePart(id as PartId)
    ? [anchor.point[0] * DIE_SCALE, anchor.point[1], anchor.point[2] * DIE_SCALE]
    : anchor.point,
}])) as typeof unscaledAnchors;
