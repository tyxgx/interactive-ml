"use client";

import { useEffect } from "react";
import { API_BASE } from "@/lib/api";

// The free-tier backend sleeps when idle. Pinging it as soon as the landing page loads
// means it is usually awake by the time someone clicks "Open the app".
export default function WarmUp() {
  useEffect(() => {
    fetch(`${API_BASE}/health`, { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
