## I. Overall Architecture: Single State Machine, Dual-Entry Mode

Instead of two separate graphs, we design a **unified state machine** that enters different subgraph branches based on the `mode` parameter passed via CLI (`learn` / `code`).

**The shared global state object roughly includes:**

```typescript
/**
 * Represents a single step within the execution plan.
 * Steps can be nested to arbitrary depth, forming a tree that is executed
 * depth‑first. This naturally models recursive expansion of complex tasks.
 */
interface ExecutionStep {
  id: string; // Unique identifier for this step
  description: string; // Human-readable description of what this step does
  ruleRequired: number | null; // ID of the rule needed to execute this step (null if no rule)
  action: string; // Action type, e.g., "readAndParse", "generateCode", "createFile"
  parameters?: Record<string, any>; // Additional parameters for the action
  /**
   * Optional list of sub‑steps that must be completed before this step is considered done.
   * The execution engine will process sub‑steps depth‑first, pushing the parent step
   * onto a stack while its children are executed.
   */
  subSteps?: ExecutionStep[];
}

interface AgentState {
  mode: 'learn' | 'code'; // Workflow mode
  userInput: string; // Raw user input (prompt for learning or task description for coding)
  scope: string | null; // Scope limitation for learning (file, directory, concept domain)
  projectRoot: string; // Current working directory

  // Rule engine related
  triggeredRules: number[]; // List of rule IDs triggered by this task
  activeRuleStack: number[]; // Current rule stack being processed (for recursive dependencies)
  ruleContext: Record<string, any>; // Retrieved context variables {varName: value}
  missingContext: string[]; // Names of context variables not yet satisfied

  // Interaction and output
  messages: Message[]; // Conversation history with user (for mid-way confirmations)
  finalResult: string | null; // Output of the coding flow (diff or generated file content)
  pendingConfirmation: object | null; // Conflict/modification proposal requiring user confirmation

  // Coding flow specific (MVP: tree‑structured plan executed depth‑first)
  executionPlan: ExecutionStep[] | null; // Root steps of the plan tree
  // The execution engine maintains an internal stack to track nested step progress.
}
```

---

## II. Learning Flow (Learn Flow) Detailed

### Trigger Method

CLI command similar to:

```bash
tool learn --scope src/domain/order --message "Learn the directory conventions for DDD aggregates"
```

Or omit `--scope`, letting the AI infer the scope from the message.

### Nodes and Flow Diagram (MVP Simplified)

```mermaid
graph TD
    START([START]) --> ParseLearnIntent[ParseLearnIntent]
    ParseLearnIntent --> RetrieveRelevant[RetrieveRelevant<br/>ExistingRules]
    RetrieveRelevant --> AnalyzeScope[AnalyzeScopeAnd<br/>CodePatterns]
    AnalyzeScope --> GenerateCandidate[GenerateCandidate<br/>Rules]
    GenerateCandidate --> ProposeNewRules[ProposeNewRules<br/>with User Confirmation]
    ProposeNewRules -->|Approved| SaveOrUpdate[SaveOrUpdateRules]
    ProposeNewRules -->|Rejected| END([END])
    SaveOrUpdate --> END
```

### Node Details

