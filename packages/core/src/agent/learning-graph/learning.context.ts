import { z } from 'zod';
import { ruleSchema } from '../../db/schemas/rule';
import {
  FileSystemService,
  InteractiveUser,
  LlmService,
  RuleRepository,
} from './runtimes/contexts/index';

export const LearningContextSchema = z.object({
  llm: z.object({
    complete: z.function({
      input: [z.string()],
      output: z.promise(z.string()),
    }),
  }),
  ruleRepository: z.object({
    getAllDistinctTags: z.function({
      output: z.promise(z.array(z.string())),
    }),
    findByTags: z.function({
      input: [z.array(z.string().length(50))],
      output: z.promise(z.array(ruleSchema)),
    }),
    save: z.function({
      input: [ruleSchema],
      output: z.promise(ruleSchema),
    }),
    saveReferences: z.function({
      input: [z.number(), z.array(z.number())],
    }),
  }),
  fileSystem: z.object({
    readFile: z.function({
      input: [z.string(), z.string(), z.int()],
      output: z.promise(z.string()),
    }),
    listDirectory: z.function({
      input: [z.string(), z.string()],
      output: z.promise(z.string()),
    }),
  }),
  interactiveUser: z.object({
    prompt: z.function({
      input: [z.string()],
      output: z.promise(z.string()),
    }),
  }),
});

export type LearningContext = z.infer<typeof LearningContextSchema>;

export const buildContext = (): LearningContext => ({
  llm: new LlmService(),
  ruleRepository: new RuleRepository(),
  fileSystem: new FileSystemService(),
  interactiveUser: new InteractiveUser(),
});
