import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState } from '../state';
import { LLMClient } from '../../llm/client';
import { z } from 'zod';
import { Rule } from '../../db/schema';

const ResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

export async function extractRules(
  state: typeof AgentState.State,
  _config?: RunnableConfig,
): Promise<Partial<typeof AgentState.State>> {
  const llm = new LLMClient();
  const candidateRules: Partial<Rule>[] = [];

  for (const diff of state.diffs) {
    const prompt = `You are a coding convention extraction expert. Based on the following code change, derive a single convention rule.
The rule should describe: under what circumstances to do what, and why.

File: ${diff.filePath}
Language: ${diff.language}
Before change:
\`\`\`${diff.language}
${diff.oldContent}
\`\`\`

After change:
\`\`\`${diff.language}
${diff.newContent}
\`\`\`

User explanation: ${state.message}

Output a JSON object with the following fields:
- name: Short rule name (e.g., "mikro-orm-entity-default-field")
- description: Human-readable description
- tags: Array of relevant tags
- scope: { languages: ["typescript"], filePatterns: ["**/*.entity.ts"] }
- priority: "high" | "medium" | "low"
- trigger: Structured description of triggering conditions (preferably using AST patterns)
- action: The action to perform (e.g., rewrite, insert)
- examples: [{ bad: "incorrect code", good: "correct code" }]

Note: trigger and action should be as precise as possible to facilitate programmatic execution.`;

    const response = await llm.invoke(prompt, {
      response_format: 'json_object',
    });
    const rule = ResponseSchema.parse(response);
    candidateRules.push(rule);
  }

  return { candidateRules };
}
