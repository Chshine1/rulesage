import { z } from 'zod';

export const CodingContextSchema = z.object({});

export type CodingContext = z.infer<typeof CodingContextSchema>;
