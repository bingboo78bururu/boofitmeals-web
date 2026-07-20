import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MissionForm } from "./mission-form";
import { BodyLogForm } from "./body-log-form";
import { DateLinkContent } from "./date-link-content";
import { mealLabel } from "@/lib/roles";
import { addDays, isValidDateString, todayString } from "@/lib/dates";
import { finalScore } from "@/lib/score";
import type { MealType } from "@/lib/supabase/types";

const MEALS = (Object.keys(mealLabel) as MealType[]).map((type) => ({
  type,
  label: mealLabel[type],
}));

function DateStrip({
  selectedDate,
  today,
}: {
  selectedDate: string;
  today: string;
}) {
  const days = [-3, -2, -1, 0, 1, 2, 3].map((offset) =>
    addDays(selectedDate, offset)
  );
  const prevWindow = addDays(selectedDate, -7);
  const nextWindowRaw = addDays(selectedDate, 7);
  const nextWindow = nextWindowRaw > today ? today : nextWindowRaw;
  const nextDisabled = selectedDate >= today;

  return (
    <div className="flex items-center justify-center gap-1">
      <Link
        href={`/member?date=${prevWindow}`}
        className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-full text-ink-soft hover:bg-cream-soft active:scale-90 active:bg-cream-soft"
        aria-label="이전 날짜들"
      >
        ‹
      </Link>

      {days.map((d) => {
        const isFuture = d > today;
        const isSelected = d === selectedDate;
        const isToday = d === today;
        const dayNum = Number(d.slice(8, 10));

        if (isFuture) {
          return (
            <span
              key={d}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm text-ink-soft/30"
            >
              {dayNum}
            </span>
          );
        }

        return (
          <Link
            key={d}
            href={`/member?date=${d}`}
            className={`flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-sm font-medium transition-transform active:scale-90 ${
              isSelected
                ? "bg-carrot text-white active:bg-carrot-dark"
                : isToday
                  ? "border border-carrot text-carrot-dark active:bg-cream-soft"
                  : "text-ink-soft hover:bg-cream-soft active:bg-cream-soft"
            }`}
          >
            <DateLinkContent dayNum={dayNum} />
          </Link>
        );
      })}

      {nextDisabled ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft/30">
          ›
        </span>
      ) : (
        <Link
          href={`/member?date=${nextWindow}`}
          className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-full text-ink-soft hover:bg-cream-soft active:scale-90 active:bg-cream-soft"
          aria-label="다음 날짜들"
        >
          ›
        </Link>
      )}
    </div>
  );
}

export default async function MemberPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireRole("member");
  const supabase = await createClient();
  const today = todayString();

  const { date: dateParam } = await searchParams;
  let selectedDate = dateParam && isValidDateString(dateParam) ? dateParam : today;
  if (selectedDate > today) selectedDate = today;

  const isToday = selectedDate === today;

  const [{ data: selectedMissions }, { data: allMissionScores }, { data: todayBodyLog }] =
    await Promise.all([
      supabase
        .from("missions")
        .select(
          "id, meal_type, note, photo_url, ai_score, ai_score_reason, coach_score"
        )
        .eq("member_id", profile.id)
        .eq("mission_date", selectedDate),
      supabase
        .from("missions")
        .select("ai_score, coach_score")
        .eq("member_id", profile.id),
      supabase
        .from("body_logs")
        .select("weight_kg, body_fat_pct, muscle_mass_kg")
        .eq("member_id", profile.id)
        .eq("log_date", today)
        .maybeSingle(),
    ]);

  const carrotCount = (allMissionScores ?? []).reduce(
    (sum, m) => sum + finalScore(m),
    0
  );

  const missionByMeal = new Map(
    (selectedMissions ?? []).map((m) => [m.meal_type, m])
  );
  const missionIds = (selectedMissions ?? []).map((m) => m.id);

  const { data: feedbackRows } = missionIds.length
    ? await supabase
        .from("feedback")
        .select("mission_id, content")
        .in("mission_id", missionIds)
    : { data: [] as { mission_id: string; content: string }[] };

  const feedbackByMission = new Map(
    (feedbackRows ?? []).map((f) => [f.mission_id, f.content])
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">안녕하세요, {profile.name}님</h1>
          <p className="mt-1 text-sm text-ink-soft">
            오늘도 뚜렷한 목표를 향해 한 걸음.
          </p>
        </div>
        <div className="rounded-2xl bg-carrot-light/30 px-5 py-3 text-center">
          <p className="text-xs font-medium text-carrot-dark">누적 당근</p>
          <p className="text-2xl font-extrabold text-carrot-dark">
            🥕 {carrotCount}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">오늘의 체중/체지방률</h2>
        <BodyLogForm existing={todayBodyLog ?? null} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isToday
              ? "오늘의 미션"
              : `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일 미션`}
          </h2>
          {!isToday && (
            <Link
              href="/member"
              className="text-xs font-medium text-carrot-dark hover:underline"
            >
              오늘로
            </Link>
          )}
        </div>

        <DateStrip selectedDate={selectedDate} today={today} />

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {MEALS.map(({ type, label }) => {
            const mission = missionByMeal.get(type);
            const feedback = mission ? feedbackByMission.get(mission.id) : null;

            return (
              <div
                key={type}
                className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-card p-5"
              >
                {isToday ? (
                  <MissionForm
                    mealType={type}
                    mealLabel={label}
                    existingNote={mission?.note ?? null}
                    existingPhotoUrl={mission?.photo_url ?? null}
                    existingAiScore={mission?.ai_score ?? null}
                    existingAiScoreReason={mission?.ai_score_reason ?? null}
                    existingCoachScore={mission?.coach_score ?? null}
                  />
                ) : (
                  <>
                    <h3 className="text-sm font-bold">{label}</h3>
                    {mission ? (
                      <>
                        <div className="flex gap-3">
                          {mission.photo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mission.photo_url}
                              alt={`${label} 사진`}
                              className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                            />
                          )}
                          <p className="whitespace-pre-wrap text-sm text-ink-soft">
                            {mission.note}
                          </p>
                        </div>
                        {mission.ai_score !== null && (
                          <p className="rounded-lg bg-cream-soft px-3 py-2 text-xs text-ink-soft">
                            🤖 AI 채점 {mission.ai_score}점
                            {mission.ai_score_reason
                              ? ` · ${mission.ai_score_reason}`
                              : ""}
                          </p>
                        )}
                        {mission.coach_score !== null && (
                          <p className="rounded-lg bg-leaf/10 px-3 py-2 text-xs text-leaf-dark">
                            🥕 코치 조정 점수 {mission.coach_score}점
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-ink-soft">기록 없음</p>
                    )}
                  </>
                )}

                {feedback && (
                  <div className="rounded-xl border border-leaf/30 bg-leaf/10 p-3">
                    <p className="text-xs font-medium text-leaf-dark">
                      영양코치 피드백
                    </p>
                    <p className="mt-1 text-sm">{feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
