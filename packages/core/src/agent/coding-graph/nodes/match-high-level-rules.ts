import { CodingState } from '@rulesage/core/agent/coding-graph/coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '@rulesage/core/agent/coding-graph/coding.context';

export function matchHighLevelRules(
  _state: Pick<CodingState, 'taskIntent'>,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Pick<CodingState, 'triggeredRules' | 'matchedHighLevelRules'>> {
  throw new Error('Not implemented');
}
