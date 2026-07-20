-- 담당 코치가 바뀌어도(또는 다른 코치 계정이어도), 현재 담당 코치면
-- 이전 코치가 남긴 피드백을 수정할 수 있도록 허용
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

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
