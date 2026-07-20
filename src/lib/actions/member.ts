"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { scoreMissionPhoto } from "@/lib/ai-score";
import { todayString } from "@/lib/dates";
import type { MealType } from "@/lib/supabase/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export type SimpleFormState = { error: string } | { success: true } | undefined;
export type MissionFormState =
  | { error: string }
  | { success: true; aiScore: 0 | 1 | 2 | null | "unchanged" }
  | undefined;

export async function saveGoal(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const currentBodyFat = Number(formData.get("current_body_fat"));
  const targetBodyFat = Number(formData.get("target_body_fat"));
  const targetDate = String(formData.get("target_date") ?? "");

  if (!currentBodyFat || !targetBodyFat || !targetDate) {
    return { error: "체지방률과 목표일을 모두 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("goals").upsert(
    {
      member_id: profile.id,
      current_body_fat: currentBodyFat,
      target_body_fat: targetBodyFat,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/member");
  return { success: true };
}

export async function submitMission(
  _prevState: MissionFormState,
  formData: FormData
): Promise<MissionFormState> {
  const profile = await requireRole("member");

  const mealType = String(formData.get("meal_type") ?? "") as MealType;
  if (!MEAL_TYPES.includes(mealType)) {
    return { error: "끼니 종류가 올바르지 않아요." };
  }

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "오늘 식단을 간단히 기록해주세요." };

  const today = todayString();
  const supabase = await createClient();

  let photoUrl: string | undefined;
  // undefined = 이번 제출에 새 사진 없음(기존 점수 유지) / null = 채점 실패 / 0|1|2 = 채점 성공
  let aiScore: 0 | 1 | 2 | null | undefined;
  let aiScoreReason: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return { error: "사진은 5MB 이하로 올려주세요." };
    }
    const ext = photo.type === "image/png" ? "png" : "jpg";
    const path = `${profile.id}/${today}-${mealType}.${ext}`;
    const photoBytes = await photo.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("mission-photos")
      .upload(path, photoBytes, { upsert: true, contentType: photo.type });

    if (uploadError) return { error: uploadError.message };

    photoUrl = `${supabase.storage.from("mission-photos").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;

    const aiResult = await scoreMissionPhoto(photoBytes, photo.type);
    aiScore = aiResult ? aiResult.score : null;
    aiScoreReason = aiResult ? aiResult.reason : null;
  }

  const { error } = await supabase.from("missions").upsert(
    {
      member_id: profile.id,
      mission_date: today,
      meal_type: mealType,
      note,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
      ...(aiScore !== undefined
        ? { ai_score: aiScore, ai_score_reason: aiScoreReason }
        : {}),
    },
    { onConflict: "member_id,mission_date,meal_type" }
  );

  if (error) return { error: error.message };

  revalidatePath("/member");
  revalidatePath("/member/calendar");
  revalidatePath("/member/ranking");
  revalidatePath("/coach");
  revalidatePath("/admin");
  return { success: true, aiScore: aiScore === undefined ? "unchanged" : aiScore };
}
