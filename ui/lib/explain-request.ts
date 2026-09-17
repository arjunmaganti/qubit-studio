import type { ExplainResult } from './explain-llm.ts';
import type { TopicId } from './explain-topics.ts';
import type { ChipSnapshot } from './insight-types.ts';

export interface ExplainState {
  key: string | null;
  answer: ExplainResult | null;
  loading: boolean;
  error: string | null;
}
const EMPTY: ExplainState = { key: null, answer: null, loading: false, error: null };

/** One deliberate request at a time, owned by the full producing context. */
export class ExplainRequest {
  private state: ExplainState = EMPTY;
  private controller: AbortController | null = null;
  private listeners = new Set<() => void>();
  private transport: typeof fetch;
  constructor(transport: typeof fetch = (...args) => fetch(...args)) { this.transport = transport; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(state: ExplainState) { this.state = state; this.listeners.forEach(listener => listener()); }
  cancel = (key?: string) => {
    if (key !== undefined && this.state.key !== key) return;
    this.controller?.abort();
    this.controller = null;
    this.update(EMPTY);
  };
  ask = (key: string, topics: TopicId[], snapshot: ChipSnapshot) => {
    if (this.controller && this.state.key === key) return;
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    this.update({ key, answer: null, error: null, loading: true });
    const current = () => this.controller === controller && !controller.signal.aborted;
    void (async () => {
      try {
        const response = await this.transport('/api/explain', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics, snapshot }), signal: controller.signal,
        });
        const data: unknown = await response.json().catch(() => null);
        if (!current()) return;
        if (!response.ok) {
          const message = data !== null && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error.slice(0, 240) : 'Could not generate an explanation. Please try again.';
          throw new Error(message);
        }
        const result = data as ExplainResult;
        if (!result || typeof result.title !== 'string' || !result.title.trim() || result.title.length > 180 ||
          typeof result.body !== 'string' || !result.body.trim() || result.body.length > 2500) throw new Error('The server returned an invalid explanation. Please try again.');
        this.update({ key, answer: result, error: null, loading: false });
      } catch (error) {
        if (current()) this.update({ key, answer: null, loading: false, error: error instanceof Error ? error.message : 'Could not generate an explanation. Please try again.' });
      } finally {
        if (current()) this.controller = null;
      }
    })();
  };
}
