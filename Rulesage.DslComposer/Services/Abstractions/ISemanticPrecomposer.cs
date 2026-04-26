using Rulesage.Common.Types;

namespace Rulesage.DslComposer.Services.Abstractions;

public interface ISemanticPrecomposer
{
    Task<SemanticComposition> ComposeAsync(
        string nlTask,
        CompositionContext context,
        CancellationToken cancellationToken = default);
}