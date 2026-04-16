import { integer, pgTable, pgEnum } from 'drizzle-orm/pg-core';

const referenceTypeEnum = pgEnum('reference_type', [
  'DEPENDS_ON',
  'CONTEXT_SOURCE',
  'MENTIONED_IN_DESC',
]);

export const ruleReferences = pgTable('rules', {
  sourceRuleId: integer().primaryKey(),
  targetRuleId: integer().primaryKey(),
  referenceType: referenceTypeEnum().notNull(),
});

export type RuleReference = typeof ruleReferences.$inferSelect;
