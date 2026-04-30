namespace Rulesage.Synthesis

open System.Threading
open System.Threading.Tasks
open Rulesage.Common.Types.Domain
open Rulesage.Composition
open Rulesage.Retrieval
open Rulesage.Synthesis.Services.Abstractions
open Rulesage.Synthesis.Types

type OperationSynthesizer(converterService: IConverterService, operationService: IOperationService, dslRetrievalService: IDslRetrievalService, operationComposer: IOperationComposer) =
    let rec SynthesizeValueAsync (value: BlueprintValue) (operation: OperationBlueprint) (operationArgs: Map<string, SynthesizedValue>) (cancellationToken: CancellationToken): Task<SynthesizedValue> =
        task {
            match value with
            | BlueprintValue.Leaf template -> return SynthesizedValue.Leaf template
            | BlueprintValue.NodeBlueprint nodeBlueprint ->
                let! node = SynthesizeNodeAsync nodeBlueprint operation operationArgs cancellationToken
                return node |> SynthesizedValue.Node
            | BlueprintValue.FromParameter parameterKey ->
                let arg = operationArgs |> Map.tryFind parameterKey
                match arg with
                | Some a -> return a
                | None -> return failwith "argument key not found"
            | BlueprintValue.FromSubtask (subtaskKey, outputKey) ->
                let subtask = operation.subtasks |> Map.tryFind subtaskKey
                match subtask with
                | Some s ->
                    match s with
                    | Subtask.InvokeConverter (converter, converterArgs) ->
                        let! synArgs = SynthesizeArgumentsAsync converterArgs operation operationArgs cancellationToken
                        return converterService.Convert converter.id synArgs
                    | Subtask.InvokeOperation (subOp, subArgs) ->
                        let bp = operationService.FindOne subOp true
                        let! synArgs = SynthesizeArgumentsAsync subArgs operation operationArgs cancellationToken
                        let! outputs = SynthesizeOperationAsync bp synArgs cancellationToken
                        return outputs |> Map.find outputKey |> SynthesizedValue.Node
                    | Subtask.NlTask template ->
                        let! outputs = SelfSynthesizeNlTaskAsync template cancellationToken
                        return outputs |> Map.find outputKey |> SynthesizedValue.Node
                | None ->
                    return failwith "subtask not found"
        }
        
    and SynthesizeArgumentsAsync (args: Map<string, BlueprintValue>) (operation: OperationBlueprint) (operationArgs: Map<string, SynthesizedValue>) (cancellationToken: CancellationToken): Task<Map<string, SynthesizedValue>> =
        task {
            let tasks = args |> Map.map (fun _ v -> SynthesizeValueAsync v operation operationArgs cancellationToken)
            let! _ = tasks.Values |> Task.WhenAll
            return tasks |> Map.map (fun _ v -> v.Result)
        }

    and SynthesizeNodeAsync (node: NodeBlueprint) (operation: OperationBlueprint) (operationArgs: Map<string, SynthesizedValue>) (cancellationToken: CancellationToken): Task<SynthesizedNode> =
        task {
            let args = node.args |> Map.map (fun _ v -> SynthesizeValueAsync v operation operationArgs cancellationToken)
            let! _ = args.Values |> Task.WhenAll
            return {
                nodeType = node.node
                arguments = args |> Map.map (fun _ v -> v.Result)
            }
        }

    and SynthesizeOperationAsync (operation: OperationBlueprint) (args: Map<string, SynthesizedValue>) (cancellationToken: CancellationToken): Task<Map<string, SynthesizedNode>> =
        task {
            let outputs = operation.outputs |> Map.map (fun _ nodeBp -> SynthesizeNodeAsync nodeBp operation args cancellationToken)
            let! _ = outputs.Values |> Task.WhenAll
            return outputs |> Map.map (fun _ v -> v.Result)
        }
        
    and SelfSynthesizeNlTaskAsync (nlTask: string) (cancellationToken: CancellationToken) =
        task {
            let! prefetchedOps = dslRetrievalService.RetrieveAsync(nlTask, System.Nullable(), cancellationToken)
            let! op = operationComposer.ComposeAsync(nlTask, prefetchedOps, cancellationToken)
            let! result = SynthesizeOperationAsync op Map.empty cancellationToken
            return result
        }
    
    interface IOperationSynthesizer with
        member this.SynthesizeNlTaskAsync(nlTask, cancellationToken) =
            task {
                let! r = SelfSynthesizeNlTaskAsync nlTask cancellationToken
                return r |> Map.toSeq |> readOnlyDict
            }