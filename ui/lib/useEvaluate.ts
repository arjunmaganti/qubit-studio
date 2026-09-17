'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { evalReducer, initialEvalState, isStale } from './evaluate-state';
import type { EvalState } from './evaluate-state';
import type { DeviceParams } from './types';
import { validDeviceParams, validDeviceResult } from './device-snapshot';
import { sameParams } from './params';

const DEBOUNCE_MS = 140;

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.detail === 'string') return data.detail;
    return `Simulation request failed (HTTP ${response.status}).`;
  } catch {
    return `Simulation request failed (HTTP ${response.status}).`;
  }
}

export interface EvaluateHandle extends EvalState {
  stale: boolean;
  retry: () => void;
}

/**
 * Debounced evaluate against the same-origin proxy. Every edit issues a new
 * sequence number; only the newest sequence may become the displayed result.
 */
export function useEvaluate(params: DeviceParams): EvaluateHandle {
  const [state, dispatch] = useReducer(evalReducer, initialEvalState);
  const [attempt, setAttempt] = useState(0);
  const seqRef = useRef(0);
  const { ej_ghz, ec_ghz, ng, ncut } = params;

  useEffect(() => {
    const seq = ++seqRef.current;
    // Mark the view stale immediately, before the debounce window elapses.
    dispatch({ type: 'request', seq });

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        if (!validDeviceParams({ ej_ghz, ec_ghz, ng, ncut })) throw new Error('Enter valid device parameters before calculating.');
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ej_ghz, ec_ghz, ng, ncut }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(await readError(response));
        const result: unknown = await response.json();
        if (controller.signal.aborted || seq !== seqRef.current) return;
        if (!validDeviceResult(result) || !sameParams(result, { ej_ghz, ec_ghz, ng, ncut })) throw new Error('The solver returned an invalid or mismatched result. Retry the calculation.');
        dispatch({ type: 'success', seq, result });
      } catch (error) {
        if (controller.signal.aborted) return;
        dispatch({
          type: 'failure',
          seq,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ej_ghz, ec_ghz, ng, ncut, attempt]);

  const retry = useCallback(() => {
    dispatch({ type: 'request', seq: ++seqRef.current });
    setAttempt((n) => n + 1);
  }, []);

  // Effects run after render: never expose the old ready state for newly edited inputs.
  const matches = state.result !== null && sameParams(params, state.result);
  const stale = isStale(state) || (state.result !== null && !matches);
  const status = state.status === 'ready' && !matches ? 'loading' : state.status;
  return { ...state, status, stale, retry };
}
