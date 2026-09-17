'use client';

import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { DesignGoals, DeviceParams } from './types.ts';
import { ExperimentSessionStore, searchBaselineParams } from './experiment-session.ts';
import type { ExperimentMaterials, ExperimentSession } from './experiment-session.ts';

/** Owned by Page, not an inspector tab: remounting either tab keeps this session. */
export function useExperimentSession(params: DeviceParams, goals: DesignGoals, materials: ExperimentMaterials, baseline: DeviceParams | null = null): ExperimentSession {
  const pinned = useMemo(() => searchBaselineParams(baseline), [baseline]);
  const [store] = useState(() => new ExperimentSessionStore({ params, goals, materials, baseline: pinned }));
  useSyncExternalStore(store.subscribe, store.getRevision, store.getRevision);
  useLayoutEffect(() => { store.activate(); return () => store.dispose(); }, [store]);
  useLayoutEffect(() => { store.updateContext({ params, goals, materials, baseline: pinned }); }, [store, params, goals, materials, pinned]);
  // Derive freshness against this render's inputs before effects invalidate old requests.
  return store.view({ params, goals, materials, baseline: pinned });
}

export type { ExperimentSession, ExperimentEvidence, ExperimentMaterials } from './experiment-session.ts';
