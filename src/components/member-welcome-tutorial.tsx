"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Step = {
  targetId: string;
  text: string;
  padTop?: number;
  showAiRubric?: boolean;
};

// 각 단계가 가리키는 요소는 goal-banner.tsx(#tour-goal-setting)와
// member/layout.tsx의 bottomNav id들에 대응한다.
const steps: Step[] = [
  {
    targetId: "tour-goal-setting",
    text: "처음 오셨나요? 먼저 목표를 설정해주세요!",
  },
  {
    targetId: "bottom-nav-mission",
    text: "여기서 매 끼니 식단 사진을 올려보세요!\nAI가 즉시 채점해드려요.",
    // 가운데 탭은 아이콘이 -mt-6로 위로 떠 있어서, 그만큼 강조 박스도 위로 더 늘려야 안 잘림
    padTop: 32,
    showAiRubric: true,
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

const CALLOUT_MAX_WIDTH = 320;
const CALLOUT_MARGIN = 12;

function DotsLoader() {
  return (
    <span className="inline-flex items-center gap-0.5 py-0.5">
      <span
        className="h-1 w-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "-0.3s" }}
      />
      <span
        className="h-1 w-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "-0.15s" }}
      />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export function MemberWelcomeTutorial() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isPending, startTransition] = useTransition();
  const [closingVia, setClosingVia] = useState<"skip" | "confirm" | null>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const [calloutHeight, setCalloutHeight] = useState(140);

  function close(via: "skip" | "confirm") {
    setClosingVia(via);
    startTransition(() => {
      router.replace("/member");
    });
  }

  // 튜토리얼이 떠 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

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
          close("confirm");
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

  // 카드 내용(예: AI 채점기준 카드 유무)에 따라 실제 렌더 높이가 달라지므로,
  // "대상 위쪽에 띄워야 하는" 단계의 위치 계산에 고정값 대신 실측 높이를 쓴다.
  useLayoutEffect(() => {
    if (!calloutRef.current) return;
    const h = calloutRef.current.getBoundingClientRect().height;
    if (Math.abs(h - calloutHeight) > 0.5) setCalloutHeight(h);
  });

  if (!rect) return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const pad = 6;
  const padTop = step.padTop ?? pad;
  const spot = {
    top: rect.top - padTop,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + padTop + pad,
  };

  const calloutWidth = Math.min(
    CALLOUT_MAX_WIDTH,
    window.innerWidth - CALLOUT_MARGIN * 2
  );
  const roomBelow = window.innerHeight - (spot.top + spot.height);
  const calloutBelow = roomBelow > calloutHeight + CALLOUT_MARGIN;
  const calloutLeft = Math.min(
    Math.max(spot.left, CALLOUT_MARGIN),
    window.innerWidth - calloutWidth - CALLOUT_MARGIN
  );

  function prev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  function next() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      close("confirm");
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
        ref={calloutRef}
        className="absolute flex flex-col gap-2"
        style={{
          width: calloutWidth,
          left: calloutLeft,
          top: calloutBelow
            ? spot.top + spot.height + CALLOUT_MARGIN
            : Math.max(
                CALLOUT_MARGIN,
                spot.top - CALLOUT_MARGIN - calloutHeight
              ),
        }}
      >
        <div className="rounded-2xl bg-card p-4 text-center shadow-xl">
          <p className="whitespace-pre-line text-sm font-medium text-ink">
            {step.text}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  disabled={isPending}
                  className="text-xs text-ink-soft hover:text-ink disabled:opacity-60"
                >
                  이전
                </button>
              )}
              <button
                type="button"
                onClick={() => close("skip")}
                disabled={isPending}
                className="text-xs text-ink-soft hover:text-ink disabled:opacity-60"
              >
                {isPending && closingVia === "skip" ? (
                  <DotsLoader />
                ) : (
                  "건너뛰기"
                )}
              </button>
            </div>
            <span className="shrink-0 text-xs text-ink-soft">
              {stepIndex + 1}/{steps.length}
            </span>
            <button
              type="button"
              onClick={next}
              disabled={isPending}
              className="rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
            >
              {isPending && closingVia === "confirm" ? (
                <DotsLoader />
              ) : isLast ? (
                "확인"
              ) : (
                "다음"
              )}
            </button>
          </div>
        </div>

        {step.showAiRubric && (
          <div className="rounded-2xl border border-line bg-card p-4 text-left shadow-xl">
            <p className="text-xs font-bold text-carrot-dark">
              🤖 AI는 이렇게 채점해요
            </p>
            <ul className="mt-2 space-y-1 text-xs text-ink-soft">
              <li>0점 · 식사 사진이 아니거나 성의 없이 찍음</li>
              <li>1점 · 성실하게 찍었지만 구성이나 양이 부족</li>
              <li>2점 · 구성도 좋고 양도 충분</li>
            </ul>
            <p className="mt-2 text-xs text-ink-soft">
              감량 목적이면 저탄수·채소·단백질 위주, 증량 목적이면 단백질과
              충분한 칼로리 기준으로 채점 기준이 달라져요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
