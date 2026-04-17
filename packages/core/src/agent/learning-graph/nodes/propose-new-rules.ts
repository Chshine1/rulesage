import { LearningState } from '@rulesage/core/agent/learning-graph/learning.state';
import { Runtime } from '@langchain/langgraph';
import { LearningContext } from '@rulesage/core/agent/learning-graph/learning.context';

export function proposeNewRules(
  _state: Pick<LearningState, 'candidateRules' | 'relevantExistingRules'>,
  _runtime: Runtime<Pick<LearningContext, 'interactiveUser'>>,
): Promise<Partial<LearningState>> {
  throw new Error('not implemented');
}
