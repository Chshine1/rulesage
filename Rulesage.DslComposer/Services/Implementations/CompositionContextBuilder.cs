using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class CompositionContextBuilder(IAstSignatureRegistry astRegistry) : ICompositionContextBuilder
{
    private readonly IAstSignatureRegistry _astRegistry = astRegistry;

    public Task<CompositionContext> BuildAsync(
        DslEntry[] prefetchedEntries,
        CancellationToken cancellationToken = default)
    {
        // 1. collect all referenced signature ids
        var referencedIds = new HashSet<int>();
        foreach (var entry in prefetchedEntries)
        {
            foreach (var (_, sig) in entry.context)
                referencedIds.Add(sig);
            foreach (var (_, filled) in entry.produce)
                AddSignatureIds(filled, referencedIds);
            foreach (var (_, subtask) in entry.subtasks)
            {
                switch (subtask)
                {
                    case Subtask.DslCall dslCall:
                    {
                        foreach (var (_, fa) in dslCall.context)
                            AddSignatureIds(fa, referencedIds);
                        break;
                    }
                    case Subtask.NlTask nl:
                    {
                        foreach (var (_, sig) in nl.expect)
                            referencedIds.Add(sig);
                        break;
                    }
                }
            }
        }

        var allSigs = _astRegistry.GetAllSignatures();
        var availableSignatures = allSigs
            .Where(s => referencedIds.Contains(s.id))
            .Select(s => new AstNodeSignatureIr(
                semanticName: s.name,
                signatureId: s.id,
                // description = signature name of the parameter type
                parameters: s.parameters.Select(p => (
                    p.Item1,
                    allSigs.FirstOrDefault(x => x.id == p.Item2)?.name ?? $"id_{p.Item2}"
                )).ToList()
            ))
            .ToList();

        var availableDsls = prefetchedEntries
            .Select(e => new DslEntryIr(
                semanticName: $"dsl_{e.id}",
                dslId: e.id,
                description: $"DSL entry {e.id} with {e.subtasks.Length} subtasks"
            ))
            .ToList();

        return Task.FromResult(new CompositionContext(availableDsls, availableSignatures));
    }

    private static void AddSignatureIds(FilledAst filled, HashSet<int> ids)
    {
        ids.Add(filled.signature);
        foreach (var (_, filling) in filled.parameters)
            CollectIds(filling);
    }

    private static void CollectIds(AstParametersFilling filling)
    {
        if (filling is not AstParametersFilling.AstLiteral literal) return;
        foreach (var (_, inner) in literal.value)
            CollectIds(inner);
    }
}