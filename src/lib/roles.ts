import type { MealType, UserRole } from "@/lib/supabase/types";

export const roleHome: Record<UserRole, string> = {
  member: "/member",
  coach: "/coach",
  admin: "/admin",
};

export const roleLabel: Record<UserRole, string> = {
  member: "회원",
  coach: "영양코치",
  admin: "운영자",
};

export const mealLabel: Record<MealType, string> = {
  breakfast: "아침식사",
  lunch: "점심식사",
  dinner: "저녁식사",
};
