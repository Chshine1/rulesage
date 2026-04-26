using Rulesage.Common.Types;
using Rulesage.DslComposer.Types;

namespace Rulesage.DslComposer.Services.Abstractions;

public interface IDslConstrainedDecoder
{
    Task<DslCompositionIr> DecodeAsync(
        string prompt,
        Grammar grammar,
        CancellationToken cancellationToken = default);
}