import { z } from 'zod';
import { ruleSchema } from '@rulesage/core/db/schemas/rule';

export const LearningContextSchema = z.object({
  llm: z.object({
    complete: z.function().input(z.string()).output(z.promise(z.string())),
  }),
  ruleRepository: z.object({
    searchByKeywords: z
      .function()
      .input(z.array(z.string()))
      .output(z.promise(z.array(ruleSchema))),
    save: z.function().input(ruleSchema).output(ruleSchema),
    saveReferences: z.function().input(z.number(), z.array(z.number())),
  }),
  fileSystem: z.object({
    readFilesInScope: z
      .function()
      .input(z.string(), z.string())
      .output(z.array(z.string())),
  }),
  interactiveUser: z.object({
    prompt: z
      .function()
      .input(z.string(), z.array(z.string()))
      .output(z.promise(z.string())),
  }),
});

export type LearningContext = z.infer<typeof LearningContextSchema>;
