namespace Rulesage.Common.Types

type DslEntryId = int

type ContextKey = string
type SubtaskKey = string
type ProductionKey = string

type LeafValue =
    | LiteralLeaf of value: string
    // Template of an NL prompt, with placeholders keys in context
    // Produce a literal by prompting an LLM
    | NlLeaf of promptTemplate: string
    
// The type a context entry will accept
type ContextEntry =
    // accepts a leaf (thus no other specification)
    | Leaf
    // accepts an AST node with the given signature
    | AstNode of signature: AstNodeSignatureId

// Fill a parameter in an AST signature
// so its type is already defined (as in the singature)
type AstParametersFilling =
    // by filling a leaf value
    | Leaf of value: LeafValue
    // by parameters to fill a literal AST of the required type
    | AstLiteral of value: (AstParamaterKey * AstParametersFilling) list
    | FromContext of key: ContextKey
    | FromSubtask of subtaskKey: SubtaskKey * producedKey: ProductionKey

type FilledAst = AstNodeSignatureId * (AstParamaterKey * AstParametersFilling) list

type Subtask =
    // Call a dsl and pass required contexts
    | DslCall of dslId: DslEntryId * context: (ContextKey * FilledAst) list
    // An NL task expecting typed ASTs production
    | NlTask of taskTemplate: string * expect: (ProductionKey * AstNodeSignatureId) list

type DslEntry = {
    id: DslEntryId
    context: (ContextKey * ContextEntry) list
    produce: (ProductionKey * FilledAst) list
    subtasks: (SubtaskKey * Subtask) list
}