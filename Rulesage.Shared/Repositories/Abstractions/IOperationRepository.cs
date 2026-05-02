using Rulesage.Common.Types.Domain;

namespace Rulesage.Shared.Repositories.Abstractions;

public interface IOperationRepository : IDocumentRepository
{
    Task<OperationBlueprint?> FindByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IEnumerable<(OperationSignature, float)>> FindOrderByCosineDistance(float[] queryVector, int take,
        CancellationToken cancellationToken = default);
}