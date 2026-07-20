import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const links = [{ href: "/admin", label: "대시보드" }];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <AppShell role="admin" name={profile.name} links={links}>
      {children}
    </AppShell>
  );
}
