import { z } from 'zod';

export const MainStateSchema = z.object({
  mode: z.union([z.literal('learn'), z.literal('code')]),
  userInput: z.string().describe('original user input'),
  projectRoot: z
    .string()
    .default(process.cwd())
    .describe('current working directory'),

  missingContext: z
    .array(z.string())
    .default([])
    .describe('missing context variable keys'),
  finalResult: z.string().nullable().default(null).describe('final output'),
});

export type MainState = z.infer<typeof MainStateSchema>;

export const ExecutionStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  rulesRequired: z.array(z.number()).default([]),
  get subSteps() {
    return z.array(ExecutionStepSchema).nullable().default(null);
  },
});

export const CodeStateSchema = z.object({
  userInput: z.string(),
  projectRoot: z.string().default(process.cwd()),

  triggeredRules: z
    .array(z.number())
    .default([])
    .describe('id array of trigger rules'),
  activeRuleStack: z
    .array(z.number())
    .default([])
    .describe('active rule stack'),
  ruleContext: z
    .record(z.string(), z.unknown())
    .default({})
    .describe('loaded context variables'),

  executionPlan: z.array(ExecutionStepSchema).nullable().default(null),

  finalResult: z.string().nullable().default(null),
});
