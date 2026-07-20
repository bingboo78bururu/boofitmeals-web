import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";
import { ScoreOverride } from "./score-override";
import { mealLabel } from "@/lib/roles";
import { finalScore } from "@/lib/score";
import type { MealType } from "@/lib/supabase/types";

export default async function CoachPage() {
  const profile = await requireRole("coach");
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("member_id")
    .eq("coach_id", profile.id);

  const memberIds = (assignments ?? []).map((a) => a.member_id);

  const [{ data: members }, { data: missions }] = await Promise.all([
    memberIds.length
      ? supabase.from("profiles").select("id, name").in("id", memberIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    memberIds.length
      ? supabase
          .from("missions")
          .select(
            "id, member_id, mission_date, meal_type, note, photo_url, ai_score, ai_score_reason, coach_score"
          )
          .in("member_id", memberIds)
          .order("mission_date", { ascending: false })
          .limit(30)
      : Promise.resolve({
          data: [] as {
            id: string;
            member_id: string;
            mission_date: string;
            meal_type: MealType;
            note: string | null;
            photo_url: string | null;
            ai_score: number | null;
            ai_score_reason: string | null;
            coach_score: number | null;
          }[],
        }),
  ]);

  const missionIds = (missions ?? []).map((m) => m.id);
  const { data: feedbacks } = missionIds.length
    ? await supabase
        .from("feedback")
        .select("mission_id, content")
        .in("mission_id", missionIds)
    : { data: [] as { mission_id: string; content: string }[] };

  const feedbackByMission = new Map(
    (feedbacks ?? []).map((f) => [f.mission_id, f.content])
  );
  const nameByMember = new Map((members ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">담당 회원</h1>
        <p className="mt-1 text-sm text-ink-soft">
          담당 회원 {members?.length ?? 0}명 · 최근 미션에 피드백을
          남겨주세요.
        </p>
      </div>

      {(!missions || missions.length === 0) && (
        <p className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
          아직 배정된 회원의 미션 기록이 없어요.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {(missions ?? []).map((mission) => {
          const existingFeedback = feedbackByMission.get(mission.id);
          return (
            <li
              key={mission.id}
              className="rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">
                  {nameByMember.get(mission.member_id) ?? "회원"}
                </span>
                <span className="text-ink-soft">
                  {mission.mission_date} · {mealLabel[mission.meal_type]}
                </span>
              </div>
              <div className="mt-2 flex gap-3">
                {mission.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mission.photo_url}
                    alt={`${nameByMember.get(mission.member_id) ?? "회원"}의 식단 사진`}
                    className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1">
                  <p className="whitespace-pre-wrap text-sm text-ink-soft">
                    {mission.note}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.ai_score !== null && (
                      <span className="w-fit rounded-lg bg-cream-soft px-2 py-0.5 text-xs text-carrot-dark">
                        🤖 AI 채점 {mission.ai_score}점
                        {mission.ai_score_reason
                          ? ` · ${mission.ai_score_reason}`
                          : ""}
                      </span>
                    )}
                    {mission.coach_score !== null && (
                      <span className="w-fit rounded-lg bg-leaf/10 px-2 py-0.5 text-xs text-leaf-dark">
                        🥕 최종 점수 {finalScore(mission)}점 (코치 조정)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ScoreOverride
                missionId={mission.id}
                aiScore={mission.ai_score}
                coachScore={mission.coach_score}
              />

              <FeedbackForm
                missionId={mission.id}
                existingFeedback={existingFeedback ?? null}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
