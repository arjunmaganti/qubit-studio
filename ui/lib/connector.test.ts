import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anchorVisible, connectorPath, ndcToStage } from './connector.ts';

const canvas = { x: 0, y: 56, width: 1000, height: 600 };

describe('ndcToStage', () => {
  it('should map the NDC origin to the canvas centre offset by the canvas origin', () => {
    assert.deepEqual(ndcToStage({ x: 0, y: 0, z: 0, w: 1 }, canvas), { x: 500, y: 356 });
  });

  it('should map NDC top-left to the canvas top-left', () => {
    assert.deepEqual(ndcToStage({ x: -1, y: 1, z: 0, w: 1 }, canvas), { x: 0, y: 56 });
  });

  it('should respect a canvas that is the left half of the stage (Split)', () => {
    const half = { x: 0, y: 56, width: 500, height: 600 };
    assert.deepEqual(ndcToStage({ x: 1, y: -1, z: 0, w: 1 }, half), { x: 500, y: 656 });
  });
});

describe('anchorVisible', () => {
  it('should be visible inside the clip volume and canvas', () => {
    assert.equal(anchorVisible({ x: 0.2, y: -0.3, z: 0.5, w: 2 }, canvas), true);
  });

  it('should hide a point behind the camera', () => {
    assert.equal(anchorVisible({ x: 0, y: 0, z: 0.5, w: -1 }, canvas), false);
    assert.equal(anchorVisible({ x: 0, y: 0, z: 1.2, w: 1 }, canvas), false);
  });

  it('should hide a point panned off the canvas', () => {
    assert.equal(anchorVisible({ x: 1.4, y: 0, z: 0.5, w: 1 }, canvas), false);
  });
});

describe('connectorPath', () => {
  it('should end at the vertical centre of the badge left edge with a horizontal last leg', () => {
    const path = connectorPath({ x: 300, y: 400 }, { x: 900, y: 100, width: 32, height: 32 });
    assert.equal(path.length, 3);
    assert.deepEqual(path[0], { x: 300, y: 400 });
    assert.deepEqual(path[2], { x: 900, y: 116 });
    assert.equal(path[1].y, path[2].y);
    assert.ok(path[1].x < path[2].x);
  });
});
