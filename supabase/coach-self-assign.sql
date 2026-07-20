-- 회원가입 온보딩에서 본인이 직접 담당 코치를 선택할 수 있도록 허용
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create policy "assignments insert by member"
  on coach_assignments for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and exists (select 1 from profiles p where p.id = coach_id and p.role = 'coach')
  );

create policy "assignments update by member"
  on coach_assignments for update
  to authenticated
  using (member_id = auth.uid())
  with check (
    member_id = auth.uid()
    and exists (select 1 from profiles p where p.id = coach_id and p.role = 'coach')
  );
