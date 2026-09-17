/**
 * Minimal Gemini helper utilities shared by explain-llm.ts and the /api/explain route.
 * This is a focused stub — only the two functions needed by the explain feature.
 */

/** LLM path turns on as soon as GEMINI_API_KEY is present. Set INSIGHTS_USE_LLM=0 to force local. */
export function llmInsightsConfigured(): boolean {
  if (process.env.INSIGHTS_USE_LLM === '0') return false;
  const key = (process.env.GEMINI_API_KEY ?? '').replace(/^["']|["']$/g, '');
  return Boolean(key);
}

/** Extract concatenated text from a Gemini generateContent response body. */
export function textFromGemini(data: unknown): string {
  if (data === null || typeof data !== 'object') return '';
  const candidates = (data as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const first = candidates[0];
  if (first === null || typeof first !== 'object') return '';
  const content = (first as Record<string, unknown>).content;
  if (content === null || typeof content !== 'object') return '';
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) =>
      part !== null && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
        ? (part as { text: string }).text
        : '',
    )
    .join('\n');
}
