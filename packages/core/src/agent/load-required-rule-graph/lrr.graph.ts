import { END, START, StateGraph } from '@langchain/langgraph';
import { LrrContextSchema } from './lrr.context';
import { LrrStateSchema } from './lrr.state';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildLoadRequiredRuleGraph() {
  const graph = new StateGraph(LrrStateSchema, LrrContextSchema);

  graph.addEdge(START, END);

  return graph;
}
