"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-ink-soft hover:text-carrot">
        ← 부핏Meals
      </Link>
      <h1 className="text-2xl font-bold">로그인</h1>

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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              비밀번호
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-ink-soft hover:text-carrot"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
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
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-carrot-dark">
          회원가입
        </Link>
      </p>
    </div>
  );
}
