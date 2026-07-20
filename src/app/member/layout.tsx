import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { GoalBanner } from "@/components/goal-banner";
import {
  CalendarIcon,
  FeedIcon,
  GrowthIcon,
  HomeIcon,
  MyPageIcon,
} from "@/components/icons";

const bottomNav = [
  { href: "/member/feed", label: "우리 반", icon: <FeedIcon /> },
  { href: "/member/growth", label: "내 변화", icon: <GrowthIcon /> },
  { href: "/member", label: "식단 인증", icon: <HomeIcon /> },
  { href: "/member/calendar", label: "당근캘린더", icon: <CalendarIcon /> },
  { href: "/member/mypage", label: "MY", icon: <MyPageIcon /> },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("member");

  return (
    <AppShell
      role="member"
      name={profile.name}
      links={[]}
      bottomNav={bottomNav}
      banner={<GoalBanner memberId={profile.id} />}
    >
      {children}
    </AppShell>
  );
}
