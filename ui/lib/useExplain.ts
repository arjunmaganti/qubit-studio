'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ExplainResult } from './explain-llm.ts';
import { ExplainRequest } from './explain-request.ts';
import { parseChipSnapshot } from './insight-snapshot.ts';
import type { TopicId } from './explain-topics.ts';
import type { ChipSnapshot } from './insight-types.ts';

export interface ExplainHandle {
  answer: ExplainResult | null;
  loading: boolean;
  error: string | null;
  canAsk: boolean;
  ask: () => void;
  cancel: () => void;
}

export function useExplain(snapshot: ChipSnapshot, topicOrTopics: TopicId[] | TopicId | null): ExplainHandle {
  const [request] = useState(() => new ExplainRequest());
  const state = useSyncExternalStore(request.subscribe, request.getSnapshot, request.getSnapshot);
  const topicsKey = [...new Set(Array.isArray(topicOrTopics) ? topicOrTopics : topicOrTopics ? [topicOrTopics] : [])].sort().join(',');
  const key = JSON.stringify({ topics: topicsKey, snapshot });
  const valid = useMemo(() => parseChipSnapshot(snapshot).ok, [snapshot]);
  const canAsk = topicsKey.length > 0 && snapshot.readiness === 'ready' && valid;
  // Cleanup belongs to the producing key, so it cannot cancel a newer request.
  useEffect(() => () => request.cancel(key), [request, key]);
  const ask = useCallback(() => {
    if (canAsk) request.ask(key, topicsKey.split(',') as TopicId[], snapshot);
  }, [request, key, topicsKey, snapshot, canAsk]);
  const cancel = useCallback(() => request.cancel(), [request]);
  const current = state.key === key && canAsk;
  return { answer: current ? state.answer : null, loading: current && state.loading, error: current ? state.error : null, canAsk, ask, cancel };
}
