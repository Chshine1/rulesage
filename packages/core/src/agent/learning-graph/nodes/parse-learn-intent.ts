import { Runtime } from '@langchain/langgraph';
import { ExtractedIntentSchema, LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';

export async function parseLearnIntent(
  state: Pick<LearningState, 'userInput' | 'scopes'>,
  runtime: Runtime<Pick<LearningContext, 'llm' | 'ruleRepository'>>,
): Promise<Pick<LearningState, 'extractedIntent'>> {
  if (runtime.context === undefined) throw new Error('runtime.context');

  const existingTags =
    await runtime.context.ruleRepository.getAllDistinctTags();

  const prompt = `
You are an assistant that extracts structured intent from user learning requests.

User input: "${state.userInput}"
Scopes: ${JSON.stringify(state.scopes, null, 2)}

Existing rule tags in the system (prefer these when applicable):
${existingTags.map((t) => `- ${t}`).join('\n')}

Task:
Analyze the user input and scopes. Produce a JSON object with:
- "summary": A concise one-sentence summary of the learning goal.
- "targetTags": An array of tags (max 5) that best categorize this learning request. Use existing tags if possible; otherwise, propose new ones following the pattern: lowercase, hyphen-separated (e.g., "ddd-aggregate", "naming-convention").
- "keywords": Additional keywords extracted from the input for fallback search.

Output only valid JSON. Do not include any other text.
`;

  const response = await runtime.context.llm.complete(prompt);
  const parsed = JSON.parse(response) as unknown;

  const result = ExtractedIntentSchema.parse(parsed);

  return { extractedIntent: result };
}
