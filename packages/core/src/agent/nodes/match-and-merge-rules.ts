import { AgentState } from '../state';
import { rules } from '../../db/schema';
import { and, sql } from 'drizzle-orm';
import { Rule } from '../../db/schema';
import { LLMClient } from '../../llm/client';
import { z } from 'zod';
import { getDb } from '@rulesage/core/db/client';

const ResponseSchema = z.object({
  action: z.union([z.literal('merge'), z.literal('create')]),
  targetRuleId: z.int().optional(),
});

async function decideMerge(
  candidate: Partial<Rule>,
  existing: Rule[],
): Promise<{
  action: 'merge' | 'create';
  targetRule?: Rule;
}> {
  if (existing.length === 0) {
    return { action: 'create' };
  }

  const llm = new LLMClient();
  const prompt = `You are a rule management expert. A new candidate rule has been extracted, and there are similar existing rules in the database. Decide whether to:
- "merge": if the candidate rule refines or supplements an existing rule
- "create": if the candidate rule represents a completely new pattern

Candidate rule:
${JSON.stringify(candidate, null, 2)}

Existing rules:
${JSON.stringify(
  existing.map((r) => ({ id: r.id, name: r.name, description: r.description })),
  null,
  2,
)}

Return JSON: { "action": "merge" | "create", "targetRuleId": "if merge, provide the target rule ID" }`;

  try {
    const response = await llm.invoke(prompt, {
      response_format: 'json_object',
    });
    const decision = ResponseSchema.parse(response);

    if (decision.action === 'merge' && decision.targetRuleId) {
      const target = existing.find((r) => r.id === decision.targetRuleId);
      if (target) {
        return { action: 'merge', targetRule: target };
      }
    }
  } catch (error) {
    console.warn('Merge decision failed, defaulting to create:', error);
  }

  return { action: 'create' };
}

async function mergeRules(
  target: Rule,
  candidate: Partial<Rule>,
): Promise<Rule> {
  const llm = new LLMClient();
  const prompt = `Merge two code convention rules to generate a more comprehensive rule.

Target rule (existing):
${JSON.stringify(target, null, 2)}

Candidate rule (new):
${JSON.stringify(candidate, null, 2)}

Output the merged rule as a complete JSON object, preserving all field structures. If fields conflict, prioritize the more specific/stricter description.`;

  try {
    const response = await llm.invoke(prompt, {
      response_format: 'json_object',
    });
    const merged = response as Rule;

    merged.id = target.id;
    merged.createdAt = target.createdAt;
    merged.updatedAt = new Date();

    merged.evolution = {
      ...(target.evolution || {}),
      lastUpdated: new Date().toISOString(),
      reason: `Merged with candidate rule: ${candidate.name ?? ''}`,
    };

    return merged;
  } catch (error) {
    console.error('Failed to merge rules:', error);
    return {
      ...target,
      ...candidate,
      id: target.id,
      createdAt: target.createdAt,
      updatedAt: new Date(),
    } as Rule;
  }
}

export async function matchAndMergeRules(
  state: typeof AgentState.State,
): Promise<Partial<typeof AgentState.State>> {
  const finalRules: Rule[] = [];

  for (const candidate of state.candidateRules) {
    let query = getDb().select().from(rules);

    const conditions = [];
    if (candidate.tags && candidate.tags.length > 0) {
      conditions.push(sql`${rules.tags} && ${candidate.tags}`);
    }
    if (
      candidate.scope?.filePatterns &&
      candidate.scope.filePatterns.length > 0
    ) {
      conditions.push(
        sql`${rules.scope}->'filePatterns' ?| array[${candidate.scope.filePatterns.map((p) => `'${p}'`).join(',')}]`,
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const existing = await query.limit(5);

    const decision = await decideMerge(candidate, existing);

    if (decision.action === 'merge' && decision.targetRule) {
      const merged = await mergeRules(decision.targetRule, candidate);
      finalRules.push(merged);
    } else {
      const newRule: Rule = {
        ...candidate,
        id: candidate.id || `rule-${new Date().toISOString()}`,
        name: candidate.name || 'Unnamed Rule',
        description: candidate.description || '',
        tags: candidate.tags || [],
        scope: candidate.scope || { languages: [], filePatterns: [] },
        priority: candidate.priority || 'medium',
        trigger: candidate.trigger || { type: 'unknown' },
        action: candidate.action || { type: 'unknown' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Rule;

      finalRules.push(newRule);
    }
  }

  return { finalRules };
}
