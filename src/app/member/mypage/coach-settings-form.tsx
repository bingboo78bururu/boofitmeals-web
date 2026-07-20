"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCoach } from "@/lib/actions/member";

type Coach = {
  id: string;
  name: string;
  bio: string | null;
  tags: string[];
  photo_url: string | null;
};

export function CoachSettingsForm({
  coaches,
  currentCoachId,
}: {
  coaches: Coach[];
  currentCoachId: string | null;
}) {
  const [state, action, pending] = useActionState(updateCoach, undefined);
  const [editing, setEditing] = useState(!currentCoachId);
  const currentCoach = coaches.find((c) => c.id === currentCoachId);

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

  if (!editing && currentCoach) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          {currentCoach.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentCoach.photo_url}
              alt={`${currentCoach.name} 프로필 사진`}
              className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-soft text-sm font-bold text-carrot-dark">
              {currentCoach.name.slice(0, 1)}
            </div>
          )}
          <span className="font-medium">{currentCoach.name}</span>
        </div>
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
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {coaches.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-line bg-card has-[:checked]:border-carrot"
          >
            <input
              type="radio"
              name="coach_id"
              value={c.id}
              defaultChecked={c.id === currentCoachId}
              className="sr-only"
            />
            {c.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photo_url}
                alt={`${c.name} 프로필 사진`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-cream-soft text-3xl font-bold text-carrot-dark">
                {c.name.slice(0, 1)}
              </div>
            )}
            <div className="flex flex-col gap-1.5 p-3">
              <p className="text-sm font-bold">{c.name}</p>
              {c.bio && (
                <p className="line-clamp-2 text-xs text-ink-soft">{c.bio}</p>
              )}
              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-leaf/10 px-1.5 py-0.5 text-[10px] font-medium text-leaf-dark"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
