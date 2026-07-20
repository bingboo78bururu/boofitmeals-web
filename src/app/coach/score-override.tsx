"use client";

import { useActionState } from "react";
import { overrideScore } from "@/lib/actions/coach";

const OPTIONS = [0, 1, 2] as const;

export function ScoreOverride({
  missionId,
  aiScore,
  coachScore,
}: {
  missionId: string;
  aiScore: number | null;
  coachScore: number | null;
}) {
  const [state, action, pending] = useActionState(overrideScore, undefined);

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="mission_id" value={missionId} />
      <span className="text-xs font-medium text-ink-soft">코치 점수 조정</span>
      {OPTIONS.map((value) => (
        <button
          key={value}
          type="submit"
          name="score"
          value={value}
          disabled={pending}
          className={`h-7 w-7 rounded-full text-xs font-bold transition disabled:opacity-60 ${
            coachScore === value
              ? "bg-leaf text-white"
              : coachScore === null && aiScore === value
                ? "border border-leaf text-leaf-dark"
                : "border border-line text-ink-soft hover:border-leaf"
          }`}
        >
          {value}
        </button>
      ))}
      {coachScore !== null && (
        <button
          type="submit"
          name="score"
          value=""
          disabled={pending}
          className="text-xs text-ink-soft underline hover:text-leaf-dark"
        >
          AI 점수로 되돌리기
        </button>
      )}
      {state && "error" in state && (
        <span className="text-xs text-carrot-dark">{state.error}</span>
      )}
    </form>
  );
}
