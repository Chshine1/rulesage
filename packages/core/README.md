## I. Table Structure Design

### 1. Main Rules Table `rules`

```sql
CREATE TABLE rules (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    description      JSONB NOT NULL DEFAULT '{"text": "", "refs": []}',  -- Structured description
    tags             TEXT[] NOT NULL DEFAULT '{}',
    version          INT NOT NULL DEFAULT 1,
    is_active        BOOLEAN NOT NULL DEFAULT true,

    -- Trigger condition: flat JSON, keys are condition types, values are match patterns
    trigger_condition JSONB NOT NULL DEFAULT '{}',

    -- Context schema: variable name -> { description, source_rule_id, output_key, required }
    context_schema   JSONB NOT NULL DEFAULT '{}',

    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rules_tags ON rules USING gin (tags);
CREATE INDEX idx_rules_trigger_condition ON rules USING gin (trigger_condition);
CREATE INDEX idx_rules_context_schema ON rules USING gin (context_schema);
```

### 2. Rule References Table `rule_references`

```sql
CREATE TABLE rule_references (
    id               SERIAL PRIMARY KEY,
    source_rule_id   INT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    target_rule_id   INT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    reference_type   TEXT NOT NULL,  -- e.g., 'DEPENDS_ON', 'CONTEXT_SOURCE', 'MENTIONED_IN_DESC'
    context_key      TEXT,           -- When reference_type = 'CONTEXT_SOURCE', indicates which context variable
    metadata         JSONB,
    UNIQUE (source_rule_id, target_rule_id, reference_type, context_key)
);
```

---

## II. Detailed Field Explanations

### 1. Structured Format of `description`

**Format**:

```json
{
  "text": "Domain service classes must follow {rule:6}, located under the domain directory specified in {rule:2}.",
  "refs": [
    {
      "placeholder": "{rule:6}",
      "rule_id": 6,
      "rule_name": "Create NestJS DI standard service class"
    },
    {
      "placeholder": "{rule:2}",
      "rule_id": 2,
      "rule_name": "Non-gateway microservice directory specification"
    }
  ]
}
```

**Benefits**:

- When AI reads this, it can directly extract the IDs of referenced rules without semantic guessing.
- Frontend rendering can replace placeholders with hyperlinks, improving maintainability.
- When inserting a new rule reference, the `refs` array can be automatically updated and synchronized with the `rule_references` table (optional trigger implementation).

### 2. Unified Rule Reference Format for `context_schema`

**Format**:

```typescript
const contextSchema = {
  service_path: {
    description: 'Relative path to the current microservice root directory',
    source_rule_id: 101, // Assume 101 is the "get service root directory" rule
    output: 'a relative path', // Specific what and how to output
    required: true,
  },
  domain_aggregates: {
    description: 'List of aggregate roots parsed from DOMAIN.md',
    source_rule_id: 3, // Rule 3: "DOMAIN.md DDD domain modeling specification"
    output_key: 'names of aggregates as an array',
    required: true,
  },
};
```

**Key Points**:

- No more `type` field. All information retrieval is considered **calling another rule**. Even low-level file operations should be encapsulated by corresponding base rules.
- Base rules (e.g., "get service root directory", "read and parse JSON file") can be pre-populated in the system. Their `context_schema` can be empty (no external input needed), and execution is handled by the Agent's built-in capabilities.

### 3. `trigger_condition` Remains Unchanged

Still uses flat JSON with array values, convenient for `@>` queries.

---

## III. Complete Table Creation SQL

```sql
-- Main rules table
CREATE TABLE rules (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    description      JSONB NOT NULL DEFAULT '{"text": "", "refs": []}',
    tags             TEXT[] NOT NULL DEFAULT '{}',
    version          INT NOT NULL DEFAULT 1,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    trigger_condition JSONB NOT NULL DEFAULT '{}',
    context_schema   JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rules_tags ON rules USING gin (tags);
CREATE INDEX idx_rules_trigger_condition ON rules USING gin (trigger_condition);
CREATE INDEX idx_rules_context_schema ON rules USING gin (context_schema);

-- Rule references table
CREATE TABLE rule_references (
    id               SERIAL PRIMARY KEY,
    source_rule_id   INT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    target_rule_id   INT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    reference_type   TEXT NOT NULL,
    context_key      TEXT,   -- Only used when reference_type = 'CONTEXT_SOURCE', records the key name in context_schema
    metadata         JSONB,
    UNIQUE (source_rule_id, target_rule_id, reference_type, context_key)
);

COMMENT ON TABLE rules IS 'Project development specifications and knowledge rules, declaratively defined for AI to query and follow';
COMMENT ON COLUMN rules.description IS 'Structured description, format {"text": "...", "refs": [{"placeholder": "...", "rule_id": ...}]}';
COMMENT ON COLUMN rules.trigger_condition IS 'Trigger condition, e.g., {"user_intent": ["implement_domain_model"]}';
COMMENT ON COLUMN rules.context_schema IS 'Context requirement declaration, key is variable name, value contains source_rule_id (pointing to the rule that provides the data) and output_key';
```

---

## IV. Design Philosophy Explanation

### 1. Why Encapsulate All Information Retrieval with Rules?

