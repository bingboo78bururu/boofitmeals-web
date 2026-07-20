"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SimpleFormState } from "@/lib/actions/member";
import type { GoalUnit } from "@/lib/supabase/types";

export async function chooseGoalType(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const goalType = String(formData.get("goal_type") ?? "");
  if (goalType === "loss" || goalType === "gain") {
    const unit: GoalUnit = goalType === "gain" ? "muscle_mass_kg" : "body_fat_pct";
    const supabase = await createClient();
    const { error } = await supabase
      .from("goals")
      .upsert({ member_id: profile.id, unit }, { onConflict: "member_id" });

    if (error) return { error: error.message };
    revalidatePath("/member");
    revalidatePath("/member/mypage");
  }

  redirect("/signup/class");
}

export async function chooseClass(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const classId = String(formData.get("class_id") ?? "");
  if (classId) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ class_id: classId })
      .eq("id", profile.id);

    if (error) return { error: error.message };
    revalidatePath("/member/feed");
  }

  redirect("/member");
}
