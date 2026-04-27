namespace Rulesage.Common.Types

type ContextEntryIr =
    | Leaf
    | AstNode of astSemanticName: AstNodeSignatureIr

type FilledAstIr = {
    astIr: AstNodeSignatureIr
    paramaterFillings: (AstParamaterKey * AstParametersFilling) list
}

type SubtaskIr =
    | DslCall of dslSemanticName: DslEntryIr * context: (ContextKey * FilledAstIr) list
    | NlTask of taskTemplate: string * expect: (ProductionKey * AstNodeSignatureIr) list

type DslCompositionIr = {
    useDsls: AstNodeSignatureIr list
    context: (ContextKey * ContextEntryIr) list
    produce: (ProductionKey * FilledAstIr) list
    subtasks: (SubtaskKey * SubtaskIr) list
}