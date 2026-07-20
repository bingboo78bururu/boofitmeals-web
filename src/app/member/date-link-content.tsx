"use client";

import { useLinkStatus } from "next/link";

export function DateLinkContent({ dayNum }: { dayNum: number }) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span className="flex gap-0.5">
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

  return <>{dayNum}</>;
}
