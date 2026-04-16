import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { z } from 'zod/index';

const RULE_NAME_LENGTH = 100;
const TAG_LENGTH = 50;

export const rules = pgTable('rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: RULE_NAME_LENGTH }).notNull(),

  descriptionTemplate: varchar('description_template', {
    length: 500,
  }).notNull(),
  descriptionRefs: jsonb('description_refs'),

  tags: varchar('tags', { length: TAG_LENGTH }).array(),
  isActive: boolean('is_active').notNull(),

  trigger: jsonb('trigger').notNull(),
  context: jsonb('context').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').notNull(),
});

export const descriptionRefsSchema = z.array(
  z.object({
    placeholder: z.string().length(20),
    ruleId: z.number(),
    ruleName: z.string().length(RULE_NAME_LENGTH),
  }),
);

export const triggerSchema = z.record(
  z.string().length(TAG_LENGTH), // keys are condition types
  z.array(z.string().length(TAG_LENGTH)), // values are match patterns
);

export const contextSchema = z.object({
  description: z.string().length(500),
  sourceRuleId: z.int(),
  output: z.string().length(500).optional(),
  required: z.boolean(),
});

export type Rule = Exclude<
  typeof rules.$inferSelect,
  'descriptionRefs' | 'trigger' | 'context'
> & {
  descriptionRefs: z.infer<typeof descriptionRefsSchema>;
  trigger: z.infer<typeof triggerSchema>;
  context: z.infer<typeof contextSchema>;
};
