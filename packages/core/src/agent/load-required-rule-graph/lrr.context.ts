import { z } from 'zod';

export const LrrContextSchema = z.object({});

export type LrrContext = z.infer<typeof LrrContextSchema>;
