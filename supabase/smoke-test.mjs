// Ad-hoc end-to-end smoke test against the live Supabase project.
// Verifies: signup trigger creates profile, RLS allows the intended
// member/coach/admin flows, and blocks cross-member reads. Not part of the app.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const stamp = Date.now();
const results = [];

function report(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
}

async function signUpAndClient(role, label) {
  const client = createClient(URL_, KEY);
  const email = `${label}-${stamp}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: "test-password-123",
    options: { data: { name: label, role } },
  });
  if (error || !data.user) throw new Error(`signup failed for ${label}: ${error?.message}`);
  return { client, userId: data.user.id, email };
}

const member = await signUpAndClient("member", "member-a");
const otherMember = await signUpAndClient("member", "member-b");
const coach = await signUpAndClient("coach", "coach-a");
const admin = await signUpAndClient("admin", "admin-a");

// 1. Trigger created profiles with correct role
{
  const { data, error } = await member.client
    .from("profiles")
    .select("id, role, name")
    .eq("id", member.userId)
    .single();
  report("signup trigger creates profile with role", !error && data?.role === "member", error?.message);
}

// 2. Admin assigns member -> coach
{
  const { error } = await admin.client
    .from("coach_assignments")
    .upsert({ member_id: member.userId, coach_id: coach.userId }, { onConflict: "member_id" });
  report("admin can assign coach to member", !error, error?.message);
}

// 3. Non-admin cannot assign
{
  const { error } = await member.client
    .from("coach_assignments")
    .upsert({ member_id: otherMember.userId, coach_id: coach.userId }, { onConflict: "member_id" });
  report("member is blocked from assigning coaches (RLS)", !!error, error ? "correctly rejected" : "NOT REJECTED");
}

// 4. Member sets a goal
{
  const { error } = await member.client.from("goals").upsert(
    { member_id: member.userId, current_body_fat: 25, target_body_fat: 20, target_date: "2026-12-31" },
    { onConflict: "member_id" }
  );
  report("member can save own goal", !error, error?.message);
}

// 5. Other member cannot read this goal
{
  const { data, error } = await otherMember.client
    .from("goals")
    .select("*")
    .eq("member_id", member.userId);
  report("unrelated member cannot read another member's goal (RLS)", !error && data.length === 0, error?.message ?? `rows visible: ${data?.length}`);
}

// 6. Member submits today's mission
const today = new Date().toISOString().slice(0, 10);
let missionId;
{
  const { data, error } = await member.client
    .from("missions")
    .upsert({ member_id: member.userId, mission_date: today, note: "테스트 식단 기록" }, { onConflict: "member_id,mission_date" })
    .select("id")
    .single();
  missionId = data?.id;
  report("member can submit today's mission", !error && !!missionId, error?.message);
}

// 7. Assigned coach can see the mission
{
  const { data, error } = await coach.client
    .from("missions")
    .select("id")
    .eq("member_id", member.userId);
  report("assigned coach can see member's mission", !error && data?.length === 1, error?.message ?? `rows: ${data?.length}`);
}

// 8. Unassigned coach (simulate via otherMember acting as viewer) cannot see mission
{
  const { data } = await otherMember.client.from("missions").select("id").eq("member_id", member.userId);
  report("unrelated member cannot see another member's mission (RLS)", data?.length === 0, `rows visible: ${data?.length}`);
}

// 9. Coach leaves feedback
{
  const { error } = await coach.client
    .from("feedback")
    .insert({ mission_id: missionId, coach_id: coach.userId, content: "탄수화물을 조금 더 챙겨보세요." });
  report("assigned coach can leave feedback", !error, error?.message);
}

// 10. Member sees the feedback
{
  const { data, error } = await member.client
    .from("feedback")
    .select("content")
    .eq("mission_id", missionId)
    .single();
  report("member can read coach's feedback on own mission", !error && !!data?.content, error?.message);
}

// 11. Ranking query works (profiles + missions readable to any authenticated member)
{
  const { data: members, error: e1 } = await member.client.from("profiles").select("id, name").eq("role", "member");
  const { data: missions, error: e2 } = await member.client.from("missions").select("member_id");
  report("ranking board query (profiles + missions) succeeds", !e1 && !e2 && members.length >= 2 && missions.length >= 1, (e1 || e2)?.message);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("Failed:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
