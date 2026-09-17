import { parseChipSnapshot } from './insight-snapshot.ts';
import { isTopicId, TOPIC_IDS, type TopicId } from './explain-topics.ts';
import type { ChipSnapshot } from './insight-types.ts';
import type { ExplainResult } from './explain-llm.ts';

export const MAX_EXPLAIN_BODY_BYTES = 32_768;
export const EXPLAIN_TIMEOUT_MS = 25_000;

interface ExplainDependencies {
  configured: () => boolean;
  explain: (topics: TopicId[], snapshot: ChipSnapshot, signal: AbortSignal) => Promise<ExplainResult>;
}

class RequestProblem extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function readBody(request: Request, signal: AbortSignal): Promise<unknown> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_EXPLAIN_BODY_BYTES)) {
    throw new RequestProblem('Explanation request is too large.', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestProblem('Request body must contain JSON.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_EXPLAIN_BODY_BYTES) {
        await reader.cancel();
        throw new RequestProblem('Explanation request is too large.', 413);
      }
      chunks.push(value);
    }
    signal.throwIfAborted();
  } finally {
    signal.removeEventListener('abort', abort);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new RequestProblem('Request body was not valid JSON.', 400); }
}

/** Dependency injection keeps route tests entirely separate from provider configuration. */
export function createExplainHandler(dependencies: ExplainDependencies) {
  return async function handleExplain(request: Request): Promise<Response> {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(EXPLAIN_TIMEOUT_MS)]);
    const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    try {
      const body = await readBody(request, signal);
      if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new RequestProblem('Explain request must be a JSON object.', 400);
      const source = body as Record<string, unknown>;
      const requested = source.topics ?? (source.topic === undefined ? undefined : [source.topic]);
      if (!Array.isArray(requested) || requested.length === 0 || requested.length > TOPIC_IDS.length || !requested.every(isTopicId)) {
        throw new RequestProblem(`Select between 1 and ${TOPIC_IDS.length} known explanation topics.`, 400);
      }
      const topics = [...new Set(requested as TopicId[])].sort();
      const parsed = parseChipSnapshot(source.snapshot);
      if (!parsed.ok) throw new RequestProblem(parsed.error, 400);
      if (parsed.snapshot.readiness !== 'ready') throw new RequestProblem('Wait for a completed current calculation before asking Gemini.', 409);
      signal.throwIfAborted();
      if (!dependencies.configured()) return respond({ error: 'Explanations are unavailable right now. Please try again later.' }, 503);
      const result = await dependencies.explain(topics, parsed.snapshot, signal);
      signal.throwIfAborted();
      return respond(result);
    } catch (error) {
      if (error instanceof RequestProblem) return respond({ error: error.message }, error.status);
      if (signal.aborted) return respond({ error: 'The explanation request was cancelled or timed out. Please try again.' }, 408);
      return respond({ error: 'Could not generate an explanation. Please try again.' }, 502);
    }
  };
}
