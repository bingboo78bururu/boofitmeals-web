"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/loading-overlay";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timer = setTimeout(() => setTimedOut(true), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setPending(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-ink-soft hover:text-carrot">
        ← 부핏Meals
      </Link>
      <h1 className="text-2xl font-bold">비밀번호 재설정</h1>

      {done ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="rounded-lg bg-leaf/10 px-3 py-2 text-sm text-leaf-dark">
            비밀번호가 변경됐어요.
          </p>
          <Link
            href="/login"
            className="rounded-xl bg-carrot px-4 py-2.5 text-center font-semibold text-white hover:bg-carrot-dark"
          >
            로그인하러 가기
          </Link>
        </div>
      ) : ready ? (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              새 비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-carrot"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-carrot-light/20 px-3 py-2 text-sm text-carrot-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-carrot px-4 py-2.5 font-semibold text-white transition hover:bg-carrot-dark disabled:opacity-60"
          >
            {pending ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      ) : timedOut ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="rounded-lg bg-carrot-light/20 px-3 py-2 text-sm text-carrot-dark">
            인증 링크가 만료됐거나 올바르지 않아요.
          </p>
          <Link
            href="/forgot-password"
            className="rounded-xl bg-carrot px-4 py-2.5 text-center font-semibold text-white hover:bg-carrot-dark"
          >
            다시 요청하기
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          인증 링크를 확인하고 있어요...
        </p>
      )}
      <LoadingOverlay show={pending} />
    </div>
  );
}
