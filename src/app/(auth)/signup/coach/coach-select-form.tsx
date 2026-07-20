"use client";

import { useActionState } from "react";
import { chooseCoach } from "@/lib/actions/onboarding";

export function CoachSelectForm({
  coaches,
}: {
  coaches: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(chooseCoach, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {coaches.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm has-[:checked]:border-carrot has-[:checked]:bg-carrot-light/20"
          >
            <input type="radio" name="coach_id" value={c.id} required />
            <span className="font-medium">{c.name}</span>
          </label>
        ))}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-carrot px-4 py-2.5 font-semibold text-white transition hover:bg-carrot-dark disabled:opacity-60"
      >
        {pending ? "저장 중..." : "다음"}
      </button>
    </form>
  );
}
