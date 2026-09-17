import type { DeviceResult } from './types';

export type EvalStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface EvalState {
  status: EvalStatus;
  /** Sequence number of the newest issued request. */
  seq: number;
  /** Sequence number of the currently displayed result. */
  appliedSeq: number;
  result: DeviceResult | null;
  error: string | null;
}

export type EvalEvent =
  | { type: 'request'; seq: number }
  | { type: 'success'; seq: number; result: DeviceResult }
  | { type: 'failure'; seq: number; error: string };

export const initialEvalState: EvalState = {
  status: 'idle',
  seq: 0,
  appliedSeq: -1,
  result: null,
  error: null,
};

/**
 * Latest edit wins. A response may only become current if it answers the newest
 * issued request; anything older is dropped, even if it arrives later.
 */
export function evalReducer(state: EvalState, event: EvalEvent): EvalState {
  switch (event.type) {
    case 'request':
      // Keep the previous result visible; the UI labels it as stale.
      if (event.seq < state.seq) return state;
      return { ...state, status: 'loading', seq: event.seq, error: null };
    case 'success':
      if (event.seq !== state.seq) return state;
      return { ...state, status: 'ready', appliedSeq: event.seq, result: event.result, error: null };
    case 'failure':
      if (event.seq !== state.seq) return state;
      // Retain the last completed snapshot, explicitly outdated and unavailable to actions.
      return { ...state, status: 'error', error: event.error };
    default:
      return state;
  }
}

/** True when the displayed result no longer answers the newest request. */
export function isStale(state: EvalState): boolean {
  return state.status !== 'ready' && state.result !== null;
}
