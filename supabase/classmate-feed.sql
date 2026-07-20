-- 같은 클래스 동료의 미션/피드백을 볼 수 있는 "피드" 화면 지원
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

-- 내 클래스를 안전하게 조회하는 헬퍼 (RLS 정책에서 재사용)
create function public.my_class_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select class_id from public.profiles where id = auth.uid();
$$;

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
