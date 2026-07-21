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

export async function createClass(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireRole("admin");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "클래스 이름을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({ name });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/signup/class");
  return { success: true };
}

export async function deleteClass(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireRole("admin");

  const classId = String(formData.get("class_id") ?? "");
  if (!classId) return { error: "삭제할 클래스가 올바르지 않아요." };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/signup/class");
  revalidatePath("/member/feed");
  return { success: true };
}

export async function reassignMemberClass(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireRole("admin");

  const memberId = String(formData.get("member_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");
  if (!memberId || !classId) {
    return { error: "회원과 클래스를 모두 선택해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ class_id: classId })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/member/feed");
  revalidatePath("/member/mypage");
  return { success: true };
}
