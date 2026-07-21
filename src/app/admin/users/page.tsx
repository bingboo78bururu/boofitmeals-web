import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssignCoachForm } from "./assign-coach-form";
import { ClassForm } from "./class-form";
import { DeleteClassButton } from "./delete-class-button";
import { ReassignClassForm } from "./reassign-class-form";
import { todayString } from "@/lib/dates";
import { finalScore } from "@/lib/score";

const REFUND_THRESHOLD = 100;

export default async function AdminUsersPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const today = todayString();
  const [year, month] = today.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;

  const [
    { data: members },
    { data: coaches },
    { data: assignments },
    { data: classes },
    { data: directory },
    { data: monthMissions },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, class_id").eq("role", "member"),
    supabase.from("profiles").select("id, name").eq("role", "coach"),
    supabase.from("coach_assignments").select("member_id, coach_id"),
    supabase.from("classes").select("id, name").order("name"),
    supabase.rpc("admin_user_directory"),
    supabase
      .from("missions")
      .select("member_id, ai_score, coach_score")
      .gte("mission_date", monthStart),
  ]);

  const coachNameById = new Map((coaches ?? []).map((c) => [c.id, c.name]));
  const coachIdByMember = new Map(
    (assignments ?? []).map((a) => [a.member_id, a.coach_id])
  );
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const memberCountByClass = new Map<string, number>();
  for (const member of members ?? []) {
    if (!member.class_id) continue;
    memberCountByClass.set(
      member.class_id,
      (memberCountByClass.get(member.class_id) ?? 0) + 1
    );
  }

  // 환급 챌린지(월 100개) 진행 상황 확인용 — 최종 점수(코치 조정 우선) 기준으로 합산
  const monthCarrotsByMember = new Map<string, number>();
  for (const m of monthMissions ?? []) {
    monthCarrotsByMember.set(
      m.member_id,
      (monthCarrotsByMember.get(m.member_id) ?? 0) + finalScore(m)
    );
  }

  const directoryRows = (directory ?? [])
    .filter((d) => d.role !== "admin")
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "coach" ? -1 : 1;
      return a.name.localeCompare(b.name, "ko");
    });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">회원/코치 관리</h1>
        <p className="mt-1 text-sm text-ink-soft">
          닉네임·이메일 조회, 클래스·담당코치 배정을 이 화면에서 관리하세요.
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-lg font-bold">회원 · 코치 디렉토리</h2>
        <p className="mb-3 text-xs text-ink-soft">
          회원은 이번 달 누적 당근도 함께 확인할 수 있어요. {REFUND_THRESHOLD}
          개를 채우면 등록비 전액 환급 대상이에요.
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
