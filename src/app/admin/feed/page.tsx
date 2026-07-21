import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { finalScore } from "@/lib/score";
import { mealLabel } from "@/lib/roles";

export default async function AdminFeedPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [
    { data: members },
    { data: coaches },
    { data: assignments },
    { data: feed },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("role", "member"),
    supabase.from("profiles").select("id, name").eq("role", "coach"),
    supabase.from("coach_assignments").select("member_id, coach_id"),
    supabase
      .from("missions")
      .select(
        "id, member_id, mission_date, meal_type, note, photo_url, ai_score, ai_score_reason, coach_score, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const coachNameById = new Map((coaches ?? []).map((c) => [c.id, c.name]));
  const coachIdByMember = new Map(
    (assignments ?? []).map((a) => [a.member_id, a.coach_id])
  );
  const memberNameById = new Map((members ?? []).map((m) => [m.id, m.name]));

  const feedMissionIds = (feed ?? []).map((m) => m.id);
  const { data: feedFeedbacks } = feedMissionIds.length
    ? await supabase
        .from("feedback")
        .select("mission_id, content")
        .in("mission_id", feedMissionIds)
    : { data: [] as { mission_id: string; content: string }[] };
  const feedbackByMission = new Map(
    (feedFeedbacks ?? []).map((f) => [f.mission_id, f.content])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">미션 피드</h1>
        <p className="mt-1 text-sm text-ink-soft">
          최근 인증된 미션 {feed?.length ?? 0}건이에요. AI 채점이 이상하거나
          담당 코치가 피드백을 안 남긴 건이 없는지 확인하세요.
        </p>
      </div>

      {!feed || feed.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
          아직 인증된 미션이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {feed.map((mission) => {
            const hasFeedback = feedbackByMission.has(mission.id);
            return (
              <li
                key={mission.id}
                className="rounded-2xl border border-line bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                  <span className="font-bold">
                    {memberNameById.get(mission.member_id) ?? "회원"}
                    <span className="ml-2 font-normal text-ink-soft">
                      담당:{" "}
                      {coachNameById.get(
                        coachIdByMember.get(mission.member_id) ?? ""
                      ) ?? "미배정"}
                    </span>
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
                      alt={`${memberNameById.get(mission.member_id) ?? "회원"}의 식단 사진`}
                      className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-1.5">
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
                      {hasFeedback ? (
                        <span className="w-fit rounded-lg bg-leaf/10 px-2 py-0.5 text-xs text-leaf-dark">
                          💬 코치 피드백 완료
                        </span>
                      ) : (
                        <span className="w-fit rounded-lg bg-carrot-light/30 px-2 py-0.5 text-xs text-carrot-dark">
                          💬 코치 피드백 없음
                        </span>
                      )}
                    </div>
                    {hasFeedback && (
                      <p className="mt-1 rounded-lg bg-leaf/10 px-3 py-2 text-xs">
                        {feedbackByMission.get(mission.id)}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
