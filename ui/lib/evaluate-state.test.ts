import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evalReducer, initialEvalState, isStale } from './evaluate-state.ts';
import type { EvalState } from './evaluate-state.ts';
import type { DeviceResult } from './types.ts';

const result = (ej: number) => ({ ej_ghz: ej, f01_ghz: ej / 2 }) as DeviceResult;

function apply(events: Parameters<typeof evalReducer>[1][], from: EvalState = initialEvalState): EvalState {
  return events.reduce(evalReducer, from);
}

describe('evalReducer', () => {
  it('should mark loading and keep the previous result when a request starts', () => {
    const ready = apply([{ type: 'request', seq: 1 }, { type: 'success', seq: 1, result: result(15) }]);
    const next = evalReducer(ready, { type: 'request', seq: 2 });
    assert.equal(next.status, 'loading');
    assert.equal(next.result?.ej_ghz, 15);
  });

  it('should apply a response that answers the newest request', () => {
    const state = apply([{ type: 'request', seq: 1 }, { type: 'success', seq: 1, result: result(16) }]);
    assert.equal(state.status, 'ready');
    assert.equal(state.result?.ej_ghz, 16);
  });

  it('should drop a stale response that arrives after a newer request', () => {
    const state = apply([
      { type: 'request', seq: 1 },
      { type: 'request', seq: 2 },
      { type: 'success', seq: 1, result: result(15.2) },
    ]);
    assert.equal(state.result, null);
    assert.equal(state.status, 'loading');
  });

  it('should keep the latest edit when responses finish out of order', () => {
    const state = apply([
      { type: 'request', seq: 1 },
      { type: 'request', seq: 2 },
      { type: 'success', seq: 2, result: result(16) },
      { type: 'success', seq: 1, result: result(15.2) },
    ]);
    assert.equal(state.result?.ej_ghz, 16);
    assert.equal(state.status, 'ready');
  });

  it('retains the previous completed snapshot as outdated when the newest request fails', () => {
    const state = apply([
      { type: 'request', seq: 1 },
      { type: 'success', seq: 1, result: result(15) },
      { type: 'request', seq: 2 },
      { type: 'failure', seq: 2, error: 'backend unreachable' },
    ]);
    assert.equal(state.status, 'error');
    assert.equal(state.result?.ej_ghz, 15);
    assert.equal(isStale(state), true);
    assert.equal(state.error, 'backend unreachable');
  });

  it('should ignore a stale failure so it cannot blank a current result', () => {
    const state = apply([
      { type: 'request', seq: 1 },
      { type: 'request', seq: 2 },
      { type: 'success', seq: 2, result: result(16) },
      { type: 'failure', seq: 1, error: 'aborted' },
    ]);
    assert.equal(state.status, 'ready');
    assert.equal(state.result?.ej_ghz, 16);
  });
});

describe('isStale', () => {
  it('should be true while a newer request is in flight', () => {
    const state = apply([
      { type: 'request', seq: 1 },
      { type: 'success', seq: 1, result: result(15) },
      { type: 'request', seq: 2 },
    ]);
    assert.equal(isStale(state), true);
  });

  it('should be false once the newest response has been applied', () => {
    const state = apply([{ type: 'request', seq: 1 }, { type: 'success', seq: 1, result: result(15) }]);
    assert.equal(isStale(state), false);
  });
});
