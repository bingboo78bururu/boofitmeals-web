"use client";

import { useActionState, useEffect, useState } from "react";
import { submitFeedback } from "@/lib/actions/coach";

export function FeedbackForm({
  missionId,
  existingFeedback,
}: {
  missionId: string;
  existingFeedback: string | null;
}) {
  const [state, action, pending] = useActionState(submitFeedback, undefined);
  const [editing, setEditing] = useState(!existingFeedback);

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing && existingFeedback) {
    return (
      <div className="mt-3 rounded-xl bg-leaf/10 px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-leaf-dark">피드백 완료</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-ink-soft hover:text-leaf-dark"
          >
            수정하기
          </button>
        </div>
        <p className="mt-1">{existingFeedback}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="mission_id" value={missionId} />
      <textarea
        name="content"
        required
        rows={2}
        defaultValue={existingFeedback ?? ""}
        placeholder="탄수화물 비중이 조금 낮아요. 다음 끼니엔 현미밥을 추가해보세요."
        className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-leaf"
      />
      {state && "error" in state && (
        <p className="text-xs text-carrot-dark">{state.error}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-leaf px-4 py-1.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60"
        >
          {pending ? "전송 중..." : "피드백 남기기"}
        </button>
        {existingFeedback && (
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
