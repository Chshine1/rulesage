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
