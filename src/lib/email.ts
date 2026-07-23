import { Resend } from "resend";

import type { MealType } from "./supabase/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Resend 도메인 인증 전에는 onboarding@resend.dev로만 발신 가능(수신자도 제한될 수 있음).
// 실제 도메인을 인증했다면 RESEND_FROM_EMAIL을 Vercel env에 설정해 덮어쓴다.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "부핏Meals <onboarding@resend.dev>";

// 코치 알림 메일을 항상 추가로 받고 싶은 주소(예: 운영자 본인, 테스트용).
// Resend 샌드박스(도메인 미인증) 상태에서는 코치 이메일로 실제 발송이 막힐 수 있어
// 우선 이 주소로만 확인하고 싶을 때도 유용하다.
const CC_EMAIL = process.env.RESEND_CC_EMAIL;

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
};

export async function sendMissionSubmittedEmail(params: {
  coachEmail: string;
  memberName: string;
  mealType: MealType;
  missionDate: string;
}) {
  if (!resend) {
    console.error("[email] RESEND_API_KEY not set — skipping mission-submitted email");
    return;
  }

  const mealLabel = MEAL_LABEL[params.mealType];

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.coachEmail,
      ...(CC_EMAIL ? { cc: CC_EMAIL } : {}),
      subject: `[부핏Meals] ${params.memberName}님이 ${mealLabel} 식단을 인증했어요`,
      text: `${params.memberName}님이 ${params.missionDate} ${mealLabel} 식단 인증을 올렸어요.\n\n확인하러 가기: https://boofitmeals-web.vercel.app/coach`,
    });
    if (error) console.error("[email] resend rejected mission-submitted email", error);
  } catch (err) {
    console.error("[email] failed to send mission-submitted email", err);
  }
}