| Node                            | Responsibilities                                                                                                                                                                                                                                                                                                             |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ParseLearnIntent`              | Use LLM to extract from `userInput`: 1) Candidate rule name; 2) Draft rule description; 3) Possible keyword tags; 4) Implied trigger conditions.                                                                                                                                                                             |
| `RetrieveRelevantExistingRules` | Use extracted keywords to query the database `rules` table (full-text search on `tags` and `name`), returning a list of potentially existing relevant rules. **In MVP, this is only used to inform the user about possible duplicates; no automatic refactoring is performed.**                                              |
| `AnalyzeScopeAndCodePatterns`   | Read file contents under `scope`, use **lightweight AST parsing or regex** to capture patterns that can be standardized (e.g., consistent use of `@Injectable()`, unified error handling). This step is independent of existing rules.                                                                                       |
| `GenerateCandidateRules`        | Combine learning objectives and code patterns, let LLM generate candidate rules in JSON format according to the `rules` table structure. Emphasize making `triggerCondition` specific (e.g., `{"fileType": "dto"}`).                                                                                                         |
| `ProposeNewRules`               | Show a preview of the candidate rule(s) to the user. If similar existing rules were found during retrieval, the prompt will mention them as a hint (e.g., "Rule #123 seems related. Consider reviewing it."), but **no automated merging or refactoring** is attempted. The user simply approves (Y/n) to save the new rule. |
| `SaveOrUpdateRules`             | Execute database write, simultaneously parse `description.refs` and `contextSchema.sourceRuleId`, populate `ruleReferences` table.                                                                                                                                                                                           |

_Note: The complex `AnalyzeRuleRelationshipsAndRefactor` and `RefactorRules` nodes are omitted for MVP simplicity. The user retains full control over rule evolution._

---

## III. Coding Flow (Code Flow) Detailed

### Trigger Method

```bash
tool code "Implement all application services defined in the DOMAIN.md specification following DDD and NestJS DI conventions"
```

### Core Design Principles for the Coding Flow

1. **Minimal Initial Rule Expansion** – After task understanding, only a small, high‑level set of rules is matched. The graph avoids eagerly loading all potentially relevant rules.
2. **Plan‑First Approach** – Once high‑level rules are identified, the agent creates a **structured execution plan** that can be arbitrarily nested. The plan is a **tree of steps**, where any step may contain its own sub‑steps.
3. **Just‑In‑Time Rule Retrieval** – When the plan encounters a step that cannot be executed with the current `ruleContext`, the agent recursively loads the specific rule(s) needed for that sub‑task. **This recursive loading is the core MVP feature.**
4. **Depth‑First Execution with a Stack** – Execution proceeds by traversing the plan tree depth‑first. When a step has `subSteps`, the engine pushes the parent step onto a stack and processes the children one by one. After all children complete, the parent step resumes and finalizes. This model naturally handles step‑internal recursive expansion (e.g., “implement a service” expands into “write constructor”, “write methods”, each of which may further expand into “choose types”, etc.).

### Nodes and Flow Diagram

```mermaid
graph TD
    START([START]) --> UnderstandTask[UnderstandTask]
    UnderstandTask --> MatchHighLevelRules[MatchHighLevelRules<br/>Limited Scope]

    MatchHighLevelRules -->|No Matching Rules| SuggestLearn[SuggestLearnFlow]
    MatchHighLevelRules -->|High‑Level Rules Found| CreatePlan[CreatePlanFromRules]

    CreatePlan --> ProcessPlan[ProcessPlanStep<br/>Depth First Traversal]

    ProcessPlan -->|Step requires missing context| LoadRequiredRule[LoadRequiredRule<br/>SubGraph]
    LoadRequiredRule --> ProcessPlan

    ProcessPlan -->|Plan complete| Output[OutputResult]
    Output --> END([END])

    SuggestLearn --> END
```

### Detailed Node Descriptions

| Node                  | Responsibilities                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UnderstandTask`      | Parse the user's natural language task into a structured intent object containing: desired outcome, affected domain entities, and any explicit references to files or specifications.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `MatchHighLevelRules` | Query the rule database **with a strict limit** (e.g., top 3‑5 rules). Only retrieve **architectural**, **workflow**, or **meta‑rules** that describe _how_ to approach the task (e.g., “Domain Specification Parsing Rule”, “NestJS Application Service Implementation Workflow”, “DDD Module Structure Rule”). The goal is to obtain a skeleton for planning, not to fetch every possible implementation detail.                                                                                                                                                                                                                                                                     |
| `CreatePlanFromRules` | Using the matched high‑level rules, generate a **tree‑structured execution plan**. The plan consists of root `ExecutionStep` objects, each of which may recursively contain `subSteps`. This allows the plan to reflect natural task decomposition: e.g., “implement OrderService” may have children for “write constructor”, “write methods”, and those children may have further children for specific coding patterns.                                                                                                                                                                                                                                                              |
| `ProcessPlanStep`     | The central execution loop, implemented as a **depth‑first traversal** over the plan tree. It maintains an internal stack of steps. For the current step:<br/>1. Check if the current `ruleContext` and loaded rules provide enough information to execute the step.<br/>2. **If sufficient**, execute the step’s action. If the step has `subSteps`, push the current step onto the stack and begin processing the first child.<br/>3. **If insufficient**, trigger the `LoadRequiredRule` sub‑graph to fetch the precise rule needed, then re‑evaluate the same step.<br/>When a step and all its children are complete, pop the stack and continue with the next sibling or parent. |
| `LoadRequiredRule`    | **Core recursive sub‑graph** that:<br/>• Identifies the exact rule ID required for the missing capability.<br/>• If the rule is already in `activeRuleStack`, raises a circular dependency error.<br/>• Otherwise, pushes the rule ID onto the stack, runs its `PrepareContext` (which may recursively load its own dependencies), and finally merges its capabilities into `ruleContext`.<br/>This ensures rules are loaded **on‑demand** and only when absolutely necessary, preserving short‑context accuracy.                                                                                                                                                                      |
| `OutputResult`        | Aggregate all generated files and changes, format them as a unified diff or file tree, and present the final result to the user. A **lightweight LLM self‑review warning** may be appended if potential compliance issues are detected, but no automatic correction loop is performed.                                                                                                                                                                                                                                                                                                                                                                                                 |

