namespace Rulesage.Synthesis.Services.Implementations

open Rulesage.Composition
open Rulesage.Retrieval
open Rulesage.Synthesis.Services.Abstractions

type NlTaskResolver(
    dslRetrievalService: IDslRetrievalService,
    operationComposer: IOperationComposer
) =
    interface INlTaskResolver with
        member this.ResolveAsync cancellationToken nlTask =
            task {
                let! prefetchedOps = dslRetrievalService.RetrieveAsync(nlTask, System.Nullable(), cancellationToken)
                let! op = operationComposer.ComposeAsync(nlTask, prefetchedOps, cancellationToken)
                return op
            }