"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Point = { x: number; y: number; c: number };

const W = 480;
const H = 350;
const COLS = 60;
const ROWS = 44;
const CLASS_VARS = ["--chart-series-1", "--chart-series-2", "--chart-series-3"];
const CLASS_NAMES = ["Class A", "Class B", "Class C"];

// Deterministic PRNG so the starting data is identical on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initialPoints(): Point[] {
  const rand = mulberry32(7);
  const centers = [
    [130, 115],
    [350, 105],
    [240, 265],
  ];
  const pts: Point[] = [];
  centers.forEach(([cx, cy], c) => {
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 70;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, c });
    }
  });
  return pts;
}

// Plain k-nearest-neighbours vote. `skip` excludes a point (leave-one-out).
function classify(points: Point[], x: number, y: number, k: number, skip = -1) {
  const nearest: { d: number; c: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === skip) continue;
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    nearest.push({ d: dx * dx + dy * dy, c: points[i].c });
  }
  nearest.sort((a, b) => a.d - b.d);
  const votes = [0, 0, 0];
  const take = Math.min(k, nearest.length);
  for (let i = 0; i < take; i++) votes[nearest[i].c] += 1 / (1 + nearest[i].d * 0.0001);
  return votes.indexOf(Math.max(...votes));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function BoundaryPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [k, setK] = useState(5);
  const [activeClass, setActiveClass] = useState(0);
  const [themeTick, setThemeTick] = useState(0);

  // Redraw when the OS colour scheme flips so the canvas follows the tokens.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemeTick((t) => t + 1);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const looAccuracy = useMemo(() => {
    let wrong = 0;
    const misses = new Set<number>();
    points.forEach((p, i) => {
      if (classify(points, p.x, p.y, k, i) !== p.c) {
        wrong++;
        misses.add(i);
      }
    });
    return { accuracy: 1 - wrong / points.length, misses };
  }, [points, k]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const styles = getComputedStyle(document.documentElement);
    const read = (name: string) => styles.getPropertyValue(name).trim();
    const colors = CLASS_VARS.map(read);
    const ring = read("--color-surface-raised");
    const danger = read("--color-destructive");

    ctx.fillStyle = read("--color-surface-sunken");
    ctx.fillRect(0, 0, W, H);

    // Paint class regions into a tiny offscreen bitmap, then scale it up.
    // This avoids the hairline seams that per-cell fillRect produces.
    const off = document.createElement("canvas");
    off.width = COLS;
    off.height = ROWS;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    const img = offCtx.createImageData(COLS, ROWS);
    const rgb = colors.map(hexToRgb);
    const cw = W / COLS;
    const ch = H / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cls = classify(points, (c + 0.5) * cw, (r + 0.5) * ch, k);
        const o = (r * COLS + c) * 4;
        img.data[o] = rgb[cls][0];
        img.data[o + 1] = rgb[cls][1];
        img.data[o + 2] = rgb[cls][2];
        img.data[o + 3] = 56;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, W, H);

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = colors[p.c];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = ring;
      ctx.stroke();
      if (looAccuracy.misses.has(i)) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = danger;
        ctx.stroke();
      }
    });
  }, [points, k, looAccuracy, themeTick]);

  const addPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      setPoints((prev) => [...prev, { x, y, c: activeClass }]);
    },
    [activeClass]
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-[0_24px_60px_-20px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="font-mono text-xs text-muted-foreground">
          k-nearest neighbours, running in your browser
        </p>
        <p className="font-mono text-xs font-semibold text-foreground" aria-live="polite">
          accuracy {(looAccuracy.accuracy * 100).toFixed(1)}%
        </p>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={addPoint}
        aria-label="Interactive decision boundary. Click to add a point of the selected class."
        className="block aspect-[48/35] w-full cursor-crosshair touch-none"
        style={{ width: "100%", height: "auto" }}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border px-4 py-3">
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Class to add">
          {CLASS_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={activeClass === i}
              onClick={() => setActiveClass(i)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-[transform,background-color] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeClass === i
                  ? "border-foreground/40 bg-surface-sunken text-foreground"
                  : "border-border text-muted-foreground hover:bg-surface-sunken"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: `var(${CLASS_VARS[i]})` }}
              />
              {name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          k = <span className="w-4 font-mono font-semibold text-foreground">{k}</span>
          <input
            type="range"
            min={1}
            max={15}
            step={2}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-24 accent-[var(--color-primary)]"
            aria-label="Number of neighbours k"
          />
        </label>

        <button
          type="button"
          onClick={() => setPoints(initialPoints())}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-[transform,background-color] duration-150 hover:bg-surface-sunken hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Reset
        </button>
      </div>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Click the plot to add points. Red rings mark points the model would get wrong.
      </p>
    </div>
  );
}
