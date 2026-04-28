namespace Rulesage.Common.Types.Domain

type Identifier = {
    id: int
    ir: string
}

type ParamType =
    | Leaf
    | Node of nodeType: Identifier

type Node = {
    id: Identifier
    parameters: Map<string, ParamType>
}

type Converter = {
    id: Identifier
    parameters: Map<string, ParamType>
    outputs: Map<string, ParamType>
}
    
type OperationSignature = {
    id: Identifier
    parameters: Map<string, ParamType>
    outputs: Map<string, ParamType>
}