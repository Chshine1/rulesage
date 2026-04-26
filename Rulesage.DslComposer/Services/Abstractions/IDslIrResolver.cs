using Rulesage.Common.Types;

namespace Rulesage.DslComposer.Services.Abstractions;

public interface IDslIrResolver
{
    DslEntry Resolve(DslCompositionIr compositionIr, CompositionContext context);
}