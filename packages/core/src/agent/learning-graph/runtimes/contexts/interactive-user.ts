import type { LearningContextSchema } from '../../learning.context';
import { z } from 'zod';

type IInteractiveUser = z.infer<
  typeof LearningContextSchema.shape.interactiveUser
>;

export class InteractiveUser implements IInteractiveUser {
  prompt(_prompt: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
