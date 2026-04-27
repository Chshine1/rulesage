namespace Rulesage.Common.Types

type AstNodeSignatureIr = string
type DslEntryIr = string

type AstNodeSignatureRep = {
    ir: AstNodeSignatureIr
    astId: AstNodeSignatureId
    parameters: (AstParamaterKey * AstNodeSignatureIr) list
}

type DslEntryRep = {
    ir: DslEntryIr
    dslId: DslEntryId
    description: string
}

type CompositionContext = {
    availableAstSignatures: Map<AstNodeSignatureIr, AstNodeSignatureRep>
    availableDsls: Map<DslEntryIr, DslEntryRep>
}