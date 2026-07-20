import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mealLabel } from "@/lib/roles";
import { finalScore } from "@/lib/score";
import type { MealType } from "@/lib/supabase/types";

export default async function MemberFeedPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();

  if (!profile.class_id) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">클래스 피드</h1>
          <p className="mt-1 text-sm text-ink-soft">
            같은 클래스 동료들의 오늘 식단을 확인해보세요.
          </p>
        </div>
        <p className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
          아직 클래스가 배정되지 않았어요. 운영자에게 문의해주세요.
        </p>
      </div>
    );
  }

  const { data: classmates } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "member")
    .eq("class_id", profile.class_id);

  const memberIds = (classmates ?? []).map((m) => m.id);
  const nameByMember = new Map((classmates ?? []).map((m) => [m.id, m.name]));

  const { data: missions } = memberIds.length
    ? await supabase
        .from("missions")
        .select(
          "id, member_id, mission_date, meal_type, note, photo_url, ai_score, ai_score_reason, coach_score"
        )
        .in("member_id", memberIds)
        .order("mission_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30)
    : {
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
      };

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">클래스 피드</h1>
        <p className="mt-1 text-sm text-ink-soft">
          같은 클래스 동료 {classmates?.length ?? 0}명의 식단을 확인해보세요.
        </p>
      </div>

      {(!missions || missions.length === 0) && (
        <p className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
          아직 인증한 미션이 없어요.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {(missions ?? []).map((mission) => {
          const feedback = feedbackByMission.get(mission.id);
          const isMe = mission.member_id === profile.id;

          return (
            <li
              key={mission.id}
              className="rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">
                  {nameByMember.get(mission.member_id) ?? "회원"}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-carrot-dark">
                      (나)
                    </span>
                  )}
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
                  {mission.ai_score !== null && (
                    <span className="w-fit rounded-full bg-cream-soft px-2 py-0.5 text-xs text-carrot-dark">
                      🥕 최종 점수 {finalScore(mission)}점
                    </span>
                  )}
                </div>
              </div>

              {feedback && (
                <div className="mt-3 rounded-xl border border-leaf/30 bg-leaf/10 p-3">
                  <p className="text-xs font-medium text-leaf-dark">
                    영양코치 피드백
                  </p>
                  <p className="mt-1 text-sm">{feedback}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
