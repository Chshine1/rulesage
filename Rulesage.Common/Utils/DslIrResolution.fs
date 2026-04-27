namespace Rulesage.Common.Utils

open Rulesage.Common.Types

module DslIrResolution =
    let Resolve (compositionIr: DslCompositionIr) (context: CompositionContext) : DslEntry =
        let ResolveFilledAst (fir: FilledAstIr) : FilledAst = {
            astId = context.availableAstSignatures[fir.astIr].astId
            paramaterFillings = fir.paramaterFillings
        }

        let ResolveContextEntry (ceIr: ContextEntryIr) : ContextEntry =
            match ceIr with
            | ContextEntryIr.Leaf -> ContextEntry.Leaf
            | ContextEntryIr.AstNode signatureName -> ContextEntry.AstNode context.availableAstSignatures[signatureName].astId

        let ResolveSubtask (subIr: SubtaskIr) : Subtask =
            match subIr with
            | SubtaskIr.DslCall (dslName, contextList) ->
                let dslId = context.availableDsls[dslName].dslId
                let resolvedContext = 
                    contextList 
                    |> List.map (fun (key, fir) -> key, ResolveFilledAst fir)
                Subtask.DslCall (dslId, resolvedContext)

            | SubtaskIr.NlTask (template, expect) ->
                let resolvedExpect = 
                    expect 
                    |> List.map (fun (prodKey, astName) -> prodKey, context.availableAstSignatures[astName].astId)
                Subtask.NlTask (template, resolvedExpect)

        {
            id = -1
            context = 
                compositionIr.context 
                |> List.map (fun (key, ceIr) -> key, ResolveContextEntry ceIr)
            produce = 
                compositionIr.produce 
                |> List.map (fun (key, fir) -> key, ResolveFilledAst fir)
            subtasks = 
                compositionIr.subtasks 
                |> List.map (fun (subtaskKey, subIr) -> subtaskKey, ResolveSubtask subIr)
        }