### Recursive Context Preparation Subgraph (Inside PrepareContext)

This is an important sub-process that implements the core "short-sighted recursive retrieval" concept from your design.

```mermaid
graph TD
    Start([Entry: New Rule ID]) --> CheckVars[Check all variables in rule.context_schema for source_rule_id]
    CheckVars -->|source_rule_id is null| ExecuteBase[Execute built-in capability for base rule, store result in rule_context]
    CheckVars -->|source_rule_id is not null| PushStack[Push source rule ID onto active_rule_stack, recursively enter PrepareContext]
    ExecuteBase --> NextVar{More variables?}
    PushStack --> NextVar
    NextVar -->|Yes| CheckVars
    NextVar -->|No| Ready[Mark rule as 'context ready', pop stack, continue with parent rule]
```

**Preventing circular dependencies**: Before recursion, check `active_rule_stack`. If a cycle is detected, interrupt and prompt the user to fix the rule dependency.

### Illustrative Example of the New Flow with Nested Plan Structure

**Task:** “Implement all application services defined in the DOMAIN.md specification following DDD and NestJS DI conventions.”

1. **MatchHighLevelRules** returns:

- Rule #42: “Parse DOMAIN.md Application Service Table”
- Rule #101: “NestJS Application Service Implementation Workflow”
- Rule #15: “DDD Module Directory Structure”

2. **CreatePlanFromRules** analyzes the task and produces a **tree‑structured plan** where high‑level steps contain nested sub‑steps that recursively expand the implementation details:

