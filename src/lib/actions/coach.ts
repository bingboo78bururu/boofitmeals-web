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
    .upsert(
      { mission_id: missionId, coach_id: profile.id, content },
      { onConflict: "mission_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/coach");
  revalidatePath("/member");
  return { success: true };
}

export async function overrideScore(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  await requireRole("coach");

  const missionId = String(formData.get("mission_id") ?? "");
  if (!missionId) return { error: "잘못된 요청이에요." };

  const scoreRaw = String(formData.get("score") ?? "");
  const score = scoreRaw === "" ? null : Number(scoreRaw);
  if (score !== null && ![0, 1, 2].includes(score)) {
    return { error: "점수는 0~2 사이여야 해요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("missions")
    .update({ coach_score: score })
    .eq("id", missionId);

  if (error) return { error: error.message };

  revalidatePath("/coach");
  revalidatePath("/member");
  revalidatePath("/member/calendar");
  revalidatePath("/member/feed");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateCoachProfile(
  _prevState: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  const profile = await requireRole("coach");

  const bio = String(formData.get("bio") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(/[,、，#]/)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 4 * 1024 * 1024) {
      return { error: "사진은 4MB 이하로 올려주세요." };
    }
    const ext = photo.type === "image/png" ? "png" : "jpg";
    const path = `${profile.id}/photo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, await photo.arrayBuffer(), {
        upsert: true,
        contentType: photo.type,
      });

    if (uploadError) return { error: uploadError.message };

    photoUrl = `${supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: bio || null,
      tags,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/coach");
  revalidatePath("/signup/coach");
  return { success: true };
}
