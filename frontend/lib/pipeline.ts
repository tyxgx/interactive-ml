export type StageName =
  | "start"
  | "preprocess"
  | "split"
  | "train"
  | "predict"
  | "evaluate";

export type StageStatus = "idle" | "running" | "done" | "failed";

export type StageResponse = {
  session_id: string;
  stage: string;
  status: "done" | "failed";
  summary: Record<string, unknown>;
};

export type StageState = {
  status: StageStatus;
  summary: Record<string, unknown> | null;
};

export const STAGE_ORDER: StageName[] = [
  "start",
  "split",
  "preprocess",
  "train",
  "predict",
  "evaluate",
];

export const STAGE_LABELS: Record<StageName, string> = {
  start: "Load Dataset",
  preprocess: "Preprocessing",
  split: "Train/Test Split",
  train: "Model Training",
  predict: "Prediction",
  evaluate: "Evaluation",
};

export type CompareResultRow = {
  algorithm: string;
  metrics: Record<string, number>;
  training_time_seconds: number;
};

export type CompareResult = {
  problem_type: "classification" | "regression";
  results: CompareResultRow[];
};

export type DecisionBoundaryResult = {
  feature_x: string;
  feature_y: string;
  x_range: [number, number];
  y_range: [number, number];
  resolution: number;
  grid_predictions: (number | string)[][];
  classes: (number | string)[];
  points: {
    x: number[];
    y: number[];
    actual: (number | string)[];
    predicted: (number | string)[];
  };
};

export function createInitialStages(): Record<StageName, StageState> {
  return STAGE_ORDER.reduce((acc, stageName) => {
    acc[stageName] = { status: "idle", summary: null };
    return acc;
  }, {} as Record<StageName, StageState>);
}
