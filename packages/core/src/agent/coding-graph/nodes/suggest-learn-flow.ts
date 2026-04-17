import { CodingState } from '@rulesage/core/agent/coding-graph/coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '@rulesage/core/agent/coding-graph/coding.context';

export function suggestLearnFlow(
  _state: Pick<CodingState, never>,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Pick<CodingState, never>> {
  throw new Error('Not implemented');
}
