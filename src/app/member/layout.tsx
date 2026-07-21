import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { GoalBanner } from "@/components/goal-banner";
import {
  CarrotIcon,
  FeedIcon,
  GrowthIcon,
  HomeIcon,
  MyPageIcon,
} from "@/components/icons";

const bottomNav = [
  { href: "/member/feed", label: "우리 반", icon: <FeedIcon />, id: "bottom-nav-feed" },
  { href: "/member/growth", label: "내 변화", icon: <GrowthIcon />, id: "bottom-nav-growth" },
  { href: "/member", label: "식단 인증", icon: <HomeIcon />, id: "bottom-nav-mission" },
  { href: "/member/calendar", label: "당근 현황", icon: <CarrotIcon />, id: "bottom-nav-carrot" },
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
