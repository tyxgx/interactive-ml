"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DatasetSelector from "@/components/DatasetSelector";
import TargetColumnSelector from "@/components/TargetColumnSelector";
import LoadDatasetButton from "@/components/LoadDatasetButton";
import RunButton from "@/components/RunButton";
import Pipeline from "@/components/Pipeline";
import DatasetPreview from "@/components/DatasetPreview";
import OutputPanel from "@/components/OutputPanel";
import { algorithms } from "@/lib/algorithms";
import { DatasetResult, DatasetListItem } from "@/lib/dataset";
import {
  StageName,
  StageState,
  StageResponse,
  STAGE_ORDER,
  createInitialStages,
} from "@/lib/pipeline";

export default function Home() {
  const [selectedId, setSelectedId] = useState(algorithms[0].id);
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [selectedTargetColumn, setSelectedTargetColumn] = useState("");
  const [datasetResult, setDatasetResult] = useState<DatasetResult | null>(
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
      const response = await fetch("http://localhost:8000/datasets");
      const data: DatasetListItem[] = await response.json();
      setDatasets(data);
      if (data.length > 0) {
        setSelectedDataset(data[0].name);
        setSelectedTargetColumn(data[0].default_target);
      }
    };
    loadDatasets();
  }, []);

  const selectedAlgorithm =
    algorithms.find((algorithm) => algorithm.id === selectedId) ??
    algorithms[0];

  const selectedDatasetColumns =
    datasets.find((dataset) => dataset.name === selectedDataset)?.columns ??
    [];

  const handleDatasetChange = (name: string) => {
    setSelectedDataset(name);
    const dataset = datasets.find((d) => d.name === name);
    setSelectedTargetColumn(dataset?.default_target ?? "");
  };

  const handleLoadDataset = async () => {
    const response = await fetch(
      `http://localhost:8000/dataset/${selectedDataset}?target_column=${selectedTargetColumn}`
    );
    const data = await response.json();
    setDatasetResult(data);
  };

  const handleRun = () => {};

  const runStage = async (
    stageName: StageName,
    sessionIdOverride?: string | null
  ): Promise<StageResponse> => {
    setPipelineState((prev) => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stageName]: { ...prev.stages[stageName], status: "running" },
      },
    }));

    const activeSessionId = sessionIdOverride ?? pipelineState.sessionId;

    const url =
      stageName === "start"
        ? "http://localhost:8000/pipeline/start"
        : `http://localhost:8000/pipeline/${activeSessionId}/${stageName}`;

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

    return data;
  };

  const handleRunStage = (stageName: StageName) => {
    runStage(stageName);
  };

  const handleRunAll = async () => {
    let currentSessionId: string | null = pipelineState.sessionId;

    for (const stageName of STAGE_ORDER) {
      const data = await runStage(stageName, currentSessionId);
      if (stageName === "start") {
        currentSessionId = data.session_id;
      }
      if (data.status === "failed") {
        break;
      }
    }
  };

  return (
    <div className="flex flex-1 h-full">
      <Sidebar
        algorithms={algorithms}
        selectedId={selectedId}
        onSelect={setSelectedId}
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
            onChange={setSelectedTargetColumn}
          />
          <LoadDatasetButton onClick={handleLoadDataset} />
          <RunButton onClick={handleRun} />
        </div>

        <DatasetPreview result={datasetResult} />

        <Pipeline
          stages={pipelineState.stages}
          onRunStage={handleRunStage}
          onRunAll={handleRunAll}
        />

        <OutputPanel />
      </main>
    </div>
  );
}
