namespace Rulesage.Common.Types

type AstNodeSignatureIr = string
type DslEntryIr = string

type AstNodeSignatureRep = {
    ir: AstNodeSignatureIr
    astId: AstNodeSignatureId
    parameters: (AstParamaterKey * string) list
}

type DslEntryRep = {
    ir: DslEntryIr
    dslId: DslEntryId
    description: string
}

type CompositionContext = {
    availableAstSignatures: AstNodeSignatureRep list
    availableDsls: DslEntryRep list
}