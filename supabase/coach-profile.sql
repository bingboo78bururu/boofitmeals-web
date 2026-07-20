-- 코치 프로필 (한줄 소개 + 해시태그) 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table profiles
  add column bio text,
  add column tags text[] not null default '{}';
