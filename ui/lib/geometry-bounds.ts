import { Box3, Mesh, Vector3, type Camera, type Object3D } from 'three';

export interface ProjectedBounds { left: number; top: number; right: number; bottom: number }

const box = new Box3();
const corner = new Vector3();

/** Bounds of visible mesh geometry, excluding selection hit volumes and helper lines. */
export function projectedBounds(root: Object3D, camera: Camera, width: number, height: number): ProjectedBounds | null {
  if (width <= 0 || height <= 0) return null;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  // Measurement runs before WebGL's render pass, including the final explode frame.
  root.updateWorldMatrix(true, true);
  root.traverseVisible((object) => {
    if (!(object instanceof Mesh) || object.userData.hit) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox || object.geometry.boundingBox.isEmpty()) return;
    box.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
    for (let i = 0; i < 8; i += 1) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      corner.project(camera);
      const x = ((corner.x + 1) / 2) * width, y = ((1 - corner.y) / 2) * height;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  });
  return [left, top, right, bottom].every(Number.isFinite) ? { left, top, right, bottom } : null;
}
