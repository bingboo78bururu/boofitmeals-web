"use client";

import { useActionState } from "react";
import { chooseCoach } from "@/lib/actions/onboarding";

type Coach = { id: string; name: string; bio: string | null; tags: string[] };

export function CoachSelectForm({ coaches }: { coaches: Coach[] }) {
  const [state, action, pending] = useActionState(chooseCoach, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {coaches.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-line bg-card has-[:checked]:border-carrot"
          >
            <input type="radio" name="coach_id" value={c.id} required className="sr-only" />
            <div className="flex aspect-square items-center justify-center bg-cream-soft text-3xl font-bold text-carrot-dark">
              {c.name.slice(0, 1)}
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              <p className="text-sm font-bold">{c.name}</p>
              {c.bio && (
                <p className="line-clamp-2 text-xs text-ink-soft">{c.bio}</p>
              )}
              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-leaf/10 px-1.5 py-0.5 text-[10px] font-medium text-leaf-dark"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-carrot px-4 py-2.5 font-semibold text-white transition hover:bg-carrot-dark disabled:opacity-60"
      >
        {pending ? "저장 중..." : "다음"}
      </button>
    </form>
  );
}
