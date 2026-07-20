"use client";

import { useActionState, useEffect } from "react";
import { logBody } from "@/lib/actions/member";

type BodyLog = {
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
};

export function BodyLogForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: BodyLog | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(logBody, undefined);

  useEffect(() => {
    if (state && "success" in state) onSaved?.();
  }, [state, onSaved]);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="weight_kg" className="text-sm font-medium">
          체중 (kg)
        </label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          step="0.1"
          defaultValue={existing?.weight_kg ?? undefined}
          className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="body_fat_pct" className="text-sm font-medium">
          체지방률 (%)
        </label>
        <input
          id="body_fat_pct"
          name="body_fat_pct"
          type="number"
          step="0.1"
          defaultValue={existing?.body_fat_pct ?? undefined}
          className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="muscle_mass_kg" className="text-sm font-medium">
          근육량 (kg)
        </label>
        <input
          id="muscle_mass_kg"
          name="muscle_mass_kg"
          type="number"
          step="0.1"
          defaultValue={existing?.muscle_mass_kg ?? undefined}
          className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark sm:basis-full">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-carrot px-4 py-2.5 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          {pending ? "저장 중..." : "오늘 기록 저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-soft hover:text-ink"
        >
          취소
        </button>
      </div>
    </form>
  );
}
