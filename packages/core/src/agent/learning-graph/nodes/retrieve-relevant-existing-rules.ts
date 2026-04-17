import { LearningState } from '../learning.state';
import { Runtime } from '@langchain/langgraph';
import { LearningContext } from '../learning.context';

export function retrieveRelevantExistingRules(
  _state: Pick<LearningState, 'extractedIntent'>,
  _runtime: Runtime<Pick<LearningContext, 'ruleRepository'>>,
): Promise<Partial<LearningState>> {
  throw new Error('Not implemented');
}
