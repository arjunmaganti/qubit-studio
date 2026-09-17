import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fitDistance, fitDistanceInRegion, freeRegion, sceneRadius, viewOffset } from './camera-fit.ts';
import { PARTS_GEOMETRY } from './chip-geometry.ts';

const FOV = 38;

describe('fitDistance', () => {
  it('should not change with aspect while the vertical fov is limiting (landscape)', () => {
    assert.equal(fitDistance(1, FOV, 1000, 500), fitDistance(1, FOV, 2000, 500));
  });

  it('should grow when the pane goes portrait and the horizontal fov becomes limiting', () => {
    const landscape = fitDistance(1, FOV, 1000, 500);
    const portrait = fitDistance(1, FOV, 500, 1000);
    assert.ok(portrait > landscape);
  });

  it('should return NaN for a degenerate viewport', () => {
    assert.ok(Number.isNaN(fitDistance(1, FOV, 1, 500)));
    assert.ok(Number.isNaN(fitDistance(1, FOV, 500, 0)));
  });
});

describe('fitDistanceInRegion', () => {
  it('should equal fitDistance when the region is the whole canvas', () => {
    assert.equal(fitDistanceInRegion(1.3, FOV, 700, 1400, 700), fitDistance(1.3, FOV, 1400, 700));
  });

  it('should grow when a right-docked card narrows the region', () => {
    const full = fitDistanceInRegion(1.3, FOV, 700, 1400, 700);
    const narrowed = fitDistanceInRegion(1.3, FOV, 700, 500, 700);
    assert.ok(narrowed > full);
  });

  it('should grow when top and bottom bands shorten the region', () => {
    const full = fitDistanceInRegion(1.3, FOV, 700, 1400, 700);
    const shortened = fitDistanceInRegion(1.3, FOV, 700, 1400, 500);
    assert.ok(shortened > full);
  });

  it('should be monotone in radius', () => {
    assert.ok(fitDistanceInRegion(2, FOV, 700, 900, 600) > fitDistanceInRegion(1, FOV, 700, 900, 600));
  });
});

describe('sceneRadius', () => {
  it('should be larger exploded than assembled', () => {
    assert.ok(sceneRadius(1, PARTS_GEOMETRY) > sceneRadius(0, PARTS_GEOMETRY));
  });

  it('should match the farthest assembled corner (package frame) plus 5% margin', () => {
    const frame = PARTS_GEOMETRY[0];
    const expected =
      Math.hypot(frame.size[0] / 2, Math.abs(frame.position[1]) + frame.size[1] / 2, frame.size[2] / 2) * 1.05;
    assert.ok(Math.abs(sceneRadius(0, PARTS_GEOMETRY) - expected) < 1e-12);
  });

  it('should be monotone non-decreasing in explode', () => {
    let prev = sceneRadius(0, PARTS_GEOMETRY);
    for (let e = 0.1; e <= 1.0001; e += 0.1) {
      const next = sceneRadius(e, PARTS_GEOMETRY);
      assert.ok(next >= prev, `radius dropped between explode ${e - 0.1} and ${e}`);
      prev = next;
    }
  });
});

describe('freeRegion', () => {
  const canvas = { x: 0, y: 0, width: 1400, height: 700 };

  it('should return the whole canvas with no overlays', () => {
    assert.deepEqual(freeRegion(canvas, []), canvas);
  });

  it('should trim a right-docked inspector card plus a gap', () => {
    const card = { x: 936, y: 72, width: 440, height: 500 };
    const region = freeRegion(canvas, [card]);
    assert.equal(region.x, 0);
    assert.equal(region.width, 936 - 24);
    assert.equal(region.height, 700);
  });

  it('should trim full-width bands at the top and bottom', () => {
    const top = { x: 0, y: 0, width: 1400, height: 56 };
    const bottom = { x: 0, y: 652, width: 1400, height: 48 };
    const region = freeRegion(canvas, [top, bottom]);
    assert.equal(region.y, 56 + 24);
    assert.equal(region.height, 652 - 24 - (56 + 24));
  });

  it('should ignore an overlay that sits outside the canvas (stacked layout)', () => {
    const below = { x: 0, y: 720, width: 1400, height: 400 };
    assert.deepEqual(freeRegion(canvas, [below]), canvas);
  });

  it('should never return a negative size', () => {
    const huge = { x: 10, y: 0, width: 2000, height: 700 };
    const region = freeRegion(canvas, [huge]);
    assert.ok(region.width >= 0 && region.height >= 0);
  });
});

describe('viewOffset', () => {
  const canvas = { x: 0, y: 0, width: 1400, height: 700 };

  it('should be zero for an unobstructed canvas', () => {
    assert.deepEqual(viewOffset(canvas, canvas), { dx: 0, dy: 0 });
  });

  it('should shift left when a card occupies the right side', () => {
    const region = freeRegion(canvas, [{ x: 936, y: 72, width: 440, height: 500 }]);
    assert.ok(viewOffset(canvas, region).dx < 0);
  });
});
