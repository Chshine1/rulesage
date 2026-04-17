import { LearningState } from '@rulesage/core/agent/learning-graph/learning.state';
import { Runtime } from '@langchain/langgraph';
import { LearningContext } from '@rulesage/core/agent/learning-graph/learning.context';

export function analyzeScopeAndCodePatterns(
  _state: Pick<LearningState, 'scopes' | 'projectRoot'>,
  _runtime: Runtime<Pick<LearningContext, 'fileSystem'>>,
): Promise<Partial<LearningState>> {
  throw new Error('Not implemented');
}
