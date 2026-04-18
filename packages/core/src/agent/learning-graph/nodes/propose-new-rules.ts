import { Runtime } from '@langchain/langgraph';
import { LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';

export function proposeNewRules(
  _state: Pick<LearningState, 'candidateRules' | 'relevantExistingRules'>,
  _runtime: Runtime<Pick<LearningContext, 'interactiveUser'>>,
): Promise<Pick<LearningState, 'userDecision'>> {
  throw new Error('not implemented');
}
