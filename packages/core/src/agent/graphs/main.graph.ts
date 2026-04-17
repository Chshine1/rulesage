import { StateGraph, END, StateSchema } from '@langchain/langgraph';
import { MainState, MainStateSchema } from '../state';
import { buildLearnGraph } from './learn.graph';
import { buildCodeGraph } from './code.graph';

const schema = new StateSchema(MainStateSchema.shape);

export function buildMainGraph(): StateGraph<typeof schema> {
  const graph = new StateGraph(schema);

  const learnSubgraph = buildLearnGraph().compile();
  const codeSubgraph = buildCodeGraph().compile();

  graph
    .addNode('learnSubgraph', async (parentState) => {
      const subgraphInput = { projectRoot: parentState.projectRoot };

      const subgraphOutput = await learnSubgraph.invoke(subgraphInput);
      return { finalRules: subgraphOutput.executionPlan };
    })
    .addNode('codeSubgraph', codeSubgraph)
    .addNode('parseInput', (): Promise<Partial<MainState>> => {
      throw new Error();
    })
    .addEdge('__start__', 'parseInput')
    .addConditionalEdges('parseInput', (state) => {
      return state.mode === 'learn' ? 'learnSubgraph' : 'codeSubgraph';
    })
    .addEdge('learnSubgraph', END)
    .addEdge('codeSubgraph', END);

  return graph;
}
