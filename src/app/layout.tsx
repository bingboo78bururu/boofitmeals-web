import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부핏Meals — 목표 기반 식단관리",
  description: "체성분 목표를 세우고, 매일의 실천을 당근으로 쌓아가는 식단관리 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
