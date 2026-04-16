export interface ExecutionStep {
  id: string;
  description: string;
  rulesRequired: number[];
  substeps: ExecutionStep[] | null;
}
