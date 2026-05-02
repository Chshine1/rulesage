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
        public IServiceCollection AddOperationRetrieval(
            string onnxModelPath,
            string vocabPath,
            Action<RetrievalOptions>? configureOptions = null)
        {
            collection.AddSingleton<Tokenizer>(WordPieceTokenizer.Create(vocabPath,
                new WordPieceOptions
                {
                    SpecialTokens = new Dictionary<string, int>
                    {
                        ["[PAD]"] = 0,
                        ["[UNK]"] = 100,
                        ["[CLS]"] = 101,
                        ["[SEP]"] = 102,
                        ["[MASK]"] = 103
                    }
                }));

            collection.Configure(configureOptions ?? (_ => { }));

            collection.AddSingleton<IOperationIdfService, OperationIdfService>();

            collection.AddSingleton<IEmbeddingService>(sp =>
                new OnnxEmbeddingService(sp.GetRequiredService<Tokenizer>(), onnxModelPath));

            collection.AddScoped<IOperationRetrievalService, OperationRetrievalService>();

            return collection;
        }
    }
}