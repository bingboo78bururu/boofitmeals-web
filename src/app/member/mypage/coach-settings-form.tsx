"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCoach } from "@/lib/actions/member";

export function CoachSettingsForm({
  coaches,
  currentCoachId,
}: {
  coaches: { id: string; name: string }[];
  currentCoachId: string | null;
}) {
  const [state, action, pending] = useActionState(updateCoach, undefined);
  const [editing, setEditing] = useState(!currentCoachId);
  const currentCoachName = coaches.find((c) => c.id === currentCoachId)?.name;

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (coaches.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
        아직 등록된 영양코치가 없어요.
      </p>
    );
  }

  if (!editing && currentCoachName) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
        <span className="font-medium">{currentCoachName}</span>
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
        {coaches.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm has-[:checked]:border-carrot has-[:checked]:bg-carrot-light/20"
          >
            <input
              type="radio"
              name="coach_id"
              value={c.id}
              defaultChecked={c.id === currentCoachId}
            />
            <span className="font-medium">{c.name}</span>
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
        {currentCoachId && (
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
