-- 클래스(같은 클래스끼리 랭킹보드 그룹) 기능 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles
  add column class_id uuid references classes (id) on delete set null;

alter table classes enable row level security;

create policy "classes readable by authenticated users"
  on classes for select
  to authenticated
  using (true);

create policy "classes insert by admin"
  on classes for insert
  to authenticated
  with check (public.my_role() = 'admin');

create policy "classes update by admin"
  on classes for update
  to authenticated
  using (public.my_role() = 'admin');

create policy "classes delete by admin"
  on classes for delete
  to authenticated
  using (public.my_role() = 'admin');
