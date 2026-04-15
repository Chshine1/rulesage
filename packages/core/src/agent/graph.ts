import { StateGraph, END } from '@langchain/langgraph';
import { AgentState } from './state';
import { FileDiff } from './state';
import { analyzeIntent } from '@rulesage/core/agent/nodes/analyze-intent';
import { extractRules } from '@rulesage/core/agent/nodes/extract-rules';
import { matchAndMergeRules } from '@rulesage/core/agent/nodes/match-and-merge-rules';
import { dbInstance } from '@rulesage/core/db/client';
import { saveRules } from '@rulesage/core/agent/nodes/save-rules';

const workflow = new StateGraph(AgentState)
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

export interface CommitWorkflowInput {
  diffs: FileDiff[];
  message: string;
  projectRoot: string;
}

export interface CommitWorkflowOutput {
  finalRules: import('../db/schema').Rule[];
}

export async function runCommitWorkflow(
  input: CommitWorkflowInput,
): Promise<CommitWorkflowOutput> {
  await dbInstance.initialize();

  const initialState = {
    diffs: input.diffs,
    message: input.message,
    projectRoot: input.projectRoot,
    analysis: null,
    candidateRules: [],
    matchedRules: [],
    finalRules: [],
  };

  const result = await app.invoke(initialState);

  return {
    finalRules: result.finalRules,
  };
}
