# 🥕 부핏Meals

매일의 식단을 사진으로 인증하면 AI가 채점하고, 담당 영양코치가 피드백을 남기고, 같은 클래스 동료들과 함께
목표를 향해 나아가는 식단관리 웹 서비스입니다.

🔗 **서비스 바로가기**: https://boofitmeals-web.vercel.app

## 소개

체성분 목표(체중/체지방률 감량 또는 근육량 증가)를 설정하고, 하루 세 끼(아침·점심·저녁) 식단 사진을
인증하면 Claude Vision이 그 사람의 목표에 맞춰 0~2점으로 자동 채점합니다. 영양코치는 회원별 피드를
보며 점수를 조정하거나 피드백을 남길 수 있고, 회원은 캘린더와 랭킹보드, 체중/체지방률 변화 그래프로
자신의 실천을 계속 확인할 수 있습니다.

## 주요 기능

**회원**
- 하루 세 끼 식단 사진 인증 + AI 자동 채점(목표에 따라 채점 기준이 달라짐)
- 목표 설정(감량/증량), 오늘의 체중·체지방률·근육량 기록 및 추이 그래프
- 당근 캘린더(끼니별 인증 현황), 같은 클래스 동료 피드 + 당근 랭킹
- 목표 달성 시 상단 배너로 축하 알림

**영양코치**
- 담당 회원의 최근 식단 피드를 보며 AI 채점 점수 조정 및 피드백 작성
- 프로필(소개글·해시태그·사진) 관리

**운영자**
- 회원 현황·미션 수행률·AI 채점 분포 대시보드
- 회원 ↔ 코치 배정, 클래스 생성/관리

## 기술 스택

- **Frontend**: Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Storage, Row Level Security)
- **AI**: Claude Haiku(Vision) — Anthropic Messages API 직접 호출
- **배포**: Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local`에 아래 값이 필요합니다.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

AI 채점을 쓰려면 `ANTHROPIC_API_KEY`도 필요합니다(배포 환경에서는 Vercel 환경변수로 별도 설정).

### 데이터베이스

`supabase/schema.sql`이 전체 스키마입니다. Supabase 프로젝트를 새로 만들었다면 SQL Editor에서 이
파일을 한 번 실행하면 됩니다. 이후 추가된 기능들은 `supabase/*.sql`의 개별 마이그레이션 파일로
누적되어 있습니다.

## 프로젝트 구조

```
src/app/            역할별 라우트 (member / coach / admin), 로그인·회원가입
src/lib/actions/     Server Actions (역할별로 분리)
src/lib/supabase/    Supabase 클라이언트 및 DB 타입
supabase/            스키마 및 마이그레이션 SQL
QA.md                진행한 QA/버그 수정 이력
```

더 자세한 아키텍처 설명은 [`CLAUDE.md`](./CLAUDE.md)에 있습니다.
