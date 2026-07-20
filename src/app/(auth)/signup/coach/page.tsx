import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CoachSelectForm } from "./coach-select-form";

export default async function SignupCoachPage() {
  await requireRole("member");
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("profiles")
    .select("id, name, bio, tags, photo_url")
    .eq("role", "coach");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-1 text-sm text-ink-soft">2 / 3</p>
      <h1 className="text-2xl font-bold">담당 영양코치를 선택해주세요</h1>
      <p className="mt-2 text-sm text-ink-soft">
        선택한 코치가 식단 사진에 피드백을 남겨드려요.
      </p>

      <div className="mt-8">
        {coaches && coaches.length > 0 ? (
          <CoachSelectForm coaches={coaches} />
        ) : (
          <p className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
            아직 등록된 영양코치가 없어요. 나중에 운영자가 배정해드릴게요.
          </p>
        )}
      </div>

      <Link
        href="/signup/class"
        className="mt-4 text-center text-sm text-ink-soft hover:text-carrot"
      >
        나중에 선택할게요 →
      </Link>
    </div>
  );
}
