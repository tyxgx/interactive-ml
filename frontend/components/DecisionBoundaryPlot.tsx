"use client";

import { useEffect, useRef, useState } from "react";
import { Scan } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { DecisionBoundaryResult, StageResponse } from "@/lib/pipeline";
import { label as labelClass, input } from "@/lib/ui";

type DecisionBoundaryPlotProps = {
  sessionId: string | null;
  numericFeatures: string[];
  trainSummary: Record<string, unknown> | null;
};

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 420;
const SERIES_VAR_COUNT = 4;

function seriesColor(index: number): string {
  const style = getComputedStyle(document.documentElement);
  const slot = (index % SERIES_VAR_COUNT) + 1;
  return style.getPropertyValue(`--chart-series-${slot}`).trim();
}

function drawPlot(canvas: HTMLCanvasElement, result: DecisionBoundaryResult) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const style = getComputedStyle(document.documentElement);
  const surface = style.getPropertyValue("--color-surface-raised").trim();
  const border = style.getPropertyValue("--color-border").trim();
  const destructive = style.getPropertyValue("--color-destructive").trim();

  const { resolution, grid_predictions, classes, x_range, y_range, points } = result;
  const [xMin, xMax] = x_range;
  const [yMin, yMax] = y_range;

  const cellWidth = CANVAS_WIDTH / resolution;
  const cellHeight = CANVAS_HEIGHT / resolution;

  const dataXToPx = (x: number) => ((x - xMin) / (xMax - xMin)) * CANVAS_WIDTH;
  const dataYToPx = (y: number) =>
    CANVAS_HEIGHT - ((y - yMin) / (yMax - yMin)) * CANVAS_HEIGHT;

  // background regions
  ctx.globalAlpha = 0.32;
  for (let row = 0; row < resolution; row += 1) {
    for (let col = 0; col < resolution; col += 1) {
      const classIndex = classes.indexOf(grid_predictions[row][col]);
      ctx.fillStyle = seriesColor(classIndex);
      // row 0 corresponds to y_min (bottom); flip vertically for canvas space
      const py = CANVAS_HEIGHT - (row + 1) * cellHeight;
      ctx.fillRect(col * cellWidth, py, cellWidth + 1, cellHeight + 1);
    }
  }
  ctx.globalAlpha = 1;

  // border
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);

  // data points
  const radius = 4.5;
  for (let i = 0; i < points.x.length; i += 1) {
    const px = dataXToPx(points.x[i]);
    const py = dataYToPx(points.y[i]);
    const classIndex = classes.indexOf(points.actual[i]);
    const correct = points.actual[i] === points.predicted[i];

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = seriesColor(classIndex);
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = surface;
    ctx.stroke();

    if (!correct) {
      ctx.beginPath();
      ctx.arc(px, py, radius + 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = destructive;
      ctx.stroke();
    }
  }
}

type ResolvedFor = {
  sessionId: string | null;
  featureX: string;
  featureY: string;
  trainSummary: Record<string, unknown> | null;
};

export default function DecisionBoundaryPlot({
  sessionId,
  numericFeatures,
  trainSummary,
}: DecisionBoundaryPlotProps) {
  const [rawFeatureX, setRawFeatureX] = useState("");
  const [rawFeatureY, setRawFeatureY] = useState("");
  const [result, setResult] = useState<DecisionBoundaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedFor, setResolvedFor] = useState<ResolvedFor | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive valid axis selections from the raw user picks + current feature
  // list, instead of an effect that resets state on prop change.
  const featureX = numericFeatures.includes(rawFeatureX)
    ? rawFeatureX
    : numericFeatures[0] ?? "";
  const featureY =
    numericFeatures.includes(rawFeatureY) && rawFeatureY !== featureX
      ? rawFeatureY
      : numericFeatures.find((f) => f !== featureX) ?? "";

  const canFetch = Boolean(sessionId && featureX && featureY && featureX !== featureY);
  const loading =
    canFetch &&
    (!resolvedFor ||
      resolvedFor.sessionId !== sessionId ||
      resolvedFor.featureX !== featureX ||
      resolvedFor.featureY !== featureY ||
      resolvedFor.trainSummary !== trainSummary);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;

    fetch(`${API_BASE}/pipeline/${sessionId}/decision-boundary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature_x: featureX, feature_y: featureY }),
    })
      .then((res) => res.json())
      .then((data: StageResponse) => {
        if (cancelled) return;
        setResolvedFor({ sessionId, featureX, featureY, trainSummary });
        if (data.status === "done") {
          setResult(data.summary as unknown as DecisionBoundaryResult);
          setError(null);
        } else {
          setError((data.summary?.error as string) ?? "Could not compute decision boundary.");
          setResult(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedFor({ sessionId, featureX, featureY, trainSummary });
        setError("Something went wrong computing the decision boundary.");
        setResult(null);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, featureX, featureY, trainSummary, canFetch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    drawPlot(canvas, result);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const redraw = () => drawPlot(canvas, result);
    mediaQuery.addEventListener("change", redraw);
    return () => mediaQuery.removeEventListener("change", redraw);
  }, [result]);

  if (numericFeatures.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Scan className="w-4 h-4 text-primary" strokeWidth={2} />
        Decision Boundary
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="boundary-feature-x" className={labelClass}>
            X axis
          </label>
          <select
            id="boundary-feature-x"
            value={featureX}
            onChange={(e) => setRawFeatureX(e.target.value)}
            className={`w-48 cursor-pointer ${input}`}
          >
            {numericFeatures.map((feature) => (
              <option key={feature} value={feature}>
                {feature}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="boundary-feature-y" className={labelClass}>
            Y axis
          </label>
          <select
            id="boundary-feature-y"
            value={featureY}
            onChange={(e) => setRawFeatureY(e.target.value)}
            className={`w-48 cursor-pointer ${input}`}
          >
            {numericFeatures.map((feature) => (
              <option key={feature} value={feature}>
                {feature}
              </option>
            ))}
          </select>
        </div>
      </div>

      {featureX === featureY && (
        <p className="text-sm text-muted-foreground">
          Choose two different features to plot.
        </p>
      )}

      {error && !loading && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <p className="text-sm text-muted-foreground">Computing decision boundary&hellip;</p>
      )}

      {result && !loading && !error && (
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-border bg-surface-sunken p-2 overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-sm"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {result.classes.map((cls, index) => (
              <span key={String(cls)} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `var(--chart-series-${(index % SERIES_VAR_COUNT) + 1})` }}
                />
                class {String(cls)}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-destructive shrink-0" />
              misclassified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
