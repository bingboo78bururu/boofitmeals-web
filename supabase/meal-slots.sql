-- (1) "오늘 미션 수정하기" 시 RLS 에러 수정 — missions 테이블에 UPDATE 정책이 없었음
create policy "missions update by owner"
  on missions for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- (2) 하루 세 끼(아침/점심/저녁) 인증 지원
do $$ begin
  create type meal_type as enum ('breakfast', 'lunch', 'dinner');
exception when duplicate_object then null;
end $$;

alter table missions add column if not exists meal_type meal_type not null default 'lunch';

alter table missions drop constraint if exists missions_member_id_mission_date_key;
alter table missions add constraint missions_member_id_mission_date_meal_type_key
  unique (member_id, mission_date, meal_type);
