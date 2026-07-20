"use client";

import { useActionState, useEffect, useState } from "react";
import { updateGoalType } from "@/lib/actions/member";
import type { GoalUnit } from "@/lib/supabase/types";

type GoalType = "loss" | "gain";

const OPTIONS: { value: GoalType; label: string }[] = [
  { value: "loss", label: "체중/체지방률 감소" },
  { value: "gain", label: "근육량 증가" },
];

function goalTypeFromUnit(unit: GoalUnit | null): GoalType | null {
  if (!unit) return null;
  return unit === "muscle_mass_kg" ? "gain" : "loss";
}

export function GoalTypeForm({ unit }: { unit: GoalUnit | null }) {
  const [state, action, pending] = useActionState(updateGoalType, undefined);
  const currentType = goalTypeFromUnit(unit);
  const [editing, setEditing] = useState(!currentType);

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing && currentType) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
        <span className="font-medium">
          {OPTIONS.find((o) => o.value === currentType)?.label}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-ink-soft hover:text-carrot"
        >
          수정하기
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm has-[:checked]:border-carrot has-[:checked]:bg-carrot-light/20"
          >
            <input
              type="radio"
              name="goal_type"
              value={o.value}
              defaultChecked={o.value === currentType}
              required
            />
            <span className="font-medium">{o.label}</span>
          </label>
        ))}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-xl bg-carrot px-5 py-2 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        {currentType && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-ink-soft hover:text-ink"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
