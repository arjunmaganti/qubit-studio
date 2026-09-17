/** Pure camera-fitting maths. No three.js so it can run under node's test runner. */

interface BoxPart {
  size: [number, number, number];
  position: [number, number, number];
  explodeY: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const RADIUS_MARGIN = 1.05;
/** Gap kept between the framed object and any overlay edge. */
const OVERLAY_GAP = 24;

/**
 * Distance from the target at which a sphere of `radius` fits inside the
 * narrower of the vertical and horizontal fields of view.
 *
 * @returns NaN when the viewport is too small to be meaningful (< 2px either way).
 */
export function fitDistance(radius: number, fovDeg: number, width: number, height: number): number {
  return fitDistanceInRegion(radius, fovDeg, height, width, height);
}

/**
 * Distance at which the sphere fits a `regionW × regionH` pixel window of a canvas whose full
 * height spans `fovDeg`. Angular extent scales with pixels over the canvas height, so a region
 * narrower than the canvas needs a larger distance and the full canvas reduces to `fitDistance`.
 */
export function fitDistanceInRegion(
  radius: number,
  fovDeg: number,
  canvasHeight: number,
  regionW: number,
  regionH: number,
): number {
  if (canvasHeight < 2 || regionW < 2 || regionH < 2) return Number.NaN;
  const halfTan = Math.tan(((fovDeg * Math.PI) / 180) / 2);
  const vertical = 2 * Math.atan(halfTan * (regionH / canvasHeight));
  const horizontal = 2 * Math.atan(halfTan * (regionW / canvasHeight));
  return radius / Math.sin(Math.min(vertical, horizontal) / 2);
}

/**
 * Radius of an origin-centred sphere containing every box corner at the given
 * explode (0..1), plus a small margin so edges never touch the frustum.
 */
export function sceneRadius(explode: number, parts: readonly BoxPart[]): number {
  const farthest = parts.reduce((max, { size, position, explodeY }) => {
    // Farthest corner of an axis-aligned box from the origin: |centre| + half extent per axis.
    const x = Math.abs(position[0]) + size[0] / 2;
    const y = Math.abs(position[1] + explodeY * explode) + size[1] / 2;
    const z = Math.abs(position[2]) + size[2] / 2;
    return Math.max(max, Math.hypot(x, y, z));
  }, 0);
  return farthest * RADIUS_MARGIN;
}

/**
 * The part of the canvas not covered by overlays. Rects share the canvas's pixel origin.
 * A full-width band trims the top or bottom (whichever half its centre is in); any other overlay
 * trims the side its centre is on. Overlays that do not intersect the canvas are ignored.
 */
export function freeRegion(canvas: Rect, overlays: readonly Rect[]): Rect {
  let left = 0;
  let top = 0;
  let right = canvas.width;
  let bottom = canvas.height;
  for (const o of overlays) {
    const ox2 = o.x + o.width;
    const oy2 = o.y + o.height;
    const intersects = o.x < canvas.width && ox2 > 0 && o.y < canvas.height && oy2 > 0;
    if (!intersects) continue;
    const spansWidth = o.x <= 0 && ox2 >= canvas.width;
    const centreX = (o.x + ox2) / 2;
    const centreY = (o.y + oy2) / 2;
    if (spansWidth) {
      if (centreY < canvas.height / 2) top = Math.max(top, oy2 + OVERLAY_GAP);
      else bottom = Math.min(bottom, o.y - OVERLAY_GAP);
    } else if (centreX >= canvas.width / 2) {
      right = Math.min(right, o.x - OVERLAY_GAP);
    } else {
      left = Math.max(left, ox2 + OVERLAY_GAP);
    }
  }
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** Offset of the region centre from the canvas centre, in canvas pixels. */
export function viewOffset(canvas: Rect, region: Rect): { dx: number; dy: number } {
  return {
    dx: region.x + region.width / 2 - canvas.width / 2,
    dy: region.y + region.height / 2 - canvas.height / 2,
  };
}
