-- 미션 인증 사진 업로드용 스토리지 버킷
-- schema.sql 실행 이후, SQL Editor에서 추가로 실행하세요.

insert into storage.buckets (id, name, public)
values ('mission-photos', 'mission-photos', true)
on conflict (id) do nothing;

-- 파일 경로 규칙: {member_id}/{mission_date}.jpg
-- 업로드는 본인 폴더에만, 조회는 누구나(public 버킷이라 캘린더 썸네일 등에서 바로 접근)
create policy "mission photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'mission-photos');

create policy "members upload photos into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mission-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "members replace their own photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'mission-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
