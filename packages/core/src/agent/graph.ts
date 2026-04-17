import { StateGraph, END } from '@langchain/langgraph';
import { agentState } from './state';
import { analyzeIntent } from '@rulesage/core/agent/nodes/analyze-intent';
import { extractRules } from '@rulesage/core/agent/nodes/extract-rules';
import { matchAndMergeRules } from '@rulesage/core/agent/nodes/match-and-merge-rules';
import { saveRules } from '@rulesage/core/agent/nodes/save-rules';

const workflow = new StateGraph(agentState)
  .addNode('analyzeIntent', analyzeIntent)
  .addNode('extractRules', extractRules)
  .addNode('matchAndMergeRules', matchAndMergeRules)
  .addNode('saveRules', saveRules)
  .addEdge('__start__', 'analyzeIntent')
  .addEdge('analyzeIntent', 'extractRules')
  .addEdge('extractRules', 'matchAndMergeRules')
  .addEdge('matchAndMergeRules', 'saveRules')
  .addEdge('saveRules', END);

const app = workflow.compile();
