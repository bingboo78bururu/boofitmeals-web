"use client";

import { useActionState } from "react";
import { deleteClass } from "@/lib/actions/admin";
import { LoadingOverlay } from "@/components/loading-overlay";

export function DeleteClassButton({
  classId,
  className,
  memberCount,
}: {
  classId: string;
  className: string;
  memberCount: number;
}) {
  const [state, action, pending] = useActionState(deleteClass, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const msg =
          memberCount > 0
            ? `'${className}' 클래스를 삭제할까요? 배정된 ${memberCount}명은 미배정 상태가 돼요.`
            : `'${className}' 클래스를 삭제할까요?`;
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="class_id" value={classId} />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 text-xs font-medium text-ink-soft hover:text-carrot-dark disabled:opacity-60"
      >
        삭제
      </button>
      {state && "error" in state && (
        <p className="mt-1 text-xs text-carrot-dark">{state.error}</p>
      )}
      <LoadingOverlay show={pending} />
    </form>
  );
}
