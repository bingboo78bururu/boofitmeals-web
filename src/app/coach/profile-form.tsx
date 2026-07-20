"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCoachProfile } from "@/lib/actions/coach";

export function ProfileForm({
  bio,
  tags,
}: {
  bio: string | null;
  tags: string[];
}) {
  const [state, action, pending] = useActionState(updateCoachProfile, undefined);
  const [editing, setEditing] = useState(!bio && tags.length === 0);

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-ink-soft">
            {bio || "아직 소개글이 없어요."}
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs font-medium text-ink-soft hover:text-carrot"
          >
            수정하기
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-leaf/10 px-2.5 py-0.5 text-xs font-medium text-leaf-dark"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          한줄 소개
        </label>
        <input
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          placeholder="3년차 다이어트 전문 코치입니다"
          className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tags" className="text-sm font-medium">
          해시태그 (쉼표로 구분)
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={tags.join(", ")}
          placeholder="여성다이어트전문, 벌크업"
          className="w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-carrot"
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-carrot-dark">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-carrot px-4 py-2.5 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        {(bio || tags.length > 0) && (
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
