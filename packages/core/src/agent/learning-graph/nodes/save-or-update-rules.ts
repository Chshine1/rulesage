import { Runtime } from '@langchain/langgraph';
import { LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';

export function saveOrUpdateRules(
  _state: Pick<LearningState, 'candidateRules' | 'userDecision'>,
  _runtime: Runtime<Pick<LearningContext, 'ruleRepository'>>,
): Promise<Partial<LearningState>> {
  throw new Error('Not implemented');
}
