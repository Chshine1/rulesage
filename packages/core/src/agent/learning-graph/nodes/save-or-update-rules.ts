import { LearningState } from '@rulesage/core/agent/learning-graph/learning.state';
import { Runtime } from '@langchain/langgraph';
import { LearningContext } from '@rulesage/core/agent/learning-graph/learning.context';

export function saveOrUpdateRules(
  _state: Pick<LearningState, 'candidateRules' | 'userDecision'>,
  _runtime: Runtime<Pick<LearningContext, 'ruleRepository'>>,
): Promise<Partial<LearningState>> {
  throw new Error('Not implemented');
}
