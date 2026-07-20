import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const links = [{ href: "/coach", label: "회원 관리" }];

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("coach");

  return (
    <AppShell role="coach" name={profile.name} links={links}>
      {children}
    </AppShell>
  );
}
