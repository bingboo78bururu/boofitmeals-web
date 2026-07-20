import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import {
  CalendarIcon,
  FeedIcon,
  HomeIcon,
  MyPageIcon,
  RankingIcon,
} from "@/components/icons";

const bottomNav = [
  { href: "/member/feed", label: "피드", icon: <FeedIcon /> },
  { href: "/member/ranking", label: "랭킹보드", icon: <RankingIcon /> },
  { href: "/member", label: "홈", icon: <HomeIcon /> },
  { href: "/member/calendar", label: "당근캘린더", icon: <CalendarIcon /> },
  { href: "/member/mypage", label: "마이페이지", icon: <MyPageIcon /> },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("member");

  return (
    <AppShell role="member" name={profile.name} links={[]} bottomNav={bottomNav}>
      {children}
    </AppShell>
  );
}
