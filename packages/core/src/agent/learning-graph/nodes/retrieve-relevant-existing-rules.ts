import { Runtime } from '@langchain/langgraph';
import { LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';

export async function retrieveRelevantExistingRules(
  state: Pick<LearningState, 'extractedIntent'>,
  runtime: Runtime<Pick<LearningContext, 'ruleRepository'>>,
): Promise<Partial<LearningState>> {
  if (runtime.context === undefined) throw new Error('runtime.context');

  const { targetTags } = state.extractedIntent;

  if (targetTags.length === 0) {
    return { relevantExistingRules: [] };
  }

  const rules = await runtime.context.ruleRepository.findByTags(targetTags);

  return { relevantExistingRules: rules };
}
