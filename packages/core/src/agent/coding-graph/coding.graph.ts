import {
  ConditionalEdgeRouter,
  END,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { CodingState, CodingStateSchema } from './coding.state';
import { CodingContextSchema } from './coding.context';
import {
  createPlanFromRules,
  matchHighLevelRules,
  outputResult,
  processPlan,
  suggestLearnFlow,
  understandTask,
} from './nodes/index';
import { buildLoadRequiredRuleGraph } from '../load-required-rule-graph/index';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildCodingGraph() {
  const graph = new StateGraph(CodingStateSchema, CodingContextSchema);

  const lrrSubgraph = buildLoadRequiredRuleGraph().compile();

  const noRulesMatchedRouter: ConditionalEdgeRouter<
    CodingState,
    Record<string, unknown>,
    'suggestLearnFlow' | 'matchHighLevelRules'
  > = (state) => {
    return state.triggeredRules.length === 0
      ? 'suggestLearnFlow'
      : 'matchHighLevelRules';
  };

  const planProcessingFinishedRouter: ConditionalEdgeRouter<
    CodingState,
    Record<string, unknown>,
    'outputResult' | 'loadRequiredRule'
  > = (state) => {
    if (state.executionPlan === null) throw new Error('No execution plan');
    return state.executionPlan.length === 0
      ? 'outputResult'
      : 'loadRequiredRule';
  };

  graph
    .addNode('understandTask', understandTask)
    .addEdge(START, 'understandTask')

    .addNode('matchHighLevelRules', matchHighLevelRules)
    .addEdge('understandTask', 'matchHighLevelRules')

    .addNode('createPlanFromRules', createPlanFromRules)
    .addNode('suggestLearnFlow', suggestLearnFlow)
    .addConditionalEdges('matchHighLevelRules', noRulesMatchedRouter)
    .addEdge('suggestLearnFlow', END)

    .addNode('processPlan', processPlan)
    .addEdge('createPlanFromRules', 'processPlan')

    .addNode('outputResult', outputResult)
    .addNode('loadRequiredRule', async () => {
      await lrrSubgraph.invoke({});
    })
    .addConditionalEdges('processPlan', planProcessingFinishedRouter)
    .addEdge('outputResult', END);

  return graph;
}
