import { Runtime } from '@langchain/langgraph';
import { LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';

export function generateCandidateRules(
  _state: Pick<LearningState, 'extractedIntent' | 'codePatterns'>,
  _runtime: Runtime<Pick<LearningContext, 'llm'>>,
): Promise<Pick<LearningState, 'candidateRules'>> {
  throw new Error('Not implemented');
}
