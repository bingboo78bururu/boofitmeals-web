"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = { targetId: string; text: string };

// 각 단계가 가리키는 요소는 goal-banner.tsx(#tour-goal-setting)와
// member/layout.tsx의 bottomNav id들에 대응한다.
const steps: Step[] = [
  {
    targetId: "tour-goal-setting",
    text: "처음 오셨나요? 먼저 목표를 설정해주세요!\n(*식단 목표에 따라 AI 채점 기준이 달라집니다)",
  },
  {
    targetId: "bottom-nav-mission",
    text: "여기서 매 끼니 식단 사진을 올려보세요!\nAI가 즉시 채점해드려요.",
  },
  {
    targetId: "bottom-nav-carrot",
    text: "모은 당근은 여기서 확인해요.\n한 달에 100개를 모으면 등록비 전액을 환급해드려요!",
  },
  {
    targetId: "bottom-nav-feed",
    text: "같은 클래스 친구들의 인증 현황과\n랭킹을 여기서 볼 수 있어요.",
  },
  {
    targetId: "bottom-nav-growth",
    text: "체중·체지방률 변화 그래프는\n여기서 확인하세요.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

const CALLOUT_WIDTH = 256;
const CALLOUT_MARGIN = 12;

export function MemberWelcomeTutorial() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  function close() {
    router.replace("/member");
  }

  useEffect(() => {
    function measure() {
      const step = steps[stepIndex];
      const el = document.getElementById(step.targetId);
      if (!el) {
        // 대상이 화면에 없으면(예: 이미 목표가 설정돼 배너 문구가 달라진 경우)
        // 다음 단계로 자동으로 건너뛴다.
        if (stepIndex < steps.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          close();
        }
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  if (!rect) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const pad = 6;
  const spot = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  const roomBelow = window.innerHeight - (spot.top + spot.height);
  const calloutBelow = roomBelow > 160;
  const calloutLeft = Math.min(
    Math.max(spot.left, CALLOUT_MARGIN),
    window.innerWidth - CALLOUT_WIDTH - CALLOUT_MARGIN
  );

  function next() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      close();
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute rounded-xl border-2 border-carrot"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
        }}
      />

      <div
        className="absolute rounded-2xl bg-card p-4 text-center shadow-xl"
        style={{
          width: CALLOUT_WIDTH,
          left: calloutLeft,
          top: calloutBelow
            ? spot.top + spot.height + CALLOUT_MARGIN
            : spot.top - CALLOUT_MARGIN - 140,
        }}
      >
        <p className="whitespace-pre-line text-sm font-medium text-ink">
          {step.text}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={close}
            className="text-xs text-ink-soft hover:text-ink"
          >
            건너뛰기
          </button>
          <span className="text-xs text-ink-soft">
            {stepIndex + 1}/{steps.length}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white hover:bg-carrot-dark"
          >
            {isLast ? "확인" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
