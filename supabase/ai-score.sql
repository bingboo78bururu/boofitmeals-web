-- 식단 사진 AI 채점용 컬럼
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table missions
  add column if not exists ai_score smallint,
  add column if not exists ai_score_reason text;

alter table missions
  drop constraint if exists missions_ai_score_check;

alter table missions
  add constraint missions_ai_score_check check (ai_score is null or ai_score in (0, 1, 2));
