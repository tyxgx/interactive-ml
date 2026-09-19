"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DatasetSelector from "@/components/DatasetSelector";
import TargetColumnSelector from "@/components/TargetColumnSelector";
import UploadCsvInput from "@/components/UploadCsvInput";
import LoadDatasetButton from "@/components/LoadDatasetButton";
import RunButton from "@/components/RunButton";
import Pipeline from "@/components/Pipeline";
import DatasetPreview from "@/components/DatasetPreview";
import OutputPanel from "@/components/OutputPanel";
import AskAssistant from "@/components/AskAssistant";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import { algorithms } from "@/lib/algorithms";
import { apiFetch, startEngine } from "@/lib/api";
import { ENGINE_STAGE_LABEL, useEngineError, useEngineStage } from "@/lib/useEngine";
import { DatasetResult, DatasetListItem, UploadResult } from "@/lib/dataset";
import {
  StageName,
  StageState,
  StageResponse,
  STAGE_ORDER,
  createInitialStages,
  CompareResult,
  CompareProgress,
  CompareStreamEvent,
} from "@/lib/pipeline";

export default function ExplorePage() {
  const [selectedId, setSelectedId] = useState(algorithms[0].id);
  const [validAlgorithmIds, setValidAlgorithmIds] = useState<string[] | null>(
    null
  );
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [selectedTargetColumn, setSelectedTargetColumn] = useState("");
  const [datasetResult, setDatasetResult] = useState<DatasetResult | null>(
    null
  );
  const [evaluationResult, setEvaluationResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(
    null
  );
  const [pipelineState, setPipelineState] = useState<{
    sessionId: string | null;
    stages: Record<StageName, StageState>;
  }>({
    sessionId: null,
    stages: createInitialStages(),
  });

  const engineStage = useEngineStage();
  const engineError = useEngineError();
  const [compareProgress, setCompareProgress] = useState<CompareProgress | null>(
    null
  );

  useEffect(() => {
    startEngine();
    let cancelled = false;

    // Requests queue inside the engine until it has booted, so this simply waits.
    const loadDatasets = async () => {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const response = await apiFetch(`/datasets`);
          if (!response.ok) throw new Error(String(response.status));
          const data: DatasetListItem[] = await response.json();
          if (cancelled) return;
          setDatasets(data);
          if (data.length > 0) {
            setSelectedDataset(data[0].name);
            setSelectedTargetColumn(data[0].default_target);
          }
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };
    loadDatasets();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAlgorithms =
    validAlgorithmIds === null
      ? algorithms
      : algorithms.filter((algorithm) => validAlgorithmIds.includes(algorithm.id));

  const selectedAlgorithm =
    algorithms.find((algorithm) => algorithm.id === selectedId) ??
    algorithms[0];

  const selectedDatasetColumns =
    datasets.find((dataset) => dataset.name === selectedDataset)?.columns ??
    [];

  const trainSummary = pipelineState.stages.train.summary as
    | { algorithm?: string; problem_type?: string }
    | null;
  const trainedAlgorithmName = trainSummary?.algorithm
    ? algorithms.find((a) => a.id === trainSummary.algorithm)?.name ??
      trainSummary.algorithm
    : null;
  const trainedProblemType = trainSummary?.problem_type ?? null;
  const isAlgorithmLocked = pipelineState.stages.train.status === "done";

  const startSummary = pipelineState.stages.start.summary as
    | { numeric_columns?: string[] }
    | null;
  const numericFeatures = (startSummary?.numeric_columns ?? []).filter(
    (column) => column !== selectedTargetColumn
  );

  const resetPipeline = () => {
    setPipelineState({ sessionId: null, stages: createInitialStages() });
    setEvaluationResult(null);
    setCompareResult(null);
    setCompareProgress(null);
    setValidAlgorithmIds(null);
  };

  const handleDatasetChange = (name: string) => {
    if (pipelineState.sessionId) resetPipeline();
    setSelectedDataset(name);
    const dataset = datasets.find((d) => d.name === name);
    setSelectedTargetColumn(dataset?.default_target ?? "");
  };

  const handleTargetColumnChange = (column: string) => {
    if (pipelineState.sessionId) resetPipeline();
    setSelectedTargetColumn(column);
  };

  const handleAlgorithmSelect = (id: string) => {
    if (pipelineState.sessionId) resetPipeline();
    setSelectedId(id);
  };

  const handleLoadDataset = async () => {
    const response = await apiFetch(
      `/dataset/${encodeURIComponent(
        selectedDataset
      )}?target_column=${encodeURIComponent(selectedTargetColumn)}`
    );
    const data = await response.json();
    setDatasetResult(data);
  };

  const handleUpload = async (file: File) => {
    if (pipelineState.sessionId) resetPipeline();

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(`/upload`, {
      method: "POST",
      body: formData,
    });
    const data: UploadResult = await response.json();

    const datasetName = `upload:${data.upload_id}`;
    setDatasets((prev) => [
      ...prev.filter((d) => !d.name.startsWith("upload:")),
      { name: datasetName, default_target: "", columns: data.columns },
    ]);
    setSelectedDataset(datasetName);
    setSelectedTargetColumn("");
  };

  const handleRun = () => {};

  const runStage = async (
    stageName: StageName,
    sessionIdOverride?: string | null,
    algorithmOverride?: string
  ): Promise<StageResponse> => {
    setPipelineState((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stageName]: { ...prev.stages[stageName], status: "running" },
      },
    }));

    const activeSessionId = sessionIdOverride ?? pipelineState.sessionId;
    const activeAlgorithm = algorithmOverride ?? selectedId;

    const url =
      stageName === "start"
        ? `/pipeline/start`
        : `/pipeline/${activeSessionId}/${stageName}`;

    const options: RequestInit =
      stageName === "start"
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataset: selectedDataset,
              target_column: selectedTargetColumn,
            }),
          }
        : stageName === "train"
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ algorithm: activeAlgorithm }),
          }
        : { method: "POST" };

    const response = await apiFetch(url, options);
    const data: StageResponse = await response.json();

    setPipelineState((prev) => ({
      sessionId: stageName === "start" ? data.session_id : prev.sessionId,
      stages: {
        ...prev.stages,
        [stageName]: { status: data.status, summary: data.summary },
      },
    }));

    if (stageName === "start" && data.status === "done") {
      const schema = data.summary.schema as
        | { problem_type?: string }
        | undefined;
      const problemType = schema?.problem_type;
      if (problemType) {
        const algoResponse = await apiFetch(
          `/algorithms/${problemType}`
        );
        const algoIds: string[] = await algoResponse.json();
        setValidAlgorithmIds(algoIds);
        setSelectedId((prev) => (algoIds.includes(prev) ? prev : algoIds[0]));
      }
    }

    if (stageName === "evaluate" && data.status === "done") {
      setEvaluationResult(data.summary);
    }

    return data;
  };

  const handleRunStage = (stageName: StageName) => {
    runStage(stageName);
  };

  const handleRunAll = async () => {
    let currentSessionId: string | null = pipelineState.sessionId;
    let currentAlgorithm = selectedId;

    for (const stageName of STAGE_ORDER) {
      const data = await runStage(stageName, currentSessionId, currentAlgorithm);

      if (stageName === "start") {
        if (data.status !== "done") break;
        currentSessionId = data.session_id;

        const schema = data.summary.schema as
          | { problem_type?: string }
          | undefined;
        if (schema?.problem_type) {
          const algoResponse = await apiFetch(
            `/algorithms/${schema.problem_type}`
          );
          const algoIds: string[] = await algoResponse.json();
          if (!algoIds.includes(currentAlgorithm)) {
            currentAlgorithm = algoIds[0];
          }
        }
      }

      if (data.status === "failed") {
        break;
      }
    }
  };

  const handleCompareAll = async () => {
    if (!pipelineState.sessionId) return;

    setCompareResult(null);
    setCompareProgress({ done: 0, total: 0, queue: [] });
    let rankKey = "accuracy";

    try {
      const response = await apiFetch(
        `/pipeline/${pipelineState.sessionId}/compare/stream`,
        { method: "POST" }
      );
      if (!response.ok || !response.body) throw new Error("stream unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handle = (event: CompareStreamEvent) => {
        if (event.type === "start") {
          rankKey = event.problem_type === "classification" ? "accuracy" : "r2";
          setCompareProgress({ done: 0, total: event.total, queue: event.algorithms });
          setCompareResult({
            problem_type: event.problem_type,
            results: [],
            note: event.note,
          });
        } else if (event.type === "result") {
          // Rows arrive cheapest-first; keep the table ranked best-first as it fills.
          setCompareResult((prev) =>
            prev
              ? {
                  ...prev,
                  results: [...prev.results, event.row].sort(
                    (a, b) => b.metrics[rankKey] - a.metrics[rankKey]
                  ),
                }
              : prev
          );
          setCompareProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
        } else if (event.type === "done") {
          setCompareProgress(null);
        } else if (event.type === "error") {
          setCompareProgress((prev) => ({
            done: prev?.done ?? 0,
            total: prev?.total ?? 0,
            queue: prev?.queue ?? [],
            error: event.error,
          }));
        }
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handle(JSON.parse(line) as CompareStreamEvent);
        }
      }
      setCompareProgress((prev) => (prev && !prev.error ? null : prev));
    } catch {
      setCompareProgress((prev) => ({
        done: prev?.done ?? 0,
        total: prev?.total ?? 0,
        queue: prev?.queue ?? [],
        error: "Could not reach the backend. Try again in a few seconds.",
      }));
    }
  };

  const handleTune = async () => {
    if (!pipelineState.sessionId) return;

    const response = await apiFetch(
      `/pipeline/${pipelineState.sessionId}/tune`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm: selectedId }),
      }
    );
    const data: StageResponse = await response.json();
    if (data.status === "done") {
      setPipelineState((prev) => ({
        ...prev,
        stages: {
          ...prev.stages,
          train: { status: "done", summary: data.summary },
        },
      }));
    }
  };

  return (
    <div className="flex flex-1 h-full">
      <Sidebar
        algorithms={visibleAlgorithms}
        selectedId={selectedId}
        onSelect={handleAlgorithmSelect}
        disabled={isAlgorithmLocked}
      />
      <main className="w-4/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {selectedAlgorithm.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            {selectedAlgorithm.description}
          </p>
        </div>

        {engineStage !== "ready" && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-foreground ${
              engineStage === "error"
                ? "border-destructive/40 bg-destructive-soft"
                : "border-border bg-primary-soft"
            }`}
          >
            {engineStage !== "error" && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
            {ENGINE_STAGE_LABEL[engineStage]}
            {engineStage === "error" && engineError ? ` (${engineError.slice(0, 120)})` : ""}
          </p>
        )}

        <div className="flex items-end gap-4 flex-wrap">
          <DatasetSelector
            datasets={datasets}
            value={selectedDataset}
            onChange={handleDatasetChange}
          />
          <TargetColumnSelector
            columns={selectedDatasetColumns}
            value={selectedTargetColumn}
            onChange={handleTargetColumnChange}
          />
          <UploadCsvInput onUpload={handleUpload} />
          <LoadDatasetButton onClick={handleLoadDataset} />
          <RunButton onClick={handleRun} />
        </div>

        <DatasetPreview result={datasetResult} />

        <Pipeline
          stages={pipelineState.stages}
          onRunStage={handleRunStage}
          onRunAll={handleRunAll}
          onReset={resetPipeline}
          onCompareAll={handleCompareAll}
          compareEnabled={pipelineState.stages.preprocess.status === "done"}
          onTune={handleTune}
          tuneEnabled={pipelineState.stages.preprocess.status === "done"}
        />

        <OutputPanel
          algorithmName={trainedAlgorithmName}
          problemType={trainedProblemType}
          metrics={evaluationResult}
          compareResult={compareResult}
          compareProgress={compareProgress}
          trainSummary={pipelineState.stages.train.summary}
          sessionId={pipelineState.sessionId}
          numericFeatures={numericFeatures}
        />

        {pipelineState.sessionId &&
          pipelineState.stages.train.status === "done" &&
          trainSummary?.algorithm && (
            <DiagnosticsPanel
              key={`${pipelineState.sessionId}-${trainSummary.algorithm}-${String(
                (pipelineState.stages.train.summary as Record<string, unknown> | null)
                  ?.training_time_seconds
              )}`}
              sessionId={pipelineState.sessionId}
              problemType={trainedProblemType}
              algorithm={trainSummary.algorithm}
            />
          )}

        <AskAssistant sessionId={pipelineState.sessionId} />
      </main>
    </div>
  );
}
