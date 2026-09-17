import { explainTopic } from '../../../lib/explain-llm.ts';
import { createExplainHandler } from '../../../lib/explain-handler.ts';
import { llmInsightsConfigured } from '../../../lib/insight-llm.ts';

export const dynamic = 'force-dynamic';
export const POST = createExplainHandler({ configured: llmInsightsConfigured, explain: explainTopic });
