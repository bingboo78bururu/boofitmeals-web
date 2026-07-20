"use client";

import { useActionState, useEffect, useState } from "react";
import { saveGoal } from "@/lib/actions/member";

type Goal = {
  current_body_fat: number | null;
  target_body_fat: number | null;
  target_date: string | null;
};

export function GoalForm({ initial }: { initial: Goal | null }) {
  const [state, action, pending] = useActionState(saveGoal, undefined);
  const [editing, setEditing] = useState(!initial);

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing && initial) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-ink-soft">현재 체지방률</p>
            <p className="font-bold">{initial.current_body_fat}%</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">목표 체지방률</p>
            <p className="font-bold">{initial.target_body_fat}%</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">목표일</p>
            <p className="font-bold">{initial.target_date}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-carrot sm:self-auto"
        >
          수정
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-3"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="current_body_fat" className="text-sm font-medium">
          현재 체지방률 (%)
        </label>
        <input
          id="current_body_fat"
          name="current_body_fat"
          type="number"
          step="0.1"
          required
          defaultValue={initial?.current_body_fat ?? undefined}
          className="rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="target_body_fat" className="text-sm font-medium">
          목표 체지방률 (%)
        </label>
        <input
          id="target_body_fat"
          name="target_body_fat"
          type="number"
          step="0.1"
          required
          defaultValue={initial?.target_body_fat ?? undefined}
          className="rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="target_date" className="text-sm font-medium">
          목표일
        </label>
        <input
          id="target_date"
          name="target_date"
          type="date"
          required
          defaultValue={initial?.target_date ?? undefined}
          className="rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>

      {state && "error" in state && (
        <p className="sm:col-span-3 text-sm text-carrot-dark">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 sm:col-span-3">
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
