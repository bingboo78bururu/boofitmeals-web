import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { latestBodyLogValue } from "@/lib/goal";
import { GoalForm } from "../goal-form";
import { GoalTypeForm } from "./goal-type-form";
import { ClassSettingsForm } from "./class-settings-form";

export default async function MyPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();

  const [{ data: goal }, { data: classes }] = await Promise.all([
    supabase
      .from("goals")
      .select("unit, current_value, target_value, target_date")
      .eq("member_id", profile.id)
      .maybeSingle(),
    supabase.from("classes").select("id, name").order("name"),
  ]);

  const goalWithLatest = goal
    ? {
        ...goal,
        current_value: (await latestBodyLogValue(profile.id, goal.unit)) ?? goal.current_value,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {profile.name}님의 목표와 설정을 관리해요.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">식단 목적</h2>
        <GoalTypeForm unit={goal?.unit ?? null} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">나의 목표</h2>
        {goal ? (
          <GoalForm initial={goalWithLatest} unit={goal.unit} />
        ) : (
          <p className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
            먼저 식단 목적을 선택해주세요.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">클래스</h2>
        <ClassSettingsForm
          classes={classes ?? []}
          currentClassId={profile.class_id}
        />
      </section>
    </div>
  );
}
