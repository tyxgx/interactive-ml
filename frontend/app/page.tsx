"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DatasetSelector from "@/components/DatasetSelector";
import TargetColumnSelector from "@/components/TargetColumnSelector";
import UploadCsvInput from "@/components/UploadCsvInput";
import LoadDatasetButton from "@/components/LoadDatasetButton";
import RunButton from "@/components/RunButton";
import Pipeline from "@/components/Pipeline";
import DatasetPreview from "@/components/DatasetPreview";
import OutputPanel from "@/components/OutputPanel";
import { algorithms } from "@/lib/algorithms";
import { API_BASE } from "@/lib/api";
import { DatasetResult, DatasetListItem, UploadResult } from "@/lib/dataset";
import {
  StageName,
  StageState,
  StageResponse,
  STAGE_ORDER,
  createInitialStages,
  CompareResult,
} from "@/lib/pipeline";

export default function Home() {
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

  useEffect(() => {
    const loadDatasets = async () => {
      const response = await fetch(`${API_BASE}/datasets`);
      const data: DatasetListItem[] = await response.json();
      setDatasets(data);
      if (data.length > 0) {
        setSelectedDataset(data[0].name);
        setSelectedTargetColumn(data[0].default_target);
      }
    };
    loadDatasets();
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

  const resetPipeline = () => {
    setPipelineState({ sessionId: null, stages: createInitialStages() });
    setEvaluationResult(null);
    setCompareResult(null);
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
    const response = await fetch(
      `${API_BASE}/dataset/${encodeURIComponent(
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

    const response = await fetch(`${API_BASE}/upload`, {
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
        ? `${API_BASE}/pipeline/start`
        : `${API_BASE}/pipeline/${activeSessionId}/${stageName}`;

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

    const response = await fetch(url, options);
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
        const algoResponse = await fetch(
          `${API_BASE}/algorithms/${problemType}`
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
          const algoResponse = await fetch(
            `${API_BASE}/algorithms/${schema.problem_type}`
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

    const response = await fetch(
      `${API_BASE}/pipeline/${pipelineState.sessionId}/compare`,
      { method: "POST" }
    );
    const data: StageResponse = await response.json();
    if (data.status === "done") {
      setCompareResult(data.summary as unknown as CompareResult);
    }
  };

  const handleTune = async () => {
    if (!pipelineState.sessionId) return;

    const response = await fetch(
      `${API_BASE}/pipeline/${pipelineState.sessionId}/tune`,
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
      <main className="w-4/5 p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {selectedAlgorithm.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedAlgorithm.description}
          </p>
        </div>

        <div className="flex items-end gap-4">
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
          trainSummary={pipelineState.stages.train.summary}
        />
      </main>
    </div>
  );
}
