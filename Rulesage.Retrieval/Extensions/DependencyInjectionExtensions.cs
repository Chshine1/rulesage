using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.ML.Tokenizers;
using Rulesage.Retrieval.Database;
using Rulesage.Retrieval.Options;
using Rulesage.Retrieval.Services.Abstractions;
using Rulesage.Retrieval.Services.Implementations;

namespace Rulesage.Retrieval.Extensions;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection collection)
    {
        public IServiceCollection AddDslRetrieval(
            string connectionString,
            string onnxModelPath,
            string vocabPath,
            Action<RetrievalOptions>? configureOptions = null)
        {
            collection.AddDbContext<DslDbContext>(options =>
                options.UseNpgsql(connectionString, npgsqlOptions =>
                    npgsqlOptions.UseVector()));

            collection.AddSingleton<Tokenizer>(BertTokenizer.Create(vocabPath));

            collection.Configure(configureOptions ?? (_ => { }));

            collection.AddSingleton<IIdfService, IdfService>();

            collection.AddSingleton<IEmbeddingService>(sp =>
                new OnnxEmbeddingService(sp.GetRequiredService<Tokenizer>(), onnxModelPath));

            collection.AddScoped<IDslRetrievalService, DslRetrievalService>();

            return collection;
        }
    }
}