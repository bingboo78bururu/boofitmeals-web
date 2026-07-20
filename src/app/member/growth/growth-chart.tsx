"use client";

import { useRef, useState } from "react";
import { goalUnitLabel } from "@/lib/roles";
import { BodyLogForm } from "./body-log-form";
import type { GoalUnit } from "@/lib/supabase/types";

type Point = { date: string; value: number };
type BodyLog = {
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
};

const MAX_WIDTH = 600;
const HEIGHT = 220;
const PAD_X = 16;
const PAD_TOP = 32;
const PAD_BOTTOM = 32;

// 점이 적을수록 가로 폭을 좁혀서(=확대해서) 보여준다 — 안 그러면 데이터가
// 거의 없을 때 카드 전체 너비에 점 하나만 덩그러니 떠서 숫자가 작아 보임.
function widthFor(pointCount: number) {
  return Math.min(MAX_WIDTH, Math.max(220, 100 + pointCount * 90));
}

function formatDate(date: string) {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

export function GrowthChart({
  points,
  target,
  unit,
  suffix,
  existingLog,
}: {
  points: Point[];
  target: number;
  unit: GoalUnit;
  suffix: string;
  existingLog: BodyLog | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showLogForm, setShowLogForm] = useState(points.length === 0);

  const WIDTH = widthFor(points.length);
  const values = points.map((p) => p.value);
  const times = points.map((p) => new Date(`${p.date}T00:00:00Z`).getTime());
  const minTime = points.length ? Math.min(...times) : 0;
  const maxTime = points.length ? Math.max(...times) : 0;
  const rawMin = points.length ? Math.min(...values, target) : target;
  const rawMax = points.length ? Math.max(...values, target) : target;
  const spread = rawMax - rawMin || 1;
  const yMin = rawMin - spread * 0.15;
  const yMax = rawMax + spread * 0.15;

  const x = (t: number) =>
    maxTime === minTime
      ? PAD_X + (WIDTH - PAD_X * 2) / 2
      : PAD_X + ((t - minTime) / (maxTime - minTime)) * (WIDTH - PAD_X * 2);
  const y = (v: number) =>
    PAD_TOP + (1 - (v - yMin) / (yMax - yMin)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(" ");

  const targetY = y(target);
  const last = points[points.length - 1];

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const userX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    times.forEach((t, i) => {
      const dist = Math.abs(x(t) - userX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-line bg-card p-5">
      {points.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 기록이 없어요.</p>
      ) : (
        <>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-sm text-ink-soft">
              최근 {points.length}건 · 목표 {target}
              {suffix}
            </p>
            <p className="text-lg font-bold text-carrot-dark">
              {last.value}
              {suffix}
            </p>
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="mx-auto w-full touch-none"
            style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxWidth: WIDTH * 1.8 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {/* 목표선 */}
            <line
              x1={PAD_X}
              y1={targetY}
              x2={WIDTH - PAD_X}
              y2={targetY}
              stroke="var(--color-ink-soft)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <text
              x={WIDTH - PAD_X}
              y={targetY - 8}
              textAnchor="end"
              className="fill-ink-soft"
              fontSize={15}
            >
              목표 {target}
              {suffix}
            </text>

            {/* 추이선 */}
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-carrot)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 크로스헤어 */}
            {hovered && (
              <line
                x1={x(times[hoverIndex!])}
                y1={PAD_TOP - 10}
                x2={x(times[hoverIndex!])}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="var(--color-ink-soft)"
                strokeWidth={1}
                opacity={0.35}
              />
            )}

            {/* 데이터 포인트 */}
            {points.map((p, i) => (
              <circle
                key={p.date}
                cx={x(times[i])}
                cy={y(p.value)}
                r={hoverIndex === i ? 7 : 5}
                fill="var(--color-carrot)"
                stroke="var(--color-card)"
                strokeWidth={2}
              />
            ))}
          </svg>

          {hovered && (
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-carrot" />
              <span className="font-semibold text-ink">
                {hovered.value}
                {suffix}
              </span>
              <span>{formatDate(hovered.date)}</span>
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-carrot">
              표로 보기
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="py-1.5 pr-4 font-medium">날짜</th>
                    <th className="py-1.5 font-medium tabular-nums">
                      {goalUnitLabel[unit]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((p) => (
                    <tr key={p.date} className="border-b border-line last:border-0">
                      <td className="py-1.5 pr-4 tabular-nums">{p.date}</td>
                      <td className="py-1.5 tabular-nums">
                        {p.value}
                        {suffix}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      </div>

      {showLogForm ? (
        <BodyLogForm
          unit={unit}
          existing={existingLog}
          onSaved={() => setShowLogForm(false)}
          onCancel={() => setShowLogForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowLogForm(true)}
          className="w-full rounded-xl bg-carrot py-3 text-center text-sm font-semibold text-white hover:bg-carrot-dark"
        >
          오늘 수치 기록하기
        </button>
      )}
    </div>
  );
}
