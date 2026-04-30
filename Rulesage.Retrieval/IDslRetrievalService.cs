using Rulesage.Common.Types.Domain;

namespace Rulesage.Retrieval;


public interface IDslRetrievalService
{
    Task<OperationSignature[]> RetrieveAsync(
        string nlTask,
        float? targetLevel = null,
        CancellationToken cancellationToken = default);
}