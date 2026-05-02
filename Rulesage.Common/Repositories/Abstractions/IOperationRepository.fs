namespace Rulesage.Common.Repositories.Abstractions

open System.Threading
open System.Threading.Tasks
open Rulesage.Common.Types.Domain

type IOperationRepository =
    abstract member FindByIdAsync: id: int * cancellationToken: CancellationToken -> Task<OperationBlueprint option>
    abstract member FindOrderByCosineDistance: queryVector: float32 array * take: int * cancellationToken: CancellationToken -> Task<(OperationSignature * float32) array>