"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SimpleFormState } from "@/lib/actions/member";

export async function assignCoach(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireRole("admin");

  const memberId = String(formData.get("member_id") ?? "");
  const coachId = String(formData.get("coach_id") ?? "");

  if (!memberId || !coachId) {
    return { error: "회원과 영양코치를 모두 선택해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_assignments")
    .upsert({ member_id: memberId, coach_id: coachId }, { onConflict: "member_id" });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/coach");
  return { success: true };
}
