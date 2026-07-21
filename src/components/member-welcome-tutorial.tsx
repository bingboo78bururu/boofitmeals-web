"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const slides = [
  {
    icon: "🎯",
    title: "식단 목표를 설정하고\n식사 사진을 올려보세요!",
    description:
      "AI코치가 즉시 채점해드려요. 목표에 따라 AI 채점 기준이 달라지니 정확하게 설정해주세요!",
  },
  {
    icon: "💬",
    title: "매일 밤, 영양코치님의\n전문 피드백을 확인해보세요",
    description: "AI 채점에 더해, 담당 영양코치가 직접 남기는 피드백도 함께 받아볼 수 있어요.",
  },
  {
    icon: "🥕",
    title: "좋은 식사에는\n당근을 드려요!",
    description: "당근을 모아 캘린더를 채우고, 우리 반 친구들과 함께 경쟁해보세요.",
  },
];

export function MemberWelcomeTutorial() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  function close() {
    router.replace("/member");
  }

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute right-4 top-4 text-ink-soft hover:text-ink"
        >
          ✕
        </button>

        <div className="mt-4 text-5xl">{slide.icon}</div>
        <h2 className="mt-4 whitespace-pre-line text-lg font-bold leading-snug text-ink">
          {slide.title}
        </h2>
        <p className="mt-3 text-sm text-ink-soft">{slide.description}</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 화면으로 이동`}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-carrot" : "w-2 bg-line"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={close}
            className="text-sm text-ink-soft hover:text-ink"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={isLast ? close : () => setStep((s) => s + 1)}
            className="rounded-full bg-carrot px-5 py-2 text-sm font-semibold text-white hover:bg-carrot-dark"
          >
            {isLast ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
