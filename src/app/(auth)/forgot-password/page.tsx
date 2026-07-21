"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { LoadingOverlay } from "@/components/loading-overlay";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-ink-soft hover:text-carrot">
        ← 부핏Meals
      </Link>
      <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
      <p className="mt-1 text-sm text-ink-soft">
        가입한 이메일로 재설정 링크를 보내드려요.
      </p>

      {state && "success" in state ? (
        <p className="mt-8 rounded-lg bg-leaf/10 px-3 py-2 text-sm text-leaf-dark">
          이메일을 확인해주세요. 재설정 링크를 보냈어요.
        </p>
      ) : (
        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-carrot"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-carrot-light/20 px-3 py-2 text-sm text-carrot-dark">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-carrot px-4 py-2.5 font-semibold text-white transition hover:bg-carrot-dark disabled:opacity-60"
          >
            {pending ? "전송 중..." : "재설정 링크 보내기"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-carrot-dark">
          로그인으로 돌아가기
        </Link>
      </p>
      <LoadingOverlay show={pending} />
    </div>
  );
}
