import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diffDays, todayString } from "@/lib/dates";
import { goalUnitLabel, goalUnitSuffix } from "@/lib/roles";
import { latestBodyLogValue } from "@/lib/goal";

function EmptyBanner() {
  return (
    <div className="border-b border-line bg-cream-soft">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-2.5 text-sm text-ink-soft">
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

export async function GoalBanner({ memberId }: { memberId: string }) {
  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("unit, current_value, target_value, target_date")
    .eq("member_id", memberId)
    .maybeSingle();

  if (!goal || !goal.target_value || !goal.target_date) {
    return <EmptyBanner />;
  }

  const currentValue = (await latestBodyLogValue(memberId, goal.unit)) ?? goal.current_value;
  if (!currentValue) {
    return <EmptyBanner />;
  }

  const achieved =
    goal.unit === "muscle_mass_kg"
      ? currentValue >= goal.target_value
      : currentValue <= goal.target_value;

  if (achieved) {
    return (
      <div className="border-b border-line bg-leaf">
        <div className="mx-auto max-w-5xl px-6 py-2.5 text-sm font-bold text-white">
          🎉 목표를 달성했어요! 축하해요!
        </div>
      </div>
    );
  }

  const suffix = goalUnitSuffix[goal.unit];
  const days = diffDays(todayString(), goal.target_date);
  const dDayText =
    days > 0 ? `${days}일 남았어요` : days === 0 ? "오늘이 목표일이에요!" : "목표일이 지났어요";

  return (
    <div className="border-b border-line bg-cream-soft">
      <div className="mx-auto max-w-5xl px-6 py-2.5 text-sm font-medium text-carrot-dark">
        🎯 내 목표: {goalUnitLabel[goal.unit]} {currentValue}
        {suffix} → {goal.target_value}
        {suffix} · {dDayText}
      </div>
    </div>
  );
}
