import assert from 'node:assert/strict';
import test from 'node:test';
import { LEFT_ELECTRODE, RIGHT_ELECTRODE, SUBSTRATE_PLAN, GATE_PLAN, planContour, planPoint } from './chip-plan.ts';

test('3D contours preserve Layout pad steps, gate side and chip boundary',()=>{
 for(const path of [LEFT_ELECTRODE,RIGHT_ELECTRODE,SUBSTRATE_PLAN,GATE_PLAN])assert.ok(planContour(path).every(p=>p.every(Number.isFinite)));
 assert.ok(planContour(LEFT_ELECTRODE).length>20);
 assert.ok(Math.max(...planContour(LEFT_ELECTRODE).map(p=>p[0]))<0);
 assert.ok(Math.min(...planContour(RIGHT_ELECTRODE).map(p=>p[0]))>0);
 assert.ok(Math.min(...planContour(GATE_PLAN).map(p=>p[0]))>0);
 assert.deepEqual(planPoint(500,310),[0,0]);
 const chip=planContour(SUBSTRATE_PLAN);assert.equal(Math.max(...chip.map(p=>p[0]))-Math.min(...chip.map(p=>p[0])),1.08);
});
