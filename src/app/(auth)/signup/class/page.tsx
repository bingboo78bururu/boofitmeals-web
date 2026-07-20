import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClassSelectForm } from "./class-select-form";

export default async function SignupClassPage() {
  await requireRole("member");
  const supabase = await createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link
        href="/signup/goal"
        className="mb-1 flex items-center gap-1 text-sm text-ink-soft hover:text-carrot"
      >
        ← 3 / 3
      </Link>
      <h1 className="text-2xl font-bold">클래스를 선택해주세요</h1>
      <p className="mt-2 text-sm text-ink-soft">
        같은 클래스끼리 랭킹보드에서 함께 경쟁해요.
      </p>

      <div className="mt-8">
        {classes && classes.length > 0 ? (
          <ClassSelectForm classes={classes} />
        ) : (
          <p className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
            아직 생성된 클래스가 없어요. 나중에 운영자가 배정해드릴게요.
          </p>
        )}
      </div>
    </div>
  );
}
