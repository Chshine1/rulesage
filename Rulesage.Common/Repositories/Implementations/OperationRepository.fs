namespace Rulesage.Common.Repositories.Implementations

open System.Text.Json
open Npgsql
open Rulesage.Common.Repositories.Abstractions
open Rulesage.Common.Types.Domain

type OperationRepository(jsonOptions: JsonSerializerOptions) =
    interface IOperationRepository with
        member this.FindByIdAsync(cancellationToken, id) = task {
            let connectionString = ""
            use conn = new NpgsqlConnection(connectionString)
            do! conn.OpenAsync(cancellationToken)
            use cmd = new NpgsqlCommand("SELECT subtasks, outputs FROM operations WHERE id = $1", conn)
            cmd.Parameters.Add(id) |> ignore
            use! reader = cmd.ExecuteReaderAsync(cancellationToken)
            if reader.Read() then
                let subtasksJson = reader.GetString(0)
                let outputsJson  = reader.GetString(1)
                let subtasks = JsonSerializer.Deserialize<Map<string, Subtask>>(subtasksJson, jsonOptions)
                let outputs  = JsonSerializer.Deserialize<Map<string, NodeBlueprint>>(outputsJson, jsonOptions)
                return Some { subtasks = subtasks; outputs = outputs }
            else
                return None
        }
        