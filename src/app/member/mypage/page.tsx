import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GoalForm } from "../goal-form";
import { CoachSettingsForm } from "./coach-settings-form";
import { ClassSettingsForm } from "./class-settings-form";

export default async function MyPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();

  const [{ data: goal }, { data: coaches }, { data: assignment }, { data: classes }] =
    await Promise.all([
      supabase
        .from("goals")
        .select("current_body_fat, target_body_fat, target_date")
        .eq("member_id", profile.id)
        .maybeSingle(),
      supabase.from("profiles").select("id, name").eq("role", "coach"),
      supabase
        .from("coach_assignments")
        .select("coach_id")
        .eq("member_id", profile.id)
        .maybeSingle(),
      supabase.from("classes").select("id, name").order("name"),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {profile.name}님의 목표와 설정을 관리해요.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">목표</h2>
        <GoalForm initial={goal ?? null} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">담당 영양코치</h2>
        <CoachSettingsForm
          coaches={coaches ?? []}
          currentCoachId={assignment?.coach_id ?? null}
        />
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
