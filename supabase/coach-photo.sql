-- 코치 프로필 사진 업로드
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

alter table profiles
  add column photo_url text;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- 파일 경로 규칙: {user_id}/photo.{ext}
create policy "profile photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-photos');

create policy "users upload their own profile photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users replace their own profile photo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
