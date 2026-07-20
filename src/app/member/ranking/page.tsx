import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { finalScore } from "@/lib/score";

export default async function RankingPage() {
  const profile = await requireRole("member");
  const supabase = await createClient();

  const [{ data: members }, { data: missions }] = await Promise.all([
    supabase.from("profiles").select("id, name").eq("role", "member"),
    supabase.from("missions").select("member_id, ai_score, coach_score"),
  ]);

  const counts = new Map<string, number>();
  for (const m of missions ?? []) {
    counts.set(m.member_id, (counts.get(m.member_id) ?? 0) + finalScore(m));
  }

  const ranking = (members ?? [])
    .map((m) => ({ ...m, carrots: counts.get(m.id) ?? 0 }))
    .sort((a, b) => b.carrots - a.carrots);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">당근 랭킹보드</h1>
        <p className="mt-1 text-sm text-ink-soft">
          동료들과 함께 쌓은 당근을 확인해보세요.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {ranking.map((member, i) => {
          const isMe = member.id === profile.id;
          return (
            <li
              key={member.id}
              className={`flex items-center justify-between rounded-2xl border px-5 py-3 ${
                isMe
                  ? "border-carrot bg-carrot-light/20"
                  : "border-line bg-card"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-ink-soft">
                  {i + 1}
                </span>
                <span className="font-medium">
                  {member.name}
                  {isMe && (
                    <span className="ml-1.5 text-xs text-carrot-dark">
                      (나)
                    </span>
                  )}
                </span>
              </div>
              <span className="font-bold text-carrot-dark">
                🥕 {member.carrots}
              </span>
            </li>
          );
        })}
        {ranking.length === 0 && (
          <p className="text-sm text-ink-soft">
            아직 랭킹에 표시할 회원이 없어요.
          </p>
        )}
      </ol>
    </div>
  );
}
