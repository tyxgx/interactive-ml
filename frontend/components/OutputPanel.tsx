import { Fragment } from "react";
import { BarChart3, TrendingUp, Grid3x3, Table2, GitCompare } from "lucide-react";
import { algorithms } from "@/lib/algorithms";
import { CompareResult } from "@/lib/pipeline";
import { card } from "@/lib/ui";
import DecisionBoundaryPlot from "./DecisionBoundaryPlot";

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

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
      {children}
    </p>
  );
}

function LossCurveSparkline({ values }: { values: number[] }) {
  const width = 320;
  const height = 96;
  const padding = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - padding * 2) + padding;
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePoints = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPoints = `${padding},${height - padding} ${linePoints} ${
    width - padding
  },${height - padding}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary"
      preserveAspectRatio="none"
    >
      <polygon points={areaPoints} fill="currentColor" opacity="0.08" />
      <polyline
        points={linePoints}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  sessionId: string | null;
  numericFeatures: string[];
};

export default function OutputPanel({
  algorithmName: trainedAlgorithmName,
  problemType,
  metrics,
  compareResult,
  trainSummary,
  sessionId,
  numericFeatures,
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

  const hasContent =
    metrics ||
    trainSummary ||
    (lossCurve && lossCurve.length > 1) ||
    (featureSignal && featureSignal.length > 0) ||
    (confusionMatrix && confusionMatrixLabels) ||
    (actualVsPredicted && actualVsPredicted.length > 0) ||
    compareResult;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Output</h3>
      <div className={`${card} min-h-32 p-5 flex flex-col gap-6`}>
        {!hasContent && (
          <p className="text-sm text-muted-foreground">
            Run the pipeline to see metrics and visualizations here.
          </p>
        )}

        {metrics && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {trainedAlgorithmName && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-soft text-primary">
                  {trainedAlgorithmName}
                </span>
              )}
              {problemType && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-sunken text-muted-foreground border border-border">
                  {problemType}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayMetrics.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-md border border-border bg-surface-sunken px-3 py-2.5"
                >
                  <p className="text-xs text-muted-foreground">
                    {METRIC_LABELS[key] ?? key}
                  </p>
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {lossCurve && lossCurve.length > 1 && (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={TrendingUp}>Training Loss Curve</SectionHeading>
            <p className="text-xs font-mono text-muted-foreground">
              {architecture} &middot; {epochsRun} epochs
            </p>
            <div className="rounded-md border border-border bg-surface-sunken px-3 py-3">
              <LossCurveSparkline values={lossCurve} />
            </div>
          </div>
        )}

        {featureSignal && featureSignal.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={BarChart3}>{featureSignalLabel}</SectionHeading>
            <div className="flex flex-col gap-1.5">
              {featureSignal.map((row) => {
                const widthPct =
                  (Math.abs(row.importance) / maxAbsImportance) * 100;
                return (
                  <div key={row.feature} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">
                      {row.feature}
                    </span>
                    <div className="flex-1 bg-surface-sunken rounded h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded transition-[width] duration-300 ${
                          row.importance < 0 ? "bg-muted-foreground/60" : "bg-primary"
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-xs font-mono text-muted-foreground text-right">
                      {row.importance}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {problemType === "classification" && trainSummary && sessionId && (
          <DecisionBoundaryPlot
            sessionId={sessionId}
            numericFeatures={numericFeatures}
            trainSummary={trainSummary}
          />
        )}

        {confusionMatrix && confusionMatrixLabels && (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={Grid3x3}>Confusion Matrix</SectionHeading>
            <div className="overflow-x-auto">
              <div
                className="grid w-fit rounded-md overflow-hidden border border-border"
                style={{
                  gridTemplateColumns: `repeat(${confusionMatrixLabels.length + 1}, minmax(2.5rem, 1fr))`,
                }}
              >
                <div className="px-2 py-1.5 bg-surface-sunken border-b border-r border-border" />
                {confusionMatrixLabels.map((label) => (
                  <div
                    key={`col-${label}`}
                    className="px-2 py-1.5 bg-surface-sunken border-b border-border text-xs font-mono font-medium text-center text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
                {confusionMatrix.map((row, rowIndex) => (
                  <Fragment key={`row-${rowIndex}`}>
                    <div className="px-2 py-1.5 bg-surface-sunken border-r border-border text-xs font-mono font-medium text-center text-muted-foreground">
                      {confusionMatrixLabels[rowIndex]}
                    </div>
                    {row.map((cell, colIndex) => (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`px-2 py-1.5 text-center text-sm font-mono ${
                          rowIndex === colIndex
                            ? "bg-primary-soft text-primary font-semibold"
                            : "text-foreground/80"
                        }`}
                      >
                        {cell}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Rows = actual class, columns = predicted class.
            </p>
          </div>
        )}

        {actualVsPredicted && actualVsPredicted.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={Table2}>
              Actual vs Predicted (first {actualVsPredicted.length} test points)
            </SectionHeading>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-fit border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-sunken">
                    <th className="px-3 py-1.5 text-left font-semibold text-foreground border-b border-border">
                      Actual
                    </th>
                    <th className="px-3 py-1.5 text-left font-semibold text-foreground border-b border-border">
                      Predicted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actualVsPredicted.map((row, index) => (
                    <tr key={index} className="odd:bg-surface-raised even:bg-surface-sunken/40">
                      <td className="px-3 py-1.5 font-mono text-xs border-b border-border">
                        {row.actual}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs border-b border-border">
                        {row.predicted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {compareResult && (
          <div className="flex flex-col gap-2">
            <SectionHeading icon={GitCompare}>
              Algorithm Comparison ({compareResult.problem_type})
            </SectionHeading>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-sunken">
                    <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">
                      Algorithm
                    </th>
                    {metricKeys.map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap"
                      >
                        {METRIC_LABELS[key] ?? key}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">
                      Training Time (s)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareResult.results.map((row, index) => (
                    <tr
                      key={row.algorithm}
                      className={
                        index === 0
                          ? "bg-primary-soft font-medium"
                          : "odd:bg-surface-raised even:bg-surface-sunken/40"
                      }
                    >
                      <td className="px-3 py-2 border-b border-border">
                        {algorithmName(row.algorithm)}
                      </td>
                      {metricKeys.map((key) => (
                        <td key={key} className="px-3 py-2 font-mono text-xs border-b border-border">
                          {row.metrics[key]}
                        </td>
                      ))}
                      <td className="px-3 py-2 font-mono text-xs border-b border-border">
                        {row.training_time_seconds}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
