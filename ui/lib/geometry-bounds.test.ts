import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Group, Mesh, OrthographicCamera } from 'three';
import { projectedBounds } from './geometry-bounds.ts';

function scene() {
  const root = new Group(), part = new Group();
  part.add(new Mesh(new BoxGeometry(1, 1, 0.1)));
  root.add(part);
  const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 20);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  return { root, part, camera };
}

test('geometry bounds use the current explode transform before the next WebGL render', () => {
  const { root, part, camera } = scene();
  assert.deepEqual(projectedBounds(root, camera, 400, 400), { left: 150, top: 150, right: 250, bottom: 250 });
  part.position.y = 1;
  assert.deepEqual(projectedBounds(root, camera, 400, 400), { left: 150, top: 50, right: 250, bottom: 150 });
  part.position.y = 0;
  assert.deepEqual(projectedBounds(root, camera, 400, 400), { left: 150, top: 150, right: 250, bottom: 250 });
});

test('hidden component groups and selection hit volumes cannot change the camera fit', () => {
  const { root, camera } = scene();
  const expected = projectedBounds(root, camera, 400, 400);
  const hidden = new Group();
  hidden.visible = false;
  hidden.add(new Mesh(new BoxGeometry(100, 100, 100)));
  const hit = new Mesh(new BoxGeometry(50, 50, 50));
  hit.userData.hit = true;
  root.add(hidden, hit);
  assert.deepEqual(projectedBounds(root, camera, 400, 400), expected);
});

test('bounds become empty when every component is hidden and recover when shown', () => {
  const { root, part, camera } = scene();
  part.visible = false;
  assert.equal(projectedBounds(root, camera, 400, 400), null);
  part.visible = true;
  assert.ok(projectedBounds(root, camera, 400, 400));
  assert.equal(projectedBounds(root, camera, 0, 400), null);
});

test('world transforms and viewport proportions are included in the measured geometry', () => {
  const { root, part, camera } = scene();
  root.position.x = 0.5;
  part.scale.set(2, 0.5, 1);
  assert.deepEqual(projectedBounds(root, camera, 800, 400), { left: 300, top: 175, right: 700, bottom: 225 });
});
