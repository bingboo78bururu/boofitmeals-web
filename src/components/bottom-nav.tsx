"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function BottomNav({
  items,
  centerIndex = 2,
}: {
  items: NavItem[];
  centerIndex?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card">
      <div className="mx-auto flex max-w-5xl items-end justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((item, i) => {
          const isActive =
            item.href === "/member"
              ? pathname === "/member"
              : pathname.startsWith(item.href);

          if (i === centerIndex) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span
                  className={`-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl shadow-md transition active:scale-95 ${
                    isActive ? "bg-carrot-dark" : "bg-carrot"
                  } text-white`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isActive ? "text-carrot-dark" : "text-ink-soft"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 touch-manipulation flex-col items-center gap-1 py-1 active:scale-95"
            >
              <span className={isActive ? "text-carrot-dark" : "text-ink-soft"}>
                {item.icon}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-carrot-dark" : "text-ink-soft"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
