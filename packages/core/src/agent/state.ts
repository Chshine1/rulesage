import { Annotation } from '@langchain/langgraph';
import { Rule } from '../db/schema';

export interface FileDiff {
  filePath: string;
  language: string;
  oldContent: string;
  newContent: string;
  hunks: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
}

export const AgentState = Annotation.Root({
  diffs: Annotation<FileDiff[]>({
    reducer: (_, x) => x,
    default: () => [],
  }),
  message: Annotation<string>({
    reducer: (_, x) => x,
    default: () => '',
  }),
  projectRoot: Annotation<string>({
    reducer: (_, x) => x,
    default: () => process.cwd(),
  }),
  analysis: Annotation<{
    intent: string;
    frameworks: string[];
    affectedFiles: string[];
  } | null>({
    reducer: (_, x) => x,
    default: () => null,
  }),
  candidateRules: Annotation<Partial<Rule>[]>({
    reducer: (_, x) => x,
    default: () => [],
  }),
  matchedRules: Annotation<Rule[]>({
    reducer: (_, x) => x,
    default: () => [],
  }),
  finalRules: Annotation<Rule[]>({
    reducer: (_, x) => x,
    default: () => [],
  }),
});
