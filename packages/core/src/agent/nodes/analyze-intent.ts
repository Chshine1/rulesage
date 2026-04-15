import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState } from '../state';
import { LLMClient } from '../../llm/client';
import { z } from 'zod';

const ResponseSchema = z.object({
  intent: z.string(),
  frameworks: z.array(z.string()),
});

export async function analyzeIntent(
  state: typeof AgentState.State,
  _config?: RunnableConfig,
): Promise<Partial<typeof AgentState.State>> {
  const llm = new LLMClient();

  const firstDiff = state.diffs[0];
  if (firstDiff === undefined) {
    throw new Error();
  }

  const prompt = `Analyze the following code changes and commit message, then extract:
1. Change intent (one-sentence summary)
2. Frameworks/libraries involved (e.g., NestJS, MikroORM, React)
3. Primary affected file patterns

Commit message: ${state.message}

Changed files:
${state.diffs.map((d) => `- ${d.filePath}`).join('\n')}

First diff example:
File: ${firstDiff.filePath}
Changes:
${firstDiff.hunks.map((h) => h.lines.join('\n')).join('\n')}

Return JSON format: { "intent": "...", "frameworks": [...], "filePatterns": [...] }`;

  const response = await llm.invoke(prompt, { response_format: 'json_object' });
  const parsed = ResponseSchema.parse(response);

  return {
    analysis: {
      intent: parsed.intent,
      frameworks: parsed.frameworks,
      affectedFiles: state.diffs.map((d) => d.filePath),
    },
  };
}
