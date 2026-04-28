using Rulesage.Retrieval.Database.Entities;

namespace Rulesage.Retrieval;


public interface IDslRetrievalService
{
    Task<IReadOnlyList<DslEntry>> RetrieveAsync(
        string nlTask,
        float? targetLevel = null,
        CancellationToken cancellationToken = default);
}