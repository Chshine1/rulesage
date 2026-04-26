using System.Text.Json;
using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;

namespace Rulesage.DslComposer;

public class DslComposer(
    ICompositionContextBuilder contextBuilder,
    ISemanticPrecomposer semanticComposer,
    IGrammarGenerator grammarGenerator,
    IDslConstrainedDecoder gcd,
    IDslIrResolver irResolver,
    JsonSerializerOptions jsonOptions)
    : IDslComposer
{
    public async Task<DslEntry> ComposeAsync(
        string nlTask,
        DslEntry[] prefetchedEntries,
        CancellationToken cancellationToken = default)
    {
        var context = await contextBuilder.BuildAsync(prefetchedEntries, cancellationToken);
        var semantic = await semanticComposer.ComposeAsync(nlTask, context, cancellationToken);
        var grammar = await grammarGenerator.GenerateAsync(context, cancellationToken);

        var structuredPrompt =
            $"Convert the following semantic composition into a precise DslCompositionIr JSON using the provided grammar.\n" +
            $"Semantic composition:\n{JsonSerializer.Serialize(semantic, jsonOptions)}";

        var compositionIr = await gcd.DecodeAsync(structuredPrompt, grammar, cancellationToken);
        return irResolver.Resolve(compositionIr, context);
    }
}