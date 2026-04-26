using Rulesage.Common.Types;
using Rulesage.DslComposer.Types;

namespace Rulesage.DslComposer.Services.Abstractions;

public interface IGrammarGenerator
{
    Task<Grammar> GenerateAsync(
        CompositionContext context,
        CancellationToken cancellationToken = default);
}