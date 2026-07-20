"use client";

import { useActionState } from "react";
import { submitFeedback } from "@/lib/actions/coach";

export function FeedbackForm({ missionId }: { missionId: string }) {
  const [state, action, pending] = useActionState(submitFeedback, undefined);

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="mission_id" value={missionId} />
      <textarea
        name="content"
        required
        rows={2}
        placeholder="탄수화물 비중이 조금 낮아요. 다음 끼니엔 현미밥을 추가해보세요."
        className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-leaf"
      />
      {state && "error" in state && (
        <p className="text-xs text-carrot-dark">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-leaf px-4 py-1.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60"
      >
        {pending ? "전송 중..." : "피드백 남기기"}
      </button>
    </form>
  );
}
