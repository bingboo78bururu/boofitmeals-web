"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCoachProfile } from "@/lib/actions/coach";
import { compressImage } from "@/lib/compress-image";
import { LoadingOverlay } from "@/components/loading-overlay";

export function ProfileForm({
  bio,
  tags,
  photoUrl,
}: {
  bio: string | null;
  tags: string[];
  photoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateCoachProfile, undefined);
  const [editing, setEditing] = useState(!bio && tags.length === 0 && !photoUrl);
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="프로필 사진"
                className="h-14 w-14 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cream-soft text-lg font-bold text-carrot-dark">
                {"?"}
              </div>
            )}
            <p className="text-sm text-ink-soft">
              {bio || "아직 소개글이 없어요."}
            </p>
          </div>
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
      <div className="flex items-center gap-4">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="프로필 사진"
            className="h-16 w-16 shrink-0 rounded-full border border-line object-cover"
          />
        )}
        <label className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-sm">
          <span className="font-medium">프로필 사진</span>
          <input
            type="file"
            name="photo"
            accept="image/png,image/jpeg"
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              if (!file) {
                setPreview(photoUrl);
                return;
              }
              setPreview(URL.createObjectURL(file));
              setCompressing(true);
              const compressed = await compressImage(file);
              if (compressed !== file) {
                const dt = new DataTransfer();
                dt.items.add(compressed);
                input.files = dt.files;
                setPreview(URL.createObjectURL(compressed));
              }
              setCompressing(false);
            }}
            className="w-full max-w-full truncate text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-cream-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-carrot-dark"
          />
          {compressing && (
            <span className="text-[11px] text-ink-soft">사진 최적화 중...</span>
          )}
        </label>
      </div>

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
          disabled={pending || compressing}
          className="rounded-xl bg-carrot px-4 py-2.5 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        {(bio || tags.length > 0 || photoUrl) && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-ink-soft hover:text-ink"
          >
            취소
          </button>
        )}
      </div>
      <LoadingOverlay show={pending} />
    </form>
  );
}
