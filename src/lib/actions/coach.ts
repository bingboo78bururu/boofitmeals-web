"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SimpleFormState } from "@/lib/actions/member";

export async function submitFeedback(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("coach");

  const missionId = String(formData.get("mission_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!missionId || !content) {
    return { error: "피드백 내용을 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .insert({ mission_id: missionId, coach_id: profile.id, content });

  if (error) return { error: error.message };

  revalidatePath("/coach");
  revalidatePath("/member");
  return { success: true };
}
