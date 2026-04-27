using Rulesage.Common.Types;
using Rulesage.Common.Utils;
using Rulesage.DslComposer.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class DslIrResolver : IDslIrResolver
{
    public DslEntry Resolve(DslCompositionIr compositionIr, CompositionContext context)
    {
        return DslIrResolution.Resolve(compositionIr, context);
    }
}