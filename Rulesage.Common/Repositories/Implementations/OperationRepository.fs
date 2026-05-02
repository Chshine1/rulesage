namespace Rulesage.Common.Repositories.Implementations

open System.Text.Json
open Npgsql
open Rulesage.Common.Repositories.Abstractions
open Rulesage.Common.Types.Domain

type OperationRepository(dataSource: NpgsqlDataSource, jsonOptions: JsonSerializerOptions) =
    interface IDocumentRepository with
        member _.GetDocumentsAsync(cancellationToken) =
            task {
                use conn = dataSource.CreateConnection()
                do! conn.OpenAsync(cancellationToken)

                use cmd = new NpgsqlCommand("SELECT description FROM operations", conn)
                use! reader = cmd.ExecuteReaderAsync(cancellationToken)

                return
                    seq {
                        while reader.Read() do
                            yield reader.GetString(0)
                    }
            }

    interface IOperationRepository with
        member _.FindByIdAsync(id, cancellationToken) =
            task {
                use conn = dataSource.CreateConnection()
                do! conn.OpenAsync(cancellationToken)

                use cmd =
                    new NpgsqlCommand("SELECT subtasks, outputs FROM operations WHERE id = $1", conn)

                cmd.Parameters.Add(id) |> ignore
                use! reader = cmd.ExecuteReaderAsync(cancellationToken)

                if reader.Read() then
                    let subtasksJson = reader.GetString(0)
                    let outputsJson = reader.GetString(1)

                    let subtasks =
                        JsonSerializer.Deserialize<Map<string, Subtask>>(subtasksJson, jsonOptions)

                    let outputs =
                        JsonSerializer.Deserialize<Map<string, NodeBlueprint>>(outputsJson, jsonOptions)

                    return
                        Some
                            {
                                subtasks = subtasks
                                outputs = outputs
                            }
                else
                    return None
            }

        member _.FindOrderByCosineDistance(queryVector, take, cancellationToken) =
            task {
                use conn = dataSource.CreateConnection()
                do! conn.OpenAsync(cancellationToken)

                use cmd =
                    new NpgsqlCommand(
                        """
                        SELECT
                            id,
                            ir,
                            description,
                            level,
                            signature_params,
                            signature_outputs,
                            (embedding <=> $1) AS distance
                        FROM operations
                        ORDER BY embedding <=> $1
                        LIMIT $2;
                        """,
                        conn
                    )

                cmd.Parameters.Add(queryVector) |> ignore
                cmd.Parameters.Add(take) |> ignore
                use! reader = cmd.ExecuteReaderAsync(cancellationToken)

                return
                    seq {
                        while reader.Read() do
                            let parameters =
                                JsonSerializer.Deserialize<Map<string, ParamType>>(reader.GetString(4), jsonOptions)

                            let outputs =
                                JsonSerializer.Deserialize<Map<string, ParamType>>(reader.GetString(5), jsonOptions)

                            yield
                                {
                                    id =
                                        {
                                            id = reader.GetInt32(0)
                                            ir = reader.GetString(1)
                                        }
                                    description = reader.GetString(2)
                                    level = reader.GetFloat(3)
                                    parameters = parameters
                                    outputs = outputs
                                },
                                float32 (reader.GetDouble(6))
                    }
                    |> Seq.toArray
            }
