import { Check, Loader2, X, Play, SlidersHorizontal, RotateCcw, GitCompare } from "lucide-react";
import { STAGE_ORDER, STAGE_LABELS, StageName, StageState } from "@/lib/pipeline";
import { button } from "@/lib/ui";

type PipelineProps = {
  stages: Record<StageName, StageState>;
  onRunStage: (stageName: StageName) => void;
  onRunAll: () => void;
  onReset: () => void;
  onCompareAll: () => void;
  compareEnabled: boolean;
  onTune: () => void;
  tuneEnabled: boolean;
};

function SummaryEntries({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          return (
            <div key={key}>
              <p>{key}:</p>
              <div className="pl-3">
                <SummaryEntries data={value as Record<string, unknown>} />
              </div>
            </div>
          );
        }

        const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
        return (
          <p key={key}>
            {key}: {displayValue}
          </p>
        );
      })}
    </>
  );
}

function StageIcon({ status }: { status: StageState["status"] }) {
  if (status === "done") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-success-foreground shrink-0">
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-soft text-primary shrink-0">
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground shrink-0">
        <X className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-border-strong text-muted-foreground shrink-0" />
  );
}

export default function Pipeline({
  stages,
  onRunStage,
  onRunAll,
  onReset,
  onCompareAll,
  compareEnabled,
  onTune,
  tuneEnabled,
}: PipelineProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onRunAll} className={button.primary}>
            <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
            Run Entire Pipeline
          </button>
          <button
            type="button"
            disabled={!compareEnabled}
            onClick={onCompareAll}
            className={button.secondary}
          >
            <GitCompare className="w-3.5 h-3.5" strokeWidth={2.5} />
            Compare All Algorithms
          </button>
          <button type="button" onClick={onReset} className={button.subtle}>
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
            Reset Pipeline
          </button>
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {STAGE_ORDER.map((stageName, index) => {
          const previousStageName = STAGE_ORDER[index - 1];
          const isDisabled =
            index > 0 && stages[previousStageName].status !== "done";
          const state = stages[stageName];
          const isActive = state.status === "running";
          const isDone = state.status === "done";
          const isFailed = state.status === "failed";

          return (
            <li
              key={stageName}
              className={`relative rounded-lg px-4 py-3 flex flex-col gap-2 border transition-colors duration-200 ${
                isActive
                  ? "border-primary bg-primary-soft/40 shadow-sm"
                  : isFailed
                  ? "border-destructive/60 bg-destructive-soft"
                  : isDone
                  ? "border-border bg-surface-raised"
                  : "border-border bg-surface-raised"
              } ${isDisabled ? "opacity-60" : ""}`}
            >
              {/* connector line to next stage */}
              {index < STAGE_ORDER.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[26px] top-full h-2 w-px ${
                    isDone ? "bg-success" : "bg-border-strong"
                  }`}
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StageIcon status={state.status} />
                  <span
                    className={`text-sm ${
                      isActive || isDone ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {index + 1}. {STAGE_LABELS[stageName]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onRunStage(stageName)}
                    className={button.sm}
                  >
                    Run
                  </button>
                  {stageName === "train" && (
                    <button
                      type="button"
                      disabled={!tuneEnabled}
                      onClick={onTune}
                      className={button.accent}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Tune Hyperparameters
                    </button>
                  )}
                </div>
              </div>

              {state.status !== "idle" && (
                <div className="pl-9 text-xs text-muted-foreground flex flex-col gap-0.5 font-mono">
                  <p>status: {state.status}</p>
                  {state.summary && <SummaryEntries data={state.summary} />}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
