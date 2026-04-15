import { pgTable, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const snapshots = pgTable('snapshots', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  scope: jsonb('scope').notNull(),
  fileHashes: jsonb('file_hashes').notNull(),
});
export type Snapshot = Exclude<
  typeof snapshots.$inferSelect,
  'scope' | 'fileHashes'
> & {
  scope: {
    includes: string[];
    excludes: string[];
  };
  fileHashes: Record<string, string>;
};

export const rules = pgTable('rules', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  tags: text('tags').array(),
  scope: jsonb('scope').notNull(),
  priority: text('priority', { enum: ['high', 'medium', 'low'] }).notNull(),
  trigger: jsonb('trigger').notNull(),
  action: jsonb('action').notNull(),
  examples: jsonb('examples'),
  relatedRules: text('related_rules').array(),
  evolution: jsonb('evolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export type Rule = typeof rules.$inferSelect;
