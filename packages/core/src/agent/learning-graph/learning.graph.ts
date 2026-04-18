import {
  ConditionalEdgeRouter,
  END,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { LearningState, LearningStateSchema } from './learning.state';
import {
  analyzeScopeAndCodePatterns,
  generateCandidateRules,
  parseLearnIntent,
  proposeNewRules,
  retrieveRelevantExistingRules,
  saveOrUpdateRules,
} from './nodes/index';
import { LearningContextSchema } from './learning.context';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildLearningGraph() {
  const graph = new StateGraph(LearningStateSchema, LearningContextSchema);

  const router: ConditionalEdgeRouter<
    LearningState,
    Record<string, unknown>,
    'saveOrUpdateRules'
  > = (state) => {
    return state.userDecision === 'reject' ? END : 'saveOrUpdateRules';
  };

  graph
    .addNode('parseLearnIntent', parseLearnIntent)
    .addEdge(START, 'parseLearnIntent')

    .addNode('retrieveRelevantExistingRules', retrieveRelevantExistingRules)
    .addEdge('parseLearnIntent', 'retrieveRelevantExistingRules')

    .addNode('analyzeScopeAndCodePatterns', analyzeScopeAndCodePatterns)
    .addEdge('retrieveRelevantExistingRules', 'analyzeScopeAndCodePatterns')

    .addNode('generateCandidateRules', generateCandidateRules)
    .addEdge('analyzeScopeAndCodePatterns', 'generateCandidateRules')

    .addNode('proposeNewRules', proposeNewRules)
    .addEdge('generateCandidateRules', 'proposeNewRules')

    .addNode('saveOrUpdateRules', saveOrUpdateRules)
    .addConditionalEdges('proposeNewRules', router)
    .addEdge('saveOrUpdateRules', END);

  return graph;
}
