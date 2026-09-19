"use client";

import { useSyncExternalStore } from "react";
import { engineStore, EngineStage } from "@/lib/api";

export function useEngineStage(): EngineStage {
  return useSyncExternalStore(
    engineStore.subscribe,
    engineStore.getStage,
    engineStore.getServerStage
  );
}

export const ENGINE_STAGE_LABEL: Record<EngineStage, string> = {
  idle: "Starting the in-browser engine in the background",
  runtime: "Starting Python in your browser",
  libraries: "Loading scientific libraries in the background (first visit downloads about 30 MB, cached after that)",
  backend: "Almost ready, loading the ML backend",
  ready: "Ready",
  error: "The in-browser engine could not start, so the hosted server is used instead (it can take a few seconds to wake up)",
};

export function useEngineError(): string | null {
  return useSyncExternalStore(
    engineStore.subscribe,
    engineStore.getError,
    () => null
  );
}