- **Unified abstraction, simplified mental model**: Whether reading files, parsing code, or calling APIs, to the upper-level Agent, it's all "execute a rule and get its output." The rule system forms a closed loop internally. Adding a new way to retrieve information only requires adding a new rule, no need to modify the table structure.
- **Naturally supports dependency derivation**: When the Agent sees `source_rule_id` in `context_schema`, it can recursively expand the entire dependency tree and automatically plan which rules must be executed first.
- **Observability and debugging**: The execution of every rule can be logged. When troubleshooting, you can clearly see "to get `service_path`, rule 101 was executed."

### 2. Workflow Impact of Structured `description`

Assume rule 5's description is:

```json
{
  "text": "Create domain service classes, following {rule:6}, file locations conform to the domain directory conventions of {rule:2}.",
  "refs": [
    {
      "placeholder": "{rule:6}",
      "rule_id": 6,
      "rule_name": "NestJS DI service class specification"
    },
    {
      "placeholder": "{rule:2}",
      "rule_id": 2,
      "rule_name": "Microservice directory structure specification"
    }
  ]
}
```

When AI reads rule 5:

- It can directly get the IDs of rule 6 and rule 2 from the `refs` array without natural language understanding.
- It can immediately show the user: "This rule depends on rule 6 and rule 2. View details?"
- If rule 2 changes, you can find all rules that reference it in their description through reverse queries, facilitating impact analysis.

### 3. Query Mechanism Review

**Scenario: User says "implement endpoints for the domain model of the order service"**

1. **Trigger rule query**:

   ```sql
   SELECT * FROM rules WHERE trigger_condition @> '{"user_intent": ["implement_domain_model"]}';
   ```

   Get rule R-4.

2. **Parse context requirements**:
   Check R-4's `context_schema`, find that `domain_aggregates` is needed, with `source_rule_id` of 3.

3. **Recursively get context**:
   Execute rule 3 (parse DOMAIN.md), rule 3 also needs `service_path`, with `source_rule_id` of 101. Rule 101 is a built-in base rule, the Agent directly calls the built-in capability to return the root directory.

4. **Apply constraints**:
   During the endpoint generation process, the Agent continuously checks for rules whose `trigger_condition` matches `{"action": "create_ts_file"}` (like rules 8, 9), merging their constraints into the generation behavior.

5. **Reference navigation**:
   When understanding rules, AI can use structured references in descriptions to quickly jump to related rules, forming a knowledge network.

---

## V. Sample Data Population (Abridged Version)

### Rules Table

| id  | name                                    | description (jsonb)                                                                                                                    | tags                | trigger_condition                            | context_schema                                                                         |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Microservice overall structure          | `{"text":"Project consists of gateway service and other microservices...","refs":[]}`                                                  | {project-structure} | `{"user_intent":["understand_layout"]}`      | `{}`                                                                                   |
| 2   | Non-gateway microservice directory spec | `{"text":"Root directory must have DOMAIN.md, see {rule:1} for details","refs":[{"placeholder":"{rule:1}","rule_id":1}]}`              | {project-structure} | `{"file_pattern":"*/DOMAIN.md"}`             | `{"service_root":{"source_rule_id":101,"output_key":"path"}}`                          |
| 3   | DOMAIN.md DDD modeling spec             | `{"text":"Strictly follow DDD tactical patterns...","refs":[]}`                                                                        | {ddd}               | `{"file_exists":"DOMAIN.md"}`                | `{"service_root":{"source_rule_id":101,"output_key":"path"}}`                          |
| 4   | Implement application service endpoints | `{"text":"Each application service method corresponds to an endpoint, following the domain model of {rule:3}","refs":[{"rule_id":3}]}` | {implementation}    | `{"user_intent":["implement_domain_model"]}` | `{"domain_aggregates":{"source_rule_id":3,"output_key":"aggregates","required":true}}` |
| 5   | Create domain service                   | `{"text":"Create domain service class, follow {rule:6}, location conforms to {rule:2}","refs":[{"rule_id":6},{"rule_id":2}]}`          | {implementation}    | `{"missing_entity":"domain_service"}`        | `{"aggregate_name":{...}}`                                                             |
| 6   | Create NestJS DI service class          | `{"text":"Use @Injectable(), constructor injection","refs":[]}`                                                                        | {code-style,nestjs} | `{"file_type":"service_class"}`              | `{}`                                                                                   |
| 7   | Create domain endpoint                  | `{"text":"Create controller method, follow parameter type spec of {rule:8}","refs":[{"rule_id":8}]}`                                   | {implementation}    | `{"missing_entity":"controller_method"}`     | `{}`                                                                                   |
| 8   | Method parameter and return type spec   | `{"text":"No 'any' allowed, parameters must be DTO classes, see {rule:9}","refs":[{"rule_id":9}]}`                                     | {code-style}        | `{"action":"create_method"}`                 | `{}`                                                                                   |
| 9   | DTO specification                       | `{"text":"DTOs go in src/dto/, use class-validator","refs":[]}`                                                                        | {code-style}        | `{"file_type":"dto"}`                        | `{}`                                                                                   |

### Base Rules (Built-in, ID 100+)

| id  | name                             | description                                                                        | tags          | context_schema output description (convention) |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- | ------------- | ---------------------------------------------- |
| 101 | Get service root directory       | `{"text":"Search upward from current file for directory containing package.json"}` | {builtin,fs}  | Outputs `{"path": "..."}`                      |
| 102 | Scan NestJS controller endpoints | `{"text":"Parse @Get/@Post methods in src/**/*.controller.ts"}`                    | {builtin,ast} | Outputs `{"endpoints": [...]}`                 |
