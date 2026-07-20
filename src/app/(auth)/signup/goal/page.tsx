import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { GoalTypeForm } from "./goal-type-form";

export default async function SignupGoalPage() {
  await requireRole("member");

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link
        href="/signup"
        className="mb-1 flex items-center gap-1 text-sm text-ink-soft hover:text-carrot"
      >
        ← 2 / 3
      </Link>
      <h1 className="text-2xl font-bold">더 중요한 목표를 골라주세요</h1>
      <p className="mt-2 text-sm text-ink-soft">
        목표에 맞는 식단 관리를 해드려요.
      </p>

      <div className="mt-8">
        <GoalTypeForm />
      </div>
    </div>
  );
}
