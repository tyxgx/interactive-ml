"use client";

// Small dependency-free SVG charts. Colours come from the --chart-series-* tokens
// so they follow light/dark mode.

export type Series = {
  label: string;
  points: [number, number][];
  band?: [number, number][]; // per-point [lo, hi] shaded band (e.g. +/- std)
  color?: number; // 1-4, index into --chart-series-*
  dashed?: boolean;
};

const W = 520;
const H = 300;
const PAD = { top: 12, right: 16, bottom: 42, left: 52 };

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
    ticks.push(Number(v.toPrecision(10)));
  }
  return ticks;
}

function fmt(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  if (abs > 0 && abs < 0.01) return v.toExponential(0);
  return Number(v.toFixed(2)).toString();
}

const colorVar = (slot: number) => `var(--chart-series-${((slot - 1) % 4) + 1})`;

type Axis = { label: string; domain?: [number, number] };

function extent(values: number[]): [number, number] {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
}

function Frame({
  title,
  xAxis,
  yAxis,
  xDomain,
  yDomain,
  children,
  legend,
}: {
  title: string;
  xAxis: string;
  yAxis: string;
  xDomain: [number, number];
  yDomain: [number, number];
  children: (sx: (v: number) => number, sy: (v: number) => number) => React.ReactNode;
  legend?: { label: string; color: number; dashed?: boolean }[];
}) {
  const sx = (v: number) =>
    PAD.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - PAD.left - PAD.right);
  const sy = (v: number) =>
    H - PAD.bottom - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (H - PAD.top - PAD.bottom);
  const xTicks = niceTicks(xDomain[0], xDomain[1]);
  const yTicks = niceTicks(yDomain[0], yDomain[1]);

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-semibold text-foreground">{title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}. ${xAxis} on the x axis, ${yAxis} on the y axis.`}
        className="w-full h-auto rounded-md border border-border bg-surface-raised"
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted-foreground)">
              {fmt(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={H - PAD.bottom} y2={H - PAD.bottom + 4} stroke="var(--color-border-strong)" />
            <text x={sx(t)} y={H - PAD.bottom + 17} textAnchor="middle" fontSize={11} fill="var(--color-muted-foreground)">
              {fmt(t)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--color-border-strong)" />
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--color-muted-foreground)">
          {xAxis}
        </text>
        <text
          transform={`translate(13 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-muted-foreground)"
        >
          {yAxis}
        </text>
        {children(sx, sy)}
      </svg>
      {legend && legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <svg width="18" height="8" aria-hidden>
                <line
                  x1="0"
                  x2="18"
                  y1="4"
                  y2="4"
                  stroke={colorVar(item.color)}
                  strokeWidth={2.5}
                  strokeDasharray={item.dashed ? "4 3" : undefined}
                />
              </svg>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export function LineChart({
  title,
  xAxis,
  yAxis,
  series,
  xDomain,
  yDomain,
  diagonal = false,
}: {
  title: string;
  xAxis: string;
  yAxis: string;
  series: Series[];
  xDomain?: [number, number];
  yDomain?: [number, number];
  diagonal?: boolean;
}) {
  const xs = series.flatMap((s) => s.points.map((p) => p[0]));
  const ys = series.flatMap((s) => [
    ...s.points.map((p) => p[1]),
    ...(s.band ? s.band.flat() : []),
  ]);
  const xd = xDomain ?? extent(xs);
  const yd = yDomain ?? extent(ys);

  return (
    <Frame
      title={title}
      xAxis={xAxis}
      yAxis={yAxis}
      xDomain={xd}
      yDomain={yd}
      legend={series.map((s, i) => ({ label: s.label, color: s.color ?? i + 1, dashed: s.dashed }))}
    >
      {(sx, sy) => (
        <>
          {diagonal && (
            <line
              x1={sx(0)}
              y1={sy(0)}
              x2={sx(1)}
              y2={sy(1)}
              stroke="var(--color-border-strong)"
              strokeDasharray="4 4"
            />
          )}
          {series.map((s, i) => {
            const color = colorVar(s.color ?? i + 1);
            const path = s.points.map(([x, y], j) => `${j === 0 ? "M" : "L"}${sx(x)},${sy(y)}`).join(" ");
            const band =
              s.band &&
              `${s.points.map(([x], j) => `${j === 0 ? "M" : "L"}${sx(x)},${sy(s.band![j][1])}`).join(" ")} ${[...s.points]
                .reverse()
                .map(([x], j) => `L${sx(x)},${sy(s.band![s.points.length - 1 - j][0])}`)
                .join(" ")} Z`;
            return (
              <g key={s.label}>
                {band && <path d={band} fill={color} opacity={0.15} />}
                <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray={s.dashed ? "6 4" : undefined} />
                {s.points.length <= 8 &&
                  s.points.map(([x, y]) => <circle key={`${x}-${y}`} cx={sx(x)} cy={sy(y)} r={3.5} fill={color} />)}
              </g>
            );
          })}
        </>
      )}
    </Frame>
  );
}

export function ScatterChart({
  title,
  xAxis,
  yAxis,
  points,
  referenceLine,
}: {
  title: string;
  xAxis: string;
  yAxis: string;
  points: [number, number][];
  referenceLine?: { kind: "horizontal"; value: number } | { kind: "identity" };
}) {
  const xd = extent(points.map((p) => p[0]));
  const yd = extent(points.map((p) => p[1]));
  const both: [number, number] = [Math.min(xd[0], yd[0]), Math.max(xd[1], yd[1])];
  const identity = referenceLine?.kind === "identity";

  return (
    <Frame title={title} xAxis={xAxis} yAxis={yAxis} xDomain={identity ? both : xd} yDomain={identity ? both : yd}>
      {(sx, sy) => (
        <>
          {referenceLine?.kind === "horizontal" && (
            <line
              x1={sx(xd[0])}
              x2={sx(xd[1])}
              y1={sy(referenceLine.value)}
              y2={sy(referenceLine.value)}
              stroke="var(--color-destructive)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />
          )}
          {identity && (
            <line x1={sx(both[0])} y1={sy(both[0])} x2={sx(both[1])} y2={sy(both[1])} stroke="var(--color-destructive)" strokeDasharray="5 4" strokeWidth={1.5} />
          )}
          {points.map(([x, y], i) => (
            <circle key={i} cx={sx(x)} cy={sy(y)} r={3} fill="var(--chart-series-1)" opacity={0.55} />
          ))}
        </>
      )}
    </Frame>
  );
}

export type { Axis };
