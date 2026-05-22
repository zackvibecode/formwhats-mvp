-- ===========================================================================
-- Storage policies for the `form-images` bucket
-- ===========================================================================
-- Run this ONCE in the Supabase SQL Editor after creating the bucket.
-- Without these policies, the storage.objects table blocks INSERT/UPDATE/
-- DELETE even on a "public" bucket -- "public" only flips public READ on,
-- it does NOT relax RLS for writes.
--
-- These policies say:
--   - Anyone can read (the bucket holds question images shown on public
--     forms, so the file URLs need to be reachable without auth).
--   - Logged-in users can upload, update, and delete inside this bucket.
--     Tighter "owner-only" rules can be layered on later by inspecting
--     the path prefix; for the MVP we trust authenticated users.
-- ===========================================================================

-- 1. Public read --------------------------------------------------------
drop policy if exists "form_images_public_read" on storage.objects;
create policy "form_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'form-images');

-- 2. Authenticated insert -----------------------------------------------
drop policy if exists "form_images_auth_insert" on storage.objects;
create policy "form_images_auth_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'form-images');

-- 3. Authenticated update -----------------------------------------------
drop policy if exists "form_images_auth_update" on storage.objects;
create policy "form_images_auth_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'form-images')
  with check (bucket_id = 'form-images');

-- 4. Authenticated delete -----------------------------------------------
drop policy if exists "form_images_auth_delete" on storage.objects;
create policy "form_images_auth_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'form-images');
