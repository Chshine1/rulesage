using Rulesage.Common.Types.Domain;
using Rulesage.Common.Types.Synthesis;

namespace Rulesage.Synthesis;

public interface IAstSynthesizer
{
    Task<Dictionary<string, SynthesizedNode>> SynthesizeAsync(OperationBlueprint entry,
        CancellationToken cancellationToken = default);
}