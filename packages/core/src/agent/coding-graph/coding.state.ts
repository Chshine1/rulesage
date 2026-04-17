import { z } from 'zod';
import { ruleSchema } from '@rulesage/core/db/schemas/rule';

export const ExecutionStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  rulesRequired: z.array(z.number()),
  get subSteps() {
    return z.array(ExecutionStepSchema).nullable();
  },
  status: z.enum(['pending', 'inProgress', 'completed', 'failed']),
  output: z.string().optional(),
});

export const RuleContextSchema = z.object({
  ruleOutputs: z.map(z.number(), z.record(z.string(), z.any())),
  loadedRules: z.map(z.number(), ruleSchema),
});

export const TaskIntentSchema = z.object({
  desiredOutcome: z.string(),
  affectedEntities: z.array(z.string()),
  fileReferences: z.array(z.string()).optional(),
});

export const CodingStateSchema = z.object({
  userInput: z.string(),
  projectRoot: z.string(),

  taskIntent: TaskIntentSchema.nullable().default(null),

  triggeredRules: z.array(z.number()),
  matchedHighLevelRules: z.array(ruleSchema),

  activeRuleStack: z.array(z.number()),

  ruleContext: RuleContextSchema.default({
    ruleOutputs: new Map(),
    loadedRules: new Map(),
  }),

  executionPlan: z.array(ExecutionStepSchema).nullable().default(null),

  finalResult: z.string().nullable().default(null),
});

export type CodingState = z.infer<typeof CodingStateSchema>;
