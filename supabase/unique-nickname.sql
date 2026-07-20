-- 닉네임(profiles.name) 중복 방지
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- 주의: 이미 같은 이름을 쓰는 회원이 있으면 unique 제약 추가 시 에러가 나요.
-- 그 경우 먼저 Table Editor에서 겹치는 이름 중 하나를 바꿔주세요.

alter table profiles
  add constraint profiles_name_key unique (name);

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
