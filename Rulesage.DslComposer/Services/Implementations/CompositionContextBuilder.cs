using Microsoft.FSharp.Collections;
using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;
using Rulesage.Shared.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class CompositionContextBuilder(IAstSignatureRegistry astRegistry) : ICompositionContextBuilder
{
    public async Task<CompositionContext> BuildAsync(
        DslEntry[] prefetchedEntries,
        CancellationToken cancellationToken = default)
    {
        var referencedIds = new HashSet<int>();
        foreach (var entry in prefetchedEntries)
        {
            foreach (var (_, contextEntry) in entry.context)
            {
                if (contextEntry is ContextEntry.AstNode ast) referencedIds.Add(ast.signature);
            }

            foreach (var (_, filled) in entry.produce)
            {
                AddSignatureIds(filled, referencedIds);
            }

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

        var allSigs = await astRegistry.GetAllSignaturesAsync(cancellationToken);
        var availableSignatures = MapModule.OfSeq(allSigs
            .Where(s => referencedIds.Contains(s.id))
            .Select(s =>
            {
                var ir = s.name;
                return new Tuple<string, AstNodeSignatureRep>(ir, new AstNodeSignatureRep(
                    s.name,
                    s.id,
                    ListModule.OfSeq(s.parameters.Select(p => new Tuple<string, string>(
                        p.Item1,
                        allSigs.FirstOrDefault(x => x.id == p.Item2)?.name ?? $"id_{p.Item2}"
                    )))
                ));
            }));

        var availableDsls = MapModule.OfSeq(prefetchedEntries
            .Select(e =>
            {
                var ir = $"dsl_{e.id}";
                return new Tuple<string, DslEntryRep>(
                    ir,
                    new DslEntryRep(
                        ir,
                        e.id,
                        $"DSL entry {e.id} with {e.subtasks.Length} subtasks"
                    )
                );
            }));

        return new CompositionContext(availableSignatures, availableDsls);
    }

    private static void AddSignatureIds(FilledAst filled, HashSet<int> ids)
    {
        ids.Add(filled.astId);
        foreach (var (_, filling) in filled.paramaterFillings)
        {
            CollectIds(filling);
        }
    }

    private static void CollectIds(AstParametersFilling filling)
    {
        if (filling is not AstParametersFilling.AstLiteral literal) return;
        foreach (var (_, inner) in literal.value)
        {
            CollectIds(inner);
        }
    }
}