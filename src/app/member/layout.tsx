import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const links = [
  { href: "/member", label: "오늘의 미션" },
  { href: "/member/calendar", label: "당근 캘린더" },
  { href: "/member/ranking", label: "랭킹보드" },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("member");

  return (
    <AppShell role="member" name={profile.name} links={links}>
      {children}
    </AppShell>
  );
}
