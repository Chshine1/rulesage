using System.Text.Json;
using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;
using Rulesage.Shared.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class SemanticPrecomposer(ILlmService llm, JsonSerializerOptions jsonOptions) : ISemanticPrecomposer
{
    public async Task<SemanticComposition> ComposeAsync(
        string nlTask,
        CompositionContext context,
        CancellationToken cancellationToken = default)
    {
        var dslList = string.Join(", ", context.availableDsls.Select(d => d.ir));
        var astList = string.Join(", ",
            context.availableAstSignatures.Select(a =>
                $"{a.ir} ({string.Join(", ", a.parameters.Select(p => p.Item1 + ":" + p.Item2))})"));

        var prompt =
            $$"""
              Compose a new DSL entry by reusing existing ones.
              Available DSL entries: {{dslList}}
              Available AST node signatures and their parameters: {{astList}}

              Task: {{nlTask}}

              Output a JSON object strictly following this schema (but use natural language for descriptions when precise values are not mandated by the schema):
              {
                "useDsls": ["<dsl_semantic_name>"],
                "context": [{"key": "<context_key>", "value": "<description of the required AST>"}],
                "produce": [{"key": "<production_key>", "value": "<description of the filled AST>"}],
                "subtasks": [{"key": "<subtask_key>", "value": "<description of what the subtask does>"}]
              }
              """;

        var rawJson = await llm.CompleteAsync(prompt, cancellationToken);
        return JsonSerializer.Deserialize<SemanticComposition>(rawJson, jsonOptions)
               ?? throw new InvalidOperationException("Failed to parse semantic composition.");
    }
}