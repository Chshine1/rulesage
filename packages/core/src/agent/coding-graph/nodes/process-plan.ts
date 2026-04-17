import { CodingState } from '@rulesage/core/agent/coding-graph/coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '@rulesage/core/agent/coding-graph/coding.context';

export function processPlan(
  _state: CodingState,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Partial<CodingState>> {
  throw new Error('Not implemented');
}
