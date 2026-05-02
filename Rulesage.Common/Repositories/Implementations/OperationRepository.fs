namespace Rulesage.Common.Repositories.Implementations

open System.Text.Json
open Npgsql
open Rulesage.Common.Repositories.Abstractions
open Rulesage.Common.Types.Domain

type OperationRepository(jsonOptions: JsonSerializerOptions) =
    interface IOperationRepository with
        member _.FindByIdAsync(id, cancellationToken) = task {
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
        
        member _.FindOrderByCosineDistance(queryVector, take, cancellationToken) = task {
            let connectionString = ""
            use conn = new NpgsqlConnection(connectionString)
            do! conn.OpenAsync(cancellationToken)
            use cmd = new NpgsqlCommand(
                """
                SELECT
                    id,
                    ir,
                    description,
                    signature_params,
                    signature_outputs,
                    (embedding <=> $1) AS distance
                FROM operations
                ORDER BY embedding <=> $1
                LIMIT $2;
                """
            , conn)
            cmd.Parameters.Add(queryVector) |> ignore
            cmd.Parameters.Add(take) |> ignore
            use! reader = cmd.ExecuteReaderAsync(cancellationToken)
            return 
                seq {
                    while reader.Read() do
                        let parameters = JsonSerializer.Deserialize<Map<string, ParamType>>(reader.GetString(3), jsonOptions)
                        let outputs = JsonSerializer.Deserialize<Map<string, ParamType>>(reader.GetString(4), jsonOptions)
                        yield
                            {
                                id = {
                                    id = reader.GetInt32(0)
                                    ir = reader.GetString(1)
                                }
                                description = reader.GetString(2)
                                parameters = parameters
                                outputs = outputs
                            }, float32(reader.GetDouble(5))
                } |> Seq.toArray
        }