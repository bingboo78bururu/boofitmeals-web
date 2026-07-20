-- butfitmeals-web schema
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하세요.

create extension if not exists "pgcrypto";

-- 역할: 회원 / 영양코치 / 운영자
create type user_role as enum ('member', 'coach', 'admin');

-- 하루 세 끼 인증: 아침 / 점심 / 저녁
create type meal_type as enum ('breakfast', 'lunch', 'dinner');

-- 목표 단위: 체지방률 / 체중 / 근육량
create type goal_unit as enum ('body_fat_pct', 'weight_kg', 'muscle_mass_kg');

-- 클래스: 같은 클래스끼리 랭킹보드가 묶임
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'member',
  name text not null unique,
  class_id uuid references classes (id) on delete set null,
  bio text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references profiles (id) on delete cascade,
  unit goal_unit not null default 'body_fat_pct',
  current_value numeric,
  target_value numeric,
  target_date date,
  updated_at timestamptz not null default now()
);

-- 오늘의 체중/체지방률/근육량 기록 (하루 하나, 그래프용 시계열)
create table body_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  log_date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  muscle_mass_kg numeric,
  created_at timestamptz not null default now(),
  unique (member_id, log_date)
);

create table coach_assignments (
  member_id uuid primary key references profiles (id) on delete cascade,
  coach_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table missions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles (id) on delete cascade,
  mission_date date not null,
  meal_type meal_type not null default 'lunch',
  note text,
  photo_url text,
  ai_score smallint check (ai_score is null or ai_score in (0, 1, 2)),
  ai_score_reason text,
  coach_score smallint check (coach_score is null or coach_score in (0, 1, 2)),
  created_at timestamptz not null default now(),
  unique (member_id, mission_date, meal_type)
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references missions (id) on delete cascade,
  coach_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 회원가입 시 auth.users -> profiles 자동 생성
-- (signUp 호출 시 options.data.role / options.data.name 으로 전달)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'member'),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 내 role을 안전하게 조회하는 헬퍼 (RLS 정책에서 재사용)
create function public.my_role()
returns user_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 회원가입(로그인 전) 시 닉네임 중복 여부를 확인하기 위한 헬퍼
create function public.name_taken(check_name text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from profiles where name = check_name);
$$;

grant execute on function public.name_taken(text) to anon, authenticated;

-- 내 클래스를 안전하게 조회하는 헬퍼 (RLS 정책에서 재사용)
create function public.my_class_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select class_id from public.profiles where id = auth.uid();
$$;

-- 회원은 note/photo/ai_score만, 담당 코치는 coach_score만 수정 가능하도록 컬럼 단위로 제한
create function public.enforce_mission_update_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.my_role() = 'coach' then
    if new.member_id is distinct from old.member_id
      or new.mission_date is distinct from old.mission_date
      or new.meal_type is distinct from old.meal_type
      or new.note is distinct from old.note
      or new.photo_url is distinct from old.photo_url
      or new.ai_score is distinct from old.ai_score
      or new.ai_score_reason is distinct from old.ai_score_reason
    then
      raise exception 'coach can only update coach_score';
    end if;
  elsif public.my_role() = 'member' then
    if new.coach_score is distinct from old.coach_score then
      raise exception 'members cannot set coach_score';
    end if;
  end if;
  return new;
end;
$$;

create trigger missions_enforce_update_columns
  before update on missions
  for each row execute procedure public.enforce_mission_update_columns();

alter table classes enable row level security;
alter table profiles enable row level security;
alter table goals enable row level security;
alter table body_logs enable row level security;
alter table coach_assignments enable row level security;
alter table missions enable row level security;
alter table feedback enable row level security;

-- classes: 회원가입 시 선택할 수 있도록 로그인 사용자에게 공개, 생성/수정/삭제는 운영자만
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

-- profiles: 이름/역할은 랭킹보드·배정 표시를 위해 로그인 사용자에게 공개
create policy "profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- goals: 본인, 담당 영양코치, 운영자만 조회/작성
create policy "goals select"
  on goals for select
  to authenticated
  using (
    member_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from coach_assignments ca
      where ca.member_id = goals.member_id and ca.coach_id = auth.uid()
    )
  );

create policy "goals upsert by owner"
  on goals for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "goals update by owner"
  on goals for update
  to authenticated
  using (member_id = auth.uid());

-- body_logs: 본인, 담당 영양코치, 운영자만 조회/작성
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

-- coach_assignments: 관련 당사자와 운영자만 조회, 운영자만 배정
create policy "assignments select"
  on coach_assignments for select
  to authenticated
  using (
    member_id = auth.uid()
    or coach_id = auth.uid()
    or public.my_role() = 'admin'
  );

create policy "assignments managed by admin"
  on coach_assignments for insert
  to authenticated
  with check (public.my_role() = 'admin');

create policy "assignments insert by member"
  on coach_assignments for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and exists (select 1 from profiles p where p.id = coach_id and p.role = 'coach')
  );

create policy "assignments update by admin"
  on coach_assignments for update
  to authenticated
  using (public.my_role() = 'admin');

create policy "assignments update by member"
  on coach_assignments for update
  to authenticated
  using (member_id = auth.uid())
  with check (
    member_id = auth.uid()
    and exists (select 1 from profiles p where p.id = coach_id and p.role = 'coach')
  );

create policy "assignments delete by admin"
  on coach_assignments for delete
  to authenticated
  using (public.my_role() = 'admin');

-- missions: 본인, 담당 영양코치, 운영자, 같은 클래스 동료만 조회. 작성은 본인만.
create policy "missions select"
  on missions for select
  to authenticated
  using (
    member_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from coach_assignments ca
      where ca.member_id = missions.member_id and ca.coach_id = auth.uid()
    )
  );

create policy "missions select by classmate"
  on missions for select
  to authenticated
  using (
    public.my_class_id() is not null
    and exists (
      select 1 from profiles p
      where p.id = missions.member_id and p.class_id = public.my_class_id()
    )
  );

create policy "missions insert by owner"
  on missions for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "missions update by owner"
  on missions for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "missions update by assigned coach"
  on missions for update
  to authenticated
  using (
    exists (
      select 1 from coach_assignments ca
      where ca.member_id = missions.member_id and ca.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from coach_assignments ca
      where ca.member_id = missions.member_id and ca.coach_id = auth.uid()
    )
  );

-- feedback: 담당 영양코치만 작성, 관련 당사자만 조회
create policy "feedback select"
  on feedback for select
  to authenticated
  using (
    coach_id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from missions m
      where m.id = feedback.mission_id and m.member_id = auth.uid()
    )
  );

create policy "feedback select by classmate"
  on feedback for select
  to authenticated
  using (
    public.my_class_id() is not null
    and exists (
      select 1 from missions m
      join profiles p on p.id = m.member_id
      where m.id = feedback.mission_id and p.class_id = public.my_class_id()
    )
  );

create policy "feedback insert by assigned coach"
  on feedback for insert
  to authenticated
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from missions m
      join coach_assignments ca on ca.member_id = m.member_id
      where m.id = feedback.mission_id and ca.coach_id = auth.uid()
    )
  );

create policy "feedback update by author"
  on feedback for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "feedback update by assigned coach"
  on feedback for update
  to authenticated
  using (
    exists (
      select 1 from missions m
      join coach_assignments ca on ca.member_id = m.member_id
      where m.id = feedback.mission_id and ca.coach_id = auth.uid()
    )
  )
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from missions m
      join coach_assignments ca on ca.member_id = m.member_id
      where m.id = feedback.mission_id and ca.coach_id = auth.uid()
    )
  );
