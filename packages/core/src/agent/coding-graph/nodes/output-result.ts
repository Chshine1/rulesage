import { CodingState } from '../coding.state';
import { Runtime } from '@langchain/langgraph';
import { CodingContext } from '../coding.context';

export function outputResult(
  _state: Pick<CodingState, 'executionPlan' | 'ruleContext' | 'projectRoot'>,
  _runtime: Runtime<Pick<CodingContext, never>>,
): Promise<Pick<CodingState, 'finalResult'>> {
  throw new Error('Not implemented');
}
