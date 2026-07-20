-- 목표 단위에 근육량 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter type goal_unit add value 'muscle_mass_kg';

alter table body_logs
  add column muscle_mass_kg numeric;
