namespace Rulesage.Common.Repositories.Abstractions

open System.Runtime.InteropServices
open System.Threading
open System.Threading.Tasks
open Rulesage.Common.Types.Domain

type IOperationRepository =
    abstract member FindByIdAsync:
        id: int * [<Optional; DefaultParameterValue(CancellationToken())>] cancellationToken: CancellationToken ->
            Task<OperationBlueprint option>

    abstract member FindOrderByCosineDistance:
        queryVector: float32 array *
        take: int *
        [<Optional; DefaultParameterValue(CancellationToken())>] cancellationToken: CancellationToken ->
            Task<(OperationSignature * float32) array>
