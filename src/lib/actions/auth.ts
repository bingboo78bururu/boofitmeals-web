"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import type { UserRole } from "@/lib/supabase/types";

export type AuthFormState = { error: string } | undefined;
export type PasswordResetFormState = { error: string } | { success: true } | undefined;

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = host?.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member") as UserRole;

  if (!name || !email || !password) {
    return { error: "닉네임, 이메일, 비밀번호를 모두 입력해주세요." };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요." };
  }

  const supabase = await createClient();

  const { data: nameTaken } = await supabase.rpc("name_taken", {
    check_name: name,
  });
  if (nameTaken) {
    return { error: "이미 사용 중인 닉네임이에요." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "이미 등록된 회원입니다." };
    }
    if (error.message.toLowerCase().includes("database error")) {
      return { error: "이미 사용 중인 닉네임이에요." };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return {
      error:
        "가입은 완료됐지만 이메일 인증이 필요해요. Supabase Authentication 설정에서 'Confirm email'을 꺼두면 바로 로그인돼요.",
    };
  }

  revalidatePath("/", "layout");
  redirect(role === "member" ? "/signup/goal" : (roleHome[role] ?? "/member"));
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(roleHome[profile?.role ?? "member"]);
}

export async function requestPasswordReset(
  _prevState: PasswordResetFormState,
  formData: FormData
): Promise<PasswordResetFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "이메일을 입력해주세요." };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
