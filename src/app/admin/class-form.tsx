"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClass } from "@/lib/actions/admin";

export function ClassForm() {
  const [state, action, pending] = useActionState(createClass, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "success" in state) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="class_name" className="text-sm font-medium">
          새 클래스 이름
        </label>
        <input
          id="class_name"
          name="name"
          required
          placeholder="2026년 7월 클래스"
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-carrot"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-carrot px-4 py-2 text-sm font-semibold text-white hover:bg-carrot-dark disabled:opacity-60"
      >
        {pending ? "생성 중..." : "클래스 추가"}
      </button>
      {state && "error" in state && (
        <p className="w-full text-xs text-carrot-dark">{state.error}</p>
      )}
    </form>
  );
}
