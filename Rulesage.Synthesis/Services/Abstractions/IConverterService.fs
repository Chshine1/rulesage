namespace Rulesage.Synthesis.Services.Abstractions

open Rulesage.Synthesis.Types

type IConverterService =
    abstract member Convert: converterId: int -> args: Map<string, SynthesizedValue> -> SynthesizedValue