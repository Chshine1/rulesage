import { z } from 'zod';

export const LrrStateSchema = z.object({});

export type LrrState = z.infer<typeof LrrStateSchema>;
