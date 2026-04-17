import { StateGraph, END, StateSchema } from '@langchain/langgraph';
import { CodeStateSchema } from '@rulesage/core/agent/state';

const schema = new StateSchema(CodeStateSchema.shape);

export function buildLearnGraph(): StateGraph<typeof schema> {
  const graph = new StateGraph(schema);
  graph
    .addEdge('prepareContext', 'processPlanStep')
    .addEdge('outputResult', END);

  return graph;
}
