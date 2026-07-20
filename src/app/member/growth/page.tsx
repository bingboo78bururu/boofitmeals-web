import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { goalUnitLabel, goalUnitSuffix } from "@/lib/roles";
import { BODY_LOG_FIELD_BY_UNIT } from "@/lib/goal";
import { todayString } from "@/lib/dates";
import { GrowthChart } from "./growth-chart";

export default async function GrowthPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("unit, current_value, target_value, target_date")
    .eq("member_id", profile.id)
    .maybeSingle();

  if (!goal || !goal.target_value) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">내 변화</h1>
          <p className="mt-1 text-sm text-ink-soft">
            체중/체지방률 변화를 그래프로 확인해요.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
          <span>아직 목표가 설정되지 않았어요.</span>
          <Link
            href="/member/mypage"
            className="shrink-0 font-medium text-carrot-dark hover:underline"
          >
            설정하기 {">"}
          </Link>
        </div>
      </div>
    );
  }

  const field = BODY_LOG_FIELD_BY_UNIT[goal.unit];
  const [{ data: logs }, { data: todayLog }] = await Promise.all([
    supabase
      .from("body_logs")
      .select(`log_date, ${field}`)
      .eq("member_id", profile.id)
      .not(field, "is", null)
      .order("log_date", { ascending: true })
      .limit(30),
    supabase
      .from("body_logs")
      .select("weight_kg, body_fat_pct, muscle_mass_kg")
      .eq("member_id", profile.id)
      .eq("log_date", todayString())
      .maybeSingle(),
  ]);

  const points = ((logs ?? []) as unknown as Record<string, string | number | null>[])
    .map((row) => ({
      date: row.log_date as string,
      value: Number(row[field]),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">내 변화</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {goalUnitLabel[goal.unit]} 변화를 목표선과 함께 확인해요.
        </p>
      </div>

      <GrowthChart
        points={points}
        target={goal.target_value}
        unit={goal.unit}
        suffix={goalUnitSuffix[goal.unit]}
        existingLog={todayLog ?? null}
      />
    </div>
  );
}
