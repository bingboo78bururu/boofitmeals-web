-- 목표 단위(체중/체지방률) 선택 + 오늘의 체중/체지방률 기록
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create type goal_unit as enum ('body_fat_pct', 'weight_kg');

alter table goals
  add column unit goal_unit not null default 'body_fat_pct';

alter table goals rename column current_body_fat to current_value;
alter table goals rename column target_body_fat to target_value;

create table body_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  log_date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  created_at timestamptz not null default now(),
  unique (member_id, log_date)
);

alter table body_logs enable row level security;

create policy "body_logs select"
  on body_logs for select
  to authenticated
  using (
    member_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from coach_assignments ca
      where ca.member_id = body_logs.member_id and ca.coach_id = auth.uid()
    )
  );

create policy "body_logs insert by owner"
  on body_logs for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "body_logs update by owner"
  on body_logs for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());
