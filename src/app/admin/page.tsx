import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/dates";
import { finalScore } from "@/lib/score";

const BUCKETS = [
  { label: "80% 이상", test: (r: number) => r >= 0.8 },
  { label: "50~79%", test: (r: number) => r >= 0.5 },
  { label: "20~49%", test: (r: number) => r >= 0.2 },
  { label: "1~19%", test: (r: number) => r > 0 },
  { label: "0%", test: () => true },
];

// 환급 챌린지 기준(월 100개)에 근접한 80~99개 구간이 가장 중요해서 강조 표시한다.
const CARROT_BUCKETS = [
  { label: "100개 이상", test: (n: number) => n >= 100, highlight: false },
  { label: "80~99개", test: (n: number) => n >= 80, highlight: true },
  { label: "60~79개", test: (n: number) => n >= 60, highlight: false },
  { label: "40~59개", test: (n: number) => n >= 40, highlight: false },
  { label: "20~39개", test: (n: number) => n >= 20, highlight: false },
  { label: "0~19개", test: () => true, highlight: false },
];

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
    { data: monthMissions },
    { data: todayMissions },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("role", "member"),
    supabase.from("profiles").select("id, name").eq("role", "coach"),
    supabase
      .from("missions")
      .select("member_id, mission_date, ai_score, coach_score")
      .gte("mission_date", monthStart),
    supabase.from("missions").select("member_id").eq("mission_date", today),
  ]);

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

  // 환급 챌린지(월 100개) 진행 상황 확인용 — 최종 점수(코치 조정 우선) 기준으로 합산
  const monthCarrotsByMember = new Map<string, number>();
  for (const m of monthMissions ?? []) {
    monthCarrotsByMember.set(
      m.member_id,
      (monthCarrotsByMember.get(m.member_id) ?? 0) + finalScore(m)
    );
  }
  const carrotBucketCounts = CARROT_BUCKETS.map(() => 0);
  for (const member of members ?? []) {
    const carrots = monthCarrotsByMember.get(member.id) ?? 0;
    const idx = CARROT_BUCKETS.findIndex((b) => b.test(carrots));
    carrotBucketCounts[idx]++;
  }

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
        <h2 className="mb-3 text-lg font-bold">이번 달 누적 당근 분포</h2>
        <p className="mb-3 text-xs text-ink-soft">
          당근 100개를 채우면 등록비 전액 환급 대상이에요. 곧 채울 수 있는
          80~99개 구간의 회원을 눈여겨보세요.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[300px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">당근 구간</th>
                <th className="px-4 py-3 font-medium tabular-nums">
                  회원 수
                </th>
              </tr>
            </thead>
            <tbody>
              {CARROT_BUCKETS.map((b, i) => (
                <tr
                  key={b.label}
                  className={`border-b border-line last:border-0 ${
                    b.highlight ? "bg-red-50" : ""
                  }`}
                >
                  <td
                    className={`px-4 py-2.5 ${
                      b.highlight ? "font-semibold text-red-700" : ""
                    }`}
                  >
                    {b.label}
                  </td>
                  <td
                    className={`px-4 py-2.5 tabular-nums ${
                      b.highlight ? "font-semibold text-red-700" : ""
                    }`}
                  >
                    {carrotBucketCounts[i]}명
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
