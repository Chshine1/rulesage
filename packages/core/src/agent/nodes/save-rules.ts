import { AgentState } from '../state';
import { dbInstance } from '../../db/client';
import { rules } from '../../db/schema';

export async function saveRules(
  state: typeof AgentState.State,
): Promise<Partial<typeof AgentState.State>> {
  for (const rule of state.finalRules) {
    if (dbInstance.db === null) {
      throw new Error();
    }
    await dbInstance.db
      .insert(rules)
      .values(rule)
      .onConflictDoUpdate({
        target: rules.id,
        set: {
          name: rule.name,
          description: rule.description,
          tags: rule.tags,
          scope: rule.scope,
          priority: rule.priority,
          trigger: rule.trigger,
          action: rule.action,
          examples: rule.examples,
          relatedRules: rule.relatedRules,
          evolution: rule.evolution,
          updatedAt: new Date(),
        },
      });
  }
  return {};
}
