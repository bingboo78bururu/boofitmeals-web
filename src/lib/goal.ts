import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GoalUnit } from "@/lib/supabase/types";

export const BODY_LOG_FIELD_BY_UNIT: Record<
  GoalUnit,
  "weight_kg" | "body_fat_pct" | "muscle_mass_kg"
> = {
  body_fat_pct: "body_fat_pct",
  weight_kg: "weight_kg",
  muscle_mass_kg: "muscle_mass_kg",
};

// 목표의 "현재" 값은 마이페이지에서 처음 설정한 스냅샷보다,
// 홈에서 기록한 가장 최근 체중/체지방률/근육량 기록을 우선한다.
export async function latestBodyLogValue(
  memberId: string,
  unit: GoalUnit
): Promise<number | null> {
  const field = BODY_LOG_FIELD_BY_UNIT[unit];
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_logs")
    .select(field)
    .eq("member_id", memberId)
    .not(field, "is", null)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const value = (data as unknown as Record<string, number | null>)[field];
  return value === null || value === undefined ? null : Number(value);
}
