namespace Rulesage.Synthesis.Services.Abstractions

open Rulesage.Common.Types.Domain

type IOperationService =
    abstract member FindOne: id: Identifier -> byId: bool -> OperationBlueprint