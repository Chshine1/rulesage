import { LearningState } from '../learning.state';
import { Runtime } from '@langchain/langgraph';
import { LearningContext } from '../learning.context';

export function generateCandidateRules(
  _state: Pick<LearningState, 'extractedIntent' | 'codePatterns'>,
  _runtime: Runtime<Pick<LearningContext, 'llm'>>,
): Promise<Partial<LearningState>> {
  throw new Error('Not implemented');
}
