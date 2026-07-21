-- 운영자 대시보드 확장: 사용자 이메일 조회 + 회원 클래스 재배정 권한
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

-- profiles는 anon key 노출을 전제로 이름/역할 등은 로그인 사용자 전체 공개지만,
-- 이메일은 auth.users에만 있고 운영자에게만 노출해야 하므로 security definer 함수로 감싼다.
-- my_role()이 admin이 아니면 빈 결과를 반환한다(예외를 던지지 않는 안전한 기본값).
create or replace function public.admin_user_directory()
returns table (
  id uuid,
  name text,
  role user_role,
  email text,
  class_id uuid,
  created_at timestamptz
)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.name, p.role, u.email, p.class_id, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.my_role() = 'admin';
$$;

grant execute on function public.admin_user_directory() to authenticated;

-- 운영자가 잘못 배정된 회원의 클래스를 직접 조정할 수 있도록(기존 "본인만 수정" 정책에 추가)
create policy "profiles update by admin"
  on profiles for update
  to authenticated
  using (public.my_role() = 'admin');