```json
{
  "steps": [
    {
      "id": "parseDomainDoc",
      "description": "Extract service signatures from DOMAIN.md",
      "rulesRequired": [42]
    },
    {
      "id": "implementServices",
      "description": "Implement all application services",
      "rulesRequired": [101, 42],
      "subSteps": [
        {
          "id": "impl-order-service",
          "description": "Implement OrderService",
          "rulesRequired": [],
          "subSteps": [
            {
              "id": "order-constructor",
              "description": "Write constructor with proper DI",
              "rulesRequired": [201],
              "subSteps": [
                {
                  "id": "choose-injection-types",
                  "description": "Decide injection token types (avoid 'any')",
                  "rulesRequired": [202]
                }
              ]
            },
            {
              "id": "order-methods",
              "description": "Implement service methods",
              "rulesRequired": [],
              "subSteps": [
                {
                  "id": "method-signatures",
                  "description": "Define method signatures from spec",
                  "rulesRequired": []
                },
                {
                  "id": "method-impl",
                  "description": "Write method bodies with error handling",
                  "rulesRequired": [301]
                }
              ]
            }
          ]
        },
        {
          "id": "impl-customer-service",
          "description": "Implement CustomerService",
          "action": "generateClass",
          "subSteps": [
            {
              "id": "customer-constructor",
              "description": "Write constructor with proper DI",
              "rulesRequired": [201],
              "subSteps": [
                {
                  "id": "choose-injection-types-cust",
                  "description": "Decide injection token types",
                  "rulesRequired": [202]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

3. **ProcessPlanStep** begins depth‑first execution:

- It executes `parseDomainDoc`, storing the parsed service list in `ruleContext`.
- It then enters `implementServices` (a grouping step). Since it has `subSteps`, the engine pushes it onto the stack and starts with the first child: `impl-order-service`.
- For `impl-order-service`, it recursively processes its children: `order-constructor` and then `order-methods`.
- Inside `order-constructor`, the step `choose-injection-types` triggers `LoadRequiredRule` for Rule #202 (“Type Selection Convention”) because the current context lacks that knowledge.
- Once Rule #202 is loaded (and cached), the constructor step completes, followed by the rest of `impl-order-service`.
- After finishing `impl-order-service` and all its descendants, the engine pops back to the `implementServices` level and moves to the next sibling: `impl-customer-service`.
- Because Rule #202 and others are already in `ruleContext`, `impl-customer-service` reuses them without additional loading.

4. After the entire tree is processed, `OutputResult` aggregates the generated code and presents the diff.

### Integration with the Learning Flow

If during `MatchHighLevelRules` **no** suitable rule is found, the flow transitions to the learning flow as before. However, the new design also allows for **in‑flight rule learning**:

- While executing `ProcessPlanStep`, if a step cannot be completed because _no rule exists_ for a required capability (e.g., “How to handle transactional decorators in this project”), the agent can **pause** the coding flow and invoke the learning flow to generate a candidate rule. Once the user approves the new rule, the coding flow resumes exactly where it left off.

This creates a seamless bidirectional relationship between the two sub‑graphs.

### Updated State Fields for the New Coding Flow

| State Field           | Purpose in New Flow                                                                                                                                         |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `triggeredRules`      | Now stores only **high‑level** rules initially. Additional rules loaded on‑demand are appended to this list.                                                |
| `activeRuleStack`     | Used to prevent circular dependencies during recursive `LoadRequiredRule` calls.                                                                            |
| `ruleContext`         | Holds all data extracted or generated during plan execution, including the results of template expansions.                                                  |
| `missingContext`      | Used internally within `ProcessPlanStep` to determine when to invoke `LoadRequiredRule`.                                                                    |
| `pendingConfirmation` | Set when the agent needs to propose a **new rule** during coding, or when a simple conflict requires user choice (e.g., “Rule already exists; overwrite?”). |
| `executionPlan`       | Stores the root steps of the plan tree.                                                                                                                     |
| _(Internal)_          | The execution engine maintains its own **step stack** to track the current path in the plan tree. This stack is not persisted across sessions in MVP.       |

---

## IV. Intersection of the Two Flows: Discovering Missing Rules During Coding

If at the `MatchTriggerRules` step of the coding flow, no rule matches the current task, or during `PrepareContext` a rule corresponding to a `sourceRuleId` is not found (dirty data situation), trigger a **subgraph transition**:

1. Pause the current coding flow.
2. Package the description of the currently missing context or task intent as a parameter to **start the learning flow** (directly entering the `GenerateCandidateRules` node, skipping some earlier nodes).
3. After the learning flow completes, **resume the coding flow**, restarting from `PrepareContext`.

In LangGraph, this can be achieved through **nested graphs** or **conditional edges that suspend and send a human intervention request**.

---

## V. State Management Key Points

| State Field           | Write Operation Nodes                           | Read Operation Nodes                             |
| :-------------------- | :---------------------------------------------- | :----------------------------------------------- |
| `triggeredRules`      | `MatchTriggerRules`                             | `PrepareContext`, `ExecuteCodeAction`            |
| `ruleContext`         | `PrepareContext` (added each recursion)         | `ExecuteCodeAction` (used for filling templates) |
| `missingContext`      | `PrepareContext` (calculated at initialization) | Recursive control loop                           |
| `pendingConfirmation` | `ProposeNewRules` (and any interactive prompt)  | Frontend polling or LangGraph interrupt point    |
| `messages`            | All interactive nodes                           | Frontend display                                 |

---

## VI. Edge Cases and Exception Handling Strategies

| Scenario                                                                       | Handling Strategy                                                                                                                                                                             |
| :----------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A rule dependency `sourceRuleId` points to a disabled rule                     | In `PrepareContext`, detect `isActive=false`, prompt user and abort, or suggest an alternative rule.                                                                                          |
| User refuses to save new rules in the learning flow                            | End directly, do not modify the database.                                                                                                                                                     |
| User requests to modify rules after code is generated in coding flow           | Can transition to the learning flow from the current coding session via a special command, pre-filling the rule content.                                                                      |
| Multiple rules have overlapping trigger conditions but non-conflicting content | Apply all, merge constraints. If there is a contradiction (e.g., one requires `any`, one forbids it), **prompt the user for resolution** (MVP: simple CLI choice, not automatic arbitration). |

---

## VII. Adaptation for CLI Interaction (MVP Simplification)

Since the tool is positioned as a CLI, interaction with the user (confirmation, conflict resolution) will be **synchronous** in the MVP.

- The CLI will use standard input/output libraries (e.g., Node.js `readline`, `inquirer`) to **block** the graph execution and wait for user response.
- **LangGraph interrupt persistence is NOT used** in the MVP to avoid complex state serialization. If the user aborts (Ctrl+C), the session is lost and must be restarted.
- This keeps the implementation simple and focused on the core rule retrieval logic.

---

## VIII. Final Workflow System Overview

```mermaid
graph TD
    subgraph "CLI Entry"
        CLI{CLI Entry}
        LearnMode[learn mode]
        CodeMode[code mode]
        CLI --> LearnMode
        CLI --> CodeMode
    end

    subgraph "Graph - Shared State"
        LearningSubgraph[Learning Subgraph<br/>]
        CodingSubgraph[Coding Subgraph<br/>Recursive Loading Core]
        HumanInteraction[Human Interaction<br/>Simple CLI prompts]

        LearnMode --> LearningSubgraph
        CodeMode --> CodingSubgraph
        LearningSubgraph --> CodingSubgraph
        CodingSubgraph --> LearningSubgraph
        LearningSubgraph --> HumanInteraction
        CodingSubgraph --> HumanInteraction
    end
```
