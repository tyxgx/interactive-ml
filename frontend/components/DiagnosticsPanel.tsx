"use client";

import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { StageResponse } from "@/lib/pipeline";
import { button } from "@/lib/ui";
import { LineChart, ScatterChart } from "@/components/charts/Charts";

type DiagnosticKey = "learning-curve" | "roc" | "residuals" | "importance";

type LearningCurve = {
  scoring: string;
  train_sizes: number[];
  train_mean: number[];
  train_std: number[];
  val_mean: number[];
  val_std: number[];
  note?: string;
};

type RocCurve = {
  label: string;
  fpr: number[];
  tpr: number[];
  auc: number;
  recall: number[];
  precision: number[];
  average_precision: number;
};

type Residuals = {
  actual: number[];
  predicted: number[];
  residuals: number[];
  mean_residual: number;
  std_residual: number;
  sampled: boolean;
};

type Importance = {
  scoring: string;
  features: { feature: string; importance: number; std: number }[];
  note?: string;
};

type Props = {
  sessionId: string;
  problemType: string | null;
  algorithm: string;
};

const zip = (a: number[], b: number[]): [number, number][] => a.map((v, i) => [v, b[i]]);

function Explain({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground max-w-[70ch]">{children}</p>;
}

function LearningCurveView({ data }: { data: LearningCurve }) {
  const lo = (m: number[], s: number[]): [number, number][] => m.map((v, i) => [v - s[i], v + s[i]]);
  const gap = data.train_mean[data.train_mean.length - 1] - data.val_mean[data.val_mean.length - 1];
  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <LineChart
        title="Learning curve"
        xAxis="Training rows"
        yAxis={data.scoring === "accuracy" ? "Accuracy" : "R²"}
        series={[
          { label: "Training score", color: 1, points: zip(data.train_sizes, data.train_mean), band: lo(data.train_mean, data.train_std) },
          { label: "Validation score (3-fold CV)", color: 3, points: zip(data.train_sizes, data.val_mean), band: lo(data.val_mean, data.val_std) },
        ]}
      />
      <Explain>
        With all training rows the gap between the curves is{" "}
        <span className="font-mono font-semibold text-foreground">{gap.toFixed(3)}</span>.
        A big gap means overfitting (more data or a simpler model helps). Two low, close curves
        mean underfitting (the model is too simple). Curves that still climb at the right edge
        mean more data would help.
      </Explain>
      {data.note && <Explain>{data.note}</Explain>}
    </div>
  );
}

function RocView({ curves, multiclass }: { curves: RocCurve[]; multiclass: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart
          title="ROC curve"
          xAxis="False positive rate"
          yAxis="True positive rate"
          xDomain={[0, 1]}
          yDomain={[0, 1]}
          diagonal
          series={curves.map((c, i) => ({
            label: `${multiclass ? `Class ${c.label}` : c.label} (AUC ${c.auc})`,
            color: i + 1,
            points: zip(c.fpr, c.tpr),
          }))}
        />
        <LineChart
          title="Precision-recall curve"
          xAxis="Recall"
          yAxis="Precision"
          xDomain={[0, 1]}
          yDomain={[0, 1.02]}
          series={curves.map((c, i) => ({
            label: `${multiclass ? `Class ${c.label}` : c.label} (AP ${c.average_precision})`,
            color: i + 1,
            points: zip(c.recall, c.precision),
          }))}
        />
      </div>
      <Explain>
        ROC shows how well the model separates a class from the rest at every threshold. The
        dashed diagonal is random guessing, and AUC 1.0 is perfect. Precision-recall is more
        honest when classes are imbalanced.
        {multiclass && " Each class is scored one-vs-rest."}
      </Explain>
    </div>
  );
}

function ResidualsView({ data }: { data: Residuals }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <ScatterChart
          title="Residuals vs predicted"
          xAxis="Predicted value"
          yAxis="Residual (actual - predicted)"
          points={zip(data.predicted, data.residuals)}
          referenceLine={{ kind: "horizontal", value: 0 }}
        />
        <ScatterChart
          title="Actual vs predicted"
          xAxis="Predicted value"
          yAxis="Actual value"
          points={zip(data.predicted, data.actual)}
          referenceLine={{ kind: "identity" }}
        />
      </div>
      <Explain>
        Residuals should scatter randomly around zero. A curve or a funnel shape means the model
        is missing structure or the errors grow with the value. Mean residual{" "}
        <span className="font-mono font-semibold text-foreground">{data.mean_residual}</span>,
        standard deviation{" "}
        <span className="font-mono font-semibold text-foreground">{data.std_residual}</span>.
        Points on the dashed line in the right chart are perfect predictions.
        {data.sampled && " Showing a random sample of the test rows."}
      </Explain>
    </div>
  );
}

