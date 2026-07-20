export type GoalType = "loss" | "gain" | null;

function buildRubric(goalType: GoalType): string {
  const purposeLine =
    goalType === "gain"
      ? '이 회원의 식단 목적은 "근육량 증가(벌크업)"야. 단백질이 충분한지, 근육 성장에 필요한 총 칼로리(탄수화물 포함)가 잘 갖춰졌는지를 중심으로 평가해줘.'
      : goalType === "loss"
        ? '이 회원의 식단 목적은 "체중/체지방률 감량"이야. 과도한 탄수화물·기름진 음식 없이 채소와 단백질 위주로 구성되어 있는지를 중심으로 평가해줘.'
        : "이 회원은 아직 식단 목적을 설정하지 않았어. 탄수화물·단백질·채소의 전반적인 균형을 기준으로 평가해줘.";

  return `이 사진은 다이어트 식단관리 앱의 "오늘의 식단 미션 인증" 사진이야. ${purposeLine}

아래 기준으로 0~2점을 매겨줘.

0점: 실제 식사 사진이 아니거나(음식이 아닌 사물, 스크린샷, 무관한 사진), 대충 찍혀서 식사 내용을 알아볼 수 없음
1점: 실제 식사 사진이 맞고 성의 있게 찍었지만, 위 목적에 맞는 구성이 부족함
2점: 실제 식사 사진이고, 위 목적에 맞게 잘 구성됨

반드시 아래 JSON 형식으로만 답해. 다른 텍스트는 절대 쓰지 마.
{"score": 0, "reason": "한국어 한 문장 이유"}`;
}

export type AiScoreResult = { score: 0 | 1 | 2; reason: string };

export async function scoreMissionPhoto(
  imageBytes: ArrayBuffer,
  mediaType: string,
  goalType: GoalType = null
): Promise<AiScoreResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ai-score] ANTHROPIC_API_KEY is not set");
    return null;
  }

  const base64 = Buffer.from(imageBytes).toString("base64");
  const rubric = buildRubric(goalType);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: rubric },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[ai-score] fetch threw", err);
    return null;
  }

  if (!res.ok) {
    console.error("[ai-score] Anthropic API error", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("[ai-score] no JSON found in model output:", text);
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (parsed.score === 0 || parsed.score === 1 || parsed.score === 2) {
      return { score: parsed.score, reason: String(parsed.reason ?? "") };
    }
    console.error("[ai-score] parsed JSON missing valid score:", parsed);
  } catch (err) {
    console.error("[ai-score] JSON.parse failed on:", match[0], err);
    return null;
  }
  return null;
}
