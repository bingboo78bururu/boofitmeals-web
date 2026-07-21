"use client";

import { useActionState } from "react";
import { reassignMemberClass } from "@/lib/actions/admin";
import { LoadingOverlay } from "@/components/loading-overlay";

export function ReassignClassForm({
  members,
  classes,
}: {
  members: { id: string; name: string; className: string | null }[];
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    reassignMemberClass,
    undefined
  );

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reassign_member_id" className="text-sm font-medium">
          회원
        </label>
        <select
          id="reassign_member_id"
          name="member_id"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">선택</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.className ? ` (현재: ${m.className})` : " (미배정)"}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reassign_class_id" className="text-sm font-medium">
          변경할 클래스
        </label>
        <select
          id="reassign_class_id"
          name="class_id"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">선택</option>
          {classes.map((c) => (
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
        {pending ? "변경 중..." : "클래스 변경"}
      </button>
      {state && "error" in state && (
        <p className="w-full text-xs text-carrot-dark">{state.error}</p>
      )}
      <LoadingOverlay show={pending} />
    </form>
  );
}
