import { z } from 'zod';
import { ruleSchema } from '@rulesage/core/db/schemas/rule';

export const ScopeSchema = z.object({
  glob: z.string(),
  description: z.string(),
});

export const LearningStateSchema = z.object({
  userInput: z.string(),
  projectRoot: z.string().default(process.cwd()),

  scopes: z.array(ScopeSchema),

  extractedIntent: z.string(),
  codePatterns: z.array(
    z.object({
      type: z.string(), // e.g., 'naming_convention', 'decorator_usage', 'error_handling'
      description: z.string(),
      examples: z.array(z.string()), // Snippet examples
      confidence: z.float32(), // 0.0 - 1.0
    }),
  ),

  candidateRules: z.array(ruleSchema),
  relevantExistingRules: z.array(ruleSchema),

  userDecision: z.union([z.literal('approve'), z.literal('reject')]).nullable(),
});

export type LearningState = z.infer<typeof LearningStateSchema>;
