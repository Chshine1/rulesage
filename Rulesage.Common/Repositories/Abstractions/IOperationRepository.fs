namespace Rulesage.Common.Repositories.Abstractions

open System.Threading
open System.Threading.Tasks
open Rulesage.Common.Types.Domain

type IOperationRepository =
    abstract member FindByIdAsync: cancellationToken: CancellationToken * id: int -> Task<OperationBlueprint option>