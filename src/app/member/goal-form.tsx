"use client";

import { useActionState, useEffect, useState } from "react";
import { saveGoal } from "@/lib/actions/member";
import { goalUnitLabel, goalUnitSuffix } from "@/lib/roles";
import type { GoalUnit } from "@/lib/supabase/types";

type Goal = {
  unit: GoalUnit;
  current_value: number | null;
  target_value: number | null;
  target_date: string | null;
};

const UNITS: GoalUnit[] = ["body_fat_pct", "weight_kg", "muscle_mass_kg"];

export function GoalForm({ initial }: { initial: Goal | null }) {
  const [state, action, pending] = useActionState(saveGoal, undefined);
  const [editing, setEditing] = useState(!initial);
  const [unit, setUnit] = useState<GoalUnit>(initial?.unit ?? "body_fat_pct");

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing && initial) {
    const suffix = goalUnitSuffix[initial.unit];
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-ink-soft">현재 {goalUnitLabel[initial.unit]}</p>
            <p className="font-bold">
              {initial.current_value}
              {suffix}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">목표 {goalUnitLabel[initial.unit]}</p>
            <p className="font-bold">
              {initial.target_value}
              {suffix}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">목표일</p>
            <p className="font-bold">{initial.target_date}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-end text-xs font-medium text-ink-soft hover:text-carrot"
        >
          수정하기
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">목표 단위</span>
        <div className="flex gap-2">
          {UNITS.map((u) => (
            <label
              key={u}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm has-[:checked]:border-carrot has-[:checked]:bg-carrot-light/20"
            >
              <input
                type="radio"
                name="unit"
                value={u}
                checked={unit === u}
                onChange={() => setUnit(u)}
              />
              {goalUnitLabel[u]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="current_value" className="text-sm font-medium">
            현재 {goalUnitLabel[unit]} ({goalUnitSuffix[unit]})
          </label>
          <input
            id="current_value"
            name="current_value"
            type="number"
            step="0.1"
            required
            defaultValue={initial?.current_value ?? undefined}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="target_value" className="text-sm font-medium">
            목표 {goalUnitLabel[unit]} ({goalUnitSuffix[unit]})
          </label>
          <input
            id="target_value"
            name="target_value"
            type="number"
            step="0.1"
            required
            defaultValue={initial?.target_value ?? undefined}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="target_date" className="text-sm font-medium">
            목표일
          </label>
          <input
            id="target_date"
            name="target_date"
            type="date"
            required
            defaultValue={initial?.target_date ?? undefined}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
          />
        </div>
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-carrot px-4 py-2.5 font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          {pending ? "저장 중..." : "목표 저장"}
        </button>
        {initial && (
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
