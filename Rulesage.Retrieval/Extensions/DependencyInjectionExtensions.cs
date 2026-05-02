using Microsoft.Extensions.DependencyInjection;
using Microsoft.ML.Tokenizers;
using Rulesage.Retrieval.Options;
using Rulesage.Retrieval.Services.Abstractions;
using Rulesage.Retrieval.Services.Implementations;

namespace Rulesage.Retrieval.Extensions;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection collection)
    {
        public IServiceCollection AddDslRetrieval(
            string onnxModelPath,
            string vocabPath,
            Action<RetrievalOptions>? configureOptions = null)
        {
            collection.AddSingleton<Tokenizer>(BertTokenizer.Create(vocabPath));

            collection.Configure(configureOptions ?? (_ => { }));

            collection.AddSingleton<OperationIdfService>();

            collection.AddSingleton<IEmbeddingService>(sp =>
                new OnnxEmbeddingService(sp.GetRequiredService<Tokenizer>(), onnxModelPath));

            collection.AddScoped<IOperationRetrievalService, OperationRetrievalService>();

            return collection;
        }
    }
}