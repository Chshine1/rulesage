import type { LearningContextSchema } from '../../learning.context';
import { z } from 'zod';

type ILlmService = z.infer<typeof LearningContextSchema.shape.llm>;

export class LlmService implements ILlmService {
  complete(input: string): Promise<string> {
    return Promise.resolve(input);
  }
}
