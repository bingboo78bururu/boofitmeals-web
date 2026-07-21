import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssignCoachForm } from "./assign-coach-form";
import { ClassForm } from "./class-form";
import { DeleteClassButton } from "./delete-class-button";
import { ReassignClassForm } from "./reassign-class-form";
import { todayString } from "@/lib/dates";
import { finalScore } from "@/lib/score";
import { mealLabel } from "@/lib/roles";

const BUCKETS = [
  { label: "80% 이상", test: (r: number) => r >= 0.8 },
  { label: "50~79%", test: (r: number) => r >= 0.5 },
  { label: "20~49%", test: (r: number) => r >= 0.2 },
  { label: "1~19%", test: (r: number) => r > 0 },
  { label: "0%", test: () => true },
];

const REFUND_THRESHOLD = 100;

export default async function AdminPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const today = todayString();
  const [year, month, day] = today.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysElapsed = day;

  const [
    { data: members },
    { data: coaches },
    { data: assignments },
    { data: monthMissions },
    { data: todayMissions },
    { data: classes },
    { data: feed },
    { data: directory },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, class_id").eq("role", "member"),
    supabase.from("profiles").select("id, name").eq("role", "coach"),
    supabase.from("coach_assignments").select("member_id, coach_id"),
    supabase
      .from("missions")
      .select("member_id, mission_date, ai_score, coach_score")
      .gte("mission_date", monthStart),
    supabase.from("missions").select("member_id").eq("mission_date", today),
    supabase.from("classes").select("id, name").order("name"),
    supabase
      .from("missions")
      .select(
        "id, member_id, mission_date, meal_type, note, photo_url, ai_score, ai_score_reason, coach_score, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.rpc("admin_user_directory"),
  ]);

  const coachNameById = new Map((coaches ?? []).map((c) => [c.id, c.name]));
  const coachIdByMember = new Map(
    (assignments ?? []).map((a) => [a.member_id, a.coach_id])
  );
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const memberNameById = new Map((members ?? []).map((m) => [m.id, m.name]));

  // 하루 최대 3끼(아침/점심/저녁)까지 인증 가능하므로, "수행률"은 끼니 수가 아니라
  // 최소 한 끼라도 인증한 날짜 수 기준으로 집계
  const monthDatesByMember = new Map<string, Set<string>>();
  for (const m of monthMissions ?? []) {
    if (!monthDatesByMember.has(m.member_id)) {
      monthDatesByMember.set(m.member_id, new Set());
    }
    monthDatesByMember.get(m.member_id)!.add(m.mission_date);
  }
  const monthCountByMember = new Map<string, number>(
    [...monthDatesByMember.entries()].map(([id, dates]) => [id, dates.size])
  );

  // 환급 챌린지(월 100개) 진행 상황 확인용 — 최종 점수(코치 조정 우선) 기준으로 합산
  const monthCarrotsByMember = new Map<string, number>();
  for (const m of monthMissions ?? []) {
    monthCarrotsByMember.set(
      m.member_id,
      (monthCarrotsByMember.get(m.member_id) ?? 0) + finalScore(m)
    );
  }

  const memberCount = members?.length ?? 0;
  const todaySubmitted = new Set((todayMissions ?? []).map((m) => m.member_id))
    .size;

  const bucketCounts = BUCKETS.map(() => 0);
  for (const member of members ?? []) {
    const rate = (monthCountByMember.get(member.id) ?? 0) / daysElapsed;
    const idx = BUCKETS.findIndex((b) => b.test(rate));
    bucketCounts[idx]++;
  }

  const aiScoreCounts = [0, 0, 0];
  for (const m of monthMissions ?? []) {
    if (m.ai_score === 0 || m.ai_score === 1 || m.ai_score === 2) {
      aiScoreCounts[m.ai_score]++;
    }
  }
  const aiScoredTotal = aiScoreCounts.reduce((a, b) => a + b, 0);

  const memberCountByClass = new Map<string, number>();
  for (const member of members ?? []) {
    if (!member.class_id) continue;
    memberCountByClass.set(
      member.class_id,
      (memberCountByClass.get(member.class_id) ?? 0) + 1
    );
  }

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

  const directoryRows = (directory ?? [])
    .filter((d) => d.role !== "admin")
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "coach" ? -1 : 1;
      return a.name.localeCompare(b.name, "ko");
    });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">운영 대시보드</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {year}년 {month}월 · {daysElapsed}일차
          기준
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-medium text-ink-soft">전체 회원</p>
          <p className="mt-1 text-3xl font-extrabold">{memberCount}명</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-medium text-ink-soft">오늘 미션 제출</p>
          <p className="mt-1 text-3xl font-extrabold">
            {todaySubmitted}
            <span className="text-base font-medium text-ink-soft">
              /{memberCount}명
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-medium text-ink-soft">영양코치</p>
          <p className="mt-1 text-3xl font-extrabold">
            {coaches?.length ?? 0}명
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-lg font-bold">전체 미션 피드</h2>
        <p className="mb-3 text-xs text-ink-soft">
          최근 인증된 미션 {feed?.length ?? 0}건이에요. AI 채점이 이상하거나
          담당 코치가 피드백을 안 남긴 건이 없는지 확인하세요.
        </p>
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
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">이번 달 미션 수행률 분포</h2>
        <p className="mb-3 text-xs text-ink-soft">
          버핏Meals 1차 베타에서 확인된 것처럼, 미션 수행률 80% 이상 구간의
          재등록 전환이 가장 높았어요. 그 구간의 회원 수를 계속 지켜보세요.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">수행률 구간</th>
                <th className="px-4 py-3 font-medium tabular-nums">
                  회원 수
                </th>
              </tr>
            </thead>
            <tbody>
              {BUCKETS.map((b, i) => (
                <tr key={b.label} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">{b.label}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {bucketCounts[i]}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">이번 달 AI 식단 채점 분포</h2>
        <p className="mb-3 text-xs text-ink-soft">
          업로드된 식단 사진을 AI가 0~2점으로 자동 채점해요 (0점: 식사 사진
          아님/성의 없음, 1점: 인증은 성실하나 구성 불균형, 2점: 탄단지
          균형 잡힌 식단).
        </p>
        {aiScoredTotal === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-5 text-sm text-ink-soft">
            아직 채점된 식단 사진이 없어요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[300px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-soft">
                  <th className="px-4 py-3 font-medium">점수</th>
                  <th className="px-4 py-3 font-medium tabular-nums">건수</th>
                  <th className="px-4 py-3 font-medium tabular-nums">비율</th>
                </tr>
              </thead>
              <tbody>
                {["0점 · 인증 미흡", "1점 · 성실한 인증", "2점 · 균형 잡힌 식단"].map(
                  (label, i) => (
                    <tr key={label} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5">{label}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {aiScoreCounts[i]}건
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {Math.round((aiScoreCounts[i] / aiScoredTotal) * 100)}%
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold">회원 · 코치 디렉토리</h2>
        <p className="mb-3 text-xs text-ink-soft">
          닉네임·이메일과 함께, 회원은 이번 달 누적 당근을 확인할 수 있어요.
          {" "}
          {REFUND_THRESHOLD}개를 채우면 등록비 전액 환급 대상이에요.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">닉네임</th>
                <th className="px-4 py-3 font-medium">역할</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">클래스</th>
                <th className="px-4 py-3 font-medium">담당코치</th>
                <th className="px-4 py-3 font-medium tabular-nums">
                  이번 달 당근
                </th>
              </tr>
            </thead>
            <tbody>
              {directoryRows.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-ink-soft" colSpan={6}>
                    표시할 사용자가 없어요.
                  </td>
                </tr>
              )}
              {directoryRows.map((d) => {
                const isMember = d.role === "member";
                const carrots = monthCarrotsByMember.get(d.id) ?? 0;
                const refundEligible = isMember && carrots >= REFUND_THRESHOLD;
                return (
                  <tr key={d.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 font-medium">{d.name}</td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {d.role === "coach" ? "영양코치" : "회원"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {d.email ?? "-"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {isMember
                        ? (classNameById.get(d.class_id ?? "") ?? "미배정")
                        : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {isMember
                        ? (coachNameById.get(coachIdByMember.get(d.id) ?? "") ??
                          "미배정")
                        : "-"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {isMember ? (
                        <span
                          className={
                            refundEligible
                              ? "rounded-lg bg-leaf/10 px-2 py-0.5 font-semibold text-leaf-dark"
                              : ""
                          }
                        >
                          🥕 {carrots}
                          {refundEligible ? " · 환급 대상" : ""}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">클래스 관리</h2>
        <p className="mb-3 text-xs text-ink-soft">
          같은 클래스에 속한 회원끼리 랭킹보드가 묶여요. 회원가입 시 직접
          선택하거나, 아래에서 나중에 배정/조정할 수 있어요.
        </p>
        <div className="flex flex-col gap-4">
          <ClassForm />
          <ul className="grid gap-2 sm:grid-cols-2">
            {(classes ?? []).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2.5 text-sm"
              >
                <span>{c.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-ink-soft">
                    {memberCountByClass.get(c.id) ?? 0}명
                  </span>
                  <DeleteClassButton
                    classId={c.id}
                    className={c.name}
                    memberCount={memberCountByClass.get(c.id) ?? 0}
                  />
                </span>
              </li>
            ))}
            {(classes ?? []).length === 0 && (
              <p className="text-sm text-ink-soft">
                아직 생성된 클래스가 없어요.
              </p>
            )}
          </ul>
          <ReassignClassForm
            members={(members ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              className: classNameById.get(m.class_id ?? "") ?? null,
            }))}
            classes={classes ?? []}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">회원 · 영양코치 배정</h2>
        <div className="flex flex-col gap-4">
          <AssignCoachForm
            members={(members ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              coachName: coachNameById.get(coachIdByMember.get(m.id) ?? "") ?? null,
            }))}
            coaches={coaches ?? []}
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {(members ?? []).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-2.5 text-sm"
              >
                <span>{m.name}</span>
                <span className="text-ink-soft">
                  {coachNameById.get(coachIdByMember.get(m.id) ?? "") ??
                    "미배정"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
