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

type OutputPanelProps = {
  algorithmName: string | null;
  problemType: string | null;
  metrics: Record<string, unknown> | null;
  compareResult: CompareResult | null;
};

export default function OutputPanel({
  algorithmName: trainedAlgorithmName,
  problemType,
  metrics,
  compareResult,
}: OutputPanelProps) {
  const metricKeys = compareResult?.results[0]
    ? Object.keys(compareResult.results[0].metrics)
    : [];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700 mb-1">Output</h3>
      <div className="border border-gray-200 rounded min-h-32 p-3 text-sm text-gray-700 flex flex-col gap-4">
        {metrics && (
          <div className="flex flex-col gap-1">
            {trainedAlgorithmName && <p>Algorithm: {trainedAlgorithmName}</p>}
            {problemType && <p>Problem Type: {problemType}</p>}
            {Object.entries(metrics).map(([key, value]) => (
              <p key={key}>
                {METRIC_LABELS[key] ?? key}: {String(value)}
              </p>
            ))}
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
