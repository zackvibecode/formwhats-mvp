-- =========================================================================
-- FormWhats — Auth user ownership migration
-- =========================================================================
-- Run this in the Supabase SQL Editor AFTER `supabase/schema.sql` and AFTER
-- you have at least one user signed up via /login.
--
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- This migration is idempotent enough to re-run safely.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Add user_id to forms
-- -------------------------------------------------------------------------

alter table public.forms
    add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- -------------------------------------------------------------------------
-- 2. Backfill existing rows (manual step — see comments)
-- -------------------------------------------------------------------------
-- Existing forms created before auth was added do not have a user_id and
-- will become orphans (invisible to every authenticated user). We do NOT
-- guess an owner here.
--
-- To claim them for your own account, run this manually after replacing
-- the email with your real signup email:
--
--   update public.forms
--   set user_id = (select id from auth.users where email = 'YOU@EXAMPLE.COM')
--   where user_id is null;
--
-- Alternatively, drop legacy rows you no longer need:
--
--   delete from public.forms where user_id is null;

-- -------------------------------------------------------------------------
-- 3. Index for fast "my forms" queries
-- -------------------------------------------------------------------------

create index if not exists forms_user_idx on public.forms (user_id);

-- -------------------------------------------------------------------------
-- 4. Replace open MVP policies with ownership-aware ones
-- -------------------------------------------------------------------------
-- RLS is already enabled by `schema.sql`. Here we drop the old open
-- policies and create tight ones tied to auth.uid().
--
-- Public read access for `forms` and `form_fields` is preserved so the
-- public form page (/form/[slug]) keeps working without login. Public
-- inserts on `responses` also stay open so customers can submit.
-- =========================================================================

-- forms ------------------------------------------------------------------

drop policy if exists "mvp_forms_select" on public.forms;
drop policy if exists "mvp_forms_insert" on public.forms;
drop policy if exists "mvp_forms_update" on public.forms;
drop policy if exists "mvp_forms_delete" on public.forms;

drop policy if exists "forms_owner_select"   on public.forms;
drop policy if exists "forms_public_select"  on public.forms;
drop policy if exists "forms_owner_insert"   on public.forms;
drop policy if exists "forms_owner_update"   on public.forms;
drop policy if exists "forms_owner_delete"   on public.forms;

-- Owner can see their own forms.
create policy "forms_owner_select" on public.forms
    for select
    using (auth.uid() = user_id);

-- Anyone (including anon) can read an active form by slug. The public form
-- page does `.eq("slug", slug)` which keeps this scoped enough for MVP.
create policy "forms_public_select" on public.forms
    for select
    using (is_active = true);

-- Inserts must claim ownership for the calling user.
create policy "forms_owner_insert" on public.forms
    for insert
    with check (auth.uid() = user_id);

create policy "forms_owner_update" on public.forms
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "forms_owner_delete" on public.forms
    for delete
    using (auth.uid() = user_id);

-- form_fields ------------------------------------------------------------

drop policy if exists "mvp_form_fields_select" on public.form_fields;
drop policy if exists "mvp_form_fields_insert" on public.form_fields;
drop policy if exists "mvp_form_fields_update" on public.form_fields;
drop policy if exists "mvp_form_fields_delete" on public.form_fields;

drop policy if exists "form_fields_owner_select"   on public.form_fields;
drop policy if exists "form_fields_public_select"  on public.form_fields;
drop policy if exists "form_fields_owner_insert"   on public.form_fields;
drop policy if exists "form_fields_owner_update"   on public.form_fields;
drop policy if exists "form_fields_owner_delete"   on public.form_fields;

-- Owner can read fields belonging to their own forms.
create policy "form_fields_owner_select" on public.form_fields
    for select
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.user_id = auth.uid()
        )
    );

-- Public (anon + authenticated) can read fields when their parent form is
-- active. This powers the public form page rendering.
create policy "form_fields_public_select" on public.form_fields
    for select
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.is_active = true
        )
    );

create policy "form_fields_owner_insert" on public.form_fields
    for insert
    with check (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.user_id = auth.uid()
        )
    );

create policy "form_fields_owner_update" on public.form_fields
    for update
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.user_id = auth.uid()
        )
    );

create policy "form_fields_owner_delete" on public.form_fields
    for delete
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
              and f.user_id = auth.uid()
        )
    );

-- responses --------------------------------------------------------------

drop policy if exists "mvp_responses_select" on public.responses;
drop policy if exists "mvp_responses_insert" on public.responses;
drop policy if exists "mvp_responses_update" on public.responses;
drop policy if exists "mvp_responses_delete" on public.responses;

drop policy if exists "responses_owner_select"   on public.responses;
drop policy if exists "responses_public_insert"  on public.responses;
drop policy if exists "responses_owner_delete"   on public.responses;

-- Owner of the parent form can read responses for that form.
create policy "responses_owner_select" on public.responses
    for select
    using (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
              and f.user_id = auth.uid()
        )
    );

-- Public (anon + authenticated) can submit a response, but only against an
-- active form. There is no public select policy, so customer answers stay
-- private to the form owner.
create policy "responses_public_insert" on public.responses
    for insert
    with check (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
              and f.is_active = true
        )
    );

-- Optional cleanup capability for the form owner.
create policy "responses_owner_delete" on public.responses
    for delete
    using (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
              and f.user_id = auth.uid()
        )
    );
