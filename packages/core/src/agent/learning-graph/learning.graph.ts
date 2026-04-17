import {
  ConditionalEdgeRouter,
  END,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { LearningState, LearningStateSchema } from './learning.state';
import { parseLearnIntent } from './nodes/parse-learn-intent';
import { LearningContextSchema } from './learning.context';
import { retrieveRelevantExistingRules } from './nodes/retrieve-relevant-existing-rules';
import { analyzeScopeAndCodePatterns } from '@rulesage/core/agent/learning-graph/nodes/analyze-scope-and-code-patterns';
import { generateCandidateRules } from '@rulesage/core/agent/learning-graph/nodes/generate-candidate-rules';
import { proposeNewRules } from '@rulesage/core/agent/learning-graph/nodes/propose-new-rules';
import { saveOrUpdateRules } from '@rulesage/core/agent/learning-graph/nodes/save-or-update-rules';

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
