using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using Rulesage.Common.Types.Domain;
using Rulesage.Retrieval.Database;
using Rulesage.Retrieval.Database.Entities;
using Rulesage.Retrieval.Options;
using Rulesage.Retrieval.Services.Abstractions;
using Rulesage.Retrieval.Utils;

namespace Rulesage.Retrieval;

public class DslRetrievalService(
    DslDbContext dbContext,
    IEmbeddingService embeddingService,
    IIdfService idfService,
    IOptions<RetrievalOptions> options,
    ILogger<DslRetrievalService> logger)
    : IDslRetrievalService
{
    private readonly RetrievalOptions _options = options.Value;

    public async Task<OperationSignature[]> RetrieveAsync(
        string nlTask,
        float? targetLevel = null,
        CancellationToken cancellationToken = default)
    {
        var queryVector = new Vector(embeddingService.GetEmbedding(nlTask));

        var coarseCandidates = await dbContext.DslEntries
            .Select(e => new { Entry = e, CosineDistance = e.Embedding.CosineDistance(queryVector) })
            .OrderBy(e => e.CosineDistance)
            .Take(_options.CoarseRecallSize)
            .ToListAsync(cancellationToken);

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Coarse recall returned {Count} candidates", coarseCandidates.Count);
        }
        
        var tau = targetLevel ?? 1.0f;
        var scoredCandidates = coarseCandidates
            .Select(c => new
            {
                c.Entry,
                CosineSimilarity = 1.0f - (float)c.CosineDistance,
                LevelFactor = DslRetrievalUtils.ComputeLevelFactor(c.Entry.Level, tau, _options.LevelAlignmentSigma),
                DecayFactor = DslRetrievalUtils.ComputeDecayFactor(idfService.ComputeAverageIdf(c.Entry.Description), _options.IdfPenaltyBeta)
            })
            .Select(x => new
            {
                x.Entry,
                FinalScore = x.CosineSimilarity * x.LevelFactor * x.DecayFactor
            })
            .OrderByDescending(x => x.FinalScore)
            .Take(_options.FinalTopK)
            .Select(x => x.Entry)
            .ToList();

        return scoredCandidates;
    }
}