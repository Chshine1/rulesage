using Rulesage.Common.Types.Domain;
using Rulesage.Shared.Repositories.Abstractions;
using Rulesage.Shared.Services.Abstractions;

namespace Rulesage.Cli.Handlers;

public class OperationsHandler(IEmbeddingService embeddingService, IOperationRepository operationRepository)
{
    public Task<IEnumerable<OperationSignature>> SearchBySemanticQuery(string query, int skip, int take)
    {
        throw new NotImplementedException();
    }
}