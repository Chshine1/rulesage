import { Runtime } from '@langchain/langgraph';
import { CodePatternSchema, LearningState } from '../learning.state';
import { LearningContext } from '../learning.context';
import { z } from 'zod';

export async function analyzeScopeAndCodePatterns(
  state: Pick<
    LearningState,
    'scopes' | 'projectRoot' | 'relevantExistingRules' | 'extractedIntent'
  >,
  runtime: Runtime<Pick<LearningContext, 'fileSystem' | 'llm'>>,
): Promise<Pick<LearningState, 'codePatterns'>> {
  if (runtime.context === undefined) throw new Error();
  const { scopes, projectRoot, relevantExistingRules, extractedIntent } = state;

  const rulesGuidance = relevantExistingRules
    .map((r) => `Rule "${r.name}": ${r.descriptionTemplate}`)
    .join('\n');

  const planningPrompt = `
You are an expert code analyst. Your task is to plan which files or directories to inspect in order to discover reusable patterns or conventions.

**User learning intent:**
${extractedIntent.summary}

**Analysis scopes:**
${JSON.stringify(scopes, null, 2)}

**Relevant existing rules (may contain hints about where to look):**
${rulesGuidance || 'None'}

**Available filesystem inspection capabilities:**
- You can request to read the content of a specific file.
- You can request to list the contents of a directory (files and subdirectories).

Please output a JSON object with the following structure:
{
  "filesToRead": ["relative/path/to/file1.ts", "relative/path/to/file2.ts"],
  "directoriesToList": ["relative/path/to/dir1", "relative/path/to/dir2"]
}

Guidelines:
- Focus on files/directories that are likely to reveal patterns such as naming conventions, folder structures, architectural layering, error handling, testing patterns, etc.
- Prioritize directories that are within the given scopes.
- Only include paths that are likely to exist and be relevant.
- Do NOT request more than 10 files initially to keep context manageable.
`;

  const planningResponse = await runtime.context.llm.complete(planningPrompt);

  const planSchema = z.object({
    filesToRead: z.array(z.string()),
    directoriesToList: z.array(z.string()),
  });
  const plan = planSchema.parse(JSON.parse(planningResponse));

  const fileContents: Record<string, string> = {};
  const dirListings: Record<string, string> = {};

  for (const relPath of plan.filesToRead) {
    fileContents[relPath] = await runtime.context.fileSystem.readFile(
      projectRoot,
      relPath,
      50 * 1024,
    );
  }

  for (const relPath of plan.directoriesToList) {
    dirListings[relPath] = await runtime.context.fileSystem.listDirectory(
      projectRoot,
      relPath,
    );
  }

  let contextSections = '';

  if (Object.keys(fileContents).length > 0) {
    contextSections += '### File Contents ###\n';
    for (const [path, content] of Object.entries(fileContents)) {
      contextSections += `\n--- ${path} ---\n${content}\n`;
    }
  }

  if (Object.keys(dirListings).length > 0) {
    contextSections += '\n### Directory Structures ###\n';
    for (const [path, listing] of Object.entries(dirListings)) {
      contextSections += `\n--- ${path} ---\nStructure: ${listing}\n`;
    }
  }

  const analysisPrompt = `
You are an expert code pattern analyst. Based on the provided file contents and directory structures, identify recurring patterns or conventions that could be standardized into a rule.

**User learning intent:**
${extractedIntent.summary}

**Analysis scopes:**
${JSON.stringify(scopes, null, 2)}

${contextSections || 'No files or directories were read. Please infer patterns from the scopes and intent alone.'}

**Task:**
Output a JSON array of pattern objects. Each pattern must conform to the following TypeScript type:
{
  type: string;           // e.g., 'naming_convention', 'directory_structure', 'error_handling', 'test_organization', 'api_design', etc.
  description: string;    // Human-readable description of the pattern.
  examples: string[];     // Concrete code snippets or path examples demonstrating the pattern.
  confidence: number;     // A number between 0.0 and 1.0 indicating how confident you are that this pattern is intentional and consistent.
}

Guidelines:
- Be specific and evidence-based.
- If you cannot find any pattern, return an empty array.
- Do not invent patterns; only report what you observe.
- Confidence should reflect the amount and consistency of evidence.
- You may include patterns related to directory organization even without file contents if directory listings provide clear evidence.

Output only valid JSON array. Do not include any other text.
`;

  const analysisResponse = await runtime.context.llm.complete(analysisPrompt);

  const patterns = z
    .array(CodePatternSchema)
    .parse(JSON.parse(analysisResponse));

  return { codePatterns: patterns };
}
