import { LearningState } from '@rulesage/core/agent/learning-graph/learning.state';
import { LearningContext } from '@rulesage/core/agent/learning-graph/learning.context';
import { Runtime } from '@langchain/langgraph';

export function parseLearnIntent(
  _state: Pick<LearningState, 'userInput' | 'scopes'>,
  runtime: Runtime<Pick<LearningContext, 'llm'>>,
): Promise<Partial<LearningState>> {
  if (runtime.context === undefined) throw new Error();
  throw new Error('Not implemented');
}