function ImportanceView({ data }: { data: Importance }) {
  const max = Math.max(...data.features.map((f) => f.importance + f.std), 1e-9);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {data.features.map((f) => (
          <div key={f.feature} className="grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-3 text-xs">
            <span className="truncate font-mono text-foreground" title={f.feature}>
              {f.feature}
            </span>
            <div className="relative h-3 rounded-sm bg-surface-sunken">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-primary"
                style={{ width: `${Math.max(0, (f.importance / max) * 100)}%` }}
              />
              <div
                className="absolute top-1/2 h-px bg-foreground/60"
                style={{
                  left: `${Math.max(0, ((f.importance - f.std) / max) * 100)}%`,
                  width: `${(Math.min(f.std * 2, max) / max) * 100}%`,
                }}
              />
            </div>
            <span className="text-right font-mono text-muted-foreground">{f.importance}</span>
          </div>
        ))}
      </div>
      <Explain>
        Each feature is shuffled in the test set and we measure how much the{" "}
        {data.scoring === "accuracy" ? "accuracy" : "R²"} drops. A bigger drop means the model
        relies on that feature more. The thin line is the spread over repeated shuffles. This
        works for every algorithm, including ones with no built-in importances.
      </Explain>
      {data.note && <Explain>{data.note}</Explain>}
    </div>
  );
}

export default function DiagnosticsPanel({ sessionId, problemType, algorithm }: Props) {
  const [active, setActive] = useState<DiagnosticKey | null>(null);
  const [loading, setLoading] = useState<DiagnosticKey | null>(null);
  const [results, setResults] = useState<Partial<Record<DiagnosticKey, Record<string, unknown>>>>({});
  const [error, setError] = useState<string | null>(null);

  const classification = problemType === "classification";
  const tabs: { key: DiagnosticKey; label: string }[] = [
    { key: "learning-curve", label: "Learning curve" },
    classification
      ? { key: "roc", label: "ROC and precision-recall" }
      : { key: "residuals", label: "Residuals" },
    { key: "importance", label: "Permutation importance" },
  ];

  async function open(key: DiagnosticKey) {
    setActive(key);
    setError(null);
    if (results[key]) return;
    setLoading(key);
    try {
      const response = await fetch(`${API_BASE}/pipeline/${sessionId}/${key}`, { method: "POST" });
      const data = (await response.json()) as StageResponse;
      if (data.status === "done") {
        setResults((prev) => ({ ...prev, [key]: data.summary as Record<string, unknown> }));
      } else {
        setError(String((data.summary as { error?: string }).error ?? "Diagnostic failed"));
      }
    } catch {
      setError("Could not reach the backend. It may be waking up, try again in a few seconds.");
    } finally {
      setLoading(null);
    }
  }

  const current = active ? results[active] : undefined;

  return (
    <section className="rounded-lg border border-border bg-surface-raised p-5 flex flex-col gap-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="w-4 h-4 text-primary" strokeWidth={2} />
          Model diagnostics
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Go beyond a single score for the trained {algorithm.replace(/_/g, " ")} model.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => open(tab.key)}
            disabled={loading !== null}
            aria-pressed={active === tab.key}
            className={active === tab.key ? button.sm : button.subtle}
          >
            {loading === tab.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">Computing, this can take a few seconds on large datasets.</p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {current && active === "learning-curve" && <LearningCurveView data={current as unknown as LearningCurve} />}
      {current && active === "roc" && (
        <RocView
          curves={(current as unknown as { curves: RocCurve[] }).curves}
          multiclass={(current as unknown as { multiclass: boolean }).multiclass}
        />
      )}
      {current && active === "residuals" && <ResidualsView data={current as unknown as Residuals} />}
      {current && active === "importance" && <ImportanceView data={current as unknown as Importance} />}
    </section>
  );
}
