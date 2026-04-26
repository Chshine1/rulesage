using Rulesage.Common.Types;
using Rulesage.DslComposer.Services.Abstractions;

namespace Rulesage.DslComposer.Services.Implementations;

public class DslIrResolver : IDslIrResolver
{
    public DslEntry Resolve(DslCompositionIr compositionIr, CompositionContext context)
    {
        var dslMap = context.availableDsls.ToDictionary(d => d.ir, d => d.dslId);
        var astMap = context.availableAstSignatures.ToDictionary(a => a.ir, a => a.astId);

        var subtaskList = new List<(SubtaskKey, Subtask)>();
        foreach (var (key, subIr) in compositionIr.subtasks)
        {
            Subtask resolved = subIr switch
            {
                SubtaskIr.DslCall dslCall => new Subtask.DslCall(
                    dslId: ResolveDsl(dslCall.dslSemanticName),
                    context: dslCall.context.Select(c => (
                        c.Item1,
                        ResolveFilledAst(c.Item2, astMap)
                    )).ToList()),
                SubtaskIr.NlTask nl => new Subtask.NlTask(
                    taskTemplate: nl.taskTemplate,
                    expect: nl.expect.Select(e => (
                        e.Item1,
                        ResolveAst(e.Item2)
                    )).ToList()),
                _ => throw new InvalidOperationException("Unknown subtask IR")
            };
            subtaskList.Add((key, resolved));
        }

        var contextList = compositionIr.context.Select(c => (
            c.Item1,
            ResolveAst(c.Item2)
        )).ToList();

        var produceList = compositionIr.produce.Select(p => (
            p.Item1,
            ResolveFilledAst(p.Item2, astMap)
        )).ToList();

        return new DslEntry(
            id: 0, // temporary; real implementation would generate a new ID
            context: contextList,
            produce: produceList,
            subtasks: subtaskList);

        int ResolveDsl(string name) => dslMap[name];
        int ResolveAst(string name) => astMap[name];
    }

    private static FilledAst ResolveFilledAst(FilledAstIr ir, Dictionary<string, int> astMap)
    {
        var resolvedParams = ir.Item[0].Select(p => (
            p.Item1,
            p.Item2
        )).ToList();

        return new FilledAst(
            signature: astMap[ir.Item[1]],
            parameters: resolvedParams);
    }
}