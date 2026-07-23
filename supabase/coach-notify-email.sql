-- 회원이 미션(식단 인증글)을 올릴 때 담당 코치에게 이메일 알림을 보내기 위해,
-- 회원 본인 세션에서 "내 담당 코치의 이메일"만 안전하게 조회하는 함수.
-- auth.uid()로 호출자 본인의 배정만 조회하므로 다른 회원의 코치 이메일은 알 수 없다.
create or replace function public.my_coach_email()
returns text
language sql
security definer set search_path = public
stable
as $$
  select u.email
  from public.coach_assignments ca
  join auth.users u on u.id = ca.coach_id
  where ca.member_id = auth.uid();
$$;

grant execute on function public.my_coach_email() to authenticated;
