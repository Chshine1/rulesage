import type { LearningContextSchema } from '../../learning.context';
import { Rule, rules, ruleSchema } from '@rulesage/core/db/schemas/rule';
import { sql } from 'drizzle-orm';
import { getDb } from '@rulesage/core/db/client';
import { z } from 'zod';

type IRuleRepository = z.infer<
  typeof LearningContextSchema.shape.ruleRepository
>;

export class RuleRepository implements IRuleRepository {
  getAllDistinctTags(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  async findByTags(tags: string[]): Promise<Rule[]> {
    const dbResult = await getDb()
      .select()
      .from(rules)
      .where(sql`${rules.tags} && ${tags}::text[]`)
      .orderBy(
        sql`array_length(array_intersect(${rules.tags}, ${tags}::text[]), 1) DESC`,
      )
      .limit(10);

    return z.array(ruleSchema).parse(dbResult);
  }

  save(_rule: Rule): Promise<Rule> {
    throw new Error('Not implemented');
  }

  saveReferences(): Promise<void> {
    throw new Error('Not implemented');
  }
}
