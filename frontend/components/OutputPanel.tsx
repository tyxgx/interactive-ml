import { Fragment } from "react";
import { algorithms } from "@/lib/algorithms";
import { CompareResult } from "@/lib/pipeline";

const METRIC_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  precision: "Precision (weighted)",
  recall: "Recall (weighted)",
  f1: "F1 Score (weighted)",
  r2: "R² Score",
  rmse: "RMSE",
  mae: "MAE",
};

function algorithmName(id: string): string {
  return algorithms.find((a) => a.id === id)?.name ?? id;
}

function LossCurveSparkline({ values }: { values: number[] }) {
  const width = 200;
  const height = 50;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-gray-700"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type FeatureSignalRow = { feature: string; importance: number };

type ActualPredictedRow = { actual: number; predicted: number };

const METRIC_DISPLAY_KEYS = new Set([
  "accuracy",
  "precision",
  "recall",
  "f1",
  "r2",
  "rmse",
  "mae",
]);

type OutputPanelProps = {
  algorithmName: string | null;
  problemType: string | null;
  metrics: Record<string, unknown> | null;
  compareResult: CompareResult | null;
  trainSummary: Record<string, unknown> | null;
};

export default function OutputPanel({
  algorithmName: trainedAlgorithmName,
  problemType,
  metrics,
  compareResult,
  trainSummary,
}: OutputPanelProps) {
  const metricKeys = compareResult?.results[0]
    ? Object.keys(compareResult.results[0].metrics)
    : [];

  const displayMetrics = metrics
    ? Object.entries(metrics).filter(([key]) => METRIC_DISPLAY_KEYS.has(key))
    : [];

  const confusionMatrix = metrics?.confusion_matrix as number[][] | undefined;
  const confusionMatrixLabels = metrics?.confusion_matrix_labels as
    | (string | number)[]
    | undefined;

  const actualVsPredicted = metrics?.actual_vs_predicted as
    | ActualPredictedRow[]
    | undefined;

  const featureSignal = (trainSummary?.feature_importances ??
    trainSummary?.coefficients) as FeatureSignalRow[] | undefined;
  const featureSignalLabel = trainSummary?.feature_importances
    ? "Feature Importances"
    : "Coefficients";
  const maxAbsImportance = featureSignal
    ? Math.max(...featureSignal.map((row) => Math.abs(row.importance)), 1e-9)
    : 0;

  const lossCurve = trainSummary?.loss_curve as number[] | undefined;
  const architecture = trainSummary?.architecture as string | undefined;
  const epochsRun = trainSummary?.epochs_run as number | undefined;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700 mb-1">Output</h3>
      <div className="border border-gray-200 rounded min-h-32 p-3 text-sm text-gray-700 flex flex-col gap-4">
        {metrics && (
          <div className="flex flex-col gap-1">
            {trainedAlgorithmName && <p>Algorithm: {trainedAlgorithmName}</p>}
            {problemType && <p>Problem Type: {problemType}</p>}
            {displayMetrics.map(([key, value]) => (
              <p key={key}>
                {METRIC_LABELS[key] ?? key}: {String(value)}
              </p>
            ))}
          </div>
        )}

        {lossCurve && lossCurve.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Training Loss Curve</p>
            <p className="text-xs text-gray-600">
              {architecture} &middot; {epochsRun} epochs
            </p>
            <LossCurveSparkline values={lossCurve} />
          </div>
        )}

        {featureSignal && featureSignal.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">{featureSignalLabel}</p>
            <div className="flex flex-col gap-1.5">
              {featureSignal.map((row) => {
                const widthPct =
                  (Math.abs(row.importance) / maxAbsImportance) * 100;
                return (
                  <div key={row.feature} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate text-xs text-gray-600">
                      {row.feature}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                      <div
                        className={
                          row.importance < 0 ? "bg-gray-400 h-4" : "bg-gray-700 h-4"
                        }
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-xs text-gray-600 text-right">
                      {row.importance}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {confusionMatrix && confusionMatrixLabels && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Confusion Matrix</p>
            <div
              className="grid w-fit"
              style={{
                gridTemplateColumns: `repeat(${confusionMatrixLabels.length + 1}, minmax(2.5rem, 1fr))`,
              }}
            >
              <div className="border border-gray-300 px-2 py-1 bg-gray-50" />
              {confusionMatrixLabels.map((label) => (
                <div
                  key={`col-${label}`}
                  className="border border-gray-300 px-2 py-1 bg-gray-50 text-xs font-medium text-center"
                >
                  {label}
                </div>
              ))}
              {confusionMatrix.map((row, rowIndex) => (
                <Fragment key={`row-${rowIndex}`}>
                  <div className="border border-gray-300 px-2 py-1 bg-gray-50 text-xs font-medium text-center">
                    {confusionMatrixLabels[rowIndex]}
                  </div>
                  {row.map((cell, colIndex) => (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={
                        rowIndex === colIndex
                          ? "border border-gray-300 px-2 py-1 text-center bg-gray-100 font-medium"
                          : "border border-gray-300 px-2 py-1 text-center"
                      }
                    >
                      {cell}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Rows = actual class, columns = predicted class.
            </p>
          </div>
        )}

        {actualVsPredicted && actualVsPredicted.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              Actual vs Predicted (first {actualVsPredicted.length} test points)
            </p>
            <table className="border border-gray-300 border-collapse w-fit">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Actual
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Predicted
                  </th>
                </tr>
              </thead>
              <tbody>
                {actualVsPredicted.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1">
                      {row.actual}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {row.predicted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compareResult && (
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              Algorithm Comparison ({compareResult.problem_type})
            </p>
            <table className="border border-gray-300 border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Algorithm
                  </th>
                  {metricKeys.map((key) => (
                    <th
                      key={key}
                      className="border border-gray-300 px-2 py-1 text-left"
                    >
                      {METRIC_LABELS[key] ?? key}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-2 py-1 text-left">
                    Training Time (s)
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareResult.results.map((row, index) => (
                  <tr
                    key={row.algorithm}
                    className={index === 0 ? "bg-gray-100 font-medium" : ""}
                  >
                    <td className="border border-gray-300 px-2 py-1">
                      {algorithmName(row.algorithm)}
                    </td>
                    {metricKeys.map((key) => (
                      <td key={key} className="border border-gray-300 px-2 py-1">
                        {row.metrics[key]}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-2 py-1">
                      {row.training_time_seconds}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
