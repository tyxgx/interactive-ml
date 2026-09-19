"use client";

import { useEffect } from "react";
import { remoteFetch, startEngine } from "@/lib/api";

// Everything the app needs is started while the visitor reads the landing page:
// the in-browser Python engine (persists when they open the app) and the small
// server that powers the AI assistant, which sleeps when idle.
export default function WarmUp() {
  useEffect(() => {
    startEngine();
    remoteFetch("/health", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
