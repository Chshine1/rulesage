using System.Text.Json;
using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;
using Rulesage.DslComposer.Types;
using Rulesage.Shared.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class DslConstrainedDecoder(ILlmService llm, JsonSerializerOptions jsonOptions) : IDslConstrainedDecoder
{
    public async Task<DslCompositionIr> DecodeAsync(
        string prompt,
        Grammar grammar,
        CancellationToken cancellationToken = default)
    {
        // TODO: Use GCD here
        var rawJson = await llm.CompleteAsync(prompt, cancellationToken);

        return JsonSerializer.Deserialize<DslCompositionIr>(rawJson, jsonOptions)
               ?? throw new InvalidOperationException("GCD did not return a valid DslCompositionIr.");
    }
}