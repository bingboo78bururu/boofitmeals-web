"use client";

import { useActionState, useEffect, useState } from "react";
import { submitMission } from "@/lib/actions/member";
import { compressImage } from "@/lib/compress-image";
import { LoadingOverlay } from "@/components/loading-overlay";
import type { MealType } from "@/lib/supabase/types";

const MEAL_PLACEHOLDER: Record<MealType, string> = {
  breakfast: "아침 8시 30분, 그릭요거트와 견과류...",
  lunch: "점심 12시 30분, 닭가슴살 샐러드와 현미밥 100g...",
  dinner: "저녁 7시, 두부조림과 나물 반찬...",
};

function popupMessage(aiScore: 0 | 1 | 2 | null | "unchanged"): string | null {
  if (aiScore === 2) return "탄단지 구성이 완벽해요!\n당근 2개 드려요! 🥕🥕";
  if (aiScore === 1)
    return "잘하셨어요! 당근 1개 드려요 🥕\n다음 식사에는 당근 2개 받아보세요 :)";
  if (aiScore === 0) return "제대로 된 식사 사진이 아니예요! 😅\n당근 0개입니다!";
  if (aiScore === null)
    return "사진 채점에 실패했어요. 잠시 후 다시 시도해주세요.";
  return null; // "unchanged" — 사진 없이 메모만 수정한 경우, 팝업 없음
}

function ScorePopup({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="max-w-xs rounded-2xl bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="whitespace-pre-line text-base font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-xl bg-carrot px-5 py-2 text-sm font-semibold text-white hover:bg-carrot-dark"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export function MissionForm({
  mealType,
  mealLabel,
  existingNote,
  existingPhotoUrl,
  existingAiScore,
  existingAiScoreReason,
  existingCoachScore,
}: {
  mealType: MealType;
  mealLabel: string;
  existingNote: string | null;
  existingPhotoUrl: string | null;
  existingAiScore: number | null;
  existingAiScoreReason: string | null;
  existingCoachScore: number | null;
}) {
  const [state, action, pending] = useActionState(submitMission, undefined);
  const [preview, setPreview] = useState<string | null>(existingPhotoUrl);
  const [editing, setEditing] = useState(!existingNote);
  const [popup, setPopup] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (state && "success" in state) {
      setEditing(false);
      const msg = popupMessage(state.aiScore);
      if (msg) setPopup(msg);
    }
  }, [state]);

  if (!editing && existingNote) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{mealLabel}</h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-ink-soft hover:text-carrot"
          >
            수정하기
          </button>
        </div>

        <div className="flex gap-3">
          {existingPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={existingPhotoUrl}
              alt={`${mealLabel} 사진`}
              className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
            />
          )}
          <p className="whitespace-pre-wrap text-sm text-ink-soft">
            {existingNote}
          </p>
        </div>

        {existingAiScore !== null && (
          <p className="rounded-lg bg-cream-soft px-3 py-2 text-xs text-ink-soft">
            🤖 AI 채점 {existingAiScore}점
            {existingAiScoreReason ? ` · ${existingAiScoreReason}` : ""}
          </p>
        )}
        {existingCoachScore !== null && (
          <p className="rounded-lg bg-leaf/10 px-3 py-2 text-xs text-leaf-dark">
            🥕 코치 조정 점수 {existingCoachScore}점
          </p>
        )}

        {popup && <ScorePopup message={popup} onClose={() => setPopup(null)} />}
      </div>
    );
  }

  return (
    <>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="meal_type" value={mealType} />
        <h3 className="text-sm font-bold">{mealLabel}</h3>

        <textarea
          name="note"
          required
          rows={3}
          defaultValue={existingNote ?? ""}
          placeholder={MEAL_PLACEHOLDER[mealType]}
          className="rounded-xl border border-line bg-background px-4 py-3 outline-none focus:border-carrot"
        />

        <div className="flex flex-wrap items-center gap-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={`${mealLabel} 사진`}
              className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover"
            />
          )}
          <label className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-sm">
            <span className="font-medium">식단 사진 (선택)</span>
            <input
              type="file"
              name="photo"
              accept="image/png,image/jpeg"
              onChange={async (e) => {
                const input = e.target;
                const file = input.files?.[0];
                if (!file) {
                  setPreview(existingPhotoUrl);
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

        {state && "error" in state && (
          <p className="text-sm text-carrot-dark">{state.error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || compressing}
            className="self-start whitespace-nowrap rounded-xl bg-carrot px-5 py-2.5 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
          >
            {pending
              ? "기록 중..."
              : existingNote
                ? `${mealLabel} 수정하기`
                : `🥕 ${mealLabel} 인증하고 당근 받기`}
          </button>
          {existingNote && (
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

      {popup && <ScorePopup message={popup} onClose={() => setPopup(null)} />}
      <LoadingOverlay show={pending} />
    </>
  );
}
