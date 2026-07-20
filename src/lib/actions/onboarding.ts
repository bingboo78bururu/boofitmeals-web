"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SimpleFormState } from "@/lib/actions/member";

export async function chooseCoach(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("member");

  const coachId = String(formData.get("coach_id") ?? "");
  if (coachId) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("coach_assignments")
      .upsert({ member_id: profile.id, coach_id: coachId }, { onConflict: "member_id" });

    if (error) return { error: error.message };
    revalidatePath("/coach");
    revalidatePath("/admin");
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
