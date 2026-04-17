import { CodingState } from '@rulesage/core/agent/coding-graph/coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '@rulesage/core/agent/coding-graph/coding.context';

export function understandTask(
  _state: Pick<CodingState, 'userInput'>,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Pick<CodingState, 'taskIntent'>> {
  throw new Error('Not implemented');
}
