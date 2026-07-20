-- 코치의 AI 점수 조정 기능 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table missions
  add column coach_score smallint check (coach_score is null or coach_score in (0, 1, 2));

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
