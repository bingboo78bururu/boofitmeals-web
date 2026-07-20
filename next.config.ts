import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel 서버리스 함수 자체가 요청 본문을 4.5MB로 하드 제한하므로
      // 이보다 크게 설정해봐야 의미 없음(오히려 언제 잘릴지 헷갈림).
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
