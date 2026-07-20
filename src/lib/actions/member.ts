"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { scoreMissionPhoto } from "@/lib/ai-score";
import { todayString } from "@/lib/dates";
import { BODY_LOG_FIELD_BY_UNIT } from "@/lib/goal";
import type { GoalUnit, MealType } from "@/lib/supabase/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const GOAL_UNITS: GoalUnit[] = ["body_fat_pct", "weight_kg", "muscle_mass_kg"];

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

  const unit = String(formData.get("unit") ?? "") as GoalUnit;
  if (!GOAL_UNITS.includes(unit)) {
    return { error: "목표 단위가 올바르지 않아요." };
  }

  const currentValue = Number(formData.get("current_value"));
  const targetValue = Number(formData.get("target_value"));
  const targetDate = String(formData.get("target_date") ?? "");

  if (!currentValue || !targetValue || !targetDate) {
    return { error: "현재/목표 수치와 목표일을 모두 입력해주세요." };
  }
  if (currentValue < 0 || targetValue < 0) {
    return { error: "수치는 0 이상이어야 해요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("goals").upsert(
    {
      member_id: profile.id,
      unit,
      current_value: currentValue,
      target_value: targetValue,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id" }
  );

  if (error) {
    console.error("[saveGoal] goals upsert failed", error);
    return { error: error.message };
  }

  // 목표의 "현재" 수치도 성장 그래프에 오늘 기록으로 남긴다.
  const field = BODY_LOG_FIELD_BY_UNIT[unit];
  const logPayload: {
    member_id: string;
    log_date: string;
    weight_kg?: number;
    body_fat_pct?: number;
    muscle_mass_kg?: number;
  } = { member_id: profile.id, log_date: todayString() };
  logPayload[field] = currentValue;

  const { error: logError } = await supabase
    .from("body_logs")
    .upsert(logPayload, { onConflict: "member_id,log_date" });
  if (logError) {
    console.error("[saveGoal] body_logs upsert failed", logError);
    return { error: logError.message };
  }

  revalidatePath("/member");
  revalidatePath("/member/mypage");
  revalidatePath("/member/growth");
  return { success: true };
}

export async function logBody(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const bodyFatRaw = String(formData.get("body_fat_pct") ?? "").trim();
  const muscleMassRaw = String(formData.get("muscle_mass_kg") ?? "").trim();
  const weightKg = weightRaw ? Number(weightRaw) : null;
  const bodyFatPct = bodyFatRaw ? Number(bodyFatRaw) : null;
  const muscleMassKg = muscleMassRaw ? Number(muscleMassRaw) : null;

  if (weightKg === null && bodyFatPct === null && muscleMassKg === null) {
    return { error: "체중, 체지방률, 근육량 중 하나는 입력해주세요." };
  }
  if ((weightKg ?? 0) < 0 || (bodyFatPct ?? 0) < 0 || (muscleMassKg ?? 0) < 0) {
    return { error: "수치는 0 이상이어야 해요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("body_logs").upsert(
    {
      member_id: profile.id,
      log_date: todayString(),
      weight_kg: weightKg,
      body_fat_pct: bodyFatPct,
      muscle_mass_kg: muscleMassKg,
    },
    { onConflict: "member_id,log_date" }
  );

  if (error) {
    console.error("[logBody] upsert failed", error);
    return { error: error.message };
  }

  revalidatePath("/member");
  revalidatePath("/member/growth");
  revalidatePath("/member/mypage");
  return { success: true };
}

export async function updateGoalType(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const goalType = String(formData.get("goal_type") ?? "");
  if (goalType !== "loss" && goalType !== "gain") {
    return { error: "식단 목적을 선택해주세요." };
  }
  const unit: GoalUnit = goalType === "gain" ? "muscle_mass_kg" : "body_fat_pct";

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("goals")
    .select("unit")
    .eq("member_id", profile.id)
    .maybeSingle();

  const payload: {
    member_id: string;
    unit: GoalUnit;
    current_value?: null;
    target_value?: null;
    target_date?: null;
  } = { member_id: profile.id, unit };

  // 단위가 실제로 바뀌면 이전 단위 기준으로 입력했던 하위 목표 수치는 의미가
  // 없어지므로 같이 초기화한다.
  if (existing && existing.unit !== unit) {
    payload.current_value = null;
    payload.target_value = null;
    payload.target_date = null;
  }

  const { error } = await supabase
    .from("goals")
    .upsert(payload, { onConflict: "member_id" });

  if (error) return { error: error.message };

  revalidatePath("/member");
  revalidatePath("/member/mypage");
  revalidatePath("/member/growth");
  return { success: true };
}

export async function updateClass(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const classId = String(formData.get("class_id") ?? "");
  if (!classId) return { error: "클래스를 선택해주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ class_id: classId })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/member/mypage");
  revalidatePath("/member/feed");
  revalidatePath("/admin");
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
    if (photo.size > 4 * 1024 * 1024) {
      return { error: "사진은 4MB 이하로 올려주세요." };
    }
    const ext = photo.type === "image/png" ? "png" : "jpg";
    const path = `${profile.id}/${today}-${mealType}.${ext}`;
    const photoBytes = await photo.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("mission-photos")
      .upload(path, photoBytes, { upsert: true, contentType: photo.type });

    if (uploadError) return { error: uploadError.message };

    photoUrl = `${supabase.storage.from("mission-photos").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;

    const { data: goalRow } = await supabase
      .from("goals")
      .select("unit")
      .eq("member_id", profile.id)
      .maybeSingle();
    const goalType = goalRow ? (goalRow.unit === "muscle_mass_kg" ? "gain" : "loss") : null;

    const aiResult = await scoreMissionPhoto(photoBytes, photo.type, goalType);
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
  revalidatePath("/member/feed");
  revalidatePath("/coach");
  revalidatePath("/admin");
  return { success: true, aiScore: aiScore === undefined ? "unchanged" : aiScore };
}
