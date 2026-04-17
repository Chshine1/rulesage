import { CodingState } from '@rulesage/core/agent/coding-graph/coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '@rulesage/core/agent/coding-graph/coding.context';

export function createPlanFromRules(
  _state: Pick<CodingState, 'taskIntent' | 'matchedHighLevelRules'>,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Pick<CodingState, 'executionPlan'>> {
  throw new Error('Not implemented');
}
