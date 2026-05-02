namespace Rulesage.Retrieval.Services.Abstractions;

public interface IIdfService
{
    Task<float> ComputeAverageIdfAsync(string text, CancellationToken cancellationToken = default);
}