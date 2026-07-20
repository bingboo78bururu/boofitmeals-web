-- 코치가 자신이 남긴 피드백을 수정할 수 있도록 허용
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create policy "feedback update by author"
  on feedback for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
