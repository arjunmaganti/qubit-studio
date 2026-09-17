/** Pure maths for the selection callout line. No DOM, no three.js. */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Normalised device coordinates of the anchor after camera projection; w is clip-space w. */
export interface Projected {
  x: number;
  y: number;
  z: number;
  w: number;
}

const ELBOW = 36;

/** Convert an NDC point to pixels inside a canvas rect; the rect origin is in stage pixels. */
export function ndcToStage(p: Projected, canvas: Rect): Point {
  return {
    x: canvas.x + ((p.x + 1) / 2) * canvas.width,
    y: canvas.y + ((1 - p.y) / 2) * canvas.height,
  };
}

/** In front of the camera, inside the clip volume, and inside the canvas rect. */
export function anchorVisible(p: Projected, canvas: Rect): boolean {
  if (!(p.w > 0) || p.z <= -1 || p.z >= 1) return false;
  const px = ndcToStage(p, canvas);
  return (
    px.x >= canvas.x && px.x <= canvas.x + canvas.width && px.y >= canvas.y && px.y <= canvas.y + canvas.height
  );
}

/**
 * Anchor → elbow → left edge of the card badge, all in stage pixels.
 * The final leg is horizontal so the line enters the card squarely.
 */
export function connectorPath(anchor: Point, badge: Rect): Point[] {
  const end = { x: badge.x, y: badge.y + badge.height / 2 };
  const elbow = { x: badge.x - ELBOW, y: end.y };
  return [anchor, elbow, end];
}
