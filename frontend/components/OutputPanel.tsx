const METRIC_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  precision: "Precision (weighted)",
  recall: "Recall (weighted)",
  f1: "F1 Score (weighted)",
  r2: "R² Score",
  rmse: "RMSE",
  mae: "MAE",
};

type OutputPanelProps = {
  algorithmName: string | null;
  problemType: string | null;
  metrics: Record<string, unknown> | null;
};

export default function OutputPanel({
  algorithmName,
  problemType,
  metrics,
}: OutputPanelProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-medium text-gray-700 mb-1">Output</h3>
      <div className="border border-gray-200 rounded min-h-32 p-3 text-sm text-gray-700 flex flex-col gap-1">
        {metrics && (
          <>
            {algorithmName && <p>Algorithm: {algorithmName}</p>}
            {problemType && <p>Problem Type: {problemType}</p>}
            {Object.entries(metrics).map(([key, value]) => (
              <p key={key}>
                {METRIC_LABELS[key] ?? key}: {String(value)}
              </p>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
