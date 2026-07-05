import { STAGE_ORDER, STAGE_LABELS, StageName, StageState } from "@/lib/pipeline";

type PipelineProps = {
  stages: Record<StageName, StageState>;
  onRunStage: (stageName: StageName) => void;
  onRunAll: () => void;
};

export default function Pipeline({ stages, onRunStage, onRunAll }: PipelineProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Pipeline</h3>
        <button
          type="button"
          onClick={onRunAll}
          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded"
        >
          Run Entire Pipeline
        </button>
      </div>

      <ol className="flex flex-col gap-2">
        {STAGE_ORDER.map((stageName, index) => {
          const previousStageName = STAGE_ORDER[index - 1];
          const isDisabled =
            index > 0 && stages[previousStageName].status !== "done";
          const state = stages[stageName];

          return (
            <li
              key={stageName}
              className="border border-gray-200 rounded px-3 py-2 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {index + 1}. {STAGE_LABELS[stageName]}
                </span>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onRunStage(stageName)}
                  className="px-3 py-1 text-sm font-medium text-white bg-gray-700 rounded disabled:bg-gray-300"
                >
                  Run
                </button>
              </div>

              {state.status !== "idle" && (
                <div className="text-xs text-gray-600 flex flex-col gap-0.5">
                  <p>status: {state.status}</p>
                  {state.summary &&
                    Object.entries(state.summary).map(([key, value]) => (
                      <p key={key}>
                        {key}: {String(value)}
                      </p>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
