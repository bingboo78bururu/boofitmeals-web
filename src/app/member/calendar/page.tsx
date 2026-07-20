import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/dates";
import { finalScore } from "@/lib/score";
import type { MealType } from "@/lib/supabase/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_DOT_LABEL: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
};
const YM_RE = /^\d{4}-\d{2}$/;

function CarrotDot({ score, label }: { score: number; label: string }) {
  if (score >= 2) {
    return (
      <span
        title={`${label} · 당근 2개`}
        className="relative inline-flex h-2.5 w-2 shrink-0 items-end justify-center"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute -top-0.5 z-0 h-2 w-2 text-leaf"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-carrot" />
      </span>
    );
  }
  if (score === 1) {
    return (
      <span
        title={`${label} · 당근 1개`}
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-carrot"
      />
    );
  }
  return (
    <span
      title={`${label} · 당근 0개`}
      className="h-1.5 w-1.5 shrink-0 rounded-full bg-line"
    />
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const profile = await requireRole("member");
  const supabase = await createClient();

  const todayYM = todayString().slice(0, 7);
  const { month: monthParam } = await searchParams;
  const ym = monthParam && YM_RE.test(monthParam) ? monthParam : todayYM;
  const [year, monthNum] = ym.split("-").map(Number);
  const month = monthNum - 1; // 0-indexed

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const prevMonthEnd = new Date(year, month, 0);

  const prevYm = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthStart = new Date(year, month + 1, 1);
  const nextYm = `${nextMonthStart.getFullYear()}-${String(nextMonthStart.getMonth() + 1).padStart(2, "0")}`;

  const { data: missions } = await supabase
    .from("missions")
    .select("mission_date, meal_type, ai_score, coach_score")
    .eq("member_id", profile.id)
    .gte("mission_date", monthStart.toISOString().slice(0, 10))
    .lte("mission_date", monthEnd.toISOString().slice(0, 10));

  const scoresByDay = new Map<number, Map<MealType, number>>();
  for (const m of missions ?? []) {
    const day = Number(m.mission_date.slice(8, 10));
    if (!scoresByDay.has(day)) scoresByDay.set(day, new Map());
    scoresByDay.get(day)!.set(m.meal_type, finalScore(m));
  }
  const markedDays = new Set(scoresByDay.keys());

  const daysInMonth = monthEnd.getDate();
  const leadingBlanks = monthStart.getDay();
  const daysInPrevMonth = prevMonthEnd.getDate();

  const leadingCells = Array.from({ length: leadingBlanks }, (_, i) => ({
    day: daysInPrevMonth - leadingBlanks + i + 1,
    current: false,
  }));
  const currentCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    current: true,
  }));
  const trailingCount = (7 - ((leadingCells.length + currentCells.length) % 7)) % 7;
  const trailingCells = Array.from({ length: trailingCount }, (_, i) => ({
    day: i + 1,
    current: false,
  }));
  const cells = [...leadingCells, ...currentCells, ...trailingCells];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">당근 캘린더</h1>
          <p className="mt-1 text-sm text-ink-soft">
            식단을 인증해서 당근을 채워보세요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-line" />
            0개
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-carrot" />
            1개
          </span>
          <span className="flex items-center gap-1">
            <CarrotDot score={2} label="범례" />
            2개
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/member/calendar?month=${prevYm}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-soft hover:bg-cream-soft"
            aria-label="지난달"
          >
            ‹
          </Link>
          <span className="text-lg font-bold">
            {year}년 {month + 1}월
          </span>
          <Link
            href={`/member/calendar?month=${nextYm}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-soft hover:bg-cream-soft"
            aria-label="다음달"
          >
            ›
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-ink-soft">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map(({ day, current }, i) => {
            const dayScores = current ? scoresByDay.get(day) : undefined;
            return (
              <div
                key={i}
                className="flex min-h-16 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-line/60 py-2 text-sm"
              >
                <span className={current ? "text-ink-soft" : "text-ink-soft/25"}>
                  {day}
                </span>
                {current && (
                  <div className="flex items-end gap-1">
                    {MEAL_ORDER.map((meal) => (
                      <CarrotDot
                        key={meal}
                        score={dayScores?.get(meal) ?? 0}
                        label={MEAL_DOT_LABEL[meal]}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-ink-soft">
        이번달 {markedDays.size}일 실천했어요.
      </p>
    </div>
  );
}
