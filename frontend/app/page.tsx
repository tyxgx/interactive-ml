"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DatasetSelector from "@/components/DatasetSelector";
import LoadDatasetButton from "@/components/LoadDatasetButton";
import RunButton from "@/components/RunButton";
import Pipeline from "@/components/Pipeline";
import DatasetPreview from "@/components/DatasetPreview";
import OutputPanel from "@/components/OutputPanel";
import { algorithms } from "@/lib/algorithms";
import { DatasetResult } from "@/lib/dataset";
import {
  StageName,
  StageState,
  StageResponse,
  STAGE_ORDER,
  createInitialStages,
} from "@/lib/pipeline";

export default function Home() {
  const [selectedId, setSelectedId] = useState(algorithms[0].id);
  const [selectedDataset, setSelectedDataset] = useState("Iris");
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

  const selectedAlgorithm =
    algorithms.find((algorithm) => algorithm.id === selectedId) ??
    algorithms[0];

  const handleLoadDataset = async () => {
    const response = await fetch("http://localhost:8000/dataset/iris");
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
            body: JSON.stringify({ dataset: selectedDataset.toLowerCase() }),
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
            value={selectedDataset}
            onChange={setSelectedDataset}
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
