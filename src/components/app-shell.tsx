import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { roleHome, roleLabel } from "@/lib/roles";
import { BottomNav } from "@/components/bottom-nav";
import type { UserRole } from "@/lib/supabase/types";

export function AppShell({
  role,
  name,
  links,
  bottomNav,
  banner,
  children,
}: {
  role: UserRole;
  name: string;
  links: { href: string; label: string }[];
  bottomNav?: { href: string; label: string; icon: React.ReactNode }[];
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-30">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-6">
              <Link
                href={roleHome[role]}
                className="text-lg font-bold text-carrot-dark"
              >
                🥕 부핏Meals
              </Link>
              {links.length > 0 && (
                <nav className="flex gap-1 text-sm font-medium">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-cream-soft hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-ink-soft">
                {name}{" "}
                <span className="font-medium text-carrot-dark">
                  {roleLabel[role]}
                </span>
              </span>
              <form action={logout}>
                <button className="text-ink-soft hover:text-ink">
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </header>
        {banner}
      </div>
      <main
        className={`mx-auto w-full max-w-5xl flex-1 px-6 py-8 ${bottomNav ? "pb-28" : ""}`}
      >
        {children}
      </main>
      {bottomNav && <BottomNav items={bottomNav} />}
    </div>
  );
}
