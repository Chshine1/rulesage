using Rulesage.Common.Types;

namespace Rulesage.Shared.Services.Abstractions;

public interface IAstSignatureRegistry
{
    Task<AstNodeSignature[]> GetAllSignaturesAsync(CancellationToken cancellationToken = default);
}