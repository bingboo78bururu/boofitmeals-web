"use client";

import { useActionState } from "react";
import { assignCoach } from "@/lib/actions/admin";
import { LoadingOverlay } from "@/components/loading-overlay";

export function AssignCoachForm({
  members,
  coaches,
}: {
  members: { id: string; name: string; coachName: string | null }[];
  coaches: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(assignCoach, undefined);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="member_id" className="text-sm font-medium">
          회원
        </label>
        <select
          id="member_id"
          name="member_id"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">선택</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.coachName ? ` (현재: ${m.coachName})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="coach_id" className="text-sm font-medium">
          영양코치
        </label>
        <select
          id="coach_id"
          name="coach_id"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">선택</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-carrot px-4 py-2 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
      >
        {pending ? "배정 중..." : "배정하기"}
      </button>
      {state && "error" in state && (
        <p className="w-full text-xs text-carrot-dark">{state.error}</p>
      )}
      <LoadingOverlay show={pending} />
    </form>
  );
}
