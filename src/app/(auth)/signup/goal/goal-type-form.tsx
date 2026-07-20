"use client";

import { useActionState } from "react";
import { chooseGoalType } from "@/lib/actions/onboarding";

const OPTIONS = [
  {
    value: "loss",
    label: "체중/체지방률 감량",
    desc: "식단으로 체중이나 체지방을 줄이고 싶어요",
  },
  {
    value: "gain",
    label: "근육량 증가",
    desc: "식단으로 근육량을 키우고 싶어요",
  },
] as const;

export function GoalTypeForm() {
  const [state, action, pending] = useActionState(chooseGoalType, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {OPTIONS.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer flex-col gap-1 rounded-2xl border-2 border-line bg-card px-5 py-4 has-[:checked]:border-carrot has-[:checked]:bg-carrot-light/20"
        >
          <div className="flex items-center gap-3">
            <input type="radio" name="goal_type" value={o.value} required />
            <span className="font-bold">{o.label}</span>
          </div>
          <span className="pl-7 text-xs text-ink-soft">{o.desc}</span>
        </label>
      ))}

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
